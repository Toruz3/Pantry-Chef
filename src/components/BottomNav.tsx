import React from 'react';
import { Package, Utensils, Plus, Trophy, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomNavProps {
  activeTab: 'pantry' | 'recipe' | 'stats' | 'settings';
  handleTabChange: (tab: 'pantry' | 'recipe' | 'stats' | 'settings') => void;
  isGenerating: boolean;
  setShowAddSheet: (show: boolean) => void;
}

export function BottomNav({ activeTab, handleTabChange, isGenerating, setShowAddSheet }: BottomNavProps) {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-t border-stone-200/50 dark:border-stone-800/50 flex justify-around items-center h-[calc(4rem+env(safe-area-inset-bottom))] px-2 z-40 pb-safe transition-colors duration-200">
      <button
        onClick={() => handleTabChange('pantry')}
        disabled={isGenerating}
        className={cn(
          'flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all active:scale-95',
          activeTab === 'pantry' ? 'text-emerald-600 dark:text-emerald-500' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100',
          isGenerating && 'opacity-50 cursor-not-allowed',
        )}
      >
        <div className={cn(
          "p-1.5 rounded-xl transition-colors",
          activeTab === 'pantry' && "bg-emerald-100 dark:bg-emerald-900/40"
        )}>
          <Package className={cn('w-5 h-5', activeTab === 'pantry' && 'fill-emerald-50 dark:fill-emerald-900/30')} />
        </div>
        <span className="text-[10px] font-medium">Dispensa</span>
      </button>

      <button
        onClick={() => handleTabChange('recipe')}
        disabled={isGenerating}
        className={cn(
          'flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all active:scale-95',
          activeTab === 'recipe' ? 'text-emerald-600 dark:text-emerald-500' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100',
          isGenerating && 'opacity-50 cursor-not-allowed',
        )}
      >
        <div className={cn(
          "p-1.5 rounded-xl transition-colors",
          activeTab === 'recipe' && "bg-emerald-100 dark:bg-emerald-900/40"
        )}>
          <Utensils className={cn('w-5 h-5', activeTab === 'recipe' && 'fill-emerald-50 dark:fill-emerald-900/30')} />
        </div>
        <span className="text-[10px] font-medium">Ricette</span>
      </button>

      {/* FAB for Add */}
      <div className="relative flex items-center justify-center">
        <button
          onClick={() => setShowAddSheet(true)}
          disabled={isGenerating}
          className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all active:scale-90 -translate-y-4 disabled:opacity-50"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      <button
        onClick={() => handleTabChange('stats')}
        disabled={isGenerating}
        className={cn(
          'flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all active:scale-95',
          activeTab === 'stats' ? 'text-emerald-600 dark:text-emerald-500' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100',
          isGenerating && 'opacity-50 cursor-not-allowed',
        )}
      >
        <div className={cn(
          "p-1.5 rounded-xl transition-colors",
          activeTab === 'stats' && "bg-emerald-100 dark:bg-emerald-900/40"
        )}>
          <Trophy className={cn('w-5 h-5', activeTab === 'stats' && 'fill-emerald-50 dark:fill-emerald-900/30')} />
        </div>
        <span className="text-[10px] font-medium">Statistiche</span>
      </button>

      <button
        onClick={() => handleTabChange('settings')}
        disabled={isGenerating}
        className={cn(
          'flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all active:scale-95',
          activeTab === 'settings' ? 'text-emerald-600 dark:text-emerald-500' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100',
          isGenerating && 'opacity-50 cursor-not-allowed',
        )}
      >
        <div className={cn(
          "p-1.5 rounded-xl transition-colors",
          activeTab === 'settings' && "bg-emerald-100 dark:bg-emerald-900/40"
        )}>
          <SettingsIcon className={cn('w-5 h-5', activeTab === 'settings' && 'fill-emerald-50 dark:fill-emerald-900/30')} />
        </div>
        <span className="text-[10px] font-medium">Impostazioni</span>
      </button>
    </nav>
  );
}
