import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Coffee, Package, Utensils, Moon,
  Loader2, Users, Calendar, Check,
  LayoutList, LayoutPanelLeft, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Product, GeneratedRecipe } from '../../types';
import { cn } from '../../lib/utils';
import { RecipeSkeleton } from '../ui/Skeleton';
import { useProductsContext } from '../../contexts/ProductsContext';

// ─── Meal type config ────────────────────────────────────────────────────────

const MEAL_TYPES = [
  {
    id: 'colazione' as const,
    label: 'Colazione',
    Icon: Coffee,
    card: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 active:bg-amber-200 dark:active:bg-amber-900/60',
  },
  {
    id: 'spuntino' as const,
    label: 'Spuntino',
    Icon: Package,
    card: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-900/50 text-orange-800 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 active:bg-orange-200 dark:active:bg-orange-900/60',
  },
  {
    id: 'pranzo' as const,
    label: 'Pranzo',
    Icon: Utensils,
    card: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:bg-emerald-200 dark:active:bg-emerald-900/60',
  },
  {
    id: 'cena' as const,
    label: 'Cena',
    Icon: Moon,
    card: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-900/50 text-indigo-800 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 active:bg-indigo-200 dark:active:bg-indigo-900/60',
  },
] as const;

// ─── Props ───────────────────────────────────────────────────────────────────

