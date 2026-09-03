/**
 * MENTOR: SafeAreaView (and BlurView) are NOT RN core primitives.
 * NativeWind v4 ignores their className unless cssInterop is registered.
 * Import this once from the root layout before any screens render.
 */
import { cssInterop } from 'nativewind';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';

cssInterop(SafeAreaView, { className: 'style' });
cssInterop(BlurView, { className: 'style' });
