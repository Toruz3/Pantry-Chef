import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Barcode, Mic, Square, Receipt, X, Sparkles, AlertCircle, Check, Package } from 'lucide-react';
import { cn } from '../lib/utils';
import { AddProductForm } from './AddProductForm';
import { AudioExtractedProduct, Category, CATEGORIES, CATEGORY_EMOJIS } from '../types';
import { PRODUCT_UNITS } from '../constants/units';
import { toast } from 'react-hot-toast';
import { haptics } from '../utils/haptics';
import { addRandomProducts } from '../utils/testData';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  isScanningBarcode: boolean;
  setIsScanningBarcode: (v: boolean) => void;
  isRecording: boolean;
  isAnalyzingAudio: boolean;
  isFetchingBarcode: boolean;
  isAnalyzingReceipt: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  cameraInputRef: React.RefObject<HTMLInputElement>;
  galleryInputRef: React.RefObject<HTMLInputElement>;
  handleReceiptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setIsReceiptModalOpen: (v: boolean) => void;
  scannedProductName: string;
  setScannedProductName: (name: string) => void;
  addProduct: (
    productData: {
      name: string;
      expirationDate: string;
      quantity: number;
      unit: string;
    },
    onSuccess?: () => void,
    onError?: (msg: string) => void
  ) => Promise<void>;
  addProducts: (products: any[]) => void;
  isCategorizing: boolean;
  audioParsedProducts: AudioExtractedProduct[] | null;
  setAudioParsedProducts: (products: AudioExtractedProduct[] | null) => void;
  invalidIndices: Set<number>;
  setInvalidIndices: React.Dispatch<React.SetStateAction<Set<number>>>;
  products: any[];
}

