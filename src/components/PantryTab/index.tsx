import React, { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpDown, Trash2, Package, AlertTriangle, Clock, CheckCircle, Search, Settings, XCircle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { useDebounce } from 'use-debounce';
import { GroupedVirtuoso, GroupedVirtuosoHandle } from 'react-virtuoso';
import { Product, CATEGORIES, CATEGORY_EMOJIS } from '../../types';
import { SortOption, SORT_OPTIONS } from '../../constants/sortOptions';
import { ProductCard } from './ProductCard';
import { ProductActionSheet } from './ProductActionSheet';
import { PantrySkeleton } from '../ui/Skeleton';
import { PullToRefresh } from '../ui/PullToRefresh';
import { cn } from '../../lib/utils';

import { useProductsContext } from '../../contexts/ProductsContext';

interface PantryTabProps {
  setShowAddSheet: (show: boolean) => void;
  handleConsumeProduct: (id: string, quantity: number) => void;
  handleWasteProduct: (id: string, quantity: number) => void;
  onOpenSettings: () => void;
  pantryLayout: 'grid' | 'compact';
}

export const PantryTab = React.forwardRef<HTMLDivElement, PantryTabProps>(({
  setShowAddSheet,
  handleConsumeProduct, handleWasteProduct,
  onOpenSettings,
  pantryLayout,
}, ref) => {
  const {
    products, groupedProducts, sortBy, setSortBy,
    setShowClearConfirm, editingProductId,
    handleEditProduct, handleSaveEdit, handleCancelEdit, handleDeleteProduct,
    isLoading,
  } = useProductsContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const virtuosoRef = useRef<GroupedVirtuosoHandle>(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchActionConfirm, setBatchActionConfirm] = useState<'consume' | 'waste' | 'delete' | null>(null);

  const [actionSheetProduct, setActionSheetProduct] = useState<Product | null>(null);
  const [actionSheetType, setActionSheetType] = useState<'consume' | 'waste' | null>(null);
  
  const [activeFilter, setActiveFilter] = useState<'all' | 'expired' | 'soon' | 'fresh'>('all');

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
    setBatchActionConfirm(null);
  };

  const toggleSelectProduct = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const executeBatchAction = () => {
    if (batchActionConfirm === 'consume') {
      selectedIds.forEach(id => {
        const p = products.find(p => p.id === id);
        if (p) handleConsumeProduct(id, p.quantity);
      });
    } else if (batchActionConfirm === 'waste') {
      selectedIds.forEach(id => {
        const p = products.find(p => p.id === id);
        if (p) handleWasteProduct(id, p.quantity);
      });
    } else if (batchActionConfirm === 'delete') {
      selectedIds.forEach(id => handleDeleteProduct(id));
    }
    toggleSelectionMode();
  };

  const handleBatchConsume = () => setBatchActionConfirm('consume');
  const handleBatchWaste = () => setBatchActionConfirm('waste');
  const handleBatchDelete = () => setBatchActionConfirm('delete');

  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return [];
    const query = debouncedSearchQuery.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(query));
  }, [products, debouncedSearchQuery]);

  const virtuosoData = useMemo(() => {
    const groups: string[] = [];
    const groupCounts: number[] = [];
    const items: Product[] = [];

    CATEGORIES.forEach(category => {
      let categoryProducts = groupedProducts[category] || [];
      
      if (activeFilter !== 'all') {
        categoryProducts = categoryProducts.filter(p => {
          const d = differenceInDays(parseISO(p.expirationDate), new Date());
          if (activeFilter === 'expired') return d < 0;
          if (activeFilter === 'soon') return d >= 0 && d <= 7;
          if (activeFilter === 'fresh') return d > 7;
          return true;
        });
      }

      if (categoryProducts && categoryProducts.length > 0) {
        groups.push(category);
        groupCounts.push(categoryProducts.length);
        items.push(...categoryProducts);
      }
    });

    return { groups, groupCounts, items };
  }, [groupedProducts, activeFilter]);

  const handleSearchResultClick = (productId: string) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    
    const index = virtuosoData.items.findIndex(p => p.id === productId);
    if (index !== -1 && virtuosoRef.current) {
      // Use setTimeout to ensure the DOM has updated and the dropdown is closed
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({ index, align: 'center', behavior: 'smooth' });
        
        // Add a brief highlight effect after scrolling
        setTimeout(() => {
          const element = document.getElementById(`product-${productId}`);
          if (element) {
            element.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2');
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-2');
            }, 2000);
          }
        }, 500); // Wait for scroll to finish
      }, 100);
    }
  };

  const stats = useMemo(() => {
    const expired   = products.filter(p => differenceInDays(parseISO(p.expirationDate), new Date()) < 0).length;
    const soon      = products.filter(p => { const d = differenceInDays(parseISO(p.expirationDate), new Date()); return d >= 0 && d <= 7; }).length;
    const ok        = products.length - expired - soon;
    return { expired, soon, ok };
  }, [products]);

  const virtuosoComponents = useMemo(() => ({
    List: React.forwardRef((props: any, ref) => (
      <div
        {...props}
        ref={ref}
        className={cn(
          props.className,
          pantryLayout === 'grid' && "sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4"
        )}
      />
    )),
    TopItemList: React.forwardRef(({ style, ...props }: any, ref) => {
      const { top, ...restStyle } = style || {};
      return (
        <div
          {...props}
          ref={ref}
          style={{ ...restStyle, zIndex: 40 }}
          className={cn(props.className, "sticky top-0 sm:top-16 w-full")}
        />
      );
    }),
    Group: ({ children, style, ...props }: any) => (
      <div 
        {...props} 
        style={{ ...style, top: undefined }} 
        className={cn(props.className, pantryLayout === 'grid' && "col-span-full")}
      >
        {children}
      </div>
    ),
    Item: ({ children, ...props }: any) => (
      <div {...props} className={cn(props.className, "pb-3 sm:pb-0")}>
        {children}
      </div>
    )
  }), [pantryLayout]);

  const handleRefresh = async () => {
    // Simulate a network request for local data
    await new Promise(resolve => setTimeout(resolve, 800));
    // In a real app, this would fetch new data
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <motion.div
        ref={ref}
        key="pantry"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="space-y-6 pb-nav-safe sm:pb-0"
      >
      <section className="pt-2 sm:pt-8 relative">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Chef da Dispensa Logo" className="w-16 h-16 rounded-2xl shadow-sm mx-auto mb-4 object-cover" referrerPolicy="no-referrer" />
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">La Tua Dispensa</h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1">Gestisci i tuoi ingredienti e le loro scadenze</p>
        </div>

        {/* Barra di ricerca globale */}
        {products.length > 0 && (
          <div className="relative mb-6 z-50">
            <div className={cn(
              "relative flex items-center bg-white dark:bg-stone-900 border rounded-2xl transition-all shadow-sm",
              isSearchFocused ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-stone-200 dark:border-stone-800"
            )}>
              <Search className="w-5 h-5 text-stone-400 ml-4" />
              <input
                type="text"
                placeholder="Cerca un prodotto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="w-full bg-transparent border-none py-3.5 px-3 focus:outline-none text-base text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="p-2 mr-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
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
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden max-h-64 overflow-y-auto"
                >
                  {searchResults.length > 0 ? (
                    <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                      {searchResults.map(product => (
                        <li 
                          key={product.id}
                          onClick={() => handleSearchResultClick(product.id)}
                          className="p-3 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium text-stone-800 dark:text-stone-200">{product.name}</p>
                              <p className="text-xs text-stone-500 dark:text-stone-400">
                                {product.quantity} {product.unit} • Scadenza: {product.expirationDate}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-stone-500 dark:text-stone-400 text-sm">
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
            <button 
              onClick={() => setActiveFilter(activeFilter === 'expired' ? 'all' : 'expired')}
              className={cn(
              'flex-1 flex flex-col items-center justify-center py-3 px-1 rounded-2xl transition-colors border cursor-pointer active:scale-95',
              stats.expired > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40' : 'bg-stone-50/50 dark:bg-stone-900/50 border-stone-200/50 dark:border-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800',
              activeFilter === 'expired' && 'ring-2 ring-red-500 ring-offset-1 dark:ring-offset-stone-950'
            )}>
              <div className="flex items-center gap-1 mb-1.5">
                <AlertTriangle className={cn("w-3.5 h-3.5", stats.expired > 0 ? "text-red-500 dark:text-red-400" : "text-stone-400 dark:text-stone-500")} />
                <span className={cn('text-[10px] font-bold uppercase tracking-wider', stats.expired > 0 ? 'text-red-600 dark:text-red-400' : 'text-stone-500 dark:text-stone-400')}>
                  Scaduti
                </span>
              </div>
              <p className={cn('text-xl font-bold leading-none', stats.expired > 0 ? 'text-red-600 dark:text-red-400' : 'text-stone-400 dark:text-stone-500')}>
                {stats.expired}
              </p>
            </button>

            <button 
              onClick={() => setActiveFilter(activeFilter === 'soon' ? 'all' : 'soon')}
              className={cn(
              'flex-1 flex flex-col items-center justify-center py-3 px-1 rounded-2xl transition-colors border cursor-pointer active:scale-95',
              stats.soon > 0 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/40' : 'bg-stone-50/50 dark:bg-stone-900/50 border-stone-200/50 dark:border-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800',
              activeFilter === 'soon' && 'ring-2 ring-amber-500 ring-offset-1 dark:ring-offset-stone-950'
            )}>
              <div className="flex items-center gap-1 mb-1.5">
                <Clock className={cn("w-3.5 h-3.5", stats.soon > 0 ? "text-amber-500 dark:text-amber-400" : "text-stone-400 dark:text-stone-500")} />
                <span className={cn('text-[10px] font-bold uppercase tracking-wider', stats.soon > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400')}>
                  In scadenza
                </span>
              </div>
              <p className={cn('text-xl font-bold leading-none', stats.soon > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500')}>
                {stats.soon}
              </p>
            </button>

            <button 
              onClick={() => setActiveFilter(activeFilter === 'fresh' ? 'all' : 'fresh')}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 transition-colors cursor-pointer active:scale-95 hover:bg-emerald-100 dark:hover:bg-emerald-900/40",
                activeFilter === 'fresh' && 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-stone-950'
              )}
            >
              <div className="flex items-center gap-1 mb-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Freschi
                </span>
              </div>
              <p className="text-xl font-bold leading-none text-emerald-600 dark:text-emerald-400">
                {stats.ok}
              </p>
            </button>
          </div>
        )}

        {/* Toolbar */}
        {products.length > 0 && (
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                {products.length} {products.length === 1 ? 'prodotto' : 'prodotti'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSelectionMode}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold active:scale-95 transition-colors px-2.5 py-1.5 rounded-lg",
                    isSelectionMode 
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" 
                      : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                  )}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{isSelectionMode ? 'Annulla' : 'Seleziona'}</span>
                </button>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1.5 text-xs font-semibold active:scale-95 transition-colors px-2.5 py-1.5 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Svuota tutto</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
              {SORT_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setSortBy(o.value as SortOption)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap border active:scale-95",
                    sortBy === o.value 
                      ? "bg-stone-900 dark:bg-emerald-600 text-white border-stone-900 dark:border-emerald-600 shadow-md shadow-stone-900/20 dark:shadow-emerald-900/20" 
                      : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 shadow-sm"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="mt-8">
            <PantrySkeleton />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 px-4 text-stone-500 dark:text-stone-400 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl bg-stone-50/50 dark:bg-stone-900/50 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full text-stone-300 dark:text-stone-700" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {/* Bag body */}
                <rect x="25" y="35" width="50" height="55" rx="4" className="fill-stone-100 dark:fill-stone-800" />
                {/* Bag handles */}
                <path d="M35 35 C35 15, 65 15, 65 35" />
                {/* Details */}
                <line x1="40" y1="35" x2="40" y2="45" strokeWidth="2" strokeOpacity="0.5" />
                <line x1="60" y1="35" x2="60" y2="45" strokeWidth="2" strokeOpacity="0.5" />
              </svg>
            </div>
            <p className="text-stone-900 dark:text-stone-100 font-bold text-xl mb-2">La tua dispensa è vuota!</p>
            <p className="text-sm max-w-xs mx-auto text-stone-500 dark:text-stone-400 mb-8">
              La dispensa è vuota. Aggiungi degli ingredienti per iniziare a cucinare senza sprechi.
            </p>
            <button
              onClick={() => setShowAddSheet(true)}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shadow-emerald-600/20"
            >
              Aggiungi un prodotto
            </button>
          </div>
        ) : (
          <div 
            className="h-full transition-all duration-300" 
            style={{ paddingBottom: isSelectionMode && selectedIds.size > 0 ? '160px' : '0px' }}
          >
            <GroupedVirtuoso
              ref={virtuosoRef}
              useWindowScroll
              groupCounts={virtuosoData.groupCounts}
              components={virtuosoComponents}
              groupContent={index => {
                const category = virtuosoData.groups[index];
                return (
                  <div className="flex items-center py-3 bg-stone-50 dark:bg-stone-950 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 relative z-30">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">{category}</h3>
                      <span className="text-xl" aria-hidden="true">{CATEGORY_EMOJIS[category]}</span>
                    </div>
                    <span className="ml-auto text-xs font-semibold text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                      {virtuosoData.groupCounts[index]}
                    </span>
                  </div>
                );
              }}
              itemContent={(index) => {
                const product = virtuosoData.items[index];
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                    onAction={(action) => {
                      setActionSheetProduct(product);
                      setActionSheetType(action);
                    }}
                    isEditing={editingProductId === product.id}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    layout={pantryLayout}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedIds.has(product.id)}
                    onToggleSelect={() => toggleSelectProduct(product.id)}
                    onLongPress={() => {
                      if (!isSelectionMode) {
                        setIsSelectionMode(true);
                        setSelectedIds(new Set([product.id]));
                        setBatchActionConfirm(null);
                      }
                    }}
                  />
                );
              }}
            />
          </div>
        )}

        {/* Floating Action Bar for Selection Mode */}
        <AnimatePresence>
          {isSelectionMode && selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 bg-stone-900 dark:bg-stone-800 text-white rounded-2xl shadow-2xl p-4 z-50 flex flex-col gap-3"
            >
              {batchActionConfirm ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-center">
                    Sei sicuro di voler {batchActionConfirm === 'consume' ? 'consumare' : batchActionConfirm === 'waste' ? 'sprecare' : 'eliminare'} {selectedIds.size} {selectedIds.size === 1 ? 'prodotto' : 'prodotti'}?
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setBatchActionConfirm(null)} className="flex-1 bg-stone-700 hover:bg-stone-600 py-2 rounded-xl text-sm font-bold transition-colors">
                      Annulla
                    </button>
                    <button onClick={executeBatchAction} className={cn(
                      "flex-1 py-2 rounded-xl text-sm font-bold transition-colors",
                      batchActionConfirm === 'consume' ? "bg-emerald-600 hover:bg-emerald-500" :
                      batchActionConfirm === 'waste' ? "bg-red-600 hover:bg-red-500" :
                      "bg-stone-600 hover:bg-stone-500"
                    )}>
                      Conferma
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{selectedIds.size} selezionati</span>
                    <button onClick={toggleSelectionMode} className="text-stone-400 hover:text-white text-sm">Annulla</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={handleBatchConsume} className="bg-emerald-600 hover:bg-emerald-500 py-2 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1 transition-colors">
                      <CheckCircle className="w-4 h-4" /> Consumato
                    </button>
                    <button onClick={handleBatchWaste} className="bg-red-600 hover:bg-red-500 py-2 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1 transition-colors">
                      <Trash2 className="w-4 h-4" /> Buttato
                    </button>
                    <button onClick={handleBatchDelete} className="bg-stone-700 hover:bg-stone-600 py-2 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1 transition-colors">
                      <XCircle className="w-4 h-4" /> Elimina
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <ProductActionSheet
        product={actionSheetProduct}
        action={actionSheetType}
        onClose={() => {
          setActionSheetProduct(null);
          setActionSheetType(null);
        }}
        onConfirm={(id, qty) => {
          if (actionSheetType === 'consume') {
            handleConsumeProduct(id, qty);
          } else if (actionSheetType === 'waste') {
            handleWasteProduct(id, qty);
          }
        }}
      />
    </motion.div>
    </PullToRefresh>
  );
});