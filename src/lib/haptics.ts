type VibrationPattern = number | number[];

function vibrate(pattern: VibrationPattern) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }

  navigator.vibrate(pattern);
}

export const haptics = {
  light: () => vibrate(10),
  success: () => vibrate([16, 24, 16]),
  error: () => vibrate([32, 28, 32]),

  // Sorting Hat ceremony patterns
  /** Heavy thud for the reveal moment */
  reveal: () => vibrate([50, 30, 80, 40, 120]),
  /** Quick tap for tile selection */
  tap: () => vibrate(6),
  /** Rising crescendo for constellation completion */
  crescendo: () => vibrate([10, 20, 15, 20, 25, 20, 40, 20, 60]),
  /** Double-pulse for trait bar arrival */
  pulse: () => vibrate([12, 16, 12]),
};
