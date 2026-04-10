import { useState, useEffect } from 'react';
import { UserStats, Badge, WeeklyChallenge } from '../types';
import { differenceInDays, parseISO, addDays, startOfWeek } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import confetti from 'canvas-confetti';

// Averages per item
const AVG_CO2 = 0.5; // kg
const AVG_WATER = 150; // liters

export const AVAILABLE_BADGES: Badge[] = [
  { id: 'first_save', name: 'Principiante', description: 'Hai consumato il tuo primo prodotto!', icon: '🌱' },
  { id: 'saver_10', name: 'Risparmiatore', description: 'Hai salvato 10 prodotti.', icon: '💰' },
  { id: 'saver_50', name: 'Eroe dell\'Ambiente', description: 'Hai salvato 50 prodotti.', icon: '🌍' },
  { id: 'streak_3', name: 'Costante', description: 'Hai aggiornato la dispensa per 3 giorni di fila.', icon: '🔥' },
  { id: 'streak_7', name: 'Zero Sprechi', description: 'Hai aggiornato la dispensa per 7 giorni di fila.', icon: '👑' },
];

const DEFAULT_STATS: UserStats = {
  itemsConsumed: 0,
  itemsWasted: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastActionDate: null,
  badges: [],
  weeklyChallenges: [],
};

const generateWeeklyChallenges = (): WeeklyChallenge[] => {
  const nextWeek = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7).getTime();
  return [
    {
      id: `consume_5_${Date.now()}`,
      title: 'Salva 5 prodotti',
      description: 'Consuma 5 prodotti prima che scadano.',
      target: 5,
      progress: 0,
      xpReward: 100,
      isCompleted: false,
      expiresAt: nextWeek,
    },
    {
      id: `streak_3_${Date.now()}`,
      title: 'Costanza',
      description: 'Mantieni una striscia attiva di 3 giorni.',
      target: 3,
      progress: 0,
      xpReward: 150,
      isCompleted: false,
      expiresAt: nextWeek,
    }
  ];
};

