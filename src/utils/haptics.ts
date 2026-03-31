export const vibrate = (pattern: number | number[] = 50) => {
  if (typeof window !== 'undefined' && navigator && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore errors on devices that don't support vibration
    }
  }
};

export const haptics = {
  light: () => vibrate(10),
  medium: () => vibrate(30),
  heavy: () => vibrate(50),
  success: () => vibrate([10, 30, 10]),
  warning: () => vibrate([30, 50, 30]),
  error: () => vibrate([50, 100, 50]),
};
