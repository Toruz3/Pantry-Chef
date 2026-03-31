import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { X, Check, Minus, Plus } from 'lucide-react';
import { Product } from '../../types';

interface ProductActionSheetProps {
  product: Product | null;
  action: 'consume' | 'waste' | null;
  onClose: () => void;
  onConfirm: (id: string, quantity: number) => void;
}

export function ProductActionSheet({ product, action, onClose, onConfirm }: ProductActionSheetProps) {
  const [quantity, setQuantity] = useState<number | ''>(1);
  const dragControls = useDragControls();

  useEffect(() => {
    if (product) {
      setQuantity(1);
    }
  }, [product]);

  // Handle native back button
  const onCloseRef = React.useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (product && action) {
      window.history.pushState({ modal: 'productAction' }, '');
      
      const handlePopState = () => {
        onCloseRef.current();
      };
      
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.modal === 'productAction') {
          window.history.back();
        }
      };
    }
  }, [product, action]);

  const handleConfirm = () => {
    if (quantity && quantity > 0 && product) {
      onConfirm(product.id, Number(quantity));
      onClose();
    }
  };

  const isConsume = action === 'consume';
  const title = isConsume ? 'Consuma Prodotto' : 'Butta Prodotto';
  const buttonColor = isConsume ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600';

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {product && action && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-white dark:bg-stone-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 100 || velocity.y > 500) {
                onClose();
              }
            }}
          >
            <div 
              className="shrink-0 touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mt-3 mb-2 sm:hidden" />
              
              <div className="p-6 pb-0">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">{title}</h3>
                  <button onClick={onClose} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 overflow-y-auto">
              <p className="text-stone-600 dark:text-stone-400 mb-6">
                Quanti <span className="font-bold text-stone-900 dark:text-stone-100">{product.name}</span> hai {isConsume ? 'consumato' : 'buttato'}?
                (Disponibili: {product.quantity} {product.unit})
              </p>

              <div className="flex items-center justify-center gap-6 mb-8">
                <button
                  onClick={() => setQuantity(prev => Math.max(1, Number(prev) - 1))}
                  className="w-14 h-14 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-95 transition-all"
                >
                  <Minus className="w-6 h-6" />
                </button>
                
                <div className="relative w-24">
                  <input
                    type="number"
                    min="1"
                    max={product.quantity}
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') setQuantity('');
                      else setQuantity(Math.min(product.quantity, Math.max(1, Number(val))));
                    }}
                    className="w-full text-center text-3xl font-bold bg-transparent border-b-2 border-stone-300 dark:border-stone-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none py-2 dark:text-white"
                  />
                </div>

                <button
                  onClick={() => setQuantity(prev => Math.min(product.quantity, Number(prev) + 1))}
                  className="w-14 h-14 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-95 transition-all"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              <button
                onClick={handleConfirm}
                disabled={!quantity || quantity <= 0}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${buttonColor} disabled:opacity-50 disabled:active:scale-100`}
              >
                <Check className="w-6 h-6" />
                Conferma
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
