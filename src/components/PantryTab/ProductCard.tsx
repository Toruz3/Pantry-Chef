import React, { useRef, useState, useEffect } from 'react';
import { motion, useAnimation, PanInfo } from 'motion/react';
import { Pencil, Trash2, X, Check, Calendar, Sparkles, Minus, Plus } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { Product, CATEGORIES, CATEGORY_EMOJIS } from '../../types';
import { PRODUCT_UNITS } from '../../constants/units';
import { getExpiryInfo } from '../../utils/expiry';
import { cn } from '../../lib/utils';

interface ProductCardProps {
  product: Product;
  isEditing: boolean;
  onEdit: (product: Product) => void;
  onSaveEdit: (id: string, updatedProduct: Partial<Product>) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  onAction?: (action: 'consume' | 'waste') => void;
  layout?: 'grid' | 'compact';
  isSelected?: boolean;
  onToggleSelect?: () => void;
  isSelectionMode?: boolean;
  onLongPress?: () => void;
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

const ProductCardComponent = React.forwardRef<HTMLDivElement, ProductCardProps>((props, ref) => {
  const {
    product,
    isEditing,
    onEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    onAction,
    layout = 'grid',
    isSelected,
    onToggleSelect,
    isSelectionMode,
  } = props;

  const [editName, setEditName] = useState(product.name);
  const [editCategory, setEditCategory] = useState(product.category || 'Altro');
  const [editQuantity, setEditQuantity] = useState<number | ''>(product.quantity);
  const [editUnit, setEditUnit] = useState(product.unit);
  const [editDate, setEditDate] = useState(product.expirationDate);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wasLongPressed = useRef(false);

  const handleTouchStart = () => {
    if (isSelectionMode) return;
    wasLongPressed.current = false;
    longPressTimerRef.current = setTimeout(() => {
      wasLongPressed.current = true;
      if (props.onLongPress) {
        props.onLongPress();
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    // Reset wasLongPressed after a short delay so onClick can be blocked
    setTimeout(() => {
      wasLongPressed.current = false;
    }, 100);
  };

  useEffect(() => {
    if (isEditing) {
      setEditName(product.name);
      setEditCategory(product.category || 'Altro');
      setEditQuantity(product.quantity);
      setEditUnit(product.unit);
      setEditDate(product.expirationDate);
    }
  }, [isEditing, product]);

  const handleSave = () => {
    if (!editName || !editDate || editQuantity === '') return;
    onSaveEdit(product.id, {
      name: editName,
      category: editCategory,
      quantity: Number(editQuantity),
      unit: editUnit,
      expirationDate: editDate,
    });
  };

  const { colorClass, text } = getExpiryInfo(product.expirationDate);
  const baseCard = cn(
    'overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 border-l-4 transition-all relative',
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
      <motion.div
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
                    type="number" min="1" step="1" inputMode="numeric"
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
              onClick={onCancelEdit}
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

  const levelPercentage = getLevelPercentage(product.quantity, product.unit);
  const levelColor = getLevelColor(levelPercentage);

  const parsedDate = product.expirationDate ? parseISO(product.expirationDate) : null;
  const formattedDate = parsedDate && isValid(parsedDate)
    ? format(parsedDate, 'd MMM yyyy', { locale: it })
    : 'N/D';

  return (
    <motion.div
      id={`product-${product.id}`}
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="relative overflow-hidden rounded-xl"
    >
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4 rounded-xl font-medium text-sm">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 h-full w-1/2 pl-4 rounded-l-xl">
          <Pencil className="w-5 h-5" /> Modifica
        </div>
        <div className="flex items-center justify-end gap-2 text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 h-full w-1/2 pr-4 rounded-r-xl">
          Elimina <Trash2 className="w-5 h-5" />
        </div>
      </div>

      {/* Foreground Card */}
      <motion.div
        drag={isSelectionMode ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        animate={controls}
        onPointerDown={handleTouchStart}
        onPointerUp={handleTouchEnd}
        onPointerCancel={handleTouchEnd}
        onPanStart={handleTouchEnd}
        onContextMenu={(e) => {
          if (!isSelectionMode) {
            e.preventDefault();
            if (props.onLongPress) props.onLongPress();
          }
        }}
        onClick={(e) => {
          if (wasLongPressed.current) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          if (isSelectionMode && onToggleSelect) {
            onToggleSelect();
          }
        }}
        className={cn(
          baseCard, 
          'relative z-10 h-full transition-colors',
          !isSelectionMode && 'cursor-grab active:cursor-grabbing',
          isSelectionMode && 'cursor-pointer',
          isSelected && 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500'
        )}
      >
        {layout === 'compact' ? (
          <div className="p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              {isSelectionMode && (
                <div className="shrink-0 mr-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    isSelected 
                      ? "bg-emerald-500 border-emerald-500 text-white" 
                      : "border-stone-300 dark:border-stone-600"
                  )}>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-stone-900 dark:text-stone-100 text-sm truncate">
                    {product.name}
                  </p>
                  {product.isEstimate && (
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                  <span className="font-medium bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider whitespace-nowrap">
                    {product.quantity} {product.unit}
                  </span>
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <Calendar className="w-3 h-3 shrink-0" />
                    {formattedDate}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className={cn(
                  'hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider whitespace-nowrap',
                  colorClass,
                )}>
                  {text}
                </span>
                <div className="flex items-center gap-1 sm:border-l sm:border-stone-200 sm:dark:border-stone-700 sm:pl-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); onAction?.('consume'); }}
                    className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors active:scale-95"
                    title="Consumato"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAction?.('waste'); }}
                    className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors active:scale-95"
                    title="Buttato"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 flex flex-col h-full">
            <div className="flex items-start justify-between gap-3 mb-3">
              {isSelectionMode && (
                <div className="shrink-0 mt-1 mr-1">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    isSelected 
                      ? "bg-emerald-500 border-emerald-500 text-white" 
                      : "border-stone-300 dark:border-stone-600"
                  )}>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-base sm:text-lg leading-tight break-words line-clamp-2">
                    {product.name}
                  </h4>
                  {product.isEstimate && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0" title="Dati stimati dall'AI">
                      <Sparkles className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                  <span className="font-semibold bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md text-xs whitespace-nowrap">
                    {product.quantity} {product.unit}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium whitespace-nowrap">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {formattedDate}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={cn(
                  'text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider whitespace-nowrap',
                  colorClass,
                )}>
                  {text}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1.5 mb-4 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', levelColor)}
                style={{ width: `${levelPercentage}%` }}
              />
            </div>

            {/* Actions */}
            <div className="mt-auto">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onAction?.('consume'); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-xs font-bold active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" /> Consumato
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAction?.('waste'); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-xs font-bold active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Buttato
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});

export const ProductCard = React.memo(ProductCardComponent);