import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpDown, Trash2, Package } from 'lucide-react';
import { Product, CATEGORIES } from '../../types';
import { SortOption, SORT_OPTIONS } from '../../constants/sortOptions';
import { ProductCard } from './ProductCard';

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

export function PantryTab({
  products,
  groupedProducts,
  sortBy,
  setSortBy,
  setShowClearConfirm,
  setActiveTab,
  editingProductId,
  editState,
  handleEditProduct,
  handleSaveEdit,
  handleCancelEdit,
  handleDeleteProduct
}: PantryTabProps) {
  return (
    <motion.div
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center justify-between w-full gap-3">
            {products.length > 0 && (
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 min-w-[150px]">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full appearance-none bg-white border border-stone-200 text-stone-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium shadow-sm"
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                </div>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center border border-red-100 shrink-0"
                  title="Svuota dispensa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <span className="text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl whitespace-nowrap shrink-0">
              {products.length} {products.length === 1 ? 'prodotto' : 'prodotti'}
            </span>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 text-stone-500 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
            <Package className="w-12 h-12 mx-auto mb-3 text-stone-300" />
            <p className="text-stone-900 font-medium text-lg">La dispensa è vuota</p>
            <p className="text-sm mt-1 max-w-sm mx-auto">
              Vai alla sezione "Aggiungi" per inserire i tuoi primi prodotti.
            </p>
            <button 
              onClick={() => setActiveTab('add')}
              className="mt-6 bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              Aggiungi Prodotto
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {CATEGORIES.map(category => {
              const categoryProducts = groupedProducts[category];
              if (categoryProducts.length === 0) return null;
              
              return (
                <div key={category} className="space-y-3">
                  <h3 className="text-lg font-bold text-stone-900 px-1 border-b border-stone-200 pb-2">{category}</h3>
                  <ul className="space-y-3">
                    <AnimatePresence>
                      {categoryProducts.map((product) => (
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
}
