import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Bell, Clock, CalendarDays } from 'lucide-react';
import { Settings } from '../../hooks/useSettings';
import { requestNotificationPermission } from '../../utils/notifications';
import { toast } from 'react-hot-toast';

interface SettingsModalProps {
  settings: Settings;
  onUpdate: (newSettings: Partial<Settings>) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, onUpdate, onClose }: SettingsModalProps) {
  const [enabled, setEnabled] = useState(settings.notificationsEnabled);
  const [days, setDays] = useState(settings.notifyDaysInAdvance);
  const [time, setTime] = useState(settings.notifyTime);

  const handleToggleNotifications = async () => {
    if (!enabled) {
      const granted = await requestNotificationPermission();
      setEnabled(true);
      if (granted) {
        toast.success('Notifiche attivate con successo!');
      } else {
        toast.success('Notifiche native bloccate dal browser. Riceverai gli avvisi all\'interno dell\'app.', { duration: 4000 });
      }
    } else {
      setEnabled(false);
    }
  };

  const handleSave = () => {
    onUpdate({
      notificationsEnabled: enabled,
      notifyDaysInAdvance: days,
      notifyTime: time,
    });
    toast.success('Impostazioni salvate');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] dark:border dark:border-stone-800"
      >
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-500" /> Impostazioni Notifiche
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-200">Abilita Notifiche</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">Ricevi avvisi per i prodotti in scadenza</p>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900 ${
                enabled ? 'bg-emerald-600' : 'bg-stone-200 dark:bg-stone-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-5 pt-2"
            >
              {/* Days in advance */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  <CalendarDays className="w-4 h-4 text-stone-400 dark:text-stone-500" /> Preavviso (giorni)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50 dark:bg-stone-800 dark:text-white text-base"
                />
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">Ti avviseremo {days} giorni prima della scadenza.</p>
              </div>

              {/* Time */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  <Clock className="w-4 h-4 text-stone-400 dark:text-stone-500" /> Orario notifica
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50 dark:bg-stone-800 dark:text-white text-base"
                />
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">A che ora vuoi ricevere il promemoria giornaliero?</p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-5 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <button
            onClick={handleSave}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors active:scale-[0.98]"
          >
            Salva Impostazioni
          </button>
        </div>
      </motion.div>
    </div>
  );
}
