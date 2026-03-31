import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Check, Minus, Plus } from 'lucide-react';
import { Product, CATEGORIES, CATEGORY_EMOJIS } from '../../types';
import { PRODUCT_UNITS } from '../../constants/units';

interface ProductCardEditProps {
  product: Product;
  onSave: (id: string, updatedProduct: Partial<Product>) => void;
  onCancel: () => void;
}

export function ProductCardEdit({ product, onSave, onCancel }: ProductCardEditProps) {
  const [editName, setEditName] = useState(product.name);
  const [editCategory, setEditCategory] = useState(product.category || 'Altro');
  const [editQuantity, setEditQuantity] = useState<number | ''>(product.quantity);
  const [editUnit, setEditUnit] = useState(product.unit);
  const [editDate, setEditDate] = useState(product.expirationDate);

  useEffect(() => {
    setEditName(product.name);
    setEditCategory(product.category || 'Altro');
    setEditQuantity(product.quantity);
    setEditUnit(product.unit);
    setEditDate(product.expirationDate);
  }, [product]);

  const handleSave = () => {
    if (!editName || !editDate || editQuantity === '') return;
    onSave(product.id, {
      name: editName,
      category: editCategory,
      quantity: Number(editQuantity),
      unit: editUnit,
      expirationDate: editDate,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-5 shadow-xl border-2 border-emerald-500 dark:border-emerald-600 relative z-10"
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-stone-500 mb-1">Nome</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Categoria</label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base appearance-none dark:text-white"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat} {CATEGORY_EMOJIS[cat]}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex gap-3 flex-1">
            <div className="flex-1">
              <label className="block text-xs font-medium text-stone-500 mb-1">Quantità</label>
              <div className="flex items-center bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                <button
                  type="button"
                  aria-label="Diminuisci quantità"
                  onClick={() => setEditQuantity(Math.max(1, (Number(editQuantity) || 0) - 1))}
                  className="px-3 py-3 sm:py-2 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors active:bg-stone-300 dark:active:bg-stone-600 flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number" min="0" step="any" inputMode="decimal"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-transparent text-center py-3 sm:py-2 focus:outline-none text-base dark:text-white"
                />
                <button
                  type="button"
                  aria-label="Aumenta quantità"
                  onClick={() => setEditQuantity((Number(editQuantity) || 0) + 1)}
                  className="px-3 py-3 sm:py-2 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors active:bg-stone-300 dark:active:bg-stone-600 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="w-24 sm:w-28">
              <label className="block text-xs font-medium text-stone-500 mb-1">Unità</label>
              <select
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base appearance-none dark:text-white"
              >
                {PRODUCT_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-stone-500 mb-1">Scadenza</label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-2 px-3 text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-colors active:scale-95"
          >
            <X className="w-4 h-4" /> Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={!editName || !editDate || editQuantity === ''}
            className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-2 px-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 active:scale-95"
          >
            <Check className="w-4 h-4" /> Salva
          </button>
        </div>
      </div>
    </motion.div>
  );
}
