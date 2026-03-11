import React from 'react';
import { motion } from 'motion/react';
import { Pencil, Trash2, X, Check, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Product, CATEGORIES } from '../../types';
import { PRODUCT_UNITS } from '../../constants/units';
import { getExpiryInfo } from '../../utils/expiry';
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

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  editState: EditState;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

function ProductCardComponent({
  product,
  onEdit,
  onDelete,
  isEditing,
  editState,
  onSaveEdit,
  onCancelEdit
}: ProductCardProps) {
  const { colorClass, text } = getExpiryInfo(product.expirationDate);

  if (isEditing) {
    return (
      <motion.li
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="p-4 rounded-xl border border-stone-200 bg-white hover:border-emerald-200 hover:shadow-sm transition-all group"
      >
        <div className="w-full space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Nome</label>
              <input
                type="text"
                value={editState.name}
                onChange={(e) => editState.setName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Categoria</label>
              <select
                value={editState.category}
                onChange={(e) => editState.setCategory(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-stone-500 mb-1">Quantità</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={editState.quantity}
                onChange={(e) => editState.setQuantity(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-stone-500 mb-1">Unità</label>
              <select
                value={editState.unit}
                onChange={(e) => editState.setUnit(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none"
              >
                {PRODUCT_UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-stone-500 mb-1">Scadenza</label>
              <input
                type="date"
                value={editState.date}
                onChange={(e) => editState.setDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-stone-100">
            <button
              onClick={onCancelEdit}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
              Annulla
            </button>
            <button
              onClick={onSaveEdit}
              disabled={!editState.name || !editState.date || editState.quantity === ''}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Salva
            </button>
          </div>
        </div>
      </motion.li>
    );
  }

  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-4 rounded-xl border border-stone-200 bg-white hover:border-emerald-200 hover:shadow-sm transition-all group"
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-stone-900 text-lg">{product.name}</p>
            <p className="text-stone-600 text-sm mt-0.5">
              {product.quantity} {product.unit}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap", colorClass)}>
            {text}
          </span>
          <span className="text-sm text-stone-500 capitalize flex items-center gap-1 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {format(parseISO(product.expirationDate), 'd MMM yyyy', { locale: it })}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 pt-3 border-t border-stone-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(product)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-100"
          >
            <Pencil className="w-4 h-4" />
            Modifica
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100"
          >
            <Trash2 className="w-4 h-4" />
            Elimina
          </button>
        </div>
      </div>
    </motion.li>
  );
}

export const ProductCard = React.memo(ProductCardComponent);
