import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  buildSosShareMessage,
  calculateEligibilityEstimate,
  getPotentiallyCompatibleDonors,
  rankDonors,
} from "@/services/blood-network-service";
import {
  CreateBloodRequestPayload,
  useBloodNetworkStore,
} from "@/stores/blood-network-store";
import { useLanguageStore } from "@/stores/language-store";
import {
  BloodCircleContact,
  BloodComponent,
  BloodRequest,
  CircleRelationship,
  DonationHistoryEntry,
  DonorAvailabilityStatus,
  EmergencyLevel,
  HospitalVerification,
} from "@/types/blood-network";
import { BloodGroup } from "@/types/health-vault";
import { Vital } from "@/constants/vital-theme";

const C = Vital.colors;
const F = Vital.fonts;

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENTS: BloodComponent[] = ["PACKED_RBC", "WHOLE_BLOOD", "PLASMA", "PLATELETS", "CRYOPRECIPITATE"];
const COMPONENT_LABELS: Record<BloodComponent, string> = {
  PACKED_RBC: "Packed RBC", WHOLE_BLOOD: "Whole Blood", PLASMA: "Plasma",
  PLATELETS: "Platelets", CRYOPRECIPITATE: "Cryoprecipitate",
};
const EMERGENCY_LEVELS: EmergencyLevel[] = ["NORMAL", "URGENT", "CRITICAL"];
const LEVEL_COLORS: Record<EmergencyLevel, string> = { NORMAL: "#22C55E", URGENT: "#F59E0B", CRITICAL: "#EF4444" };
const LEVEL_EMOJI: Record<EmergencyLevel, string> = { NORMAL: "🟢", URGENT: "🟡", CRITICAL: "🔴" };
const AVAILABILITY_CONFIG: Record<DonorAvailabilityStatus, { label: string; color: string; emoji: string; desc: string }> = {
  AVAILABLE:      { label: "Available",       color: "#22C55E", emoji: "🟢", desc: "Ready to receive requests" },
  MAYBE:          { label: "Maybe Available", color: "#F59E0B", emoji: "🟡", desc: "Will decide when notified" },
  UNAVAILABLE:    { label: "Unavailable",     color: "#EF4444", emoji: "🔴", desc: "Cannot donate now" },
  DO_NOT_DISTURB: { label: "Do Not Disturb",  color: "#6B7280", emoji: "💤", desc: "Emergency requests only" },
};

interface BloodNetworkModalProps { visible: boolean; onClose: () => void; }
type Section = "HOME" | "NEED_BLOOD" | "MATCH_PREVIEW" | "MY_STATUS" | "MY_CIRCLE" | "REQUESTS" | "HISTORY" | "ADD_CIRCLE" | "LOG_DONATION";

