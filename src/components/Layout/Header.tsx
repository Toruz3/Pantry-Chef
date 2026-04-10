import React from 'react';
import { Plus, Package, Utensils, Trophy, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HeaderProps {
  activeTab: 'pantry' | 'recipe' | 'stats' | 'settings';
  handleTabChange: (tab: 'pantry' | 'recipe' | 'stats' | 'settings') => void;
  isGenerating: boolean;
  setShowAddSheet: (show: boolean) => void;
}

export function Header({ activeTab, handleTabChange, isGenerating, setShowAddSheet }: HeaderProps) {
  return (
    <header className="hidden sm:block bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200/50 dark:border-stone-800/50 sticky top-0 z-10 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Chef da Dispensa Logo" className="w-10 h-10 rounded-xl shadow-sm object-cover" referrerPolicy="no-referrer" />
          <h1 className="text-xl font-semibold tracking-tight hidden sm:block dark:text-white">Chef da Dispensa</h1>
        </div>
        <nav className="hidden sm:flex gap-2 items-center">
          <button
            onClick={() => setShowAddSheet(true)}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm mr-2"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi</span>
          </button>
          {(['pantry', 'recipe', 'stats', 'settings'] as const).map(tab => {
            const labels: Record<string, string> = { pantry: 'Dispensa', recipe: 'Ricette', stats: 'Statistiche', settings: 'Impostazioni' };
            const Icons: Record<string, React.ElementType> = { pantry: Package, recipe: Utensils, stats: Trophy, settings: SettingsIcon };
            const Icon = Icons[tab];
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                disabled={isGenerating}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors',
                  activeTab === tab ? 'bg-stone-900 dark:bg-stone-800 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/80 dark:hover:bg-stone-800/80',
                  isGenerating && 'opacity-50 cursor-not-allowed',
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{labels[tab]}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
