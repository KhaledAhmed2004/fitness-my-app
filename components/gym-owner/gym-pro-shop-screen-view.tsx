/**
 * Gym Pro-Shop, Juice Bar & Supplement POS Screen View (GymOS)
 * Tab 2 Commercial Nutrition: 1-Tap Shake & Supplement Billing, Member Tab Ledger, Low-Stock Alerts & Retail P&L
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen } from '@/components/ui/app-screen';
import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymProShopItem, PosPaymentMethod, ProShopCategory } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {};

const CATEGORIES: { key: ProShopCategory | 'ALL'; label: string; icon: any }[] = [
  { key: 'ALL', label: 'All Items', icon: 'storefront' },
  { key: 'SHAKES', label: 'Shakes', icon: 'local-cafe' },
  { key: 'SUPPLEMENTS', label: 'Supplements', icon: 'medication' },
  { key: 'BEVERAGES', label: 'Drinks', icon: 'local-drink' },
  { key: 'SNACKS', label: 'Snacks', icon: 'restaurant' },
  { key: 'GEAR', label: 'Gear', icon: 'fitness-center' },
];

export function GymProShopScreenView(_props?: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const {
    gymProfile,
    members,
    proShopItems,
    posSales,
    addProShopItem,
    recordPosSale,
    restockProShopItem,
    getLowStockProShopItems,
    getProShopSalesSummary,
  } = useGymOwnerStore();

  const [selectedCategory, setSelectedCategory] = useState<ProShopCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [selectedItemForSale, setSelectedItemForSale] = useState<GymProShopItem | null>(null);
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [buyerType, setBuyerType] = useState<'WALK_IN' | 'MEMBER'>('WALK_IN');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>('Cash');
  const [trxId, setTrxId] = useState('');

  // Add Item / Restock Modal
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [itemToRestock, setItemToRestock] = useState<GymProShopItem | null>(null);
  const [restockQty, setRestockQty] = useState('10');

  // New Item Form
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ProShopCategory>('SHAKES');
  const [newItemPrice, setNewItemPrice] = useState('250');
  const [newItemCost, setNewItemCost] = useState('140');
  const [newItemStock, setNewItemStock] = useState('20');
  const [newItemUnit, setNewItemUnit] = useState('Glass / Scoop');
  const [newItemProtein, setNewItemProtein] = useState('30');
  const [newItemCalories, setNewItemCalories] = useState('220');

  // Computed summary
  const summary = getProShopSalesSummary();
  const lowStockList = getLowStockProShopItems();

  const filteredItems = useMemo(() => {
    return proShopItems.filter((item) => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [proShopItems, selectedCategory, searchQuery]);

  const handleOpenSaleModal = (item: GymProShopItem) => {
    setSelectedItemForSale(item);
    setSaleQuantity(1);
    setBuyerType('WALK_IN');
    setSelectedMemberId(members[0]?.id || '');
    setPaymentMethod('Cash');
    setTrxId('');
    setSellModalVisible(true);
  };

  const handleCompleteSale = async () => {
    if (!selectedItemForSale) return;

    if (paymentMethod === 'MEMBER_TAB' && !selectedMemberId) {
      Alert.alert('Select Member', 'Please select a registered gym member to charge this to their tab.');
      return;
    }

    const res = await recordPosSale({
      itemId: selectedItemForSale.id,
      quantity: saleQuantity,
      paymentMethod,
      buyerType,
      memberId: buyerType === 'MEMBER' ? selectedMemberId : undefined,
      transactionId: trxId.trim() || undefined,
    });

    if (!res.success) {
      Alert.alert('Sale Failed', res.message || 'Could not complete POS sale.');
      return;
    }

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setSellModalVisible(false);
    const memberObj = members.find((m) => m.id === selectedMemberId);
    const totalAmount = selectedItemForSale.priceBdt * saleQuantity;

    Alert.alert(
      '✅ Sale Recorded',
      paymentMethod === 'MEMBER_TAB'
        ? `৳${totalAmount.toLocaleString()} charged to ${memberObj?.fullName || 'Member'}'s Tab (Added to Dues).`
        : `৳${totalAmount.toLocaleString()} collected via ${paymentMethod}.`
    );
  };

  const handleSaveNewItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Item Name Required', 'Please provide a product title.');
      return;
    }

    const price = parseFloat(newItemPrice) || 0;
    const cost = parseFloat(newItemCost) || 0;
    const stock = parseInt(newItemStock, 10) || 0;

    await addProShopItem({
      name: newItemName.trim(),
      category: newItemCategory,
      priceBdt: price,
      costBdt: cost,
      stockQuantity: stock,
      reorderThreshold: Math.max(3, Math.round(stock * 0.2)),
      unit: newItemUnit.trim() || 'Unit',
      proteinGrams: parseFloat(newItemProtein) || undefined,
      caloriesKcal: parseFloat(newItemCalories) || undefined,
      isBestSeller: false,
    });

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setAddItemModalVisible(false);
    setNewItemName('');
    Alert.alert('Product Added', `${newItemName} is now live in the Pro-Shop.`);
  };

  const handleRestockSubmit = async () => {
    if (!itemToRestock) return;
    const addQty = parseInt(restockQty, 10) || 0;
    if (addQty <= 0) return;

    await restockProShopItem(itemToRestock.id, addQty);
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setRestockModalVisible(false);
    setItemToRestock(null);
    Alert.alert('Inventory Updated', `+${addQty} units added to ${itemToRestock.name}.`);
  };

  return (
    <AppScreen>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              PRO-SHOP & SHAKE BAR
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {gymProfile.gymName} • 1-Tap Retail & Supplement POS
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setAddItemModalVisible(true)}
              style={[styles.headerAddBtn, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="add" size={16} color="#000" />
              <Text style={styles.headerAddBtnText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}>
        {/* TODAY POS FINANCIAL PULSE */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TODAY SALES</Text>
            <Text style={[styles.statValue, { color: '#40C057' }]}>
              ৳{summary.todayRevenueBdt.toLocaleString()}
            </Text>
            <Text style={{ fontSize: 10, fontFamily: F.mono, color: colors.textMuted, marginTop: 2 }}>
              {summary.totalSoldUnits} items sold
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>NET PROFIT</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              +৳{summary.todayProfitBdt.toLocaleString()}
            </Text>
            <Text style={{ fontSize: 10, fontFamily: F.mono, color: colors.textMuted, marginTop: 2 }}>
              {summary.todayRevenueBdt > 0
                ? `${Math.round((summary.todayProfitBdt / summary.todayRevenueBdt) * 100)}% Margin`
                : 'Retail Margin'}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>INVENTORY</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {proShopItems.length}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: F.monoBold,
                color: summary.lowStockCount > 0 ? '#FA5252' : '#40C057',
                marginTop: 2,
              }}>
              {summary.lowStockCount > 0 ? `⚠️ ${summary.lowStockCount} Low` : '✅ Optimal'}
            </Text>
          </View>
        </View>

        {/* LOW STOCK ALERT BANNER */}
        {lowStockList.length > 0 && (
          <View style={[styles.lowStockBanner, { backgroundColor: 'rgba(250, 82, 82, 0.12)', borderColor: '#FA5252' }]}>
            <MaterialIcons name="warning" size={18} color="#FA5252" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontFamily: F.sansBold, color: '#FA5252' }}>
                Reorder Required ({lowStockList.length} Items Low)
              </Text>
              <Text style={{ fontSize: 11, fontFamily: F.sans, color: colors.textSecondary, marginTop: 2 }}>
                {lowStockList.map((i) => `${i.name} (${i.stockQuantity} ${i.unit})`).join(', ')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setItemToRestock(lowStockList[0]);
                setRestockModalVisible(true);
              }}
              style={[styles.restockQuickBtn, { backgroundColor: '#FA5252' }]}>
              <Text style={{ color: '#FFF', fontSize: 11, fontFamily: F.sansBold }}>Restock</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SEARCH BAR */}
        <View style={[styles.searchBarWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search shakes, creatine, water, straps..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* CATEGORY CHIPS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setSelectedCategory(cat.key)}
                style={[
                  styles.catChip,
                  active
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <MaterialIcons
                  name={cat.icon}
                  size={13}
                  color={active ? '#000' : colors.textSecondary}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: F.sansBold,
                    color: active ? '#000' : colors.textSecondary,
                  }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* PRO-SHOP ITEMS GRID */}
        <View style={styles.productsGrid}>
          {filteredItems.map((item) => {
            const isLowStock = item.stockQuantity <= item.reorderThreshold;
            const profitPerUnit = item.priceBdt - item.costBdt;

            return (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isLowStock ? '#FA5252' : colors.border,
                  },
                ]}>
                <View style={styles.itemCardTop}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
                      {item.isBestSeller && (
                        <View style={[styles.bestSellerTag, { backgroundColor: '#FFF3BF' }]}>
                          <Text style={{ fontSize: 9, fontFamily: F.monoBold, color: '#D9480F' }}>⭐ BEST</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: F.sans, color: colors.textSecondary, marginTop: 2 }}>
                      {item.unit} • Cost: ৳{item.costBdt} (+৳{profitPerUnit} margin)
                    </Text>
                  </View>

                  <View style={styles.priceTag}>
                    <Text style={[styles.priceText, { color: '#40C057' }]}>৳{item.priceBdt.toLocaleString()}</Text>
                  </View>
                </View>

                {/* NUTRITION STATS (IF SHAKE / SNACK) */}
                {(item.proteinGrams !== undefined || item.caloriesKcal !== undefined) && (
                  <View style={[styles.macroRow, { backgroundColor: colors.glassFill }]}>
                    {item.proteinGrams !== undefined && (
                      <Text style={{ fontSize: 10, fontFamily: F.monoBold, color: colors.primary }}>
                        💪 {item.proteinGrams}g Protein
                      </Text>
                    )}
                    {item.caloriesKcal !== undefined && (
                      <Text style={{ fontSize: 10, fontFamily: F.mono, color: colors.textSecondary }}>
                        ⚡ {item.caloriesKcal} Kcal
                      </Text>
                    )}
                  </View>
                )}

                {/* BOTTOM ACTION BAR */}
                <View style={[styles.itemCardBottom, { borderTopColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={[
                        styles.stockDot,
                        { backgroundColor: isLowStock ? '#FA5252' : '#40C057' },
                      ]}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: F.monoBold,
                        color: isLowStock ? '#FA5252' : colors.textSecondary,
                      }}>
                      {item.stockQuantity} in stock
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setItemToRestock(item);
                        setRestockModalVisible(true);
                      }}
                      style={[styles.smallRestockBtn, { borderColor: colors.border }]}>
                      <MaterialIcons name="add-business" size={13} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={item.stockQuantity === 0}
                      onPress={() => handleOpenSaleModal(item)}
                      style={[
                        styles.quickSellBtn,
                        {
                          backgroundColor: item.stockQuantity > 0 ? colors.primary : colors.glassFill,
                        },
                      ]}>
                      <MaterialIcons name="point-of-sale" size={13} color={item.stockQuantity > 0 ? '#000' : colors.textMuted} />
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: F.sansBold,
                          color: item.stockQuantity > 0 ? '#000' : colors.textMuted,
                        }}>
                        {item.stockQuantity > 0 ? 'Quick Sell' : 'Sold Out'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* RECENT POS TRANSACTIONS */}
        <View style={{ marginTop: 24, marginBottom: 30 }}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="receipt-long" size={16} color="#00B4D8" />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              TODAY'S POS RETAIL LEDGER ({posSales.length})
            </Text>
          </View>

          <View style={{ gap: 8, marginTop: 10 }}>
            {posSales.map((sale) => (
              <View
                key={sale.id}
                style={[styles.saleRecordRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.saleRecordTitle, { color: colors.textPrimary }]}>
                    {sale.quantity}x {sale.itemName}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: F.sans, color: colors.textSecondary, marginTop: 1 }}>
                    {sale.buyerType === 'MEMBER' && sale.memberName ? `👤 ${sale.memberName}` : '🚶 Walk-In Guest'} • {sale.paymentMethod}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 13, fontFamily: F.monoBold, color: '#40C057' }}>
                    +৳{sale.totalPriceBdt.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: F.mono, color: colors.textMuted }}>
                    +৳{sale.profitBdt} profit
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ----------------- QUICK SELL / POS CHECKOUT MODAL ----------------- */}
      <Modal
        visible={sellModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setSellModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                  POS Checkout
                </Text>
                <Text style={{ fontSize: 12, fontFamily: F.sans, color: colors.textSecondary }}>
                  {selectedItemForSale?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSellModalVisible(false)}>
                <MaterialIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* QUANTITY PICKER */}
            <View style={[styles.qtyRow, { backgroundColor: colors.glassFill }]}>
              <Text style={{ fontSize: 12, fontFamily: F.mono, color: colors.textSecondary }}>
                QUANTITY:
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setSaleQuantity(Math.max(1, saleQuantity - 1))}
                  style={[styles.qtyBtn, { backgroundColor: colors.surface }]}>
                  <MaterialIcons name="remove" size={16} color={colors.textPrimary} />
                </TouchableOpacity>

                <Text style={{ fontSize: 16, fontFamily: F.monoBold, color: colors.textPrimary }}>
                  {saleQuantity}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    if (selectedItemForSale && saleQuantity < selectedItemForSale.stockQuantity) {
                      setSaleQuantity(saleQuantity + 1);
                    }
                  }}
                  style={[styles.qtyBtn, { backgroundColor: colors.surface }]}>
                  <MaterialIcons name="add" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* BUYER SELECTION */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
              CUSTOMER TYPE
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => setBuyerType('WALK_IN')}
                style={[
                  styles.buyerPill,
                  buyerType === 'WALK_IN'
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: colors.glassFill, borderColor: colors.border },
                ]}>
                <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: buyerType === 'WALK_IN' ? '#000' : colors.textSecondary }}>
                  🚶 Walk-In Guest
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setBuyerType('MEMBER')}
                style={[
                  styles.buyerPill,
                  buyerType === 'MEMBER'
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: colors.glassFill, borderColor: colors.border },
                ]}>
                <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: buyerType === 'MEMBER' ? '#000' : colors.textSecondary }}>
                  👤 Registered Member
                </Text>
              </TouchableOpacity>
            </View>

            {/* MEMBER DROPDOWN / SELECTOR */}
            {buyerType === 'MEMBER' && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SELECT MEMBER</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 4 }}>
                  {members.map((m) => {
                    const active = selectedMemberId === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => setSelectedMemberId(m.id)}
                        style={[
                          styles.memberSelectPill,
                          active
                            ? { backgroundColor: '#00B4D8', borderColor: '#00B4D8' }
                            : { backgroundColor: colors.glassFill, borderColor: colors.border },
                        ]}>
                        <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: active ? '#FFF' : colors.textPrimary }}>
                          {m.fullName}
                        </Text>
                        <Text style={{ fontSize: 9, fontFamily: F.mono, color: active ? '#FFF' : colors.textSecondary }}>
                          {m.phone.slice(-4)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* PAYMENT METHOD */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
              PAYMENT METHOD
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {(['Cash', 'bKash', 'Nagad', 'Card', 'MEMBER_TAB'] as PosPaymentMethod[]).map((m) => {
                const active = paymentMethod === m;
                const isTab = m === 'MEMBER_TAB';
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setPaymentMethod(m)}
                    style={[
                      styles.methodPill,
                      active
                        ? { backgroundColor: isTab ? '#FA5252' : colors.primary, borderColor: isTab ? '#FA5252' : colors.primary }
                        : { backgroundColor: colors.glassFill, borderColor: colors.border },
                    ]}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: F.sansBold,
                        color: active ? '#FFF' : colors.textPrimary,
                      }}>
                      {isTab ? '💳 Add to Member Tab (Due)' : m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* TOTAL CALCULATION */}
            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={{ fontSize: 14, fontFamily: F.sansBold, color: colors.textSecondary }}>
                TOTAL AMOUNT:
              </Text>
              <Text style={{ fontSize: 18, fontFamily: F.monoBold, color: '#40C057' }}>
                ৳{((selectedItemForSale?.priceBdt || 0) * saleQuantity).toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleCompleteSale}
              style={[styles.completeSaleBtn, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="check-circle" size={18} color="#000" />
              <Text style={{ color: '#000', fontFamily: F.sansBold, fontSize: 14 }}>
                {paymentMethod === 'MEMBER_TAB' ? 'Charge to Member Tab' : 'Complete POS Payment'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ----------------- RESTOCK MODAL ----------------- */}
      <Modal
        visible={restockModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setRestockModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
              Restock Inventory: {itemToRestock?.name}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: F.sans, color: colors.textSecondary, marginBottom: 12 }}>
              Current Stock: {itemToRestock?.stockQuantity} {itemToRestock?.unit}
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ADD QUANTITY</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.glassFill, color: colors.textPrimary, borderColor: colors.border }]}
              keyboardType="numeric"
              value={restockQty}
              onChangeText={setRestockQty}
              placeholder="e.g. 20"
              placeholderTextColor={colors.textMuted}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                onPress={() => setRestockModalVisible(false)}
                style={[styles.sheetCancelBtn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontFamily: F.sansBold }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRestockSubmit}
                style={[styles.sheetSubmitBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#000', fontFamily: F.sansBold }}>Confirm Restock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ----------------- ADD NEW PRODUCT MODAL ----------------- */}
      <Modal
        visible={addItemModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddItemModalVisible(false)}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Add Pro-Shop Product</Text>
            <TouchableOpacity onPress={() => setAddItemModalVisible(false)} style={[styles.headerIconBtn, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }} showsVerticalScrollIndicator={false}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PRODUCT NAME *</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="e.g. NitroTech 100% Whey 5lb"
              placeholderTextColor={colors.textMuted}
              value={newItemName}
              onChangeText={setNewItemName}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {(['SHAKES', 'SUPPLEMENTS', 'BEVERAGES', 'SNACKS', 'GEAR'] as ProShopCategory[]).map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setNewItemCategory(c)}
                  style={[
                    styles.methodPill,
                    newItemCategory === c
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: newItemCategory === c ? '#000' : colors.textSecondary }}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SELLING PRICE (BDT) *</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                  keyboardType="numeric"
                  placeholder="250"
                  placeholderTextColor={colors.textMuted}
                  value={newItemPrice}
                  onChangeText={setNewItemPrice}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>COST PRICE (BDT)</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                  keyboardType="numeric"
                  placeholder="140"
                  placeholderTextColor={colors.textMuted}
                  value={newItemCost}
                  onChangeText={setNewItemCost}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>INITIAL STOCK</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                  keyboardType="numeric"
                  placeholder="20"
                  placeholderTextColor={colors.textMuted}
                  value={newItemStock}
                  onChangeText={setNewItemStock}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>UNIT</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="Glass / Tub / Can"
                  placeholderTextColor={colors.textMuted}
                  value={newItemUnit}
                  onChangeText={setNewItemUnit}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSaveNewItem}
              style={[styles.saveNewItemBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: '#000', fontFamily: F.sansBold, fontSize: 15 }}>
                Save Product to Pro-Shop
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontFamily: F.sansBold, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, fontFamily: F.sans, marginTop: 2 },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  headerAddBtnText: { color: '#000', fontFamily: F.sansBold, fontSize: 12 },
  content: { paddingHorizontal: 20, paddingTop: 14 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1 },
  statLabel: { fontSize: 9, fontFamily: F.mono, letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontFamily: F.monoBold, marginTop: 4 },
  lowStockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  restockQuickBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: F.sans },
  categoryScroll: { gap: 8, paddingBottom: 14 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  productsGrid: { gap: 12 },
  itemCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  itemCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  itemName: { fontSize: 14, fontFamily: F.sansBold },
  bestSellerTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priceTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(64, 192, 87, 0.12)' },
  priceText: { fontSize: 14, fontFamily: F.monoBold },
  macroRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  itemCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  smallRestockBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 12, fontFamily: F.monoBold, letterSpacing: 0.5 },
  saleRecordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  saleRecordTitle: { fontSize: 13, fontFamily: F.sansBold },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalSheet: { borderRadius: 16, padding: 18 },
  sheetTitle: { fontSize: 16, fontFamily: F.sansBold },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  inputLabel: { fontSize: 10, fontFamily: F.mono, letterSpacing: 0.5, marginBottom: 4 },
  buyerPill: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  memberSelectPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  methodPill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6, borderWidth: 1 },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    marginTop: 16,
  },
  completeSaleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  modalInput: { height: 44, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 13, fontFamily: F.sans },
  sheetCancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sheetSubmitBtn: { flex: 2, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveNewItemBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10, marginTop: 20 },
});
