import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';

import { Vital } from '@/constants/vital-theme';
import { extractNutritionFromImage, ExtractedNutrition } from '@/services/gemini-vision';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
  onExtracted: (nutrition: ExtractedNutrition) => void;
};

export function LabelScannerModal({ visible, onClose, onExtracted }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    if (visible && !permission?.granted && permission?.canAskAgain) {
      void requestPermission();
    }
  }, [visible, permission, requestPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current || !cameraReady) return;
    try {
      setProcessing(true);
      setErrorMsg(null);

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });

      if (!photo) throw new Error('Failed to capture photo');

      // Resize the image to speed up API transfer and save bandwidth (Gemini can read well from smaller images)
      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipResult.base64) {
        throw new Error('Failed to process image');
      }

      const extracted = await extractNutritionFromImage(manipResult.base64);

      if (extracted) {
        onExtracted(extracted);
      } else {
        setErrorMsg('Could not read nutrition data. Please try again with a clearer image.');
      }
    } catch (err) {
      console.error('Camera Capture Error:', err);
      // Android Emulator-e camera crash korle test korar jonno ei mock data use hobe
      Alert.alert(
        'Emulator Camera Failed',
        'Your emulator camera failed to take a picture (common Android emulator issue).\n\nWe will use Mock/Dummy data to show you how the feature works!',
        [
          {
            text: 'Use Mock Data',
            onPress: () => {
              onExtracted({
                name: 'Test Cereal (Mock)',
                calories: 150,
                proteinG: 4,
                carbsG: 30,
                fatG: 2,
                servingSize: '1 cup',
              });
            },
          },
          { text: 'Cancel', style: 'cancel', onPress: () => setProcessing(false) },
        ]
      );
    }
  };

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
              Scan Nutrition Label
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
            ) : processing ? (
              <View style={styles.processingBox}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={styles.processingText}>AI is reading your label...</Text>
              </View>
            ) : (
              <View style={{ flex: 1, width: '100%' }}>
                <CameraView
                  ref={cameraRef}
                  style={StyleSheet.absoluteFillObject}
                  facing="back"
                  onCameraReady={() => setCameraReady(true)}
                />
                
                {errorMsg && (
                  <View style={styles.errorOverlay}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                )}

                <View style={styles.overlay}>
                  <Text style={styles.helpText}>Make sure the nutrition table is clear</Text>
                  
                  <View style={styles.captureButtonContainer}>
                    <Pressable style={styles.captureButton} onPress={handleCapture}>
                      <View style={styles.captureButtonInner} />
                    </Pressable>
                  </View>
                </View>
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
  processingBox: {
    alignItems: 'center',
    gap: 16,
  },
  processingText: {
    color: '#fff',
    fontFamily: F.sansSemiBold,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  helpText: {
    color: '#fff',
    fontFamily: F.sansSemiBold,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  errorOverlay: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: C.errorContainer,
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  errorText: {
    color: C.onErrorContainer,
    fontFamily: F.sansSemiBold,
    textAlign: 'center',
  },
  captureButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
});
