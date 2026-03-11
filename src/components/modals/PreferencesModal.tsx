import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChefHat, Users, Utensils, Loader2 } from 'lucide-react';

interface PreferencesModalProps {
  isOpen: boolean;
  mealType: 'colazione' | 'pranzo' | 'cena' | 'spuntino' | null;
  isGenerating: boolean;
  onConfirm: (servings: number, useMicrowave: boolean, useAirFryer: boolean, preferences: string) => void;
  onCancel: () => void;
}

export function PreferencesModal({ isOpen, mealType, isGenerating, onConfirm, onCancel }: PreferencesModalProps) {
  const [servings, setServings] = useState<number>(1);
  const [useMicrowave, setUseMicrowave] = useState(false);
  const [useAirFryer, setUseAirFryer] = useState(false);
  const [userPreferences, setUserPreferences] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setServings(1);
      setUseMicrowave(false);
      setUseAirFryer(false);
      setUserPreferences('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 mx-auto">
          <ChefHat className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-center text-stone-900 mb-2">Qualche preferenza?</h3>
        <p className="text-center text-stone-600 mb-6 text-sm">
          Hai voglia di qualcosa in particolare? Aggiungi dei dettagli per aiutare lo Chef a creare la ricetta perfetta per te.
        </p>
        
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-stone-500" />
              <label htmlFor="modal-servings" className="text-stone-700 font-medium">Persone:</label>
            </div>
            <input
              type="number"
              id="modal-servings"
              min="1"
              max="20"
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value) || 1)}
              className="w-20 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-center font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-stone-700">Elettrodomestici disponibili:</span>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useMicrowave}
                  onChange={(e) => setUseMicrowave(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                />
                <span className="text-sm text-stone-600">Microonde</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useAirFryer}
                  onChange={(e) => setUseAirFryer(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                />
                <span className="text-sm text-stone-600">Friggitrice ad aria</span>
              </label>
            </div>
          </div>
        </div>

        <textarea
          value={userPreferences}
          onChange={(e) => setUserPreferences(e.target.value)}
          placeholder="Es. Vorrei qualcosa di leggero, ho voglia di piccante, non usare i latticini..."
          className="w-full h-32 p-3 border border-stone-200 rounded-xl bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none mb-6 text-sm"
        />

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={() => onConfirm(servings, useMicrowave, useAirFryer, userPreferences)}
            disabled={isGenerating}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Utensils className="w-5 h-5" />}
            Genera
          </button>
        </div>
      </motion.div>
    </div>
  );
}
