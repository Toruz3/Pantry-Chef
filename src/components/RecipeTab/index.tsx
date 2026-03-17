import React from 'react';
import { motion } from 'motion/react';
import {
  Coffee, Package, Utensils, Moon,
  Loader2, Users, Calendar, Check,
} from 'lucide-react';
import { Product, GeneratedRecipe } from '../../types';
import { cn } from '../../lib/utils';

// ─── Meal type config ────────────────────────────────────────────────────────

const MEAL_TYPES = [
  {
    id: 'colazione' as const,
    label: 'Colazione',
    Icon: Coffee,
    card: 'bg-amber-50  border-amber-200  text-amber-800  hover:bg-amber-100  active:bg-amber-200',
  },
  {
    id: 'spuntino' as const,
    label: 'Spuntino',
    Icon: Package,
    card: 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100 active:bg-orange-200',
  },
  {
    id: 'pranzo' as const,
    label: 'Pranzo',
    Icon: Utensils,
    card: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200',
  },
  {
    id: 'cena' as const,
    label: 'Cena',
    Icon: Moon,
    card: 'bg-indigo-50  border-indigo-200  text-indigo-800  hover:bg-indigo-100  active:bg-indigo-200',
  },
] as const;

// ─── Props ───────────────────────────────────────────────────────────────────

