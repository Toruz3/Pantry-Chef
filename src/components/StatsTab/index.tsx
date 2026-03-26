import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Flame, Target, 
  TrendingUp, TrendingDown, Star, Award, 
  Zap, ShieldCheck, Crown, CheckCircle2, XCircle, Lock,
  PieChart, Coins, Info
} from 'lucide-react';
import { UserStats } from '../../types';
import { cn } from '../../lib/utils';
import { AVAILABLE_BADGES } from '../../hooks/useStats';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface StatsTabProps {
  stats: UserStats;
}

const calculateLevelAndXP = (stats: UserStats) => {
  const baseXP = (stats.itemsConsumed * 10) - (stats.itemsWasted * 5);
  const streakXP = stats.currentStreak * 5;
  const badgesXP = stats.badges.length * 50;
  const challengesXP = (stats.weeklyChallenges || [])
    .filter(c => c.isCompleted)
    .reduce((sum, c) => sum + c.xpReward, 0);
  
  const totalXP = Math.max(0, baseXP + streakXP + badgesXP + challengesXP);
  
  const levels = [
    { threshold: 0, title: "Apprendista", icon: Star, color: "text-stone-500 dark:text-stone-400", bg: "bg-stone-100 dark:bg-stone-800", border: "border-stone-200 dark:border-stone-700", reward: "Accesso base" },
    { threshold: 100, title: "Esploratore", icon: ShieldCheck, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-blue-200 dark:border-blue-800", reward: "Tema Blu sbloccato" },
    { threshold: 250, title: "Cuoco Consapevole", icon: Award, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30", border: "border-emerald-200 dark:border-emerald-800", reward: "Tema Smeraldo sbloccato" },
    { threshold: 500, title: "Maestro del Risparmio", icon: Zap, color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30", border: "border-purple-200 dark:border-purple-800", reward: "Tema Viola sbloccato" },
    { threshold: 1000, title: "Eroe Zero Sprechi", icon: Crown, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", border: "border-amber-200 dark:border-amber-800", reward: "Tema Oro sbloccato" },
  ];

  let currentLevelIndex = 0;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalXP >= levels[i].threshold) {
      currentLevelIndex = i;
      break;
    }
  }

  const currentLevel = levels[currentLevelIndex];
  const nextLevel = currentLevelIndex < levels.length - 1 ? levels[currentLevelIndex + 1] : null;
  
  const levelNumber = currentLevelIndex + 1;
  
  let progress = 100;
  let xpNeeded = 0;
  if (nextLevel) {
    const xpIntoLevel = totalXP - currentLevel.threshold;
    const levelSize = nextLevel.threshold - currentLevel.threshold;
    progress = (xpIntoLevel / levelSize) * 100;
    xpNeeded = nextLevel.threshold - totalXP;
  }

  return { totalXP, levelNumber, currentLevel, nextLevel, progress, xpNeeded };
};

type TabType = 'overview' | 'challenges' | 'badges';

export const StatsTab = React.forwardRef<HTMLDivElement, StatsTabProps>(({ stats }, ref) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const totalItems = stats.itemsConsumed + stats.itemsWasted;
  const consumeRatio = totalItems > 0 ? (stats.itemsConsumed / totalItems) * 100 : 0;
  
  const { totalXP, levelNumber, currentLevel, nextLevel, progress, xpNeeded } = useMemo(() => calculateLevelAndXP(stats), [stats]);

  const LevelIcon = currentLevel.icon;

  const pieData = [
    { name: 'Consumati', value: stats.itemsConsumed, color: '#10b981' },
    { name: 'Sprecati', value: stats.itemsWasted, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Smart Insight logic
  const getInsight = () => {
    if (totalItems === 0) return "Inizia a usare l'app consumando o buttando prodotti per ricevere consigli personalizzati.";
    if (consumeRatio >= 90) return "Sei un vero campione! Il tuo livello di spreco è quasi nullo. Continua così!";
    if (stats.wasteByCategory) {
      const entries = Object.entries(stats.wasteByCategory);
      if (entries.length > 0) {
        const worstCategory = entries.reduce((a, b) => a[1] > b[1] ? a : b);
        if (worstCategory[1] > 2) {
          return `Abbiamo notato che butti spesso prodotti della categoria "${worstCategory[0]}". Prova a comprarne quantità minori la prossima volta!`;
        }
      }
    }
    if (stats.itemsWasted > 5) return "Stai sprecando un po' troppo ultimamente. Controlla più spesso la sezione 'In Scadenza'!";
    return "Stai andando bene! Ricordati di pianificare i pasti in anticipo per ridurre ulteriormente gli sprechi.";
  };

  return (
    <motion.div
      ref={ref}
      key="stats"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-nav-safe sm:pb-0"
    >
      <section className="pt-2 sm:pt-8">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Chef da Dispensa Logo" className="w-16 h-16 rounded-2xl shadow-sm mx-auto mb-4 object-cover" referrerPolicy="no-referrer" />
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Il Tuo Profilo</h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1">Impatto e progressi</p>
        </div>

        {/* Segmented Control */}
        <div className="flex p-1 bg-stone-200/50 dark:bg-stone-800/50 rounded-2xl mb-6">
          {(['overview', 'challenges', 'badges'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-xl transition-all capitalize",
                activeTab === tab 
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm" 
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
              )}
            >
              {tab === 'overview' ? 'Panoramica' : tab === 'challenges' ? 'Sfide' : 'Medagliere'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Hero Ring Chart for Level */}
              <div className={cn(
                "rounded-3xl p-6 border-2 shadow-sm relative overflow-hidden flex flex-col items-center",
                "bg-white dark:bg-stone-900",
                currentLevel.border
              )}>
                <div className={cn("absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-20 blur-2xl", currentLevel.bg)} />
                
                <div className="relative w-40 h-40 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="45"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-stone-100 dark:text-stone-800"
                    />
                    <motion.circle
                      cx="50" cy="50" r="45"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={283}
                      strokeDashoffset={283 - (283 * progress) / 100}
                      className={currentLevel.color.split(' ')[0]} // Use the light mode color class
                      initial={{ strokeDashoffset: 283 }}
                      animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <LevelIcon className={cn("w-8 h-8 mb-1", currentLevel.color)} />
                    <span className="text-2xl font-black text-stone-900 dark:text-stone-100 leading-none">{levelNumber}</span>
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mt-1">Livello</span>
                  </div>
                </div>

                <h3 className={cn("text-xl font-black mb-1", currentLevel.color)}>
                  {currentLevel.title}
                </h3>
                <p className="text-stone-500 dark:text-stone-400 font-medium text-sm mb-4">
                  {totalXP.toLocaleString()} XP Totali
                </p>

                {nextLevel ? (
                  <div className="w-full bg-stone-50 dark:bg-stone-800/50 rounded-xl p-3 flex items-center justify-between border border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-stone-400" />
                      <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                        Prossimo: <span className="font-bold">{nextLevel.reward}</span>
                      </span>
                    </div>
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{xpNeeded} XP</span>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Livello massimo raggiunto!</p>
                )}
              </div>

              {/* Real Impact Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 flex flex-col items-center text-center">
                  <Coins className="w-6 h-6 text-emerald-500 mb-2" />
                  <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider mb-1">Risparmio Stimato</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">~{stats.moneySaved?.toFixed(0) || 0}€</span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 flex flex-col items-center text-center">
                  <PieChart className="w-6 h-6 text-blue-500 mb-2" />
                  <span className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider mb-1">Cibo Salvato</span>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{consumeRatio.toFixed(0)}%</span>
                </div>
              </div>

              {/* Streaks Card */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-inner",
                    stats.currentStreak > 0 ? "bg-orange-500 text-white" : "bg-stone-200 dark:bg-stone-800 text-stone-400"
                  )}>
                    <Flame className={cn("w-6 h-6", stats.currentStreak > 0 && "animate-pulse")} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-orange-600/70 dark:text-orange-400/70 uppercase tracking-wider mb-0.5">Striscia Attuale</p>
                    <p className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none">
                      {stats.currentStreak} <span className="text-sm font-bold text-orange-500/70 dark:text-orange-500/70">giorni</span>
                    </p>
                  </div>
                </div>
                <div className="text-right border-l border-orange-200 dark:border-orange-900/50 pl-4">
                  <p className="text-[10px] font-bold text-orange-600/50 dark:text-orange-400/50 uppercase tracking-wider mb-1">Record</p>
                  <p className="text-lg font-black text-orange-700 dark:text-orange-300 leading-none">{stats.bestStreak}</p>
                </div>
              </div>

              {/* Donut Chart & Basic Stats */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-4">Rapporto Consumi</h3>
                {totalItems > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 shrink-0">
                      <RechartsPieChart width={96} height={96}>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={45}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ color: '#1c1917', fontWeight: 'bold' }}
                        />
                      </RechartsPieChart>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="text-sm font-medium text-stone-600 dark:text-stone-300">Consumati</span>
                        </div>
                        <span className="text-sm font-bold text-stone-900 dark:text-stone-100">{stats.itemsConsumed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-sm font-medium text-stone-600 dark:text-stone-300">Sprecati</span>
                        </div>
                        <span className="text-sm font-bold text-stone-900 dark:text-stone-100">{stats.itemsWasted}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-stone-500 dark:text-stone-400 text-sm">
                    Nessun dato disponibile. Inizia a usare l'app!
                  </div>
                )}
              </div>

              {/* Smart Insights */}
              <div className="bg-stone-100 dark:bg-stone-800/50 rounded-2xl p-4 flex gap-3 items-start border border-stone-200 dark:border-stone-700">
                <div className="bg-white dark:bg-stone-700 p-2 rounded-full shrink-0 shadow-sm">
                  <Info className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider mb-1">Il consiglio dello Chef</h4>
                  <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    {getInsight()}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'challenges' && (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {stats.weeklyChallenges && stats.weeklyChallenges.length > 0 ? (
                stats.weeklyChallenges.map(challenge => (
                  <div 
                    key={challenge.id}
                    className={cn(
                      "bg-white dark:bg-stone-900 border rounded-2xl p-5 shadow-sm relative overflow-hidden transition-colors",
                      challenge.isCompleted 
                        ? "border-purple-200 dark:border-purple-800/50 bg-purple-50/30 dark:bg-purple-900/10" 
                        : "border-stone-200 dark:border-stone-800"
                    )}
                  >
                    {challenge.isCompleted && (
                      <div className="absolute top-0 right-0 bg-purple-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-xl uppercase tracking-wider z-10">
                        Completata
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-3 mt-1">
                      <div className="pr-2">
                        <h4 className={cn(
                          "font-bold text-lg mb-1",
                          challenge.isCompleted ? "text-purple-900 dark:text-purple-100" : "text-stone-900 dark:text-stone-100"
                        )}>{challenge.title}</h4>
                        <p className="text-sm text-stone-500 dark:text-stone-400">{challenge.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 px-2.5 py-1.5 rounded-xl shrink-0">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-black text-amber-600 dark:text-amber-400">{challenge.xpReward}</span>
                      </div>
                    </div>
                    
                    <div className="mt-5">
                      <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        <span>Progresso</span>
                        <span>{challenge.progress} / {challenge.target}</span>
                      </div>
                      <div className="h-3 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full",
                            challenge.isCompleted ? "bg-purple-500" : "bg-stone-400 dark:bg-stone-500"
                          )} 
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
                  <Target className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
                  <p className="text-stone-500 dark:text-stone-400 font-medium">Nessuna sfida attiva al momento.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'badges' && (
            <motion.div
              key="badges"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Sbloccati: {stats.badges.length} / {AVAILABLE_BADGES.length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AVAILABLE_BADGES.map(badgeDef => {
                  const unlockedBadge = stats.badges.find(b => b.id === badgeDef.id);
                  const isUnlocked = !!unlockedBadge;

                  return (
                    <div 
                      key={badgeDef.id} 
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl shadow-sm transition-all relative overflow-hidden",
                        isUnlocked 
                          ? "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-700 group"
                          : "bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 opacity-70 grayscale"
                      )}
                    >
                      <div className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center text-3xl shrink-0 shadow-inner border",
                        isUnlocked 
                          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/50 group-hover:scale-110 transition-transform"
                          : "bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700"
                      )}>
                        {isUnlocked ? badgeDef.icon : <Lock className="w-6 h-6 text-stone-400 dark:text-stone-500" />}
                      </div>
                      <div className="flex-1">
                        <h4 className={cn(
                          "font-bold text-sm",
                          isUnlocked ? "text-stone-900 dark:text-stone-100" : "text-stone-500 dark:text-stone-400"
                        )}>
                          {badgeDef.name}
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400 leading-snug mt-0.5">
                          {badgeDef.description}
                        </p>
                        {isUnlocked && (
                          <p className="text-[10px] font-bold text-amber-500 mt-1 uppercase tracking-wider">+50 XP</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </motion.div>
  );
});
