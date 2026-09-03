import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { Vital } from '@/constants/vital-theme';
import { useMedicineStore } from '@/stores/medicine-store';

const C = Vital.colors;
const F = Vital.fonts;

export function MedicineToast() {
  const toast = useMedicineStore(s => s.toast);
  const hideToast = useMedicineStore(s => s.hideToast);
  const removeEntry = useMedicineStore(s => s.removeEntry);
  
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    if (toast) {
      setIsVisible(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsVisible(false);
      });
    }
  }, [toast]);

  if (!isVisible && !toast) return null;

  const handleUndo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (toast?.undoId) {
      removeEntry(toast.undoId);
    }
    hideToast();
  };

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]} pointerEvents={toast ? "auto" : "none"}>
      <View style={styles.toastContent}>
        <View style={styles.iconBg}>
          <MaterialIcons name="check-circle" size={28} color="#4CAF50" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{toast?.title || 'Success'}</Text>
          <Text style={styles.message}>{toast?.message || ''}</Text>
        </View>
        
        {toast?.undoId && (
          <Pressable style={styles.undoButton} onPress={handleUndo}>
            <Text style={styles.undoText}>UNDO</Text>
          </Pressable>
        )}
        
        <Pressable style={styles.closeBtn} onPress={hideToast}>
          <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 90,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 16,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: C.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  iconBg: {
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: F.sansSemiBold,
    fontSize: 16,
    color: C.onSurface,
  },
  message: {
    fontFamily: F.sans,
    fontSize: 13,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  undoButton: {
    backgroundColor: 'rgba(233, 30, 99, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  undoText: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: C.primary,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
});
