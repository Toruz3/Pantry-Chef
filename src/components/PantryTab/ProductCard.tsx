import React, { useRef } from 'react';
import { motion, useAnimation, PanInfo } from 'motion/react';
import { Pencil, Trash2, X, Check, Calendar, Sparkles } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { Product, CATEGORIES, CATEGORY_EMOJIS } from '../../types';
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
  isEditing: boolean;
  editState: EditState;
  onEdit: (product: Product) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
}

function getLevelPercentage(quantity: number, unit: string) {
  let standard = 1;
  switch (unit) {
    case 'g': standard = 500; break;
    case 'kg': standard = 1; break;
    case 'ml': standard = 500; break;
    case 'l': standard = 1; break;
    case 'pz': standard = 4; break;
    case 'scatolette': standard = 3; break;
    case 'confezioni': standard = 1; break;
    default: standard = 100;
  }
  return Math.min(100, Math.max(0, (quantity / standard) * 100));
}

function getLevelColor(percentage: number) {
  if (percentage <= 20) return 'bg-red-500';
  if (percentage <= 50) return 'bg-amber-400';
  return 'bg-emerald-500';
}

const ProductCardComponent = React.forwardRef<HTMLLIElement, ProductCardProps>(({
  product,
  isEditing,
  editState,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}, ref) => {
  const { colorClass, text } = getExpiryInfo(product.expirationDate);
  const baseCard = cn(
    'overflow-hidden rounded-xl border border-stone-200 bg-white border-l-4 transition-all relative',
    product.expirationDate && product.expirationDate < new Date().toISOString().split('T')[0]
      ? 'border-l-red-500'
      : 'border-l-emerald-500'
  );

  const controls = useAnimation();

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x > threshold) {
      onEdit(product);
      controls.start({ x: 0 });
    } else if (info.offset.x < -threshold) {
      onDelete(product.id);
      controls.start({ x: 0 });
    } else {
      controls.start({ x: 0 });
    }
  };

  if (isEditing) {
    return (
      <motion.li
        id={`product-${product.id}`}
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(baseCard, 'shadow-sm')}
      >
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Nome</label>
              <input
                type="text"
                value={editState.name}
                onChange={(e) => editState.setName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Categoria</label>
              <select
                value={editState.category}
                onChange={(e) => editState.setCategory(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat} {CATEGORY_EMOJIS[cat]}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-stone-500 mb-1">Quantità</label>
              <input
                type="number" min="0.1" step="0.1" inputMode="decimal"
                value={editState.quantity}
                onChange={(e) => editState.setQuantity(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-stone-500 mb-1">Unità</label>
              <select
                value={editState.unit}
                onChange={(e) => editState.setUnit(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none"
              >
                {PRODUCT_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-stone-500 mb-1">Scadenza</label>
              <input
                type="date"
                value={editState.date}
                onChange={(e) => editState.setDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
            <button
              onClick={onCancelEdit}
              className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-2 px-3 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors active:scale-95"
            >
              <X className="w-4 h-4" /> Annulla
            </button>
            <button
              onClick={onSaveEdit}
              disabled={!editState.name || !editState.date || editState.quantity === ''}
              className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-2 px-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 active:scale-95"
            >
              <Check className="w-4 h-4" /> Salva
            </button>
          </div>
        </div>
      </motion.li>
    );
  }

  const levelPercentage = getLevelPercentage(product.quantity, product.unit);
  const levelColor = getLevelColor(levelPercentage);

  const parsedDate = product.expirationDate ? parseISO(product.expirationDate) : null;
  const formattedDate = parsedDate && isValid(parsedDate)
    ? format(parsedDate, 'd MMM yyyy', { locale: it })
    : 'N/D';

  return (
    <motion.li
      id={`product-${product.id}`}
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="relative overflow-hidden rounded-xl mb-3"
    >
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4 rounded-xl font-medium text-sm">
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-100 h-full w-1/2 pl-4 rounded-l-xl">
          <Pencil className="w-5 h-5" /> Modifica
        </div>
        <div className="flex items-center justify-end gap-2 text-red-700 bg-red-100 h-full w-1/2 pr-4 rounded-r-xl">
          Elimina <Trash2 className="w-5 h-5" />
        </div>
      </div>

      {/* Foreground Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={cn(baseCard, 'relative z-10 h-full cursor-grab active:cursor-grabbing')}
      >
        <div className="p-4">
          {/* Nome + badge scadenza */}
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <p className="font-semibold text-stone-900 text-base leading-snug truncate">
                {product.name}
              </p>
              {product.isEstimate && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider shrink-0" title="Dati stimati dall'AI. Modifica per confermare.">
                  <Sparkles className="w-3 h-3" /> Stima
                </span>
              )}
            </div>
            <span className={cn(
              'text-xs px-2.5 py-1 rounded-full border font-semibold whitespace-nowrap shrink-0 mt-0.5',
              colorClass,
            )}>
              {text}
            </span>
          </div>

          {/* Quantità e Livello */}
          <div className="mb-3">
            <p className="text-stone-500 text-sm font-medium mb-1.5">
              {product.quantity} {product.unit}
            </p>
            <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', levelColor)}
                style={{ width: `${levelPercentage}%` }}
              />
            </div>
          </div>

          {/* Data */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 text-xs text-stone-400">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.li>
  );
});

export const ProductCard = React.memo(ProductCardComponent);