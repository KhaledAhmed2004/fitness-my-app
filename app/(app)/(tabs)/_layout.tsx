import { Tabs } from 'expo-router';
import React from 'react';

import { FloatingTabBar } from '@/components/navigation/floating-tab-bar';
import { Vital } from '@/constants/vital-theme';
import { MedicineToast } from '@/components/nutrition/medicine-toast';
import { MedicineCabinetModal } from '@/components/nutrition/medicine-cabinet-modal';
import { LogMedicineModal } from '@/components/nutrition/log-medicine-modal';
import { useFeaturesStore } from '@/stores/features-store';

export default function TabsLayout() {
  const isMedicineActive = useFeaturesStore((s) => s.features.medicine !== false);

  return (
    <>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: 'transparent' },
        }}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="nutrition" options={{ title: 'Nutrition' }} />
        <Tabs.Screen name="add" options={{ title: 'Add' }} />
        <Tabs.Screen name="fasting" options={{ title: 'Fasting' }} />
        <Tabs.Screen name="training" options={{ title: 'Training' }} />
      </Tabs>
      {isMedicineActive && (
        <>
          <MedicineCabinetModal />
          <LogMedicineModal />
          <MedicineToast />
        </>
      )}
    </>
  );
}


