import { useState, useEffect } from 'react';

export interface Settings {
  notificationsEnabled: boolean;
  notifyDaysInAdvance: number;
  notifyTime: string; // HH:mm format
  lastNotifiedDate: string;
  darkMode: boolean;
  pantryLayout: 'grid' | 'compact';
  diets: string[];
  intolerances: string;
}

const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: false,
  notifyDaysInAdvance: 3,
  notifyTime: '09:00',
  lastNotifiedDate: '',
  darkMode: false,
  pantryLayout: 'grid',
  diets: [],
  intolerances: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('chefDaDispensa_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('chefDaDispensa_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    settings,
    updateSettings,
  };
}
