import React, { useRef, useState } from 'react';
import { motion, useAnimation, PanInfo } from 'motion/react';
import { Pencil, Trash2, Check, Calendar, Sparkles } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { Product, CATEGORY_EMOJIS } from '../../types';
import { getExpiryInfo } from '../../utils/expiry';
import { cn } from '../../lib/utils';
import { ProductCardEdit } from './ProductCardEdit';

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

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wasLongPressed = useRef(false);
  const [dragX, setDragX] = useState(0);

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

  const controls = useAnimation();
  const SWIPE_THRESHOLD = 60;

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setDragX(0);
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > SWIPE_THRESHOLD || velocity > 500) {
      await controls.start({ x: 100, opacity: 0 });
      onEdit(product);
      controls.set({ x: 0, opacity: 1 });
    } else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
      await controls.start({ x: -100, opacity: 0 });
      onDelete(product.id);
      controls.set({ x: 0, opacity: 1 });
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 25 } });
    }
  };

  if (isEditing) {
    return (
      <ProductCardEdit
        product={product}
        onSave={onSaveEdit}
        onCancel={onCancelEdit}
      />
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
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={!isSelectionMode ? { y: -2 } : {}}
      className={cn(
        "relative group rounded-2xl transition-all duration-200 overflow-hidden select-none",
        isSelectionMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
        isSelected ? "ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20" : "bg-white dark:bg-stone-900 shadow-sm border border-stone-200 dark:border-stone-800",
        layout === 'compact' ? "p-3" : "p-4"
      )}
      onClick={(e) => {
        if (wasLongPressed.current) return;
        if (isSelectionMode && onToggleSelect) {
          onToggleSelect();
        } else if (!isSelectionMode) {
          onAction?.('consume');
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Background actions for swipe */}
      {!isSelectionMode && (
        <>
          <div 
            className="absolute inset-y-0 left-0 w-1/2 bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-start pl-6"
            style={{ opacity: Math.min(1, Math.max(0, dragX / 80)) }}
          >
            <Pencil className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div 
            className="absolute inset-y-0 right-0 w-1/2 bg-red-100 dark:bg-red-900/30 flex items-center justify-end pr-6"
            style={{ opacity: Math.min(1, Math.max(0, -dragX / 80)) }}
          >
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
        </>
      )}

      <motion.div
        drag={!isSelectionMode ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={(...args) => { setDragX(0); handleDragEnd(...args); }}
        animate={controls}
        className={cn(
          "relative z-10 bg-white dark:bg-stone-900 rounded-2xl flex",
          layout === 'compact' ? "flex-row items-center gap-3" : "flex-col h-full"
        )}
      >
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <div className={cn(
            "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
            layout === 'grid' && "absolute top-4 left-4 z-20",
            isSelected 
              ? "bg-emerald-500 border-emerald-500" 
              : "border-stone-300 dark:border-stone-600"
          )}>
            {isSelected && <Check className="w-4 h-4 text-white" />}
          </div>
        )}

        {layout === 'compact' ? (
          // Compact Layout
          <>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg" aria-hidden="true">
                  {product.category ? CATEGORY_EMOJIS[product.category] : '📦'}
                </span>
                <h3 className="font-bold text-stone-800 dark:text-stone-200 truncate">{product.name}</h3>
                {product.isEstimate && (
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                <span className="font-medium bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
                  {product.quantity} {product.unit}
                </span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span className={cn(getExpiryInfo(product.expirationDate).colorClass, "font-medium")}>
                    {formattedDate}
                  </span>
                </div>
              </div>
            </div>
            
            {!isSelectionMode && (
              <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); onAction?.('consume'); }}
                  className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-90 transition-all"
                  aria-label="Consuma"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAction?.('waste'); }}
                  className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-90 transition-all"
                  aria-label="Spreca"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          // Grid Layout
          <>
            <div className="flex-1 mb-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-2xl" aria-hidden="true">
                    {product.category ? CATEGORY_EMOJIS[product.category] : '📦'}
                  </span>
                  <h3 className="font-bold text-stone-800 dark:text-stone-200 text-lg leading-tight truncate">
                    {product.name}
                  </h3>
                  {product.isEstimate && (
                    <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-sm">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  <span className={cn(getExpiryInfo(product.expirationDate).colorClass, "font-medium")}>
                    {formattedDate}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-lg font-bold text-stone-700 dark:text-stone-300">
                    {product.quantity} <span className="text-sm text-stone-500 font-medium">{product.unit}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-auto">
              <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden mb-4">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", levelColor)}
                  style={{ width: `${levelPercentage}%` }}
                />
              </div>

              {!isSelectionMode && (
                <div className="flex items-center gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                  <button
                    onClick={(e) => { e.stopPropagation(); onAction?.('consume'); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl transition-colors active:scale-95"
                  >
                    <Check className="w-4 h-4" /> Consuma
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAction?.('waste'); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs sm:text-sm font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" /> Spreca
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
});

ProductCardComponent.displayName = 'ProductCard';
export const ProductCard = React.memo(ProductCardComponent);
