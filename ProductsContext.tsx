import React from 'react';
import { motion } from 'motion/react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

interface ReceiptSourceModalProps {
  onSelectSource: (source: 'camera' | 'gallery') => void;
  onClose: () => void;
}

export function ReceiptSourceModal({ onSelectSource, onClose }: ReceiptSourceModalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl dark:border dark:border-stone-800 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2 pr-8">Scansiona Scontrino</h3>
        <p className="text-stone-500 dark:text-stone-400 mb-6 text-sm">
          Scegli come vuoi caricare l'immagine del tuo scontrino.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => onSelectSource('camera')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left group"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-stone-900 dark:text-white">Scatta una foto</div>
              <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Usa la fotocamera ora</div>
            </div>
          </button>

          <button
            onClick={() => onSelectSource('gallery')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-stone-900 dark:text-white">Scegli dalla galleria</div>
              <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Carica una foto esistente</div>
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
