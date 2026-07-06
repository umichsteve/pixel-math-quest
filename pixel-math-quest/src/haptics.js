// Haptic feedback for native builds. Mirrors sound.js in spirit: gameplay
// code calls these fire-and-forget, and they can never throw into the game
// loop. On the web (Vercel deploy, local dev) every call is a silent no-op,
// so there is no divergence in game logic between platforms.
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = Capacitor.isNativePlatform();

async function safely(fn) {
  if (!isNative) return;
  try {
    await fn();
  } catch {
    /* haptics unavailable (older device, settings off), never block gameplay */
  }
}

export function hapticCorrect() {
  safely(() => Haptics.impact({ style: ImpactStyle.Medium }));
}

export function hapticWrong() {
  safely(() => Haptics.notification({ type: NotificationType.Error }));
}

export function hapticStageClear() {
  safely(() => Haptics.notification({ type: NotificationType.Success }));
}