export function BloodNetworkModal({ visible, onClose }: BloodNetworkModalProps) {
  const { t } = useLanguageStore();
  const store = useBloodNetworkStore();
  const [section, setSection] = useState<Section>("HOME");

  const [formPatient, setFormPatient] = useState("");
  const [formGroup, setFormGroup] = useState<BloodGroup>("B+");
  const [formComponent, setFormComponent] = useState<BloodComponent>("PACKED_RBC");
  const [formUnits, setFormUnits] = useState(1);
  const [formLevel, setFormLevel] = useState<EmergencyLevel>("URGENT");
  const [formHospital, setFormHospital] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formNeededBy, setFormNeededBy] = useState("");
  const [hospitalConfirmed, setHospitalConfirmed] = useState(false);
  const [activeRequest, setActiveRequest] = useState<BloodRequest | null>(null);

  const [circleName, setCircleName] = useState("");
  const [circlePhone, setCirclePhone] = useState("");
  const [circleRel, setCircleRel] = useState<CircleRelationship>("FRIEND");
  const [circleIsDonor, setCircleIsDonor] = useState(true);
  const [circleBloodGroup, setCircleBloodGroup] = useState<BloodGroup>("O+");
  const [circleAvail, setCircleAvail] = useState<DonorAvailabilityStatus>("AVAILABLE");
  const [circleLastDonation, setCircleLastDonation] = useState("");

  const [logDate, setLogDate] = useState("");
  const [logComponent, setLogComponent] = useState<BloodComponent>("PACKED_RBC");
  const [logHospital, setLogHospital] = useState("");

  const rankedDonors = useMemo(() => {
    if (!activeRequest) return [];
    return rankDonors(store.myCircle, activeRequest);
  }, [activeRequest, store.myCircle]);

  const handleCreateRequest = () => {
    if (!formPatient.trim() || !formHospital.trim() || !formContact.trim() || !formPhone.trim()) {
      Alert.alert("Missing Info", "Please fill in all required fields."); return;
    }
    const verification: HospitalVerification = {
      status: hospitalConfirmed ? "VERIFIED" : "UNVERIFIED",
      method: hospitalConfirmed ? "User confirmation" : undefined,
      verifiedAt: hospitalConfirmed ? new Date().toISOString() : undefined,
    };
    const payload: CreateBloodRequestPayload = {
      patientName: formPatient, bloodGroup: formGroup, component: formComponent,
      unitsRequired: formUnits, emergencyLevel: formLevel,
      neededBy: formNeededBy || new Date(Date.now() + 4 * 3600000).toISOString(),
      hospitalName: formHospital, hospitalAddress: formAddress || undefined,
      contactPerson: formContact, contactPhone: formPhone, hospitalVerification: verification,
    };
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const req = store.createBloodRequest(payload);
    setActiveRequest(req);
    setSection("MATCH_PREVIEW");
  };

  const handleShareSos = (req: BloodRequest) => {
    const message = buildSosShareMessage(req);
    const url = "whatsapp://send?text=" + encodeURIComponent(message);
    void Linking.openURL(url).catch(() => { Alert.alert("WhatsApp Not Available", "Please copy and share manually:\n\n" + message); });
  };

  const handleCancelRequest = (reqId: string) => {
    Alert.alert("Stop SOS & Close Request", "Why are you closing this request?", [
      { text: "Blood found", onPress: () => { store.cancelRequest(reqId, "Blood found"); setSection("HOME"); setActiveRequest(null); } },
      { text: "No longer needed", onPress: () => { store.cancelRequest(reqId, "No longer needed"); setSection("HOME"); setActiveRequest(null); } },
      { text: "Error / Test", onPress: () => { store.cancelRequest(reqId, "Error or test"); setSection("HOME"); setActiveRequest(null); } },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleClose = () => { setSection("HOME"); setActiveRequest(null); onClose(); };

  const renderHeader = (title: string, showBack = true) => (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity onPress={() => setSection("HOME")} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={C.onSurface} />
        </TouchableOpacity>
      ) : (<View style={styles.backBtn} />)}
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
        <MaterialIcons name="close" size={22} color={C.onSurfaceVariant} />
      </TouchableOpacity>
    </View>
  );

  const renderHome = () => (
    <View style={{ flex: 1 }}>
      {renderHeader("🩸 Blood Response Network", false)}
      <View style={styles.prototypeNotice}>
        <MaterialIcons name="info-outline" size={14} color="#F59E0B" />
        <Text style={styles.prototypeNoticeText}>Local prototype — not a production emergency communication system.</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <View style={styles.dashRow}>
          {[
            { label: "Circle", value: store.myCircle.length },
            { label: "Donors", value: store.myCircle.filter(c => c.isDonor).length },
            { label: "Available", value: store.myCircle.filter(c => c.donorProfile?.availabilityStatus === "AVAILABLE").length },
            { label: "Requests", value: store.activeRequests.length },
          ].map((item) => (
            <View key={item.label} style={styles.dashCard}>
              <Text style={styles.dashValue}>{item.value}</Text>
              <Text style={styles.dashLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[styles.primaryCta, { borderColor: "#EF4444", backgroundColor: "rgba(239,68,68,0.1)" }]}
          activeOpacity={0.85}
          onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}); setSection("NEED_BLOOD"); }}>
          <View style={[styles.ctaIconBox, { backgroundColor: "rgba(239,68,68,0.2)" }]}>
            <MaterialIcons name="emergency" size={28} color="#EF4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.ctaTitle, { color: "#EF4444" }]}>Need Blood</Text>
            <Text style={styles.ctaSub}>Emergency Blood Request</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#EF4444" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryCta, { borderColor: "#22C55E", backgroundColor: "rgba(34,197,94,0.08)" }]}
          activeOpacity={0.85}
          onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); setSection("MY_STATUS"); }}>
          <View style={[styles.ctaIconBox, { backgroundColor: "rgba(34,197,94,0.18)" }]}>
            <MaterialIcons name="bloodtype" size={28} color="#22C55E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.ctaTitle, { color: "#22C55E" }]}>I Can Donate</Text>
            <Text style={styles.ctaSub}>Set My Availability</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#22C55E" />
        </TouchableOpacity>
        <Text style={styles.sectionLabel}>My Network</Text>
        {([
          { icon: "group" as const, label: "My Blood Circle", sec: "MY_CIRCLE" as Section, sub: store.myCircle.length + " contacts" },
          { icon: "assignment" as const, label: "Requests", sec: "REQUESTS" as Section, sub: store.activeRequests.length + " active" },
          { icon: "history" as const, label: "Donation History", sec: "HISTORY" as Section, sub: store.myDonationHistory.length + " events recorded" },
        ]).map((item) => (
          <TouchableOpacity key={item.sec} style={styles.navRow} onPress={() => setSection(item.sec)} activeOpacity={0.8}>
            <View style={styles.navIconBox}><MaterialIcons name={item.icon} size={20} color="#EF4444" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.navLabel}>{item.label}</Text>
              <Text style={styles.navSub}>{item.sub}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={C.onSurfaceVariant} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderNeedBlood = () => {
    const compInfo = getPotentiallyCompatibleDonors(formGroup, formComponent);
    return (
      <View style={{ flex: 1 }}>
        {renderHeader("Emergency Blood Request")}
        <ScrollView contentContainerStyle={styles.formScroll}>
          <Text style={styles.fieldLabel}>Patient Name *</Text>
          <TextInput style={styles.input} value={formPatient} onChangeText={setFormPatient} placeholder="Patient full name" placeholderTextColor={C.onSurfaceVariant} />
          <Text style={styles.fieldLabel}>Blood Group *</Text>
          <View style={styles.chipRow}>
            {BLOOD_GROUPS.map((g) => (
              <TouchableOpacity key={g} onPress={() => setFormGroup(g)} style={[styles.chip, formGroup === g && styles.chipActive]}>
                <Text style={[styles.chipText, formGroup === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Blood Component</Text>
          <View style={styles.chipRow}>
            {COMPONENTS.map((c) => (
              <TouchableOpacity key={c} onPress={() => setFormComponent(c)} style={[styles.chip, formComponent === c && styles.chipActive]}>
                <Text style={[styles.chipText, formComponent === c && styles.chipTextActive]}>{COMPONENT_LABELS[c]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {compInfo.consultBloodBank ? (
            <View style={[styles.clinicalNote, { borderColor: "#F59E0B" }]}>
              <MaterialIcons name="warning" size={14} color="#F59E0B" />
              <Text style={[styles.clinicalNoteText, { color: "#F59E0B" }]}>Component compatibility requires blood bank guidance. Cannot suggest donors for this component.</Text>
            </View>
          ) : formComponent === "WHOLE_BLOOD" ? (
            <View style={[styles.clinicalNote, { borderColor: "#F59E0B" }]}>
              <MaterialIcons name="info-outline" size={14} color="#F59E0B" />
              <Text style={[styles.clinicalNoteText, { color: "#F59E0B" }]}>Whole blood involves plasma considerations. Blood bank guidance required.</Text>
            </View>
          ) : null}
          <Text style={styles.fieldLabel}>Units / Bags Required *</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => setFormUnits(Math.max(1, formUnits - 1))}>
              <MaterialIcons name="remove" size={20} color={C.onSurface} />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{formUnits}</Text>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => setFormUnits(Math.min(10, formUnits + 1))}>
              <MaterialIcons name="add" size={20} color={C.onSurface} />
            </TouchableOpacity>
          </View>
          <Text style={styles.fieldLabel}>Emergency Level *</Text>
          <View style={styles.chipRow}>
            {EMERGENCY_LEVELS.map((lv) => (
              <TouchableOpacity key={lv} onPress={() => setFormLevel(lv)}
                style={[styles.chip, formLevel === lv && { backgroundColor: LEVEL_COLORS[lv], borderColor: LEVEL_COLORS[lv] }]}>
                <Text style={[styles.chipText, formLevel === lv && { color: "#fff" }]}>{LEVEL_EMOJI[lv]} {lv}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Hospital Name *</Text>
          <TextInput style={styles.input} value={formHospital} onChangeText={setFormHospital} placeholder="e.g. Dhaka Medical College Hospital" placeholderTextColor={C.onSurfaceVariant} />
          <TextInput style={styles.input} value={formAddress} onChangeText={setFormAddress} placeholder="Hospital address (optional)" placeholderTextColor={C.onSurfaceVariant} />
          <TouchableOpacity style={styles.toggleRow} onPress={() => setHospitalConfirmed(!hospitalConfirmed)}>
            <MaterialIcons name={hospitalConfirmed ? "check-box" : "check-box-outline-blank"} size={22} color={hospitalConfirmed ? "#22C55E" : C.onSurfaceVariant} />
            <Text style={styles.toggleText}>Hospital confirmed? {hospitalConfirmed ? "VERIFIED" : ""}</Text>
          </TouchableOpacity>
          <Text style={styles.fieldLabel}>Contact Person *</Text>
          <TextInput style={styles.input} value={formContact} onChangeText={setFormContact} placeholder="Name of contact at hospital" placeholderTextColor={C.onSurfaceVariant} />
          <Text style={styles.fieldLabel}>Contact Phone *</Text>
          <TextInput style={styles.input} value={formPhone} onChangeText={setFormPhone} placeholder="+880-XXXX-XXXXXX" placeholderTextColor={C.onSurfaceVariant} keyboardType="phone-pad" />
          <TouchableOpacity style={styles.submitBtn} onPress={handleCreateRequest} activeOpacity={0.85}>
            <MaterialIcons name="emergency" size={20} color="#fff" />
            <Text style={styles.submitBtnText}>Find Donors & Send SOS</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderMatchPreview = () => {
    const req = activeRequest;
    if (!req) return null;
    const compInfo = getPotentiallyCompatibleDonors(req.bloodGroup, req.component);
    const wave1 = req.sosWaves.find((w) => w.tier === 1);
    return (
      <View style={{ flex: 1 }}>
        {renderHeader("Smart Match Preview")}
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View style={[styles.requestCard, { borderColor: LEVEL_COLORS[req.emergencyLevel] }]}>
            <View style={styles.requestCardHeader}>
              <Text style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[req.emergencyLevel] }]}>
                {LEVEL_EMOJI[req.emergencyLevel]} {req.emergencyLevel}
              </Text>
              {req.hospitalVerification.status === "VERIFIED" && (
                <Text style={styles.verifiedBadge}>VERIFIED</Text>
              )}
            </View>
            <Text style={styles.requestTitle}>{req.bloodGroup} Blood — {req.unitsRequired} {req.unitsRequired === 1 ? "unit" : "units"}</Text>
            <Text style={styles.requestSub}>{COMPONENT_LABELS[req.component]} · {req.hospitalName}</Text>
            <Text style={styles.requestSub}>Contact: {req.contactPerson} · {req.contactPhone}</Text>
          </View>
          <View style={styles.disclaimerBox}>
            <MaterialIcons name="info-outline" size={14} color="#F59E0B" />
            <Text style={styles.disclaimerText}>
              {compInfo.consultBloodBank ? compInfo.disclaimer : "Eligibility must be confirmed by blood bank or medical professional. This is an estimated indicator only."}
            </Text>
          </View>
          <Text style={styles.sectionLabel}>Potentially compatible donors</Text>
          {compInfo.consultBloodBank ? (
            <View style={styles.consultBox}>
              <MaterialIcons name="local-hospital" size={22} color="#F59E0B" />
              <Text style={styles.consultText}>Consult blood bank for compatibility</Text>
            </View>
          ) : rankedDonors.length === 0 ? (
            <Text style={styles.emptyText}>No donors in your circle for this blood group. Add circle members to find matches.</Text>
          ) : (
            rankedDonors.map((rd) => {
              const dp = rd.contact.donorProfile!;
              const avail = AVAILABILITY_CONFIG[dp.availabilityStatus];
              return (
                <View key={rd.contact.id} style={styles.donorCard}>
                  <View style={styles.donorLeft}>
                    <View style={[styles.bloodGroupBadge, { backgroundColor: rd.compatibilityNote === "POTENTIALLY_COMPATIBLE" ? "rgba(239,68,68,0.15)" : "rgba(107,114,128,0.15)" }]}>
                      <Text style={[styles.bloodGroupText, { color: rd.compatibilityNote === "POTENTIALLY_COMPATIBLE" ? "#EF4444" : C.onSurfaceVariant }]}>{dp.bloodGroup}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.donorName}>{rd.contact.name}</Text>
                      <Text style={styles.donorRel}>{rd.contact.relationship.replace(/_/g, " ")}</Text>
                      <View style={styles.donorTagRow}>
                        <Text style={[styles.availTag, { color: avail.color }]}>{avail.emoji} {avail.label}</Text>
                        <Text style={[styles.eligTag, { color: rd.isEstimatedEligible ? "#22C55E" : "#F59E0B" }]}>
                          {rd.isEstimatedEligible ? "Est. eligible" : "Not yet est. eligible"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.callBtn}
                    onPress={() => void Linking.openURL("tel:" + rd.contact.phone).catch(() => {})}>
                    <MaterialIcons name="phone" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
          {wave1 && (
            <View style={styles.trackerBox}>
              <Text style={styles.trackerTitle}>SOS Response Tracker</Text>
              <Text style={styles.trackerRow}>Tier 1: {wave1.label} · Status: {wave1.status}</Text>
              <Text style={styles.trackerRow}>{wave1.notifiedCount} notified · {wave1.viewedCount} viewed · {wave1.acceptedCount} accepted</Text>
            </View>
          )}
          <TouchableOpacity style={styles.shareBtn} onPress={() => handleShareSos(req)} activeOpacity={0.85}>
            <MaterialIcons name="share" size={18} color="#fff" />
            <Text style={styles.shareBtnText}>Share SOS (WhatsApp)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelRequestBtn} onPress={() => handleCancelRequest(req.id)} activeOpacity={0.85}>
            <MaterialIcons name="stop-circle" size={18} color="#EF4444" />
            <Text style={styles.cancelRequestBtnText}>Stop SOS & Close Request</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderMyStatus = () => {
    const eligibility = calculateEligibilityEstimate(store.myDonationHistory[0]?.donationDate, "PACKED_RBC");
    return (
      <View style={{ flex: 1 }}>
        {renderHeader("I Can Donate")}
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <Text style={styles.fieldLabel}>My Blood Group</Text>
          <View style={styles.chipRow}>
            {BLOOD_GROUPS.map((g) => (
              <TouchableOpacity key={g} onPress={() => store.setMyBloodGroup(g)} style={[styles.chip, store.myBloodGroup === g && styles.chipActive]}>
                <Text style={[styles.chipText, store.myBloodGroup === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.fieldLabel}>My Availability</Text>
          {(["AVAILABLE", "MAYBE", "UNAVAILABLE", "DO_NOT_DISTURB"] as DonorAvailabilityStatus[]).map((s) => {
            const cfg = AVAILABILITY_CONFIG[s];
            return (
              <TouchableOpacity key={s} style={[styles.availRow, store.myAvailabilityStatus === s && { borderColor: cfg.color, backgroundColor: cfg.color + "14" }]}
                onPress={() => store.setMyAvailability(s)} activeOpacity={0.8}>
                <Text style={styles.availRowEmoji}>{cfg.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.availRowLabel}>{cfg.label}</Text>
                  <Text style={styles.availRowDesc}>{cfg.desc}</Text>
                </View>
                {store.myAvailabilityStatus === s && <MaterialIcons name="check-circle" size={20} color={cfg.color} />}
              </TouchableOpacity>
            );
          })}
          <View style={styles.cooldownBox}>
            <Text style={styles.cooldownTitle}>Cooldown Tracker (Packed RBC)</Text>
            {eligibility.daysSinceLastDonation !== null ? (
              <>
                <Text style={styles.cooldownStat}>Last donation: {eligibility.daysSinceLastDonation} days ago</Text>
                <Text style={[styles.cooldownStatus, { color: eligibility.isEstimatedEligible ? "#22C55E" : "#F59E0B" }]}>
                  {eligibility.isEstimatedEligible ? "Est. eligible" : "Est. " + eligibility.estimatedDaysRemaining + " days remaining"}
                </Text>
              </>
            ) : (
              <Text style={styles.cooldownStat}>No donation history recorded</Text>
            )}
            <Text style={styles.cooldownDisclaimer}>{eligibility.disclaimer}</Text>
          </View>
          <TouchableOpacity style={styles.logDonationBtn} onPress={() => setSection("LOG_DONATION")} activeOpacity={0.85}>
            <MaterialIcons name="add" size={18} color="#EF4444" />
            <Text style={styles.logDonationBtnText}>Log a Donation</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderMyCircle = () => (
    <View style={{ flex: 1 }}>
      {renderHeader("My Blood Circle")}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {store.myCircle.length === 0 ? (
          <Text style={styles.emptyText}>No contacts yet. Add family and friends to build your blood circle.</Text>
        ) : (
          store.myCircle.map((contact) => {
            const dp = contact.donorProfile;
            const avail = dp ? AVAILABILITY_CONFIG[dp.availabilityStatus] : null;
            const eligibility = dp ? calculateEligibilityEstimate(dp.lastDonationDate, "PACKED_RBC") : null;
            return (
              <View key={contact.id} style={styles.circleCard}>
                <View style={styles.circleCardLeft}>
                  {dp && (
                    <View style={styles.bloodGroupBadgeSmall}>
                      <Text style={styles.bloodGroupTextSmall}>{dp.bloodGroup}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.circleName}>{contact.name}</Text>
                    <Text style={styles.circleRel}>{contact.relationship.replace(/_/g, " ")}</Text>
                    {avail && <Text style={[styles.circleAvail, { color: avail.color }]}>{avail.emoji} {avail.label}</Text>}
                    {eligibility && (
                      <Text style={[styles.circleElig, { color: eligibility.isEstimatedEligible ? "#22C55E" : "#F59E0B" }]}>
                        {eligibility.isEstimatedEligible ? "Est. eligible" : "Not yet est. eligible"}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity style={styles.callBtnSmall}
                  onPress={() => void Linking.openURL("tel:" + contact.phone).catch(() => {})}>
                  <MaterialIcons name="phone" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <TouchableOpacity style={styles.addCircleBtn} onPress={() => setSection("ADD_CIRCLE")} activeOpacity={0.85}>
          <MaterialIcons name="person-add" size={18} color="#EF4444" />
          <Text style={styles.addCircleBtnText}>Add to My Circle</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderAddCircle = () => (
    <View style={{ flex: 1 }}>
      {renderHeader("Add to My Circle")}
      <ScrollView contentContainerStyle={styles.formScroll}>
        <Text style={styles.fieldLabel}>Name *</Text>
        <TextInput style={styles.input} value={circleName} onChangeText={setCircleName} placeholder="Full name" placeholderTextColor={C.onSurfaceVariant} />
        <Text style={styles.fieldLabel}>Phone *</Text>
        <TextInput style={styles.input} value={circlePhone} onChangeText={setCirclePhone} placeholder="+880-XXXX-XXXXXX" placeholderTextColor={C.onSurfaceVariant} keyboardType="phone-pad" />
        <Text style={styles.fieldLabel}>Relationship</Text>
        <View style={styles.chipRow}>
          {(["FATHER","MOTHER","SIBLING","SPOUSE","CHILD","FRIEND","COLLEAGUE","TRUSTED_CONTACT"] as CircleRelationship[]).map((r) => (
            <TouchableOpacity key={r} onPress={() => setCircleRel(r)} style={[styles.chip, circleRel === r && styles.chipActive]}>
              <Text style={[styles.chipText, circleRel === r && styles.chipTextActive]}>{r.replace(/_/g, " ")}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.toggleRow} onPress={() => setCircleIsDonor(!circleIsDonor)}>
          <MaterialIcons name={circleIsDonor ? "check-box" : "check-box-outline-blank"} size={22} color={circleIsDonor ? "#22C55E" : C.onSurfaceVariant} />
          <Text style={styles.toggleText}>This person is a blood donor</Text>
        </TouchableOpacity>
        {circleIsDonor && (
          <>
            <Text style={styles.fieldLabel}>Blood Group</Text>
            <View style={styles.chipRow}>
              {BLOOD_GROUPS.map((g) => (
                <TouchableOpacity key={g} onPress={() => setCircleBloodGroup(g)} style={[styles.chip, circleBloodGroup === g && styles.chipActive]}>
                  <Text style={[styles.chipText, circleBloodGroup === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Availability</Text>
            {(["AVAILABLE","MAYBE","UNAVAILABLE","DO_NOT_DISTURB"] as DonorAvailabilityStatus[]).map((s) => {
              const cfg = AVAILABILITY_CONFIG[s];
              return (
                <TouchableOpacity key={s} style={[styles.availRow, circleAvail === s && { borderColor: cfg.color }]}
                  onPress={() => setCircleAvail(s)} activeOpacity={0.8}>
                  <Text style={styles.availRowEmoji}>{cfg.emoji}</Text>
                  <Text style={[styles.availRowLabel, { flex: 1 }]}>{cfg.label}</Text>
                  {circleAvail === s && <MaterialIcons name="check-circle" size={18} color={cfg.color} />}
                </TouchableOpacity>
              );
            })}
            <Text style={styles.fieldLabel}>Last Donation Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={circleLastDonation} onChangeText={setCircleLastDonation} placeholder="e.g. 2025-05-12" placeholderTextColor={C.onSurfaceVariant} />
          </>
        )}
        <TouchableOpacity style={styles.submitBtn} activeOpacity={0.85}
          onPress={() => {
            if (!circleName.trim() || !circlePhone.trim()) { Alert.alert("Missing Info", "Name and phone are required."); return; }
            store.addCircleMember({
              name: circleName, relationship: circleRel, phone: circlePhone, phoneVisibility: "ALWAYS", isDonor: circleIsDonor,
              donorProfile: circleIsDonor ? {
                bloodGroup: circleBloodGroup, availabilityStatus: circleAvail,
                lastDonationDate: circleLastDonation || undefined, donationHistory: [],
              } : undefined,
            });
            setCircleName(""); setCirclePhone(""); setCircleLastDonation("");
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            setSection("MY_CIRCLE");
          }}>
          <Text style={styles.submitBtnText}>Add to Circle</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderRequests = () => (
    <View style={{ flex: 1 }}>
      {renderHeader("Requests")}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {store.activeRequests.length === 0 && store.pastRequests.length === 0 ? (
          <Text style={styles.emptyText}>No blood requests yet.</Text>
        ) : (
          <>
            {store.activeRequests.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Active</Text>
                {store.activeRequests.map((req) => (
                  <View key={req.id} style={[styles.requestCard, { borderColor: LEVEL_COLORS[req.emergencyLevel] }]}>
                    <Text style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[req.emergencyLevel], alignSelf: "flex-start" }]}>{LEVEL_EMOJI[req.emergencyLevel]} {req.emergencyLevel}</Text>
                    <Text style={styles.requestTitle}>{req.bloodGroup} — {req.unitsRequired} units · {req.hospitalName}</Text>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                      <TouchableOpacity style={[styles.shareBtn, { flex: 1 }]} onPress={() => handleShareSos(req)}>
                        <MaterialIcons name="share" size={14} color="#fff" />
                        <Text style={styles.shareBtnText}>Share SOS</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.cancelRequestBtn, { flex: 1 }]} onPress={() => handleCancelRequest(req.id)}>
                        <MaterialIcons name="stop-circle" size={14} color="#EF4444" />
                        <Text style={styles.cancelRequestBtnText}>Stop</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}
            {store.pastRequests.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Past</Text>
                {store.pastRequests.map((req) => (
                  <View key={req.id} style={[styles.requestCard, { borderColor: C.outlineVariant }]}>
                    <Text style={styles.requestTitle}>{req.bloodGroup} — {req.unitsRequired} units · {req.hospitalName}</Text>
                    <Text style={styles.requestSub}>Status: {req.status}{req.cancelledReason ? " · " + req.cancelledReason : ""}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );

  const renderHistory = () => {
    const total = store.myDonationHistory.length;
    const responded = store.pastRequests.filter(r => r.status === "FULFILLED").length;
    const badges = [
      total >= 1 && "First Donation",
      total >= 3 && "Regular Donor",
      total >= 5 && "5 Donations",
    ].filter(Boolean) as string[];
    return (
      <View style={{ flex: 1 }}>
        {renderHeader("Donation History")}
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View style={styles.dashRow}>
            <View style={styles.dashCard}><Text style={styles.dashValue}>{total}</Text><Text style={styles.dashLabel}>Donation Events</Text></View>
            <View style={styles.dashCard}><Text style={styles.dashValue}>{responded}</Text><Text style={styles.dashLabel}>Requests Responded</Text></View>
          </View>
          {badges.length > 0 && (
            <View style={styles.badgeRow}>
              {badges.map((b) => (
                <View key={b} style={styles.badge}><Text style={styles.badgeText}>{b}</Text></View>
              ))}
            </View>
          )}
          <View style={styles.disclaimerBox}>
            <MaterialIcons name="info-outline" size={13} color={C.onSurfaceVariant} />
            <Text style={styles.disclaimerText}>Donation reported by donor — not clinically confirmed</Text>
          </View>
          {store.myDonationHistory.length === 0 ? (
            <Text style={styles.emptyText}>No donation history yet. Log your first donation below.</Text>
          ) : (
            store.myDonationHistory.map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <MaterialIcons name="bloodtype" size={18} color="#EF4444" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyDate}>{entry.donationDate}</Text>
                  <Text style={styles.historyDetail}>{COMPONENT_LABELS[entry.component]}{entry.hospitalOrBloodBank ? " · " + entry.hospitalOrBloodBank : ""}</Text>
                </View>
              </View>
            ))
          )}
          <TouchableOpacity style={styles.addCircleBtn} onPress={() => setSection("LOG_DONATION")} activeOpacity={0.85}>
            <MaterialIcons name="add" size={18} color="#EF4444" />
            <Text style={styles.addCircleBtnText}>Log a Donation</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderLogDonation = () => (
    <View style={{ flex: 1 }}>
      {renderHeader("Log a Donation")}
      <ScrollView contentContainerStyle={styles.formScroll}>
        <Text style={styles.fieldLabel}>Donation Date (YYYY-MM-DD) *</Text>
        <TextInput style={styles.input} value={logDate} onChangeText={setLogDate} placeholder={new Date().toISOString().split("T")[0]} placeholderTextColor={C.onSurfaceVariant} />
        <Text style={styles.fieldLabel}>Component</Text>
        <View style={styles.chipRow}>
          {COMPONENTS.map((c) => (
            <TouchableOpacity key={c} onPress={() => setLogComponent(c)} style={[styles.chip, logComponent === c && styles.chipActive]}>
              <Text style={[styles.chipText, logComponent === c && styles.chipTextActive]}>{COMPONENT_LABELS[c]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.fieldLabel}>Hospital / Blood Bank (optional)</Text>
        <TextInput style={styles.input} value={logHospital} onChangeText={setLogHospital} placeholder="e.g. Dhaka Medical College Blood Bank" placeholderTextColor={C.onSurfaceVariant} />
        <View style={styles.disclaimerBox}>
          <MaterialIcons name="info-outline" size={13} color={C.onSurfaceVariant} />
          <Text style={styles.disclaimerText}>Donation reported by donor — not clinically confirmed</Text>
        </View>
        <TouchableOpacity style={styles.submitBtn} activeOpacity={0.85}
          onPress={() => {
            if (!logDate.trim()) { Alert.alert("Date required", "Please enter the donation date."); return; }
            store.logDonation({ donationDate: logDate, component: logComponent, hospitalOrBloodBank: logHospital || undefined });
            setLogDate(""); setLogHospital("");
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            setSection("HISTORY");
          }}>
          <Text style={styles.submitBtnText}>Save Donation Record</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderSection = () => {
    switch (section) {
      case "HOME": return renderHome();
      case "NEED_BLOOD": return renderNeedBlood();
      case "MATCH_PREVIEW": return renderMatchPreview();
      case "MY_STATUS": return renderMyStatus();
      case "MY_CIRCLE": return renderMyCircle();
      case "ADD_CIRCLE": return renderAddCircle();
      case "REQUESTS": return renderRequests();
      case "HISTORY": return renderHistory();
      case "LOG_DONATION": return renderLogDonation();
      default: return renderHome();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>{renderSection()}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: C.background },
  header:               { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.outlineVariant },
  backBtn:              { width: 36, height: 36, justifyContent: "center" },
  closeBtn:             { width: 36, height: 36, justifyContent: "center", alignItems: "flex-end" },
  headerTitle:          { flex: 1, textAlign: "center", fontSize: 16, fontFamily: F.semiBold, color: C.onSurface },
  prototypeNotice:      { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(245,158,11,0.08)", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(245,158,11,0.2)" },
  prototypeNoticeText:  { flex: 1, fontSize: 11, color: "#F59E0B", fontFamily: F.regular },
  dashRow:              { flexDirection: "row", gap: 8, marginVertical: 16 },
  dashCard:             { flex: 1, backgroundColor: C.surfaceContainer, borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: C.outlineVariant },
  dashValue:            { fontSize: 22, fontFamily: F.bold, color: "#EF4444" },
  dashLabel:            { fontSize: 10, color: C.onSurfaceVariant, fontFamily: F.regular, textAlign: "center", marginTop: 2 },
  primaryCta:           { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 16, borderWidth: 2, marginBottom: 12 },
  ctaIconBox:           { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  ctaTitle:             { fontSize: 18, fontFamily: F.bold },
  ctaSub:               { fontSize: 13, color: C.onSurfaceVariant, fontFamily: F.regular, marginTop: 2 },
  sectionLabel:         { fontSize: 12, fontFamily: F.semiBold, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 16, marginBottom: 8 },
  navRow:               { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surfaceContainer, padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: C.outlineVariant },
  navIconBox:           { width: 38, height: 38, backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 10, justifyContent: "center", alignItems: "center" },
  navLabel:             { fontSize: 14, fontFamily: F.semiBold, color: C.onSurface },
  navSub:               { fontSize: 12, color: C.onSurfaceVariant, fontFamily: F.regular },
  formScroll:           { padding: 16, paddingBottom: 48 },
  fieldLabel:           { fontSize: 13, fontFamily: F.semiBold, color: C.onSurfaceVariant, marginBottom: 6, marginTop: 16 },
  input:                { backgroundColor: C.surfaceContainer, borderWidth: 1, borderColor: C.outlineVariant, borderRadius: 10, padding: 12, color: C.onSurface, fontFamily: F.regular, fontSize: 14, marginBottom: 4 },
  chipRow:              { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip:                 { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.outlineVariant, backgroundColor: C.surfaceContainer },
  chipActive:           { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  chipText:             { fontSize: 13, color: C.onSurface, fontFamily: F.regular },
  chipTextActive:       { color: "#fff", fontFamily: F.semiBold },
  clinicalNote:         { flexDirection: "row", gap: 6, alignItems: "flex-start", backgroundColor: "rgba(245,158,11,0.08)", borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 8 },
  clinicalNoteText:     { flex: 1, fontSize: 12, fontFamily: F.regular, lineHeight: 16 },
  stepperRow:           { flexDirection: "row", alignItems: "center", gap: 16 },
  stepperBtn:           { width: 36, height: 36, backgroundColor: C.surfaceContainer, borderRadius: 18, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.outlineVariant },
  stepperValue:         { fontSize: 20, fontFamily: F.bold, color: C.onSurface, minWidth: 30, textAlign: "center" },
  toggleRow:            { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  toggleText:           { fontSize: 14, color: C.onSurface, fontFamily: F.regular },
  submitBtn:            { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#EF4444", borderRadius: 14, paddingVertical: 15, marginTop: 24 },
  submitBtnText:        { fontSize: 15, fontFamily: F.bold, color: "#fff" },
  requestCard:          { backgroundColor: C.surfaceContainer, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 2 },
  requestCardHeader:    { flexDirection: "row", gap: 8, marginBottom: 6 },
  levelBadge:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 12, fontFamily: F.bold, color: "#fff", overflow: "hidden" },
  verifiedBadge:        { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, fontSize: 12, fontFamily: F.semiBold, color: "#22C55E", backgroundColor: "rgba(34,197,94,0.12)" },
  requestTitle:         { fontSize: 16, fontFamily: F.bold, color: C.onSurface, marginBottom: 4 },
  requestSub:           { fontSize: 13, color: C.onSurfaceVariant, fontFamily: F.regular, marginBottom: 2 },
  disclaimerBox:        { flexDirection: "row", gap: 6, alignItems: "flex-start", backgroundColor: "rgba(245,158,11,0.06)", borderRadius: 8, padding: 10, marginVertical: 10 },
  disclaimerText:       { flex: 1, fontSize: 11, color: C.onSurfaceVariant, fontFamily: F.regular, lineHeight: 15 },
  consultBox:           { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(245,158,11,0.1)", borderRadius: 12, padding: 14, marginBottom: 8 },
  consultText:          { fontSize: 14, fontFamily: F.semiBold, color: "#F59E0B", flex: 1 },
  donorCard:            { flexDirection: "row", alignItems: "center", backgroundColor: C.surfaceContainer, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.outlineVariant },
  donorLeft:            { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  bloodGroupBadge:      { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  bloodGroupText:       { fontSize: 14, fontFamily: F.bold },
  donorName:            { fontSize: 14, fontFamily: F.semiBold, color: C.onSurface },
  donorRel:             { fontSize: 11, color: C.onSurfaceVariant, fontFamily: F.regular },
  donorTagRow:          { flexDirection: "row", gap: 8, marginTop: 2 },
  availTag:             { fontSize: 11, fontFamily: F.regular },
  eligTag:              { fontSize: 11, fontFamily: F.regular },
  callBtn:              { width: 36, height: 36, backgroundColor: "#22C55E", borderRadius: 18, justifyContent: "center", alignItems: "center" },
  callBtnSmall:         { width: 30, height: 30, backgroundColor: "#22C55E", borderRadius: 15, justifyContent: "center", alignItems: "center" },
  trackerBox:           { backgroundColor: "rgba(34,197,94,0.06)", borderRadius: 12, padding: 14, marginVertical: 10, borderWidth: 1, borderColor: "rgba(34,197,94,0.2)" },
  trackerTitle:         { fontSize: 13, fontFamily: F.semiBold, color: "#22C55E", marginBottom: 6 },
  trackerRow:           { fontSize: 13, color: C.onSurface, fontFamily: F.regular, marginBottom: 4 },
  shareBtn:             { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#22C55E", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginTop: 8 },
  shareBtnText:         { fontSize: 14, fontFamily: F.semiBold, color: "#fff" },
  cancelRequestBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderColor: "#EF4444", borderRadius: 12, paddingVertical: 12, marginTop: 8 },
  cancelRequestBtnText: { fontSize: 14, fontFamily: F.semiBold, color: "#EF4444" },
  availRow:             { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surfaceContainer, borderRadius: 12, borderWidth: 1, borderColor: C.outlineVariant, padding: 12, marginBottom: 8 },
  availRowEmoji:        { fontSize: 20 },
  availRowLabel:        { fontSize: 14, fontFamily: F.semiBold, color: C.onSurface },
  availRowDesc:         { fontSize: 12, color: C.onSurfaceVariant, fontFamily: F.regular },
  cooldownBox:          { backgroundColor: C.surfaceContainer, borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: C.outlineVariant },
  cooldownTitle:        { fontSize: 13, fontFamily: F.semiBold, color: C.onSurface, marginBottom: 8 },
  cooldownStat:         { fontSize: 14, color: C.onSurface, fontFamily: F.regular, marginBottom: 4 },
  cooldownStatus:       { fontSize: 14, fontFamily: F.bold, marginBottom: 6 },
  cooldownDisclaimer:   { fontSize: 11, color: C.onSurfaceVariant, fontFamily: F.regular, lineHeight: 15, fontStyle: "italic" },
  logDonationBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: "#EF4444", borderRadius: 14, paddingVertical: 14, marginTop: 24 },
  logDonationBtnText:   { fontSize: 14, fontFamily: F.semiBold, color: "#EF4444" },
  circleCard:           { flexDirection: "row", alignItems: "center", backgroundColor: C.surfaceContainer, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.outlineVariant },
  circleCardLeft:       { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bloodGroupBadgeSmall: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(239,68,68,0.12)", justifyContent: "center", alignItems: "center" },
  bloodGroupTextSmall:  { fontSize: 13, fontFamily: F.bold, color: "#EF4444" },
  circleName:           { fontSize: 14, fontFamily: F.semiBold, color: C.onSurface },
  circleRel:            { fontSize: 11, color: C.onSurfaceVariant, fontFamily: F.regular },
  circleAvail:          { fontSize: 11, fontFamily: F.regular, marginTop: 2 },
  circleElig:           { fontSize: 11, fontFamily: F.regular },
  addCircleBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: "#EF4444", borderRadius: 14, paddingVertical: 14, marginTop: 12 },
  addCircleBtnText:     { fontSize: 14, fontFamily: F.semiBold, color: "#EF4444" },
  badgeRow:             { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  badge:                { backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText:            { fontSize: 12, fontFamily: F.semiBold, color: "#EF4444" },
  historyRow:           { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, backgroundColor: C.surfaceContainer, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: C.outlineVariant },
  historyDate:          { fontSize: 13, fontFamily: F.semiBold, color: C.onSurface },
  historyDetail:        { fontSize: 12, color: C.onSurfaceVariant, fontFamily: F.regular },
  emptyText:            { fontSize: 14, color: C.onSurfaceVariant, fontFamily: F.regular, textAlign: "center", paddingVertical: 32 },
});

