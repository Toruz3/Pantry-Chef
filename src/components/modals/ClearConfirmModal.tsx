import React from 'react';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';

interface ClearConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ClearConfirmModal({ onConfirm, onCancel }: Omit<ClearConfirmModalProps, 'isOpen'>) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
      >
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-center text-stone-900 mb-2">Svuota Dispensa</h3>
        <p className="text-center text-stone-600 mb-6 text-sm">
          Sei sicuro di voler rimuovere tutti i prodotti dalla tua dispensa? Questa azione non può essere annullata.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20"
          >
            Svuota
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
