import React, { useState, useRef, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { Camera, Plus, Trash2, ChefHat, Loader2, Calendar, Image as ImageIcon, Users, Package, Utensils, Coffee, Moon, ArrowUpDown, Pencil, X, Check } from 'lucide-react';
import { analyzeProductImage, generateRecipe, GeneratedRecipe } from './services/gemini';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: string;
  name: string;
  expirationDate: string; // YYYY-MM-DD
  quantity: number;
  unit: string;
  createdAt?: number;
  imageUrl?: string;
}

type SortOption = 'expiryAsc' | 'expiryDesc' | 'addedDesc' | 'addedAsc' | 'qtyDesc' | 'qtyAsc' | 'nameAsc' | 'nameDesc';

export default function App() {
  const [activeTab, setActiveTab] = useState<'add' | 'pantry' | 'recipe'>('pantry');
  
  const [products, setProducts] = useState<Product[]>(() => {
    const salvati = localStorage.getItem('miaDispensa');
    if (salvati) {
      return JSON.parse(salvati);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('miaDispensa', JSON.stringify(products));
  }, [products]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDate, setNewProductDate] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState<number | ''>('');
  const [newProductUnit, setNewProductUnit] = useState('g');
  const [servings, setServings] = useState<number>(2);
  const [useMicrowave, setUseMicrowave] = useState(false);
  const [useAirFryer, setUseAirFryer] = useState(false);
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [isRecipeConfirmed, setIsRecipeConfirmed] = useState(false);
  const [editedUsedProducts, setEditedUsedProducts] = useState<GeneratedRecipe['usedProducts']>([]);
  
  const [sortBy, setSortBy] = useState<SortOption>('expiryAsc');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'colazione' | 'pranzo' | 'cena' | 'spuntino' | null>(null);
  const [userPreferences, setUserPreferences] = useState('');

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductDate, setEditProductDate] = useState('');
  const [editProductQuantity, setEditProductQuantity] = useState<number | ''>('');
  const [editProductUnit, setEditProductUnit] = useState('g');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const dateA = new Date(a.expirationDate).getTime();
      const dateB = new Date(b.expirationDate).getTime();
      
      switch (sortBy) {
        case 'expiryAsc':
          return dateA - dateB;
        case 'expiryDesc':
          return dateB - dateA;
        case 'addedDesc':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'addedAsc':
          return (a.createdAt || 0) - (b.createdAt || 0);
        case 'qtyDesc':
          return b.quantity - a.quantity;
        case 'qtyAsc':
          return a.quantity - b.quantity;
        case 'nameAsc':
          return a.name.localeCompare(b.name);
        case 'nameDesc':
          return b.name.localeCompare(a.name);
        default:
          return dateA - dateB;
      }
    });
  }, [products, sortBy]);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductDate || newProductQuantity === '') return;

    const newProduct: Product = {
      id: uuidv4(),
      name: newProductName,
      expirationDate: newProductDate,
      quantity: Number(newProductQuantity),
      unit: newProductUnit,
      createdAt: Date.now(),
    };

    setProducts((prev) => [...prev, newProduct]);
    setNewProductName('');
    setNewProductDate('');
    setNewProductQuantity('');
    setNewProductUnit('g');
  };

  const addRandomProducts = () => {
    const sampleNames = ['Pasta', 'Riso', 'Uova', 'Latte', 'Pollo', 'Zucchine', 'Pomodori', 'Tonno', 'Olio', 'Sale', 'Zucchero', 'Farina', 'Burro', 'Formaggio', 'Mele', 'Patate', 'Cipolle', 'Carote', 'Piselli', 'Pane'];
    const units = ['g', 'kg', 'ml', 'l', 'pz', 'scatolette', 'confezioni'];
    
    const numProducts = Math.floor(Math.random() * 6) + 10; // 10 to 15
    const newRandomProducts: Product[] = [];
    
    for (let i = 0; i < numProducts; i++) {
      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const randomUnit = units[Math.floor(Math.random() * units.length)];
      
      let finalQuantity = Math.floor(Math.random() * 10) + 1;
      if (randomUnit === 'g' || randomUnit === 'ml') {
        finalQuantity = (Math.floor(Math.random() * 10) + 1) * 100;
      }

      const randomDays = Math.floor(Math.random() * 35) - 5;
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() + randomDays);
      const formattedDate = format(randomDate, 'yyyy-MM-dd');

      newRandomProducts.push({
        id: uuidv4(),
        name: `${randomName} ${Math.floor(Math.random() * 100)}`,
        expirationDate: formattedDate,
        quantity: finalQuantity,
        unit: randomUnit,
        createdAt: Date.now() - Math.floor(Math.random() * 10000000),
      });
    }

    setProducts(prev => [...prev, ...newRandomProducts]);
    setActiveTab('pantry');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setEditProductName(product.name);
    setEditProductDate(product.expirationDate);
    setEditProductQuantity(product.quantity);
    setEditProductUnit(product.unit);
  };

  const handleSaveEdit = () => {
    if (!editingProductId || !editProductName || !editProductDate || editProductQuantity === '') return;

    setProducts(prev => prev.map(p => 
      p.id === editingProductId 
        ? { ...p, name: editProductName, quantity: Number(editProductQuantity), unit: editProductUnit, expirationDate: editProductDate }
        : p
    ));
    setEditingProductId(null);
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
  };

  const openPreferencesModal = (mealType: 'colazione' | 'pranzo' | 'cena' | 'spuntino') => {
    if (products.length === 0) {
      setError("Per favore, aggiungi prima qualche prodotto.");
      return;
    }
    setSelectedMealType(mealType);
    setUserPreferences('');
    setShowPreferencesModal(true);
  };

  const handleGenerateRecipe = async () => {
    if (!selectedMealType) return;
    
    setShowPreferencesModal(false);
    setError(null);
    setIsGenerating(true);
    setRecipe(null);
    setIsRecipeConfirmed(false);

    try {
      const generated = await generateRecipe(sortedProducts, servings, selectedMealType, { microwave: useMicrowave, airFryer: useAirFryer }, userPreferences);
      setRecipe(generated);
      setEditedUsedProducts(generated.usedProducts || []);
      setIsEditingRecipe(false);
    } catch (err: any) {
      setError(err.message || "Impossibile generare la ricetta.");
    } finally {
      setIsGenerating(false);
      setSelectedMealType(null);
    }
  };

  const handleConfirmRecipe = () => {
    if (!recipe || isRecipeConfirmed) return;

    setProducts((prev) => {
      let updatedProducts = [...prev];
      
      editedUsedProducts.forEach((usedItem) => {
        const productIndex = updatedProducts.findIndex(p => p.id === usedItem.productId);
        if (productIndex !== -1) {
          const newQuantity = updatedProducts[productIndex].quantity - usedItem.quantity;
          if (newQuantity <= 0) {
            // Remove product if quantity is 0 or less
            updatedProducts.splice(productIndex, 1);
          } else {
            // Update quantity
            updatedProducts[productIndex] = {
              ...updatedProducts[productIndex],
              quantity: newQuantity
            };
          }
        }
      });

      return updatedProducts;
    });

    setIsRecipeConfirmed(true);
  };

  const handleEditedQuantityChange = (productId: string, newQuantity: string) => {
    const numValue = newQuantity === '' ? 0 : Number(newQuantity);
    setEditedUsedProducts(prev => 
      prev.map(item => 
        item.productId === productId ? { ...item, quantity: numValue } : item
      )
    );
  };

  const getExpiryColor = (dateString: string) => {
    const days = differenceInDays(parseISO(dateString), new Date());
    if (days < 0) return 'text-red-600 bg-red-50 border-red-200';
    if (days <= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (days <= 7) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getExpiryText = (dateString: string) => {
    const days = differenceInDays(parseISO(dateString), new Date());
    if (days < 0) return `Scaduto da ${Math.abs(days)} giorni`;
    if (days === 0) return 'Scade oggi';
    if (days === 1) return 'Scade domani';
    return `Scade tra ${days} giorni`;
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
              onClick={() => setActiveTab('add')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors",
                activeTab === 'add' 
                  ? "bg-stone-900 text-white" 
                  : "text-stone-600 hover:bg-stone-100"
              )}
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi</span>
            </button>
            <button
              onClick={() => setActiveTab('pantry')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors",
                activeTab === 'pantry' 
                  ? "bg-stone-900 text-white" 
                  : "text-stone-600 hover:bg-stone-100"
              )}
            >
              <Package className="w-4 h-4" />
              <span>Dispensa</span>
            </button>
            <button
              onClick={() => setActiveTab('recipe')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors",
                activeTab === 'recipe' 
                  ? "bg-stone-900 text-white" 
                  : "text-stone-600 hover:bg-stone-100"
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
                
                <form onSubmit={handleAddProduct} className="space-y-5">
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
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="l">l</option>
                          <option value="pz">pz</option>
                          <option value="scatolette">scatolette</option>
                          <option value="confezioni">confezioni</option>
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
                        disabled={isAnalyzing}
                      />
                      <button
                        type="button"
                        disabled={isAnalyzing}
                        className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3.5 sm:py-3 rounded-xl font-medium hover:bg-emerald-100 active:bg-emerald-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        {isAnalyzing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Camera className="w-5 h-5" />
                        )}
                        {isAnalyzing ? "Scansione in corso..." : "Scansiona Etichetta"}
                      </button>
                    </div>
                  </div>
                </form>

                {/* TEST BUTTON - TO BE REMOVED LATER */}
                <div className="mt-8 pt-6 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={addRandomProducts}
                    className="w-full bg-amber-100 text-amber-800 border border-amber-300 px-4 py-3 rounded-xl font-medium hover:bg-amber-200 active:bg-amber-300 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Package className="w-5 h-5" />
                    TEST: Aggiungi 10-15 Prodotti Casuali
                  </button>
                  <p className="text-xs text-amber-600/80 text-center mt-2">
                    Questo tasto è temporaneo e serve solo per testare la dispensa.
                  </p>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'pantry' && (
            <motion.div
              key="pantry"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <section className="pt-2 sm:pt-8">
                <div className="text-center mb-8">
                  <img src="/logo.png" alt="Chef da Dispensa Logo" className="w-16 h-16 rounded-2xl shadow-sm mx-auto mb-4 object-cover" referrerPolicy="no-referrer" />
                  <h2 className="text-2xl font-bold text-stone-900">La Tua Dispensa</h2>
                  <p className="text-stone-500 mt-1">Gestisci i tuoi ingredienti e le loro scadenze</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div className="flex flex-wrap items-center justify-between w-full gap-3">
                    {products.length > 0 && (
                      <div className="flex items-center gap-3 flex-1">
                        <div className="relative flex-1 min-w-[150px]">
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="w-full appearance-none bg-white border border-stone-200 text-stone-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium shadow-sm"
                          >
                            <option value="expiryAsc">Scadenza: Più vicina</option>
                            <option value="expiryDesc">Scadenza: Più lontana</option>
                            <option value="addedDesc">Aggiunti di recente</option>
                            <option value="addedAsc">Aggiunti meno di recente</option>
                            <option value="qtyDesc">Quantità: Maggiore</option>
                            <option value="qtyAsc">Quantità: Minore</option>
                            <option value="nameAsc">Nome: A-Z</option>
                            <option value="nameDesc">Nome: Z-A</option>
                          </select>
                          <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                        </div>
                        <button
                          onClick={() => setShowClearConfirm(true)}
                          className="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center border border-red-100 shrink-0"
                          title="Svuota dispensa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <span className="text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl whitespace-nowrap shrink-0">
                      {products.length} {products.length === 1 ? 'prodotto' : 'prodotti'}
                    </span>
                  </div>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-16 text-stone-500 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                    <Package className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                    <p className="text-stone-900 font-medium text-lg">La dispensa è vuota</p>
                    <p className="text-sm mt-1 max-w-sm mx-auto">
                      Vai alla sezione "Aggiungi" per inserire i tuoi primi prodotti.
                    </p>
                    <button 
                      onClick={() => setActiveTab('add')}
                      className="mt-6 bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors"
                    >
                      Aggiungi Prodotto
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    <AnimatePresence>
                      {sortedProducts.map((product) => (
                        <motion.li
                          key={product.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-4 rounded-xl border border-stone-200 bg-white hover:border-emerald-200 hover:shadow-sm transition-all group"
                        >
                          {editingProductId === product.id ? (
                            <div className="w-full space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-stone-500 mb-1">Nome</label>
                                  <input
                                    type="text"
                                    value={editProductName}
                                    onChange={(e) => setEditProductName(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-stone-500 mb-1">Scadenza</label>
                                  <input
                                    type="date"
                                    value={editProductDate}
                                    onChange={(e) => setEditProductDate(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                  />
                                </div>
                              </div>
                              <div className="flex items-end gap-3">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-stone-500 mb-1">Quantità</label>
                                  <input
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    value={editProductQuantity}
                                    onChange={(e) => setEditProductQuantity(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                  />
                                </div>
                                <div className="w-24">
                                  <label className="block text-xs font-medium text-stone-500 mb-1">Unità</label>
                                  <select
                                    value={editProductUnit}
                                    onChange={(e) => setEditProductUnit(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none"
                                  >
                                    <option value="g">g</option>
                                    <option value="kg">kg</option>
                                    <option value="ml">ml</option>
                                    <option value="l">l</option>
                                    <option value="pz">pz</option>
                                    <option value="scatolette">scatolette</option>
                                    <option value="confezioni">confezioni</option>
                                  </select>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-3 border-t border-stone-100">
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                  Annulla
                                </button>
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={!editProductName || !editProductDate || editProductQuantity === ''}
                                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50"
                                >
                                  <Check className="w-4 h-4" />
                                  Salva
                                </button>
                              </div>
                            </div>
                          ) : (
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
                                <span className={cn("text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap", getExpiryColor(product.expirationDate))}>
                                  {getExpiryText(product.expirationDate)}
                                </span>
                                <span className="text-sm text-stone-500 capitalize flex items-center gap-1 whitespace-nowrap">
                                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                                  {format(parseISO(product.expirationDate), 'd MMM yyyy', { locale: it })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 pt-3 border-t border-stone-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditProduct(product)}
                                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-100"
                                >
                                  <Pencil className="w-4 h-4" />
                                  Modifica
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Elimina
                                </button>
                              </div>
                            </div>
                          )}
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </section>
            </motion.div>
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
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 sm:w-4 sm:h-4 text-stone-500" />
                        <label htmlFor="servings" className="text-stone-700 font-medium">Persone:</label>
                        <input
                          type="number"
                          id="servings"
                          min="1"
                          max="20"
                          value={servings}
                          onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                          className="w-16 bg-white border border-stone-200 rounded-lg px-2 py-1 text-center font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={useMicrowave}
                            onChange={(e) => setUseMicrowave(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                          />
                          <span className="text-sm font-medium text-stone-700">Microonde</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={useAirFryer}
                            onChange={(e) => setUseAirFryer(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                          />
                          <span className="text-sm font-medium text-stone-700">Friggitrice ad aria</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-200">
                      <button
                        onClick={() => openPreferencesModal('colazione')}
                        disabled={isGenerating || products.length === 0}
                        className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-3 sm:py-2.5 rounded-xl font-medium hover:bg-amber-200 active:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 shadow-sm text-sm sm:text-base"
                      >
                        {isGenerating && selectedMealType === 'colazione' ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <Coffee className="w-5 h-5 sm:w-4 sm:h-4" />}
                        Colazione
                      </button>
                      <button
                        onClick={() => openPreferencesModal('spuntino')}
                        disabled={isGenerating || products.length === 0}
                        className="bg-orange-100 text-orange-800 border border-orange-200 px-3 py-3 sm:py-2.5 rounded-xl font-medium hover:bg-orange-200 active:bg-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 shadow-sm text-sm sm:text-base"
                      >
                        {isGenerating && selectedMealType === 'spuntino' ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <Package className="w-5 h-5 sm:w-4 sm:h-4" />}
                        Spuntino
                      </button>
                      <button
                        onClick={() => openPreferencesModal('pranzo')}
                        disabled={isGenerating || products.length === 0}
                        className="bg-emerald-600 text-white px-3 py-3 sm:py-2.5 rounded-xl font-medium hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 shadow-sm shadow-emerald-600/20 text-sm sm:text-base"
                      >
                        {isGenerating && selectedMealType === 'pranzo' ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <Utensils className="w-5 h-5 sm:w-4 sm:h-4" />}
                        Pranzo
                      </button>
                      <button
                        onClick={() => openPreferencesModal('cena')}
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
                            {editedUsedProducts.map((item) => (
                              <div key={item.productId} className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                                <span className="font-medium text-stone-700">{item.name}</span>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number" 
                                    min="0"
                                    step="0.1"
                                    value={item.quantity === 0 ? '' : item.quantity}
                                    onChange={(e) => handleEditedQuantityChange(item.productId, e.target.value)}
                                    className="w-20 px-2 py-1.5 border border-stone-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  />
                                  <span className="text-stone-500 text-sm w-8">{item.unit}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <ul className="space-y-2 mb-6">
                            {editedUsedProducts.map((item) => (
                              <li key={item.productId} className="flex justify-between text-stone-700 bg-white p-3 rounded-xl border border-stone-100">
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
                                onClick={handleConfirmRecipe}
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
          onClick={() => setActiveTab('pantry')}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
            activeTab === 'pantry' ? "text-emerald-600" : "text-stone-500 hover:text-stone-900"
          )}
        >
          <Package className={cn("w-6 h-6", activeTab === 'pantry' && "fill-emerald-50")} />
          <span className="text-[10px] font-medium">Dispensa</span>
        </button>
        
        <button
          onClick={() => setActiveTab('add')}
          className="relative -top-5 flex flex-col items-center justify-center"
        >
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-white transition-transform active:scale-95",
            activeTab === 'add' ? "bg-emerald-600" : "bg-emerald-500"
          )}>
            <Plus className="w-7 h-7" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('recipe')}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
            activeTab === 'recipe' ? "text-emerald-600" : "text-stone-500 hover:text-stone-900"
          )}
        >
          <Utensils className={cn("w-6 h-6", activeTab === 'recipe' && "fill-emerald-50")} />
          <span className="text-[10px] font-medium">Ricette</span>
        </button>
      </nav>

      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
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
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={() => {
                    setProducts([]);
                    setShowClearConfirm(false);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20"
                >
                  Svuota
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showPreferencesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 mx-auto">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-center text-stone-900 mb-2">Qualche preferenza?</h3>
              <p className="text-center text-stone-600 mb-6 text-sm">
                Hai voglia di qualcosa in particolare? Aggiungi dei dettagli per aiutare lo Chef a creare la ricetta perfetta per te.
              </p>
              
              <textarea
                value={userPreferences}
                onChange={(e) => setUserPreferences(e.target.value)}
                placeholder="Es. Vorrei qualcosa di leggero, ho voglia di piccante, non usare i latticini..."
                className="w-full h-32 p-3 border border-stone-200 rounded-xl bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none mb-6 text-sm"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreferencesModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleGenerateRecipe}
                  disabled={isGenerating}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Utensils className="w-5 h-5" />}
                  Genera
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
