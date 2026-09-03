export interface FAQItem {
  id: string;
  category: 'Nutrition' | 'Fasting' | 'Training' | 'Focus' | 'Meds' | 'Account';
  question: string;
  answer: string;
  tips?: string[];
  tags: string[];
}

export const FAQ_CATEGORIES: Array<{
  id: string;
  label: string;
  icon: string;
}> = [
  { id: 'all', label: 'All FAQs', icon: 'auto-awesome' },
  { id: 'Nutrition', label: 'Nutrition & Macros', icon: 'restaurant' },
  { id: 'Fasting', label: 'Intermittent Fasting', icon: 'timer' },
  { id: 'Training', label: 'Running & Training', icon: 'directions-run' },
  { id: 'Focus', label: 'Focus & Productivity', icon: 'psychology' },
  { id: 'Meds', label: 'Medicine & Health', icon: 'medication' },
  { id: 'Account', label: 'Data & Privacy', icon: 'security' },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Nutrition',
    question: 'How do I log custom foods or adjust my daily calorie/macro targets?',
    answer:
      'Go to the Nutrition tab from the bottom navigation bar. Tap the floating "+" button to quickly log a meal or scan a barcode. To customize calorie and macronutrient targets (Protein, Carbs, Fats), head to your Profile > Nutrition Goals.',
    tips: [
      'Use quick food templates to log frequent breakfasts or post-workout shakes in 1 tap.',
      'Water intake can be tracked directly on the Dashboard telemetry bento card.',
    ],
    tags: ['nutrition', 'food', 'calorie', 'macros', 'protein', 'carbs', 'fats', 'log'],
  },
  {
    id: 'faq-2',
    category: 'Nutrition',
    question: 'What is the Biomarkers & Micronutrient score?',
    answer:
      'The Biomarker score synthesizes your micronutrient consistency (vitamins, minerals, fiber) and hydration levels across 7 rolling days to deliver an overall metabolic health index.',
    tags: ['biomarker', 'score', 'vitamins', 'health', 'nutrition'],
  },
  {
    id: 'faq-3',
    category: 'Fasting',
    question: 'How do I start and customize an Intermittent Fasting session?',
    answer:
      'Open the Fasting tracker from the dashboard banner or speed dial. Choose your preferred protocol (16:8 LeanGains, 18:6 Deep Autophagy, or 24h OMAD) and tap "Start Fast". The timer runs offline in background.',
    tips: [
      'The app highlights fasting metabolic milestones like Ketosis, Autophagy, and Peak Fat Burn.',
      'You can end or extend a fast at any time with zero penalty.',
    ],
    tags: ['fasting', 'intermittent', 'timer', 'autophagy', 'ketosis', 'omad', 'protocol'],
  },
  {
    id: 'faq-4',
    category: 'Training',
    question: 'How does live GPS running pace and heart rate zone tracking work?',
    answer:
      'From the Training tab, start a run to activate low-power background location tracking. Your current pace, cadence, elevation gain, and estimated heart rate zones (Zone 2 Endurance up to Zone 5 Peak) are calculated in real time.',
    tips: [
      'Grant "Allow all the time" location permissions in Android settings for seamless background tracking during long outdoor runs.',
    ],
    tags: ['running', 'gps', 'pace', 'training', 'workout', 'heart rate', 'zone 2'],
  },
  {
    id: 'faq-5',
    category: 'Focus',
    question: 'What is the Deep Focus timer and how does it prevent burnout?',
    answer:
      'Deep Focus implements the scientific Pomodoro and Ultra-radian rhythm technique (typically 25m work + 5m restorative breathwork or 50m deep work + 10m recharge). It logs uninterrupted sessions directly to your daily productivity score.',
    tips: [
      'Enable Do Not Disturb mode on your device to minimize notifications while a focus block is running.',
    ],
    tags: ['focus', 'pomodoro', 'productivity', 'study', 'work', 'habits', 'deep work'],
  },
  {
    id: 'faq-6',
    category: 'Meds',
    question: 'How do medicine inventory tracking and refill alerts operate?',
    answer:
      'In the Medicine Cabinet (accessible via Speed Dial or Profile), add your medications with unit dosage, frequency, and remaining pill count. Every time you confirm a dose, your remaining count decreases, and the app alerts you when inventory reaches 3 days or less.',
    tips: [
      'Schedule specific morning/evening reminders to keep your adherence rate above 95%.',
    ],
    tags: ['medicine', 'medication', 'pills', 'refill', 'cabinet', 'reminders', 'dose'],
  },
  {
    id: 'faq-7',
    category: 'Account',
    question: 'Is my health, financial, and personal data encrypted on my device?',
    answer:
      'Yes! TrackMe uses local SQLite with hardware-backed Expo SecureStore encryption (Android KeyStore & iOS Keychain). Your data never leaves your device without your explicit sync consent.',
    tips: [
      'You can export your complete raw data anytime from Security & Sessions.',
    ],
    tags: ['security', 'privacy', 'encryption', 'keystore', 'offline', 'backup', 'data'],
  },
  {
    id: 'faq-8',
    category: 'Account',
    question: 'How do I enable or disable specific features (Modular UI)?',
    answer:
      'Navigate to Profile > Customize Modules. You can individually toggle any of the 8 core features (Nutrition, Fasting, Running, Deep Focus, Medicine, Todos, Habits, Expenses). Your dashboard, bottom tabs, and radial speed dial will dynamically adapt immediately.',
    tips: [
      'You can tap "Reset All" anytime to re-enable the complete full suite of features.',
    ],
    tags: ['customize', 'modules', 'disable', 'enable', 'toggle', 'profile', 'minimal'],
  },
];
