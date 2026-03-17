import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpDown, Trash2, Package, AlertTriangle, Clock, CheckCircle, Search } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { Product, CATEGORIES, CATEGORY_EMOJIS } from '../../types';
import { SortOption, SORT_OPTIONS } from '../../constants/sortOptions';
import { ProductCard } from './ProductCard';
import { cn } from '../../lib/utils';

interface EditState {
  name: string;
  setName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  quantity: number | '';
  setQuantity: (v: number | '') => void;
  unit: string;
  setUnit: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
}

interface PantryTabProps {
  products: Product[];
  groupedProducts: Record<string, Product[]>;
  sortBy: SortOption;
  setSortBy: (sortBy: SortOption) => void;
  setShowClearConfirm: (show: boolean) => void;
  setActiveTab: (tab: 'add' | 'pantry' | 'recipe') => void;
  editingProductId: string | null;
  editState: EditState;
  handleEditProduct: (product: Product) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  handleDeleteProduct: (id: string) => void;
}

export const PantryTab = React.forwardRef<HTMLDivElement, PantryTabProps>(({
  products, groupedProducts, sortBy, setSortBy,
  setShowClearConfirm, setActiveTab,
  editingProductId, editState,
  handleEditProduct, handleSaveEdit, handleCancelEdit, handleDeleteProduct,
}, ref) => {

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return products.filter(p => p.name.toLowerCase().startsWith(query));
  }, [products, searchQuery]);

  const handleSearchResultClick = (productId: string) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    
    // Use setTimeout to ensure the DOM has updated and the dropdown is closed
    setTimeout(() => {
      const element = document.getElementById(`product-${productId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Optional: add a brief highlight effect
        element.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-2');
        }, 2000);
      }
    }, 100);
  };

  const stats = useMemo(() => {
    const expired   = products.filter(p => differenceInDays(parseISO(p.expirationDate), new Date()) < 0).length;
    const soon      = products.filter(p => { const d = differenceInDays(parseISO(p.expirationDate), new Date()); return d >= 0 && d <= 7; }).length;
    const ok        = products.length - expired - soon;
    return { expired, soon, ok };
  }, [products]);

  return (
    <motion.div
      ref={ref}
      key="pantry"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <section className="pt-2 sm:pt-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Chef da Dispensa Logo" className="w-16 h-16 rounded-2xl shadow-sm mx-auto mb-4 object-cover" referrerPolicy="no-referrer" />
          <h2 className="text-2xl font-bold text-stone-900">La Tua Dispensa</h2>
          <p className="text-stone-500 mt-1">Gestisci i tuoi ingredienti e le loro scadenze</p>
        </div>

        {/* Barra di ricerca globale */}
        {products.length > 0 && (
          <div className="relative mb-6 z-50">
            <div className={cn(
              "relative flex items-center bg-white border rounded-2xl transition-all shadow-sm",
              isSearchFocused ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-stone-200"
            )}>
              <Search className="w-5 h-5 text-stone-400 ml-4" />
              <input
                type="text"
                placeholder="Cerca un prodotto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="w-full bg-transparent border-none py-3.5 px-3 focus:outline-none text-stone-800 placeholder:text-stone-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="p-2 mr-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Risultati ricerca */}
            <AnimatePresence>
              {searchQuery.trim() && isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden max-h-64 overflow-y-auto"
                >
                  {searchResults.length > 0 ? (
                    <ul className="divide-y divide-stone-100">
                      {searchResults.map(product => (
                        <li 
                          key={product.id}
                          onClick={() => handleSearchResultClick(product.id)}
                          className="p-3 hover:bg-stone-50 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl" aria-hidden="true">
                              {product.category ? CATEGORY_EMOJIS[product.category] : '📦'}
                            </span>
                            <div>
                              <p className="font-medium text-stone-800">{product.name}</p>
                              <p className="text-xs text-stone-500">
                                {product.quantity} {product.unit} • Scadenza: {product.expirationDate}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-stone-500 text-sm">
                      Nessun prodotto trovato per "{searchQuery}"
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Statistiche rapide */}
        {products.length > 0 && (
          <div className="flex items-stretch gap-2 mb-6">
            <div className={cn(
              'flex-1 flex flex-col items-center justify-center py-3 px-1 rounded-2xl transition-colors border',
              stats.expired > 0 ? 'bg-red-50 border-red-100' : 'bg-stone-50/50 border-stone-200/50'
            )}>
              <div className="flex items-center gap-1 mb-1.5">
                <AlertTriangle className={cn("w-3.5 h-3.5", stats.expired > 0 ? "text-red-500" : "text-stone-400")} />
                <span className={cn('text-[10px] font-bold uppercase tracking-wider', stats.expired > 0 ? 'text-red-600' : 'text-stone-500')}>
                  Scaduti
                </span>
              </div>
              <p className={cn('text-xl font-bold leading-none', stats.expired > 0 ? 'text-red-600' : 'text-stone-400')}>
                {stats.expired}
              </p>
            </div>

            <div className={cn(
              'flex-1 flex flex-col items-center justify-center py-3 px-1 rounded-2xl transition-colors border',
              stats.soon > 0 ? 'bg-amber-50 border-amber-100' : 'bg-stone-50/50 border-stone-200/50'
            )}>
              <div className="flex items-center gap-1 mb-1.5">
                <Clock className={cn("w-3.5 h-3.5", stats.soon > 0 ? "text-amber-500" : "text-stone-400")} />
                <span className={cn('text-[10px] font-bold uppercase tracking-wider', stats.soon > 0 ? 'text-amber-600' : 'text-stone-500')}>
                  In scadenza
                </span>
              </div>
              <p className={cn('text-xl font-bold leading-none', stats.soon > 0 ? 'text-amber-600' : 'text-stone-400')}>
                {stats.soon}
              </p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-emerald-50 border border-emerald-100 transition-colors">
              <div className="flex items-center gap-1 mb-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Freschi
                </span>
              </div>
              <p className="text-xl font-bold leading-none text-emerald-600">
                {stats.ok}
              </p>
            </div>
          </div>
        )}

        {/* Toolbar */}
        {products.length > 0 && (
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-stone-800">
                {products.length} {products.length === 1 ? 'prodotto' : 'prodotti'}
              </h3>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-red-600 hover:bg-red-50 flex items-center gap-1.5 text-xs font-semibold active:scale-95 transition-colors px-2.5 py-1.5 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Svuota tutto</span>
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
              {SORT_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setSortBy(o.value as SortOption)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap border active:scale-95",
                    sortBy === o.value 
                      ? "bg-stone-900 text-white border-stone-900 shadow-md shadow-stone-900/20" 
                      : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50 shadow-sm"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-16 px-4 text-stone-500 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full text-stone-300" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {/* Bag body */}
                <rect x="25" y="35" width="50" height="55" rx="4" fill="#f5f5f4" />
                {/* Bag handles */}
                <path d="M35 35 C35 15, 65 15, 65 35" />
                {/* Details */}
                <line x1="40" y1="35" x2="40" y2="45" strokeWidth="2" strokeOpacity="0.5" />
                <line x1="60" y1="35" x2="60" y2="45" strokeWidth="2" strokeOpacity="0.5" />
              </svg>
            </div>
            <p className="text-stone-900 font-bold text-xl mb-2">La tua dispensa è vuota!</p>
            <p className="text-sm max-w-xs mx-auto text-stone-500 mb-8">
              La dispensa è vuota. Aggiungi degli ingredienti per iniziare a cucinare senza sprechi.
            </p>
            <button
              onClick={() => setActiveTab('add')}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shadow-emerald-600/20"
            >
              Aggiungi un prodotto
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {CATEGORIES.map(category => {
              const categoryProducts = groupedProducts[category];
              if (!categoryProducts || categoryProducts.length === 0) return null;
              return (
                <div key={category} className="space-y-3">
                  <div className="sticky top-0 sm:top-16 z-20 flex items-center gap-2 py-3 bg-stone-50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    <h3 className="text-base font-bold text-stone-800">{category}</h3>
                    <span className="text-xl" aria-hidden="true">{CATEGORY_EMOJIS[category]}</span>
                    <span className="text-xs font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                      {categoryProducts.length}
                    </span>
                  </div>
                  <ul className="space-y-3">
                    <AnimatePresence>
                      {categoryProducts.map(product => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onEdit={handleEditProduct}
                          onDelete={handleDeleteProduct}
                          isEditing={editingProductId === product.id}
                          editState={editState}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={handleCancelEdit}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </motion.div>
  );
});