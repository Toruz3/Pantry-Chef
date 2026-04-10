import { Product } from '../types';
import { differenceInDays, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return false;
  }

  try {
    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  } catch (error) {
    console.warn('Error requesting notification permission:', error);
  }

  return false;
}

export function checkAndSendNotifications(
  products: Product[],
  daysInAdvance: number,
  notifyTime: string,
  lastNotifiedDate: string,
  onNotified: (dateStr: string) => void
) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Check if we already notified today
  if (lastNotifiedDate === todayStr) {
    return;
  }

  // Check if it's past the notify time
  const [notifyHour, notifyMinute] = notifyTime.split(':').map(Number);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (currentHour < notifyHour || (currentHour === notifyHour && currentMinute < notifyMinute)) {
    return; // Not time yet
  }

  // Find products expiring soon
  const expiringProducts = products.filter(p => {
    if (!p.expirationDate) return false;
    const daysLeft = differenceInDays(parseISO(p.expirationDate), now);
    return daysLeft >= 0 && daysLeft <= daysInAdvance;
  });

  const expiredProducts = products.filter(p => {
    if (!p.expirationDate) return false;
    return differenceInDays(parseISO(p.expirationDate), now) < 0;
  });

  let title = '';
  let body = '';

  if (expiringProducts.length > 0 || expiredProducts.length > 0) {
    title = 'Chef da Dispensa - Avviso Scadenze';
    
    if (expiredProducts.length > 0) {
      body += `Hai ${expiredProducts.length} prodotti scaduti! `;
    }
    if (expiringProducts.length > 0) {
      body += `Hai ${expiringProducts.length} prodotti in scadenza nei prossimi ${daysInAdvance} giorni.`;
    }

    const hasNativeSupport = 'Notification' in window && Notification.permission === 'granted';

    if (hasNativeSupport) {
      try {
        // Try to use Service Worker if available for better mobile support
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: '/logo.png',
            badge: '/logo.png',
            vibrate: [200, 100, 200],
            tag: 'expiration-alert',
            renotify: true,
          } as any);
        }).catch(() => {
          // Fallback to standard Notification
          new Notification(title, {
            body,
            icon: '/logo.png',
          });
        });
      } catch (e) {
        // Fallback
        new Notification(title, {
          body,
          icon: '/logo.png',
        });
      }
    } else {
      // In-app fallback
      toast(body, {
        icon: '🔔',
        duration: 8000,
        style: {
          borderRadius: '16px',
          background: '#333',
          color: '#fff',
        },
      });
    }

    onNotified(todayStr);
  }
}
