import React, { useState, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Plus, Loader2, Package, Utensils, X, Check, Mic, Square, Barcode
} from 'lucide-react';
import { analyzeAudioProducts } from './services/gemini';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Category, CATEGORIES, CATEGORY_EMOJIS, AudioExtractedProduct } from './types';
import { PRODUCT_UNITS } from './constants/units';
import { Toaster, toast } from 'react-hot-toast';

import { useProducts } from './hooks/useProducts';
import { useRecipe } from './hooks/useRecipe';
import { PantryTab } from './components/PantryTab';
import { RecipeTab } from './components/RecipeTab';
import { ClearConfirmModal } from './components/modals/ClearConfirmModal';
import { PreferencesModal } from './components/modals/PreferencesModal';
import { ListeningModal } from './components/modals/ListeningModal';
import { BarcodeScannerModal } from './components/modals/BarcodeScannerModal';
import { addRandomProducts } from './utils/testData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'add' | 'pantry' | 'recipe'>('pantry');

  // ─── Products ──────────────────────────────────────────────────────────────

  const {
    products, setProducts,
    sortBy, setSortBy,
    showClearConfirm, setShowClearConfirm,
    newProductName, setNewProductName,
    newProductDate, setNewProductDate,
    newProductQuantity, setNewProductQuantity,
    newProductUnit, setNewProductUnit,
    newProductCategory, setNewProductCategory,
    isCategorizing,
    editingProductId,
    editProductName, setEditProductName,
    editProductDate, setEditProductDate,
    editProductQuantity, setEditProductQuantity,
    editProductUnit, setEditProductUnit,
    editProductCategory, setEditProductCategory,
    sortedProducts, groupedProducts,
    handleAddProduct, handleDeleteProduct,
    handleEditProduct, handleSaveEdit, handleCancelEdit,
    clearProducts,
  } = useProducts();

  const editState = {
    name: editProductName,         setName: setEditProductName,
    category: editProductCategory, setCategory: setEditProductCategory,
    quantity: editProductQuantity, setQuantity: setEditProductQuantity,
    unit: editProductUnit,         setUnit: setEditProductUnit,
    date: editProductDate,         setDate: setEditProductDate,
  };

  // ─── Recipe ────────────────────────────────────────────────────────────────

  const {
    recipe, isGenerating,
    isEditingRecipe, setIsEditingRecipe,
    isRecipeConfirmed, editedUsedProducts,
    showPreferencesModal, setShowPreferencesModal,
    selectedMealType,
    openPreferencesModal,
    handleGenerateRecipe, handleConfirmRecipe, handleEditedQuantityChange,
  } = useRecipe(setProducts);

  // Guard: check pantry is non-empty before opening the preferences modal.
  const handleOpenPreferences = (mealType: 'colazione' | 'pranzo' | 'cena' | 'spuntino') => {
    if (products.length === 0) {
      toast.error('Per favore, aggiungi prima qualche prodotto.');
      return;
    }
    openPreferencesModal(mealType);
  };

  const onConfirmRecipe = () => {
    handleConfirmRecipe();
    toast.success('Ricetta confermata!');
  };

  // ─── Navigation ────────────────────────────────────────────────────────────

  const handleTabChange = (tab: 'add' | 'pantry' | 'recipe') => {
    if (isGenerating) return;
    setActiveTab(tab);
  };

  // ─── Audio recording ───────────────────────────────────────────────────────

  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false);
  const [audioParsedProducts, setAudioParsedProducts] = useState<AudioExtractedProduct[] | null>(null);

  // ─── Barcode scanning ──────────────────────────────────────────────────────
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  const [isFetchingBarcode, setIsFetchingBarcode] = useState(false);

  const handleBarcodeScan = async (barcode: string) => {
    setIsScanningBarcode(false);
    setIsFetchingBarcode(true);
    
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      
      if (data.status === 1 && data.product) {
        const name = data.product.product_name || data.product.product_name_it || data.product.generic_name;
        const brand = data.product.brands ? data.product.brands.split(',')[0] : '';
        const fullName = brand ? `${brand} ${name}` : name;
        
        if (fullName) {
          setNewProductName(fullName);
          toast.success(`Prodotto trovato: ${fullName}`);
        } else {
          toast.error("Prodotto trovato ma senza nome. Inseriscilo manualmente.");
        }
      } else {
        toast.error("Prodotto non trovato nel database. Inseriscilo manualmente.");
      }
    } catch (err) {
      toast.error("Errore durante la ricerca del prodotto. Riprova o inseriscilo manualmente.");
    } finally {
      setIsFetchingBarcode(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/ogg';
      
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        await processAudio(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      toast.error('Impossibile accedere al microfono. Verifica i permessi.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) { mediaRecorder.stop(); setIsRecording(false); }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsAnalyzingAudio(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const b64 = reader.result?.toString().split(',')[1];
          if (b64) resolve(b64);
          else reject(new Error('Impossibile leggere il file audio.'));
        };
        reader.onerror = () => reject(new Error('Errore nella lettura del file audio.'));
      });

      const extracted = await analyzeAudioProducts(base64, audioBlob.type);
      if (extracted?.length > 0) setAudioParsedProducts(extracted);
      else toast.error("Non sono riuscito a trovare prodotti nell'audio. Riprova.");
    } catch (err: any) {
      toast.error(err.message || "Errore durante l'analisi dell'audio.");
    } finally {
      setIsAnalyzingAudio(false);
    }
  };

  const handleConfirmAudioProducts = () => {
    if (!audioParsedProducts) return;
    const newProducts: Product[] = audioParsedProducts.map(p => ({
      id: uuidv4(),
      name: p.name,
      expirationDate: p.expirationDate || format(new Date(), 'yyyy-MM-dd', { locale: it }),
      quantity: p.quantity || 1,
      unit: p.unit || 'pz',
      category: p.category && CATEGORIES.includes(p.category as Category) ? p.category : 'Altro',
      createdAt: Date.now(),
    }));
    setProducts(prev => [...prev, ...newProducts]);
    setAudioParsedProducts(null);
    toast.success('Prodotti aggiunti con successo!');
  };

  const handleUpdateAudioProduct = (index: number, field: keyof AudioExtractedProduct, value: string | number) => {
    if (!audioParsedProducts) return;
    const updated = [...audioParsedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setAudioParsedProducts(updated);
  };

  const handleRemoveAudioProduct = (index: number) => {
    if (!audioParsedProducts) return;
    const updated = audioParsedProducts.filter((_, i) => i !== index);
    setAudioParsedProducts(updated.length > 0 ? updated : null);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-200">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '16px',
            background: '#333',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
          },
          success: {
            style: {
              background: '#059669', // emerald-600
            },
          },
          error: {
            style: {
              background: '#dc2626', // red-600
            },
          },
        }}
      />

      {/* Desktop header */}
      <header className="hidden sm:block bg-white/80 backdrop-blur-md border-b border-stone-200/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Chef da Dispensa Logo" className="w-10 h-10 rounded-xl shadow-sm object-cover" referrerPolicy="no-referrer" />
            <h1 className="text-xl font-semibold tracking-tight hidden sm:block">Chef da Dispensa</h1>
          </div>
          <nav className="hidden sm:flex gap-2">
            {(['add', 'pantry', 'recipe'] as const).map(tab => {
              const labels: Record<string, string> = { add: 'Aggiungi', pantry: 'Dispensa', recipe: 'Ricette' };
              const Icons: Record<string, React.ElementType> = { add: Plus, pantry: Package, recipe: Utensils };
              const Icon = Icons[tab];
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  disabled={isGenerating}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors',
                    activeTab === tab ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100/80',
                    isGenerating && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{labels[tab]}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 sm:pb-8 sm:py-8">

        <AnimatePresence mode="wait">

          {/* ── Add tab ─────────────────────────────────────────────────────── */}
          {activeTab === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <section className="pt-2 sm:pt-8">
                <div className="text-center mb-8">
                  <img src="/logo.png" alt="Chef da Dispensa Logo" className="w-16 h-16 rounded-2xl shadow-sm mx-auto mb-4 object-cover" referrerPolicy="no-referrer" />
                  <h2 className="text-2xl font-bold text-stone-900">Aggiungi Prodotto</h2>
                  <p className="text-stone-500 mt-1">Inserisci i dettagli o scansiona l'etichetta</p>
                </div>

                <form
                  onSubmit={(e) => handleAddProduct(e, () => {
                    toast.success('Prodotto aggiunto con successo!');
                  }, (msg) => toast.error(msg))}
                  className="space-y-6"
                >
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button"
                      onClick={() => setIsScanningBarcode(true)}
                      disabled={isRecording || isAnalyzingAudio || isFetchingBarcode}
                      className="col-span-1 min-h-[100px] bg-purple-50 text-purple-700 border border-purple-200 rounded-2xl font-medium hover:bg-purple-100 active:scale-[0.98] disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-2 shadow-sm"
                    >
                      {isFetchingBarcode ? <Loader2 className="w-7 h-7 animate-spin" /> : <Barcode className="w-7 h-7" />}
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold">{isFetchingBarcode ? 'Ricerca…' : 'Scansiona'}</span>
                        <span className="text-[10px] opacity-70 mt-0.5">Codice a barre</span>
                      </div>
                    </button>

                    <button type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isAnalyzingAudio || isFetchingBarcode}
                      className={cn(
                        'col-span-1 min-h-[100px] rounded-2xl font-medium transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-2 shadow-sm',
                        isRecording
                          ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 animate-pulse'
                          : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50',
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

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-stone-200"></div>
                    <span className="flex-shrink-0 mx-4 text-stone-400 text-xs font-medium uppercase tracking-wider">Oppure inserisci manualmente</span>
                    <div className="flex-grow border-t border-stone-200"></div>
                  </div>

                  {/* Manual Entry */}
                  <div className="space-y-4 bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                    <div>
                      <label htmlFor="name" className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Nome Prodotto</label>
                      <input type="text" id="name" value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        placeholder="es. Latte, Uova, Spinaci"
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-base bg-stone-50"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="col-span-1">
                        <label htmlFor="date" className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Scadenza</label>
                        <input type="date" id="date" value={newProductDate}
                          onChange={(e) => setNewProductDate(e.target.value)}
                          className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-base bg-stone-50"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label htmlFor="quantity" className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Quantità</label>
                        <input type="number" id="quantity" min="0" step="0.1" inputMode="decimal"
                          value={newProductQuantity}
                          onChange={(e) => setNewProductQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="es. 500"
                          className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-base bg-stone-50"
                        />
                      </div>
                      <div className="w-1/3">
                        <label htmlFor="unit" className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Unità</label>
                        <select id="unit" value={newProductUnit}
                          onChange={(e) => setNewProductUnit(e.target.value)}
                          className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-base bg-stone-50"
                        >
                          {PRODUCT_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                        </select>
                      </div>
                    </div>

                    <button type="submit"
                      disabled={!newProductName || !newProductDate || newProductQuantity === '' || isCategorizing}
                      className="w-full mt-2 bg-stone-900 text-white px-4 py-3.5 rounded-xl font-medium hover:bg-stone-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isCategorizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                      {isCategorizing ? 'Categorizzazione...' : 'Aggiungi'}
                    </button>
                  </div>
                </form>

                {/* Audio product review */}
                {audioParsedProducts && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-8 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm"
                  >
                    <h3 className="text-lg font-bold text-stone-900 mb-1">Prodotti Rilevati</h3>
                    <p className="text-sm text-stone-500 mb-6">Controlla e modifica i prodotti prima di aggiungerli alla dispensa.</p>
                    <div className="space-y-4 mb-6">
                      {audioParsedProducts.map((product, index) => (
                        <div key={index} className="bg-stone-50 border border-stone-200 rounded-xl p-4 relative group">
                          <button
                            onClick={() => handleRemoveAudioProduct(index)}
                            className="absolute -top-2 -right-2 bg-white border border-stone-200 text-red-500 rounded-full p-1.5 shadow-sm hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-stone-500 mb-1">Nome</label>
                              <input type="text" value={product.name}
                                onChange={(e) => handleUpdateAudioProduct(index, 'name', e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-stone-500 mb-1">Categoria</label>
                              <select value={product.category || 'Altro'}
                                onChange={(e) => handleUpdateAudioProduct(index, 'category', e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none"
                              >
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_EMOJIS[cat]} {cat}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-stone-500 mb-1">Quantità</label>
                              <input type="number" min="0.1" step="0.1" value={product.quantity}
                                onChange={(e) => handleUpdateAudioProduct(index, 'quantity', e.target.value ? Number(e.target.value) : '')}
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                              />
                            </div>
                            <div className="w-1/3">
                              <label className="block text-xs font-medium text-stone-500 mb-1">Unità</label>
                              <select value={product.unit}
                                onChange={(e) => handleUpdateAudioProduct(index, 'unit', e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none"
                              >
                                {PRODUCT_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-stone-500 mb-1">Scadenza</label>
                              <input type="date" value={product.expirationDate || ''}
                                onChange={(e) => handleUpdateAudioProduct(index, 'expirationDate', e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setAudioParsedProducts(null)}
                        className="flex-1 py-3 px-4 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                      >Annulla</button>
                      <button onClick={handleConfirmAudioProducts}
                        className="flex-[2] py-3 px-4 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Check className="w-5 h-5" />
                        Conferma e Aggiungi ({audioParsedProducts.length})
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Dev test button */}
                <div className="mt-8 pt-6 border-t border-stone-200">
                  <button type="button"
                    onClick={() => addRandomProducts(setProducts, () => {
                      toast.success('Prodotti di test aggiunti!');
                    })}
                    className="w-full bg-amber-100 text-amber-800 border border-amber-300 px-4 py-3 rounded-xl font-medium hover:bg-amber-200 active:bg-amber-300 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Package className="w-5 h-5" />
                    Aggiungi Prodotti di Esempio
                  </button>
                  <p className="text-xs text-amber-600/80 text-center mt-2">
                    Aggiunge 10–15 prodotti casuali per testare la dispensa.
                  </p>
                </div>
              </section>
            </motion.div>
          )}

          {/* ── Pantry tab ──────────────────────────────────────────────────── */}
          {activeTab === 'pantry' && (
            <PantryTab
              key="pantry"
              products={products}
              groupedProducts={groupedProducts}
              sortBy={sortBy}
              setSortBy={setSortBy}
              setShowClearConfirm={setShowClearConfirm}
              setActiveTab={handleTabChange}
              editingProductId={editingProductId}
              editState={editState}
              handleEditProduct={handleEditProduct}
              handleSaveEdit={handleSaveEdit}
              handleCancelEdit={handleCancelEdit}
              handleDeleteProduct={handleDeleteProduct}
            />
          )}

          {/* ── Recipe tab ──────────────────────────────────────────────────── */}
          {activeTab === 'recipe' && (
            <RecipeTab
              key="recipe"
              products={products}
              recipe={recipe}
              isGenerating={isGenerating}
              isEditingRecipe={isEditingRecipe}
              setIsEditingRecipe={setIsEditingRecipe}
              isRecipeConfirmed={isRecipeConfirmed}
              editedUsedProducts={editedUsedProducts}
              selectedMealType={selectedMealType}
              onOpenPreferences={handleOpenPreferences}
              onConfirmRecipe={onConfirmRecipe}
              onEditedQuantityChange={handleEditedQuantityChange}
            />
          )}

        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-stone-200/50 flex justify-around items-center h-16 px-2 z-50 pb-safe">
        <button
          onClick={() => handleTabChange('pantry')}
          disabled={isGenerating}
          className={cn(
            'flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-95',
            activeTab === 'pantry' ? 'text-emerald-600' : 'text-stone-500 hover:text-stone-900',
            isGenerating && 'opacity-50 cursor-not-allowed',
          )}
        >
          <Package className={cn('w-6 h-6', activeTab === 'pantry' && 'fill-emerald-50')} />
          <span className="text-[10px] font-medium">Dispensa</span>
        </button>

        <button
          onClick={() => handleTabChange('add')}
          disabled={isGenerating}
          className={cn('relative -top-5 flex flex-col items-center justify-center', isGenerating && 'opacity-50 cursor-not-allowed')}
        >
          <div className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-white transition-transform active:scale-90',
            activeTab === 'add' ? 'bg-emerald-600' : 'bg-emerald-500',
          )}>
            <Plus className="w-7 h-7" />
          </div>
        </button>

        <button
          onClick={() => handleTabChange('recipe')}
          disabled={isGenerating}
          className={cn(
            'flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-95',
            activeTab === 'recipe' ? 'text-emerald-600' : 'text-stone-500 hover:text-stone-900',
            isGenerating && 'opacity-50 cursor-not-allowed',
          )}
        >
          <Utensils className={cn('w-6 h-6', activeTab === 'recipe' && 'fill-emerald-50')} />
          <span className="text-[10px] font-medium">Ricette</span>
        </button>
      </nav>

      {/* Modals & toast */}
      <AnimatePresence>
        {(isRecording || isAnalyzingAudio) && (
          <ListeningModal
            isRecording={isRecording}
            isAnalyzingAudio={isAnalyzingAudio}
            onStop={stopRecording}
          />
        )}
        <BarcodeScannerModal
          isOpen={isScanningBarcode}
          onClose={() => setIsScanningBarcode(false)}
          onScan={handleBarcodeScan}
        />
        <ClearConfirmModal
          isOpen={showClearConfirm}
          onConfirm={clearProducts}
          onCancel={() => setShowClearConfirm(false)}
        />
        <PreferencesModal
          isOpen={showPreferencesModal}
          mealType={selectedMealType}
          isGenerating={isGenerating}
          onConfirm={(servings, useMicrowave, useAirFryer, preferences) => {
            handleGenerateRecipe(sortedProducts, servings, useMicrowave, useAirFryer, preferences, (msg) => toast.error(msg));
          }}
          onCancel={() => setShowPreferencesModal(false)}
        />
      </AnimatePresence>
    </div>
  );
}
