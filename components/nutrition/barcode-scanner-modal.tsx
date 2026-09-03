import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
};

export function BarcodeScannerModal({ visible, onClose, onScanned }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (visible && !permission?.granted && permission?.canAskAgain) {
      void requestPermission();
    }
  }, [visible, permission, requestPermission]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="max-h-[95%] px-5 pt-3"
          style={{
            height: '80%',
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: C.surfaceLow,
            borderTopLeftRadius: Vital.radius.xxl,
            borderTopRightRadius: Vital.radius.xxl,
            borderTopWidth: 1,
            borderColor: C.glassBorder,
          }}>
          <View className="mb-3 items-center">
            <View className="h-1.5 w-10 rounded-full" style={{ backgroundColor: C.outlineVariant }} />
          </View>
          <View className="mb-4 flex-row items-center justify-between">
            <Text style={{ color: C.onSurface, fontSize: 20, fontFamily: F.sansExtraBold }}>
              Scan Barcode
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={C.outline} />
            </Pressable>
          </View>

          <View style={styles.cameraContainer}>
            {!permission ? (
              <ActivityIndicator color={C.primary} />
            ) : !permission.granted ? (
              <View style={styles.permissionBox}>
                <Text style={styles.permissionText}>We need your permission to show the camera</Text>
                <Pressable onPress={requestPermission} style={styles.btn}>
                  <Text style={styles.btnText}>Grant Permission</Text>
                </Pressable>
              </View>
            ) : (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
                }}
                onBarcodeScanned={(result) => {
                  if (result.data) {
                    onScanned(result.data);
                  }
                }}
              />
            )}
            {permission?.granted && (
              <View style={styles.overlay}>
                <View style={styles.target} />
                <Text style={styles.helpText}>Align barcode within the frame</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBox: {
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    fontFamily: F.sans,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  btnText: {
    color: C.onPrimary,
    fontFamily: F.sansBold,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  target: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: C.primary,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  helpText: {
    color: '#fff',
    fontFamily: F.sansSemiBold,
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