interface RecipeTabProps {
  recipes?: GeneratedRecipe[] | null;
  recipe: GeneratedRecipe | null;
  selectedRecipeIndex?: number;
  onSelectRecipe?: (index: number) => void;
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
  recipes, recipe, selectedRecipeIndex = 0, onSelectRecipe,
  isGenerating, isEditingRecipe, setIsEditingRecipe,
  isRecipeConfirmed, editedUsedProducts, selectedMealType,
  onOpenPreferences, onConfirmRecipe, onEditedQuantityChange,
}, ref) => {
  const { sortedProducts: products } = useProductsContext();
  const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const loadingMessages = [
    "Affilando i coltelli...",
    "Consultando gli chef stellati...",
    "Cercando gli abbinamenti perfetti...",
    "Scaldando i fornelli...",
    "Controllando la dispensa...",
    "Preparando la magia..."
  ];

  React.useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isGenerating, loadingMessages.length]);

  return (
    <motion.div
      ref={ref}
      key="recipe"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-nav-safe sm:pb-0"
    >
      <section className="pt-2 sm:pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Chef da Dispensa Logo"
            className="w-16 h-16 rounded-2xl shadow-sm mx-auto mb-4 object-cover"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Genera Ricetta</h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
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
        {isGenerating && (!recipes || recipes.length === 0) ? (
          <div className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 min-h-[300px]">
            <RecipeSkeleton />
            <div className="mt-8 text-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingMessageIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="text-lg font-medium text-stone-600 dark:text-stone-300"
                >
                  {loadingMessages[loadingMessageIndex]}
                </motion.p>
              </AnimatePresence>
              <p className="text-sm text-stone-400 dark:text-stone-500 mt-2">
                L'intelligenza artificiale sta creando la tua ricetta su misura.
              </p>
            </div>
          </div>
        ) : recipes && recipes.length > 0 && recipe ? (
          <div className="space-y-6">
            {/* View Mode Toggle & Recipe Selection */}
            {recipes.length > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('horizontal')}
                    className={cn(
                      "p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors",
                      viewMode === 'horizontal' ? "bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100" : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
                    )}
                  >
                    <LayoutPanelLeft className="w-4 h-4" />
                    Carosello
                  </button>
                  <button
                    onClick={() => setViewMode('vertical')}
                    className={cn(
                      "p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors",
                      viewMode === 'vertical' ? "bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100" : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
                    )}
                  >
                    <LayoutList className="w-4 h-4" />
                    Lista
                  </button>
                </div>
                
                {viewMode === 'horizontal' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onSelectRecipe?.((selectedRecipeIndex - 1 + recipes.length) % recipes.length)}
                      className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
                      {selectedRecipeIndex + 1} di {recipes.length}
                    </span>
                    <button
                      onClick={() => onSelectRecipe?.((selectedRecipeIndex + 1) % recipes.length)}
                      className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'vertical' && recipes.length > 1 && (
              <div className="flex flex-col gap-3 mb-6">
                <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200">Opzioni Ricette</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {recipes.map((r, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectRecipe?.(idx)}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all",
                        selectedRecipeIndex === idx 
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500" 
                          : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-emerald-300 dark:hover:border-emerald-700"
                      )}
                    >
                      <h4 className={cn(
                        "font-medium mb-1 line-clamp-2",
                        selectedRecipeIndex === idx ? "text-emerald-800 dark:text-emerald-300" : "text-stone-800 dark:text-stone-200"
                      )}>{r.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {r.prepTime}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          <AnimatePresence mode="wait">
          <motion.div
            key={selectedRecipeIndex}
            initial={{ opacity: 0, x: viewMode === 'horizontal' ? 20 : 0, y: viewMode === 'vertical' ? 20 : 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: viewMode === 'horizontal' ? -20 : 0, y: viewMode === 'vertical' ? -20 : 0 }}
            transition={{ duration: 0.2 }}
            className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800"
          >
            {/* Title + meta */}
            <div className="mb-8 text-center">
              <h3 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-3 font-serif">{recipe.title}</h3>
              <div className="flex justify-center gap-3 text-sm text-stone-600 dark:text-stone-400">
                <span className="flex items-center gap-1.5 bg-white dark:bg-stone-800 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-700 shadow-sm">
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {recipe.servings} {recipe.servings === 1 ? 'porzione' : 'porzioni'}
                </span>
                <span className="flex items-center gap-1.5 bg-white dark:bg-stone-800 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-700 shadow-sm">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {recipe.prepTime}
                </span>
              </div>
            </div>

            {/* Ingredients + instructions */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-4 border-b border-stone-200 dark:border-stone-800 pb-2 text-lg">
                  Ingredienti
                </h4>
                <ul className="space-y-3">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="text-stone-700 dark:text-stone-300 flex items-start gap-2">
                      <span className="text-emerald-500 mt-1 shrink-0">•</span>
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-4 border-b border-stone-200 dark:border-stone-800 pb-2 text-lg">
                  Istruzioni
                </h4>
                <ol className="space-y-5">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="text-stone-700 dark:text-stone-300 flex gap-4">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 bg-emerald-50 dark:bg-emerald-900/20 w-6 h-6 flex items-center justify-center rounded-full text-sm">
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
              <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800">
                {!isRecipeConfirmed && (
                  <>
                    <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-4 text-lg">
                      Prodotti utilizzati dalla dispensa
                    </h4>

                    {isEditingRecipe ? (
                      <div className="space-y-3 mb-6">
                        {editedUsedProducts.map((item, i) => (
                          <div
                            key={`${item.productId}-${i}`}
                            className="flex items-center justify-between bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm"
                          >
                            <span className="font-medium text-stone-700 dark:text-stone-300">{item.name}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="number" min="0" step="1" inputMode="numeric"
                                value={item.quantity === 0 ? '' : item.quantity}
                                onChange={(e) => onEditedQuantityChange(i, e.target.value)}
                                className="w-16 sm:w-20 px-2 py-1.5 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-stone-100 text-base"
                              />
                              <span className="text-stone-500 dark:text-stone-400 text-sm min-w-[4rem] max-w-[6rem] truncate" title={item.unit}>{item.unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-2 mb-6">
                        {editedUsedProducts.map((item, i) => (
                          <li
                            key={`${item.productId}-${i}`}
                            className="flex justify-between text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-100 dark:border-stone-800"
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
                          className="flex-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-4 py-3 rounded-xl font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                        >
                          Annulla Modifiche
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsEditingRecipe(true)}
                          className="flex-1 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 px-4 py-3 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
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
                    <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl font-medium border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Ingredienti scalati dalla dispensa!
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
          </AnimatePresence>
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-16 px-4 text-stone-500 dark:text-stone-400 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl bg-stone-50/50 dark:bg-stone-900/20 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full text-stone-300 dark:text-stone-700" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {/* Plate */}
                <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.2" />
                <circle cx="50" cy="50" r="25" stroke="currentColor" opacity="0.5" />
                {/* Fork and Knife */}
                <path d="M20 20 L20 80 M15 20 L15 40 C15 50 25 50 25 40 L25 20 M20 40 L20 50" strokeWidth="2" />
                <path d="M80 20 L80 80 M80 20 C70 20 70 50 80 50" strokeWidth="2" />
              </svg>
            </div>
            <p className="text-stone-900 dark:text-stone-100 font-bold text-xl mb-2">Nessuna ricetta pronta</p>
            <p className="text-sm max-w-sm mx-auto text-stone-500 dark:text-stone-400">
              Seleziona un pasto qui sopra per generare una ricetta basata sui prodotti nella tua dispensa.
            </p>
          </div>
        )}
      </section>
    </motion.div>
  );
});