interface RecipeTabProps {
  products: Product[];
  recipe: GeneratedRecipe | null;
  isGenerating: boolean;
  isEditingRecipe: boolean;
  setIsEditingRecipe: (v: boolean) => void;
  isRecipeConfirmed: boolean;
  editedUsedProducts: GeneratedRecipe['usedProducts'];
  selectedMealType: 'colazione' | 'pranzo' | 'cena' | 'spuntino' | null;
  onOpenPreferences: (mealType: 'colazione' | 'pranzo' | 'cena' | 'spuntino') => void;
  onConfirmRecipe: () => void;
  onEditedQuantityChange: (idx: number, val: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const RecipeTab = React.forwardRef<HTMLDivElement, RecipeTabProps>(({
  products, recipe, isGenerating, isEditingRecipe, setIsEditingRecipe,
  isRecipeConfirmed, editedUsedProducts, selectedMealType,
  onOpenPreferences, onConfirmRecipe, onEditedQuantityChange,
}, ref) => {
  return (
    <motion.div
      ref={ref}
      key="recipe"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <section className="pt-2 sm:pt-8">

        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Chef da Dispensa Logo"
            className="w-16 h-16 rounded-2xl shadow-sm mx-auto mb-4 object-cover"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-2xl font-bold text-stone-900">Genera Ricetta</h2>
          <p className="text-stone-500 mt-1">
            Ottieni una ricetta usando i tuoi ingredienti in scadenza.
          </p>
        </div>

        {/* Meal type buttons — uniform card grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {MEAL_TYPES.map(({ id, label, Icon, card }) => {
            const loading = isGenerating && selectedMealType === id;
            return (
              <button
                key={id}
                onClick={() => onOpenPreferences(id)}
                disabled={isGenerating || products.length === 0}
                className={cn(
                  'flex flex-col items-center justify-center gap-2.5',
                  'rounded-2xl border-2 p-4 font-semibold text-sm',
                  'transition-all active:scale-95',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  card,
                )}
              >
                {loading
                  ? <Loader2 className="w-6 h-6 animate-spin" />
                  : <Icon className="w-6 h-6" />
                }
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Recipe area */}
        {isGenerating && !recipe ? (
          <div className="text-center py-16 border-2 border-dashed border-emerald-200 rounded-2xl bg-emerald-50/40 flex flex-col items-center justify-center">
            <div className="relative w-24 h-24 mb-6">
              {/* Bubbles */}
              <motion.div animate={{ y: [0, -20, -40], opacity: [0, 1, 0], scale: [0.5, 1, 1.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="absolute left-4 top-8 w-3 h-3 bg-emerald-400 rounded-full" />
              <motion.div animate={{ y: [0, -30, -50], opacity: [0, 1, 0], scale: [0.5, 1.2, 1.5] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} className="absolute left-10 top-10 w-4 h-4 bg-emerald-300 rounded-full" />
              <motion.div animate={{ y: [0, -25, -45], opacity: [0, 1, 0], scale: [0.5, 1, 1.5] }} transition={{ repeat: Infinity, duration: 1.8, delay: 1 }} className="absolute right-6 top-6 w-3 h-3 bg-emerald-500 rounded-full" />
              
              {/* Pot */}
              <svg viewBox="0 0 100 100" className="w-full h-full text-stone-700 relative z-10" fill="currentColor">
                <path d="M10 40 L90 40 L85 90 C84 95 80 98 75 98 L25 98 C20 98 16 95 15 90 Z" fill="#44403c" />
                <rect x="5" y="30" width="90" height="10" rx="5" fill="#292524" />
                <path d="M20 40 L80 40 L75 90 C74 95 70 98 65 98 L35 98 C30 98 26 95 25 90 Z" fill="#57534e" />
                {/* Handles */}
                <path d="M5 45 C0 45 0 60 5 60" fill="none" stroke="#292524" strokeWidth="6" strokeLinecap="round" />
                <path d="M95 45 C100 45 100 60 95 60" fill="none" stroke="#292524" strokeWidth="6" strokeLinecap="round" />
              </svg>
              
              {/* Steam */}
              <motion.div animate={{ y: [0, -10, 0], x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute -top-4 left-6 w-2 h-12 bg-white/40 blur-sm rounded-full" />
              <motion.div animate={{ y: [0, -15, 0], x: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }} className="absolute -top-6 right-8 w-3 h-16 bg-white/40 blur-sm rounded-full" />
            </div>
            <p className="text-stone-900 font-bold text-xl mb-1">Lo chef sta cucinando…</p>
            <p className="text-stone-500 text-sm">Sto preparando la ricetta perfetta per te</p>
          </div>
        ) : recipe ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-stone-50 rounded-2xl p-6 sm:p-8 border border-stone-200"
          >
            {/* Title + meta */}
            <div className="mb-8 text-center">
              <h3 className="text-3xl font-bold text-stone-900 mb-3 font-serif">{recipe.title}</h3>
              <div className="flex justify-center gap-3 text-sm text-stone-600">
                <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-sm">
                  <Users className="w-4 h-4 text-emerald-600" />
                  {recipe.servings} {recipe.servings === 1 ? 'porzione' : 'porzioni'}
                </span>
                <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-sm">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  {recipe.prepTime}
                </span>
              </div>
            </div>

            {/* Ingredients + instructions */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <h4 className="font-semibold text-stone-900 mb-4 border-b border-stone-200 pb-2 text-lg">
                  Ingredienti
                </h4>
                <ul className="space-y-3">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="text-stone-700 flex items-start gap-2">
                      <span className="text-emerald-500 mt-1 shrink-0">•</span>
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-semibold text-stone-900 mb-4 border-b border-stone-200 pb-2 text-lg">
                  Istruzioni
                </h4>
                <ol className="space-y-5">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="text-stone-700 flex gap-4">
                      <span className="font-bold text-emerald-600 shrink-0 bg-emerald-50 w-6 h-6 flex items-center justify-center rounded-full text-sm">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Used products */}
            {editedUsedProducts.length > 0 && (
              <div className="mt-8 pt-6 border-t border-stone-200">
                {!isRecipeConfirmed && (
                  <>
                    <h4 className="font-semibold text-stone-900 mb-4 text-lg">
                      Prodotti utilizzati dalla dispensa
                    </h4>

                    {isEditingRecipe ? (
                      <div className="space-y-3 mb-6">
                        {editedUsedProducts.map((item, i) => (
                          <div
                            key={`${item.productId}-${i}`}
                            className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200 shadow-sm"
                          >
                            <span className="font-medium text-stone-700">{item.name}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number" min="0" step="0.1"
                                value={item.quantity === 0 ? '' : item.quantity}
                                onChange={(e) => onEditedQuantityChange(i, e.target.value)}
                                className="w-20 px-2 py-1.5 border border-stone-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              <span className="text-stone-500 text-sm w-8">{item.unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-2 mb-6">
                        {editedUsedProducts.map((item, i) => (
                          <li
                            key={`${item.productId}-${i}`}
                            className="flex justify-between text-stone-700 bg-white p-3 rounded-xl border border-stone-100"
                          >
                            <span>{item.name}</span>
                            <span className="font-medium">{item.quantity} {item.unit}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  {!isRecipeConfirmed ? (
                    <>
                      {isEditingRecipe ? (
                        <button
                          onClick={() => setIsEditingRecipe(false)}
                          className="flex-1 bg-stone-100 text-stone-700 px-4 py-3 rounded-xl font-medium hover:bg-stone-200 transition-colors"
                        >
                          Annulla Modifiche
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsEditingRecipe(true)}
                          className="flex-1 bg-white border border-stone-300 text-stone-700 px-4 py-3 rounded-xl font-medium hover:bg-stone-50 transition-colors"
                        >
                          Modifica Quantità
                        </button>
                      )}
                      <button
                        onClick={onConfirmRecipe}
                        className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shadow-emerald-600/20"
                      >
                        Conferma Ricetta
                      </button>
                    </>
                  ) : (
                    <div className="w-full bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl font-medium border border-emerald-200 flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Ingredienti scalati dalla dispensa!
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* Empty state */
          <div className="text-center py-16 px-4 text-stone-500 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full text-stone-300" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {/* Plate */}
                <circle cx="50" cy="50" r="40" fill="#f5f5f4" />
                <circle cx="50" cy="50" r="25" stroke="#e5e5e5" />
                {/* Fork and Knife */}
                <path d="M20 20 L20 80 M15 20 L15 40 C15 50 25 50 25 40 L25 20 M20 40 L20 50" strokeWidth="2" />
                <path d="M80 20 L80 80 M80 20 C70 20 70 50 80 50" strokeWidth="2" />
              </svg>
            </div>
            <p className="text-stone-900 font-bold text-xl mb-2">Nessuna ricetta pronta</p>
            <p className="text-sm max-w-sm mx-auto text-stone-500">
              Seleziona un pasto qui sopra per generare una ricetta basata sui prodotti nella tua dispensa.
            </p>
          </div>
        )}
      </section>
    </motion.div>
  );
});
