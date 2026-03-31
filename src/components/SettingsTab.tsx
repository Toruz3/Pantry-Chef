import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Clock, CalendarDays, Moon, Sun, LayoutGrid, List, UtensilsCrossed, User, LogOut, Trash2 } from 'lucide-react';
import { Settings } from '../hooks/useSettings';
import { requestNotificationPermission } from '../utils/notifications';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useStats } from '../hooks/useStats';

interface SettingsTabProps {
  settings: Settings;
  onUpdate: (newSettings: Partial<Settings>) => void;
}

const COMMON_DIETS = [
  { id: 'vegetariano', label: 'Vegetariano' },
  { id: 'vegano', label: 'Vegano' },
  { id: 'senza_glutine', label: 'Senza Glutine' },
  { id: 'senza_lattosio', label: 'Senza Lattosio' },
];

export function SettingsTab({ settings, onUpdate }: SettingsTabProps) {
  const { user, signOut } = useAuth();
  const { resetStats } = useStats();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetStatsConfirm, setShowResetStatsConfirm] = useState(false);

  const handleToggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        onUpdate({ notificationsEnabled: true });
        toast.success('Notifiche attivate con successo!');
      } else {
        onUpdate({ notificationsEnabled: true });
        toast.success('Notifiche native bloccate dal browser. Riceverai gli avvisi all\'interno dell\'app.', { duration: 4000 });
      }
    } else {
      onUpdate({ notificationsEnabled: false });
    }
  };

  const handleToggleDarkMode = () => {
    onUpdate({ darkMode: !settings.darkMode });
  };

  const toggleDiet = (dietId: string) => {
    const currentDiets = settings.diets || [];
    if (currentDiets.includes(dietId)) {
      onUpdate({ diets: currentDiets.filter(d => d !== dietId) });
    } else {
      onUpdate({ diets: [...currentDiets, dietId] });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Disconnesso con successo');
    } catch (error) {
      toast.error('Errore durante la disconnessione');
    }
  };

  const handleDeleteAccount = async () => {
    // In a real app, you would call a cloud function or delete user data from Firestore then delete the auth user
    toast.error('Funzionalità di eliminazione account non ancora implementata.');
    setShowDeleteConfirm(false);
  };

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-nav-safe sm:pb-0"
    >
      <section className="pt-2 sm:pt-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Chef da Dispensa Logo" className="w-16 h-16 rounded-2xl shadow-sm mx-auto mb-4 object-cover" referrerPolicy="no-referrer" />
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Impostazioni</h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1">Personalizza la tua esperienza</p>
        </div>

        <div className="space-y-6">
          {/* Theme Section */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-100 dark:border-stone-800">
            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2 mb-4">
              {settings.darkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />} Aspetto
            </h3>
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="font-semibold text-stone-800 dark:text-stone-200">Modalità Scura</h4>
                <p className="text-sm text-stone-500 dark:text-stone-400">Attiva il tema scuro per l'app</p>
              </div>
              <button
                onClick={handleToggleDarkMode}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900",
                  settings.darkMode ? 'bg-emerald-600' : 'bg-stone-200'
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
              <div className="mb-3">
                <h4 className="font-semibold text-stone-800 dark:text-stone-200">Layout Dispensa</h4>
                <p className="text-sm text-stone-500 dark:text-stone-400">Scegli come visualizzare i prodotti</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdate({ pantryLayout: 'grid' })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border transition-colors",
                    settings.pantryLayout === 'grid' 
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-medium" 
                      : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Dettagliato
                </button>
                <button
                  onClick={() => onUpdate({ pantryLayout: 'compact' })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border transition-colors",
                    settings.pantryLayout === 'compact' 
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-medium" 
                      : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
                  )}
                >
                  <List className="w-4 h-4" />
                  Compatto
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-100 dark:border-stone-800">
            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-500" /> Notifiche
            </h3>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-stone-800 dark:text-stone-200">Abilita Notifiche</h4>
                <p className="text-sm text-stone-500 dark:text-stone-400">Ricevi avvisi per i prodotti in scadenza</p>
              </div>
              <button
                onClick={handleToggleNotifications}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900",
                  settings.notificationsEnabled ? 'bg-emerald-600' : 'bg-stone-200 dark:bg-stone-700'
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {settings.notificationsEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-5 pt-4 border-t border-stone-100 dark:border-stone-800"
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
                    value={settings.notifyDaysInAdvance}
                    onChange={(e) => onUpdate({ notifyDaysInAdvance: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50 dark:bg-stone-800 dark:text-white text-base"
                  />
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">Ti avviseremo {settings.notifyDaysInAdvance} giorni prima della scadenza.</p>
                </div>

                {/* Time */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                    <Clock className="w-4 h-4 text-stone-400 dark:text-stone-500" /> Orario notifica
                  </label>
                  <input
                    type="time"
                    value={settings.notifyTime}
                    onChange={(e) => onUpdate({ notifyTime: e.target.value })}
                    className="w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50 dark:bg-stone-800 dark:text-white text-base"
                  />
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">A che ora vuoi ricevere il promemoria giornaliero?</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Diet and Intolerances Section */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-100 dark:border-stone-800">
            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2 mb-4">
              <UtensilsCrossed className="w-5 h-5 text-orange-500" /> Diete e Intolleranze
            </h3>
            
            <div className="mb-6">
              <h4 className="font-semibold text-stone-800 dark:text-stone-200 mb-3">Preferenze Alimentari</h4>
              <div className="flex flex-wrap gap-2">
                {COMMON_DIETS.map(diet => {
                  const isSelected = (settings.diets || []).includes(diet.id);
                  return (
                    <button
                      key={diet.id}
                      onClick={() => toggleDiet(diet.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                        isSelected
                          ? "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-800 text-orange-800 dark:text-orange-400"
                          : "bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700"
                      )}
                    >
                      {diet.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-2">
              <h4 className="font-semibold text-stone-800 dark:text-stone-200 mb-2">Allergie e Intolleranze</h4>
              <input
                type="text"
                placeholder="Es. Noci, crostacei, fragole..."
                value={settings.intolerances || ''}
                onChange={(e) => onUpdate({ intolerances: e.target.value })}
                className="w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50 dark:bg-stone-800 dark:text-white text-base"
              />
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">L'IA terrà conto di queste informazioni per suggerirti le ricette.</p>
            </div>
          </div>

          {/* Account Management Section */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-100 dark:border-stone-800">
            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-500" /> Gestione Account
            </h3>
            
            {user && (
              <div className="mb-6 flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-800">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-stone-500 dark:text-stone-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900 dark:text-stone-100 truncate">{user.displayName || 'Utente'}</p>
                  <p className="text-sm text-stone-500 dark:text-stone-400 truncate">{user.email}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Disconnetti
              </button>

              {showResetStatsConfirm ? (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                  <p className="text-sm text-orange-800 dark:text-orange-300 font-medium mb-3 text-center">
                    Vuoi davvero azzerare le tue statistiche?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowResetStatsConfirm(false)}
                      className="flex-1 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => {
                        resetStats();
                        setShowResetStatsConfirm(false);
                      }}
                      className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                      Azzera
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetStatsConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-400 font-bold hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Azzera Statistiche
                </button>
              )}

              {showDeleteConfirm ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-3 text-center">
                    Sei sicuro? Questa azione è irreversibile e cancellerà tutti i tuoi dati.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                      Conferma
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Elimina Account
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
