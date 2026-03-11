import React, { useState, useRef, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { Camera, Plus, Trash2, ChefHat, Loader2, Calendar, Image as ImageIcon, Users, Package, Utensils, Coffee, Moon, ArrowUpDown, Pencil, X, Check, Mic, Square } from 'lucide-react';
import { analyzeProductImage, generateRecipe, analyzeAudioProducts } from './services/gemini';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Category, CATEGORIES, GeneratedRecipe, AudioExtractedProduct } from './types';
import { SortOption, SORT_OPTIONS } from './constants/sortOptions';
import { PRODUCT_UNITS } from './constants/units';

import { useProducts } from './hooks/useProducts';
import { useRecipe } from './hooks/useRecipe';
import { PantryTab } from './components/PantryTab';
import { ClearConfirmModal } from './components/modals/ClearConfirmModal';
import { PreferencesModal } from './components/modals/PreferencesModal';
import { addRandomProducts } from './utils/testData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'add' | 'pantry' | 'recipe'>('pantry');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const {
    products,
    setProducts,
    sortBy,
    setSortBy,
    showClearConfirm,
    setShowClearConfirm,
    newProductName,
    setNewProductName,
    newProductDate,
    setNewProductDate,
    newProductQuantity,
    setNewProductQuantity,
    newProductUnit,
    setNewProductUnit,
    newProductCategory,
    setNewProductCategory,
    editingProductId,
    editProductName,
    setEditProductName,
    editProductDate,
    setEditProductDate,
    editProductQuantity,
    setEditProductQuantity,
    editProductUnit,
    setEditProductUnit,
    editProductCategory,
    setEditProductCategory,
    sortedProducts,
    groupedProducts,
    handleAddProduct,
    handleDeleteProduct,
    handleEditProduct,
    handleSaveEdit,
    handleCancelEdit,
    clearProducts
  } = useProducts();

  const editState = {
    name: editProductName,
    setName: setEditProductName,
    category: editProductCategory,
    setCategory: setEditProductCategory,
    quantity: editProductQuantity,
    setQuantity: setEditProductQuantity,
    unit: editProductUnit,
    setUnit: setEditProductUnit,
    date: editProductDate,
    setDate: setEditProductDate
  };

  const {
    recipe,
    setRecipe,
    isGenerating,
    isEditingRecipe,
    setIsEditingRecipe,
    isRecipeConfirmed,
    editedUsedProducts,
    showPreferencesModal,
    setShowPreferencesModal,
    selectedMealType,
    userPreferences,
    setUserPreferences,
    openPreferencesModal,
    handleGenerateRecipe,
    handleConfirmRecipe,
    handleEditedQuantityChange
  } = useRecipe(setProducts);

  const [servings, setServings] = useState<number>(1);
  const [useMicrowave, setUseMicrowave] = useState(false);
  const [useAirFryer, setUseAirFryer] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false);
  const [audioParsedProducts, setAudioParsedProducts] = useState<AudioExtractedProduct[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Impossibile accedere al microfono. Verifica i permessi.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsAnalyzingAudio(true);
    setError(null);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        if (base64Audio) {
          const extractedProducts = await analyzeAudioProducts(base64Audio, audioBlob.type);
          if (extractedProducts && extractedProducts.length > 0) {
            setAudioParsedProducts(extractedProducts);
          } else {
            setError("Non sono riuscito a trovare prodotti nell'audio. Riprova.");
          }
        }
      };
    } catch (err: any) {
      setError(err.message || "Errore durante l'analisi dell'audio.");
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
      createdAt: Date.now()
    }));
    
    setProducts(prev => [...prev, ...newProducts]);
    setAudioParsedProducts(null);
    setToastMessage("Prodotti aggiunti con successo!");
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleCancelAudioProducts = () => {
    setAudioParsedProducts(null);
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
    if (updated.length === 0) {
      setAudioParsedProducts(null);
    } else {
      setAudioParsedProducts(updated);
    }
  };

  const handleTabChange = (tab: 'add' | 'pantry' | 'recipe') => {
    if (isGenerating) return;
    setActiveTab(tab);
  };

  const onConfirmRecipe = () => {
    handleConfirmRecipe();
    setToastMessage("Ricetta confermata!");
    setTimeout(() => {
      setToastMessage(null);
      handleTabChange('pantry');
    }, 1500);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("L'immagine è troppo grande. La dimensione massima consentita è 5MB.");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const match = base64String.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (!match) {
          throw new Error("Impossibile leggere i dati dell'immagine.");
        }
        const mimeType = match[1];
        const base64Data = match[2];

        try {
          const extracted = await analyzeProductImage(base64Data, mimeType);
          
          if (extracted.name) {
            setNewProductName(extracted.name);
            if (extracted.expirationDate && isValid(parseISO(extracted.expirationDate))) {
              setNewProductDate(extracted.expirationDate);
            } else {
              setError("Impossibile rilevare una data di scadenza valida. Inseriscila manualmente.");
            }
            if (extracted.category && CATEGORIES.includes(extracted.category as Category)) {
              setNewProductCategory(extracted.category);
            }
          } else {
            setError("Impossibile rilevare il nome del prodotto. Inseriscilo manualmente.");
          }
        } catch (err: any) {
          setError(err.message || "Impossibile analizzare l'immagine.");
        } finally {
          setIsAnalyzing(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "Impossibile elaborare l'immagine.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-emerald-200">
      <header className="hidden sm:block bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Chef da Dispensa Logo" className="w-10 h-10 rounded-xl shadow-sm object-cover" referrerPolicy="no-referrer" />
            <h1 className="text-xl font-semibold tracking-tight hidden sm:block">Chef da Dispensa</h1>
          </div>
          
          <nav className="hidden sm:flex gap-2">
            <button
              onClick={() => handleTabChange('add')}
              disabled={isGenerating}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors",
                activeTab === 'add' 
                  ? "bg-stone-900 text-white" 
                  : "text-stone-600 hover:bg-stone-100",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi</span>
            </button>
            <button
              onClick={() => handleTabChange('pantry')}
              disabled={isGenerating}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors",
                activeTab === 'pantry' 
                  ? "bg-stone-900 text-white" 
                  : "text-stone-600 hover:bg-stone-100",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}
            >
              <Package className="w-4 h-4" />
              <span>Dispensa</span>
            </button>
            <button
              onClick={() => handleTabChange('recipe')}
              disabled={isGenerating}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors",
                activeTab === 'recipe' 
                  ? "bg-stone-900 text-white" 
                  : "text-stone-600 hover:bg-stone-100",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}
            >
              <Utensils className="w-4 h-4" />
              <span>Ricette</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 sm:pb-8 sm:py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between">
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              &times;
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <section className="pt-2 sm:pt-8">
                <div className="text-center mb-8">
                  <img src="/logo.png" alt="Chef da Dispensa Logo" className="w-16 h-16 rounded-2xl shadow-sm mx-auto mb-4 object-cover" referrerPolicy="no-referrer" />
                  <h2 className="text-2xl font-bold text-stone-900">Aggiungi Prodotto</h2>
                  <p className="text-stone-500 mt-1">Inserisci i dettagli o scansiona l'etichetta</p>
                </div>
                
                <form onSubmit={(e) => handleAddProduct(e, () => {
                  setToastMessage("Prodotto aggiunto con successo!");
                  setTimeout(() => setToastMessage(null), 2000);
                }, setError)} className="space-y-5">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1">Nome Prodotto</label>
                      <input
                        type="text"
                        id="name"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        placeholder="es. Latte, Uova, Spinaci"
                        className="w-full px-4 py-3.5 sm:py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-base"
                      />
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-stone-700 mb-1">Categoria</label>
                      <select
                        id="category"
                        value={newProductCategory}
                        onChange={(e) => setNewProductCategory(e.target.value)}
                        className="w-full px-4 py-3.5 sm:py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-base appearance-none bg-white"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-stone-700 mb-1">Data di Scadenza</label>
                      <input
                        type="date"
                        id="date"
                        value={newProductDate}
                        onChange={(e) => setNewProductDate(e.target.value)}
                        className="w-full px-4 py-3.5 sm:py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-base"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label htmlFor="quantity" className="block text-sm font-medium text-stone-700 mb-1">Quantità</label>
                        <input
                          type="number"
                          id="quantity"
                          min="0"
                          step="0.1"
                          value={newProductQuantity}
                          onChange={(e) => setNewProductQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="es. 500"
                          className="w-full px-4 py-3.5 sm:py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-base"
                        />
                      </div>
                      <div className="w-1/3">
                        <label htmlFor="unit" className="block text-sm font-medium text-stone-700 mb-1">Unità</label>
                        <select
                          id="unit"
                          value={newProductUnit}
                          onChange={(e) => setNewProductUnit(e.target.value)}
                          className="w-full px-4 py-3.5 sm:py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-base bg-white"
                        >
                          {PRODUCT_UNITS.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-100">
                    <button
                      type="submit"
                      disabled={!newProductName || !newProductDate || newProductQuantity === ''}
                      className="flex-1 bg-stone-900 text-white px-4 py-3.5 sm:py-3 rounded-xl font-medium hover:bg-stone-800 active:bg-stone-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Plus className="w-5 h-5" />
                      Aggiungi alla Dispensa
                    </button>
                    
                    <div className="relative flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        onChange={handleImageUpload}
                        ref={fileInputRef}
                        disabled={isAnalyzing || isRecording || isAnalyzingAudio}
                      />
                      <button
                        type="button"
                        disabled={isAnalyzing || isRecording || isAnalyzingAudio}
                        className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3.5 sm:py-3 rounded-xl font-medium hover:bg-emerald-100 active:bg-emerald-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        {isAnalyzing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Camera className="w-5 h-5" />
                        )}
                        {isAnalyzing ? "Scansione..." : "Scansiona"}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isAnalyzing || isAnalyzingAudio}
                      className={cn(
                        "flex-1 px-4 py-3.5 sm:py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm",
                        isRecording 
                          ? "bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 animate-pulse" 
                          : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 active:bg-blue-200 disabled:opacity-50"
                      )}
                    >
                      {isAnalyzingAudio ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isRecording ? (
                        <Square className="w-5 h-5 fill-current" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                      {isAnalyzingAudio ? "Analisi..." : isRecording ? "Ferma Registrazione" : "Registra Audio"}
                    </button>
                  </div>
                </form>

                {audioParsedProducts && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm"
                  >
                    <h3 className="text-lg font-bold text-stone-900 mb-4">Prodotti Rilevati</h3>
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
                              <input
                                type="text"
                                value={product.name}
                                onChange={(e) => handleUpdateAudioProduct(index, 'name', e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-stone-500 mb-1">Categoria</label>
                              <select
                                value={product.category || 'Altro'}
                                onChange={(e) => handleUpdateAudioProduct(index, 'category', e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none"
                              >
                                {CATEGORIES.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-stone-500 mb-1">Quantità</label>
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={product.quantity}
                                onChange={(e) => handleUpdateAudioProduct(index, 'quantity', e.target.value ? Number(e.target.value) : '')}
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                              />
                            </div>
                            <div className="w-1/3">
                              <label className="block text-xs font-medium text-stone-500 mb-1">Unità</label>
                              <select
                                value={product.unit}
                                onChange={(e) => handleUpdateAudioProduct(index, 'unit', e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none"
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
                                value={product.expirationDate || ''}
                                onChange={(e) => handleUpdateAudioProduct(index, 'expirationDate', e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelAudioProducts}
                        className="flex-1 py-3 px-4 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
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

                {/* TEST BUTTON - TO BE REMOVED LATER */}
                {import.meta.env.DEV && (
                  <div className="mt-8 pt-6 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={() => addRandomProducts(setProducts, () => {
                        setToastMessage("Prodotti di test aggiunti!");
                        setTimeout(() => setToastMessage(null), 2000);
                      })}
                      className="w-full bg-amber-100 text-amber-800 border border-amber-300 px-4 py-3 rounded-xl font-medium hover:bg-amber-200 active:bg-amber-300 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Package className="w-5 h-5" />
                      TEST: Aggiungi 10-15 Prodotti Casuali
                    </button>
                    <p className="text-xs text-amber-600/80 text-center mt-2">
                      Questo tasto è temporaneo e serve solo per testare la dispensa.
                    </p>
                  </div>
                )}
              </section>
            </motion.div>
          )}

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

          {activeTab === 'recipe' && (
            <motion.div
              key="recipe"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <section className="pt-2 sm:pt-8">
                <div className="text-center mb-8">
                  <img src="/logo.png" alt="Chef da Dispensa Logo" className="w-16 h-16 rounded-2xl shadow-sm mx-auto mb-4 object-cover" referrerPolicy="no-referrer" />
                  <h2 className="text-2xl font-bold text-stone-900">Genera Ricetta</h2>
                  <p className="text-stone-500 mt-1">
                    Ottieni una ricetta usando i tuoi ingredienti in scadenza.
                  </p>
                </div>
                <div className="flex flex-col gap-4 mb-6">
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <button
                        onClick={() => openPreferencesModal('colazione', products, setError)}
                        disabled={isGenerating || products.length === 0}
                        className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-3 sm:py-2.5 rounded-xl font-medium hover:bg-amber-200 active:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 shadow-sm text-sm sm:text-base"
                      >
                        {isGenerating && selectedMealType === 'colazione' ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <Coffee className="w-5 h-5 sm:w-4 sm:h-4" />}
                        Colazione
                      </button>
                      <button
                        onClick={() => openPreferencesModal('spuntino', products, setError)}
                        disabled={isGenerating || products.length === 0}
                        className="bg-orange-100 text-orange-800 border border-orange-200 px-3 py-3 sm:py-2.5 rounded-xl font-medium hover:bg-orange-200 active:bg-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 shadow-sm text-sm sm:text-base"
                      >
                        {isGenerating && selectedMealType === 'spuntino' ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <Package className="w-5 h-5 sm:w-4 sm:h-4" />}
                        Spuntino
                      </button>
                      <button
                        onClick={() => openPreferencesModal('pranzo', products, setError)}
                        disabled={isGenerating || products.length === 0}
                        className="bg-emerald-600 text-white px-3 py-3 sm:py-2.5 rounded-xl font-medium hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 shadow-sm shadow-emerald-600/20 text-sm sm:text-base"
                      >
                        {isGenerating && selectedMealType === 'pranzo' ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <Utensils className="w-5 h-5 sm:w-4 sm:h-4" />}
                        Pranzo
                      </button>
                      <button
                        onClick={() => openPreferencesModal('cena', products, setError)}
                        disabled={isGenerating || products.length === 0}
                        className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-3 sm:py-2.5 rounded-xl font-medium hover:bg-indigo-200 active:bg-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 shadow-sm text-sm sm:text-base"
                      >
                        {isGenerating && selectedMealType === 'cena' ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <Moon className="w-5 h-5 sm:w-4 sm:h-4" />}
                        Cena
                      </button>
                    </div>
                  </div>
                </div>

                {recipe ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-stone-50 rounded-xl p-6 sm:p-8 border border-stone-200"
                  >
                    <div className="mb-8 text-center">
                      <h3 className="text-3xl font-bold text-stone-900 mb-3">{recipe.title}</h3>
                      <div className="flex justify-center gap-6 text-sm text-stone-600">
                        <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-sm">
                          <Users className="w-4 h-4 text-emerald-600" /> {recipe.servings} porzioni
                        </span>
                        <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-sm">
                          <Calendar className="w-4 h-4 text-emerald-600" /> {recipe.prepTime}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="md:col-span-1">
                        <h4 className="font-semibold text-stone-900 mb-4 border-b border-stone-200 pb-2 text-lg">Ingredienti</h4>
                        <ul className="space-y-3">
                          {recipe.ingredients.map((ingredient, idx) => (
                            <li key={idx} className="text-stone-700 flex items-start gap-2">
                              <span className="text-emerald-500 mt-1">•</span>
                              <span>{ingredient}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="md:col-span-2">
                        <h4 className="font-semibold text-stone-900 mb-4 border-b border-stone-200 pb-2 text-lg">Istruzioni</h4>
                        <ol className="space-y-5">
                          {recipe.instructions.map((step, idx) => (
                            <li key={idx} className="text-stone-700 flex gap-4">
                              <span className="font-bold text-emerald-600 shrink-0 bg-emerald-50 w-6 h-6 flex items-center justify-center rounded-full text-sm">{idx + 1}</span>
                              <span className="pt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    {editedUsedProducts.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-stone-200">
                        <h4 className="font-semibold text-stone-900 mb-4 text-lg">Prodotti utilizzati dalla dispensa</h4>
                        {isEditingRecipe ? (
                          <div className="space-y-3 mb-6">
                            {editedUsedProducts.map((item, idx) => (
                              <div key={`${item.productId}-${idx}`} className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                                <span className="font-medium text-stone-700">{item.name}</span>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number" 
                                    min="0"
                                    step="0.1"
                                    value={item.quantity === 0 ? '' : item.quantity}
                                    onChange={(e) => handleEditedQuantityChange(idx, e.target.value)}
                                    className="w-20 px-2 py-1.5 border border-stone-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  />
                                  <span className="text-stone-500 text-sm w-8">{item.unit}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <ul className="space-y-2 mb-6">
                            {editedUsedProducts.map((item, idx) => (
                              <li key={`${item.productId}-${idx}`} className="flex justify-between text-stone-700 bg-white p-3 rounded-xl border border-stone-100">
                                <span>{item.name}</span>
                                <span className="font-medium">{item.quantity} {item.unit}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                          {!isRecipeConfirmed ? (
                            <>
                              {isEditingRecipe ? (
                                <button
                                  onClick={() => setIsEditingRecipe(false)}
                                  className="flex-1 bg-stone-100 text-stone-700 px-4 py-3 rounded-xl font-medium hover:bg-stone-200 transition-colors"
                                >
                                  Annulla Modifiche
                                </button>
                              ) : (
                                <button
                                  onClick={() => setIsEditingRecipe(true)}
                                  className="flex-1 bg-white border border-stone-300 text-stone-700 px-4 py-3 rounded-xl font-medium hover:bg-stone-50 transition-colors"
                                >
                                  Modifica Quantità
                                </button>
                              )}
                              <button
                                onClick={onConfirmRecipe}
                                className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shadow-emerald-600/20"
                              >
                                Conferma Ricetta
                              </button>
                            </>
                          ) : (
                            <div className="w-full bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl font-medium border border-emerald-200 flex items-center justify-center gap-2">
                              <Check className="w-5 h-5" />
                              Ingredienti scalati dalla dispensa!
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="text-center py-16 text-stone-500 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                    <img src="/logo.png" alt="Pronto a cucinare" className="w-20 h-20 rounded-2xl shadow-sm mx-auto mb-5 object-cover" referrerPolicy="no-referrer" />
                    <p className="text-stone-600 font-medium text-lg">Pronto a cucinare?</p>
                    <p className="text-sm mt-2 max-w-md mx-auto">
                      Assicurati di aver aggiunto i tuoi ingredienti nella Dispensa, seleziona per quante persone stai cucinando e lascia che l'IA crei una ricetta per aiutarti a ridurre gli sprechi alimentari.
                    </p>
                  </div>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex justify-around items-center h-16 px-2 z-50 pb-safe">
        <button
          onClick={() => handleTabChange('pantry')}
          disabled={isGenerating}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
            activeTab === 'pantry' ? "text-emerald-600" : "text-stone-500 hover:text-stone-900",
            isGenerating && "opacity-50 cursor-not-allowed"
          )}
        >
          <Package className={cn("w-6 h-6", activeTab === 'pantry' && "fill-emerald-50")} />
          <span className="text-[10px] font-medium">Dispensa</span>
        </button>
        
        <button
          onClick={() => handleTabChange('add')}
          disabled={isGenerating}
          className={cn(
            "relative -top-5 flex flex-col items-center justify-center",
            isGenerating && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-white transition-transform active:scale-95",
            activeTab === 'add' ? "bg-emerald-600" : "bg-emerald-500"
          )}>
            <Plus className="w-7 h-7" />
          </div>
        </button>

        <button
          onClick={() => handleTabChange('recipe')}
          disabled={isGenerating}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
            activeTab === 'recipe' ? "text-emerald-600" : "text-stone-500 hover:text-stone-900",
            isGenerating && "opacity-50 cursor-not-allowed"
          )}
        >
          <Utensils className={cn("w-6 h-6", activeTab === 'recipe' && "fill-emerald-50")} />
          <span className="text-[10px] font-medium">Ricette</span>
        </button>
      </nav>

      <AnimatePresence>
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
            handleGenerateRecipe(sortedProducts, servings, useMicrowave, useAirFryer, setError);
          }}
          onCancel={() => setShowPreferencesModal(false)}
        />

        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg shadow-emerald-600/20 flex items-center gap-2 font-medium"
          >
            <Check className="w-5 h-5" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