export function AddProductModal({
  isOpen, onClose,
  isScanningBarcode, setIsScanningBarcode,
  isRecording, isAnalyzingAudio, isFetchingBarcode, isAnalyzingReceipt,
  startRecording, stopRecording,
  cameraInputRef, galleryInputRef, handleReceiptUpload, setIsReceiptModalOpen,
  scannedProductName, setScannedProductName, addProduct, addProducts, isCategorizing,
  audioParsedProducts, setAudioParsedProducts, invalidIndices, setInvalidIndices,
  products
}: AddProductModalProps) {

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleConfirmAudioProducts = () => {
    if (!audioParsedProducts) return;

    const missing = new Set<number>();
    audioParsedProducts.forEach((p, index) => {
      if (!p.expirationDate || p.expirationDate.trim() === '' || p.quantity === '' || p.unit === '') {
        missing.add(index);
      }
    });

    if (missing.size > 0) {
      setInvalidIndices(missing);
      haptics.error();
      toast.error(
        missing.size === 1
          ? '1 prodotto ha campi obbligatori mancanti. Compilali prima di procedere.'
          : `${missing.size} prodotti hanno campi obbligatori mancanti. Compilali prima di procedere.`
      );
      return;
    }

    // Tutto ok, aggiungi i prodotti
    const newProducts = audioParsedProducts.map(p => ({
      name: p.name,
      expirationDate: p.expirationDate!,
      quantity: p.quantity as number,
      unit: p.unit as string,
      category: p.category && CATEGORIES.includes(p.category as Category) ? (p.category as Category) : 'Altro',
      location: 'dispensa',
      createdAt: Date.now(),
      isEstimate: p.isEstimate,
    }));
    addProducts(newProducts);
    setAudioParsedProducts(null);
    setInvalidIndices(new Set());
    haptics.success();
    toast.success('Prodotti aggiunti con successo!');
    onClose();
  };

  const handleUpdateAudioProduct = (index: number, field: keyof AudioExtractedProduct, value: string | number) => {
    if (!audioParsedProducts) return;
    const updated = [...audioParsedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setAudioParsedProducts(updated);
    
    // Se l'utente ha compilato tutti i campi, rimuovi dal set degli errori
    const current = updated[index];
    if (current.expirationDate && current.quantity !== '' && current.unit !== '') {
      setInvalidIndices(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const handleRemoveAudioProduct = (index: number) => {
    haptics.medium();
    if (!audioParsedProducts) return;
    const updated = audioParsedProducts.filter((_, i) => i !== index);
    setAudioParsedProducts(updated.length > 0 ? updated : null);
    setInvalidIndices(prev => {
      const next = new Set<number>();
      prev.forEach(i => { if (i < index) next.add(i); else if (i > index) next.add(i - 1); });
      return next;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-stone-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[70] bg-stone-50 dark:bg-stone-950 rounded-t-3xl shadow-2xl border-t border-stone-200 dark:border-stone-800 h-[90vh] flex flex-col sm:max-w-2xl sm:mx-auto sm:h-[85vh] sm:rounded-3xl sm:bottom-6 sm:border"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-t-3xl shrink-0">
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Aggiungi Prodotto</h2>
              <button
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-full bg-stone-100 dark:bg-stone-800 transition-colors"
                aria-label="Chiudi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-safe">
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button type="button"
                    onClick={() => setIsScanningBarcode(true)}
                    disabled={isRecording || isAnalyzingAudio || isFetchingBarcode || isAnalyzingReceipt}
                    className="col-span-1 min-h-[100px] bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50 rounded-2xl font-medium hover:bg-purple-100 dark:hover:bg-purple-800/60 active:scale-[0.98] disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-2 shadow-sm"
                  >
                    {isFetchingBarcode ? <Loader2 className="w-7 h-7 animate-spin" /> : <Barcode className="w-7 h-7" />}
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-semibold">{isFetchingBarcode ? 'Ricerca…' : 'Scansiona'}</span>
                      <span className="text-[10px] opacity-80 mt-0.5">Codice a barre</span>
                    </div>
                  </button>

            <button type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isAnalyzingAudio || isFetchingBarcode || isAnalyzingReceipt}
              className={cn(
                'col-span-1 min-h-[100px] rounded-2xl font-medium transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-2 shadow-sm',
                isRecording
                  ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50 hover:bg-red-200 dark:hover:bg-red-800/60 animate-pulse'
                  : 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 hover:bg-blue-100 dark:hover:bg-blue-800/60 disabled:opacity-50',
              )}
            >
              {isAnalyzingAudio
                ? <Loader2 className="w-7 h-7 animate-spin" />
                : isRecording
                  ? <Square className="w-7 h-7 fill-current" />
                  : <Mic className="w-7 h-7" />
              }
              <div className="flex flex-col items-center">
                <span className="text-sm font-semibold">{isAnalyzingAudio ? 'Analisi…' : isRecording ? 'Ferma' : 'Dettatura'}</span>
                <span className="text-[10px] opacity-70 mt-0.5">Usa la voce</span>
              </div>
            </button>
          </div>

          <div className="mt-3">
            <button type="button"
              onClick={() => setIsReceiptModalOpen(true)}
              disabled={isRecording || isAnalyzingAudio || isFetchingBarcode || isAnalyzingReceipt}
              className="w-full min-h-[80px] bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50 rounded-2xl font-medium hover:bg-amber-100 dark:hover:bg-amber-800/60 active:scale-[0.98] disabled:opacity-50 transition-all flex flex-row items-center justify-center gap-4 shadow-sm"
            >
              {isAnalyzingReceipt ? <Loader2 className="w-7 h-7 animate-spin" /> : <Receipt className="w-7 h-7" />}
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">{isAnalyzingReceipt ? 'Analisi Scontrino…' : 'Scansiona Scontrino'}</span>
                <span className="text-[10px] opacity-80 mt-0.5">Aggiungi prodotti da una foto</span>
              </div>
            </button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
            <span className="flex-shrink-0 mx-4 text-stone-500 dark:text-stone-400 text-xs font-medium uppercase tracking-wider">Oppure inserisci manualmente</span>
            <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
          </div>

          {/* Manual Entry */}
          <AddProductForm 
            onAddProduct={addProduct}
            isCategorizing={isCategorizing}
            onSuccess={() => toast.success('Prodotto aggiunto!')}
            initialName={scannedProductName}
            onNameChange={setScannedProductName}
          />

          {/* Audio product review */}
          {audioParsedProducts && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">Prodotti Rilevati</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">
                Controlla e modifica i prodotti prima di aggiungerli alla dispensa.
              </p>
              {/* Avviso data obbligatoria */}
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl px-3 py-2.5 mb-5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  La data di scadenza è obbligatoria per tutti i prodotti.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {audioParsedProducts.map((product, index) => {
                  const isInvalid = invalidIndices.has(index);
                  const isMissingDate = isInvalid && (!product.expirationDate || product.expirationDate.trim() === '');
                  const isMissingQuantity = isInvalid && product.quantity === '';
                  const isMissingUnit = isInvalid && product.unit === '';
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        'bg-stone-50 dark:bg-stone-950 border rounded-xl p-4 relative group transition-colors',
                        isInvalid ? 'border-red-400 dark:border-red-500/50 bg-red-50/30 dark:bg-red-900/10' : 'border-stone-200 dark:border-stone-800'
                      )}
                    >
                      <button
                        onClick={() => handleRemoveAudioProduct(index)}
                        className="absolute -top-2 -right-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-red-500 dark:text-red-400 rounded-full p-1.5 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1 flex items-center gap-1">
                            Nome
                            {product.isEstimate && (
                              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider" title="Dati stimati dall'AI">
                                <Sparkles className="w-2.5 h-2.5" /> Stima
                              </span>
                            )}
                          </label>
                          <input type="text" value={product.name}
                            onChange={(e) => handleUpdateAudioProduct(index, 'name', e.target.value)}
                            className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base dark:text-stone-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Categoria</label>
                          <select value={product.category || 'Altro'}
                            onChange={(e) => handleUpdateAudioProduct(index, 'category', e.target.value)}
                            className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base appearance-none dark:text-stone-100"
                          >
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat} {CATEGORY_EMOJIS[cat]}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className={cn(
                            'block text-xs font-medium mb-1',
                            isMissingQuantity ? 'text-red-600 dark:text-red-400' : 'text-stone-500 dark:text-stone-400'
                          )}>
                            Quantità {isMissingQuantity && <span className="font-bold">*</span>}
                          </label>
                          <input type="number" min="1" step="1" inputMode="numeric" value={product.quantity}
                            onChange={(e) => handleUpdateAudioProduct(index, 'quantity', e.target.value ? Number(e.target.value) : '')}
                            className={cn(
                              'w-full bg-white dark:bg-stone-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-base border dark:text-stone-100',
                              isMissingQuantity
                                ? 'border-red-400 dark:border-red-500/50 focus:ring-red-400 bg-red-50 dark:bg-red-900/10'
                                : 'border-stone-200 dark:border-stone-700 focus:ring-emerald-500'
                            )}
                          />
                        </div>
                        <div className="w-1/3">
                          <label className={cn(
                            'block text-xs font-medium mb-1',
                            isMissingUnit ? 'text-red-600 dark:text-red-400' : 'text-stone-500 dark:text-stone-400'
                          )}>
                            Unità {isMissingUnit && <span className="font-bold">*</span>}
                          </label>
                          <select value={product.unit}
                            onChange={(e) => handleUpdateAudioProduct(index, 'unit', e.target.value)}
                            className={cn(
                              'w-full bg-white dark:bg-stone-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-base appearance-none border dark:text-stone-100',
                              isMissingUnit
                                ? 'border-red-400 dark:border-red-500/50 focus:ring-red-400 bg-red-50 dark:bg-red-900/10'
                                : 'border-stone-200 dark:border-stone-700 focus:ring-emerald-500'
                            )}
                          >
                            <option value="" disabled>Seleziona...</option>
                            {PRODUCT_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className={cn(
                            'block text-xs font-medium mb-1',
                            isMissingDate ? 'text-red-600 dark:text-red-400' : 'text-stone-500 dark:text-stone-400'
                          )}>
                            Scadenza {isMissingDate && <span className="font-bold">*obbligatoria</span>}
                          </label>
                          <input
                            type="date"
                            value={product.expirationDate || ''}
                            onChange={(e) => handleUpdateAudioProduct(index, 'expirationDate', e.target.value)}
                            className={cn(
                              'w-full bg-white dark:bg-stone-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-base border dark:text-stone-100',
                              isMissingDate
                                ? 'border-red-400 dark:border-red-500/50 focus:ring-red-400 bg-red-50 dark:bg-red-900/10'
                                : 'border-stone-200 dark:border-stone-700 focus:ring-emerald-500'
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setAudioParsedProducts(null); setInvalidIndices(new Set()); }}
                  className="flex-1 py-3 px-4 text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleConfirmAudioProducts}
                  className="flex-[2] py-3 px-4 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Check className="w-5 h-5" />
                  Conferma e Aggiungi ({audioParsedProducts.length})
                </button>
              </div>
            </motion.div>
          )}

          {/* Dev test button */}
          <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800">
            <button type="button"
              onClick={() => addRandomProducts(addProducts, products, () => {
                toast.success('Prodotti di test aggiunti!');
              })}
              className="w-full bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-900/50 px-4 py-3 rounded-xl font-medium hover:bg-amber-200 dark:hover:bg-amber-900/40 active:bg-amber-300 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Package className="w-5 h-5" />
              Aggiungi Prodotti di Esempio
            </button>
            <p className="text-xs text-amber-600/80 dark:text-amber-500/80 text-center mt-2">
              Aggiunge 10–15 prodotti casuali per testare la dispensa.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
    </>
    )}
    </AnimatePresence>
  );
}