export function useStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);

  useEffect(() => {
    if (!user) {
      setStats(DEFAULT_STATS);
      return;
    }

    const storedStats = localStorage.getItem(`stats_${user.uid}`);
    let currentStats = storedStats ? JSON.parse(storedStats) : DEFAULT_STATS;
    
    // Check if challenges need to be generated or refreshed
    const now = Date.now();
    if (!currentStats.weeklyChallenges || currentStats.weeklyChallenges.length === 0 || currentStats.weeklyChallenges[0].expiresAt < now) {
      currentStats.weeklyChallenges = generateWeeklyChallenges();
      updateStatsInStorage(currentStats); // Update immediately
    }

    setStats(currentStats);
  }, [user]);

  const updateStatsInStorage = async (newStats: UserStats) => {
    if (!user) return;
    localStorage.setItem(`stats_${user.uid}`, JSON.stringify(newStats));
    setStats(newStats);
  };

  const updateStreak = (currentStats: UserStats): UserStats => {
    const today = new Date().toISOString().split('T')[0];
    let newStreak = currentStats.currentStreak;

    if (currentStats.lastActionDate) {
      const daysDiff = differenceInDays(parseISO(today), parseISO(currentStats.lastActionDate));
      if (daysDiff === 1) {
        newStreak += 1;
      } else if (daysDiff > 1) {
        newStreak = 1; // Reset streak if missed a day
      }
      // If daysDiff === 0, streak remains the same
    } else {
      newStreak = 1;
    }

    return {
      ...currentStats,
      currentStreak: newStreak,
      bestStreak: Math.max(newStreak, currentStats.bestStreak),
      lastActionDate: today,
    };
  };

  const updateChallenges = (currentStats: UserStats, action: 'consume' | 'streak', value: number): WeeklyChallenge[] => {
    if (!currentStats.weeklyChallenges) return [];
    
    let updated = false;
    const newChallenges = currentStats.weeklyChallenges.map(c => {
      if (c.isCompleted) return c;
      
      let newProgress = c.progress;
      if (action === 'consume' && c.id.startsWith('consume_')) {
        newProgress += value;
      } else if (action === 'streak' && c.id.startsWith('streak_')) {
        newProgress = value; // Streak is absolute
      }

      if (newProgress !== c.progress) {
        updated = true;
        const isCompleted = newProgress >= c.target;
        if (isCompleted) {
          toast.success(`Sfida completata: ${c.title}! +${c.xpReward} XP`, { icon: '🏆' });
        }
        return { ...c, progress: Math.min(newProgress, c.target), isCompleted };
      }
      return c;
    });

    return newChallenges;
  };

  const getEstimatedPrice = (category?: string): number => {
    switch (category) {
      case 'Carne e Pesce': return 8.0;
      case 'Latticini': return 3.5;
      case 'Frutta e Verdura': return 2.0;
      case 'Surgelati': return 4.0;
      case 'Bevande': return 1.5;
      case 'Dispensa Secca': return 2.0;
      case 'Snack e Dolci': return 2.5;
      default: return 2.0;
    }
  };

  const recordConsumption = async (quantity: number = 1, category?: string) => {
    if (!user) return;
    
    const updated = updateStreak(stats);
    const estimatedSaved = getEstimatedPrice(category) * quantity;
    
    let newStats = {
      ...updated,
      itemsConsumed: updated.itemsConsumed + quantity,
      moneySaved: (updated.moneySaved || 0) + estimatedSaved,
    };
    
    // Update challenges
    let challenges = updateChallenges(newStats, 'consume', quantity);
    challenges = updateChallenges({ ...newStats, weeklyChallenges: challenges }, 'streak', newStats.currentStreak);
    newStats.weeklyChallenges = challenges;
    
    const newBadges = [...newStats.badges];
    let unlockedAny = false;

    const unlock = (badgeId: string) => {
      if (!newBadges.find(b => b.id === badgeId)) {
        const badgeDef = AVAILABLE_BADGES.find(b => b.id === badgeId);
        if (badgeDef) {
          newBadges.push({ ...badgeDef, unlockedAt: Date.now() });
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#10b981', '#f59e0b', '#3b82f6']
            });
            toast.success(`Nuovo Badge: ${badgeDef.name} ${badgeDef.icon}`, { duration: 4000 });
          }, 500);
          unlockedAny = true;
        }
      }
    };

    if (newStats.itemsConsumed >= 1) unlock('first_save');
    if (newStats.itemsConsumed >= 10) unlock('saver_10');
    if (newStats.itemsConsumed >= 50) unlock('saver_50');
    if (newStats.currentStreak >= 3) unlock('streak_3');
    if (newStats.currentStreak >= 7) unlock('streak_7');

    if (unlockedAny) {
      newStats.badges = newBadges;
    }

    await updateStatsInStorage(newStats);
  };

  const recordWaste = async (quantity: number = 1, category?: string) => {
    if (!user) return;
    
    // Reset streak on waste
    const today = new Date().toISOString().split('T')[0];
    const updatedWasteByCategory = { ...(stats.wasteByCategory || {}) };
    const catKey = category || 'Altro';
    updatedWasteByCategory[catKey] = (updatedWasteByCategory[catKey] || 0) + quantity;

    let newStats = {
      ...stats,
      currentStreak: 0, // Reset streak!
      lastActionDate: today,
      itemsWasted: stats.itemsWasted + quantity,
      wasteByCategory: updatedWasteByCategory,
    };
    
    // Update streak challenges even on waste
    const challenges = updateChallenges(newStats, 'streak', newStats.currentStreak);
    newStats.weeklyChallenges = challenges;
    
    await updateStatsInStorage(newStats);
  };

  const resetStats = async () => {
    if (!user) return;
    await updateStatsInStorage(DEFAULT_STATS);
    toast.success('Statistiche azzerate con successo!');
  };

  return {
    stats,
    recordConsumption,
    recordWaste,
    resetStats,
  };
}
