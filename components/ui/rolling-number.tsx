import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

interface RollingNumberProps {
  value: number;
  initialValue?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
  formatter?: (val: number) => string;
}

export const RollingNumber: React.FC<RollingNumberProps> = ({
  value,
  initialValue = 0,
  duration = 900,
  prefix = '',
  suffix = '',
  style,
  formatter,
}) => {
  const [displayValue, setDisplayValue] = useState(initialValue);
  const currentValRef = useRef(initialValue);
  const frameRef = useRef<number | null>(null);

  const formatNumber = (num: number): string => {
    if (formatter) return formatter(num);
    const rounded = Math.round(num);
    return rounded.toLocaleString('en-US');
  };

  useEffect(() => {
    const startVal = currentValRef.current;
    const targetVal = value;
    const startTime = Date.now();

    if (startVal === targetVal) {
      setDisplayValue(targetVal);
      return;
    }

    // Ease-out cubic curve for natural decelerating odometer effect
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeOutCubic(progress);

      const nextVal = startVal + (targetVal - startVal) * easedProgress;
      currentValRef.current = nextVal;
      setDisplayValue(nextVal);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        currentValRef.current = targetVal;
        setDisplayValue(targetVal);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration]);

  return (
    <Text style={style}>
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </Text>
  );
};
