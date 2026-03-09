import React, { useState, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { Camera, Plus, Trash2, ChefHat, Loader2, Calendar, Image as ImageIcon, Users, Package, Utensils } from 'lucide-react';
import { analyzeProductImage, generateRecipe, GeneratedRecipe } from './services/gemini';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: string;
  name: string;
  expirationDate: string; // YYYY-MM-DD
  imageUrl?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'add' | 'pantry' | 'recipe'>('pantry');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDate, setNewProductDate] = useState('');
  const [servings, setServings] = useState<number>(2);
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const dateA = new Date(a.expirationDate).getTime();
      const dateB = new Date(b.expirationDate).getTime();
      return dateA - dateB;
    });
  }, [products]);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductDate) return;

    const newProduct: Product = {
      id: uuidv4(),
      name: newProductName,
      expirationDate: newProductDate,
    };

    setProducts((prev) => [...prev, newProduct]);
    setNewProductName('');
    setNewProductDate('');
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

  const handleGenerateRecipe = async () => {
    if (products.length === 0) {
      setError("Per favore, aggiungi prima qualche prodotto.");
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    setRecipe(null);

    try {
      const generated = await generateRecipe(sortedProducts, servings);
      setRecipe(generated);
    } catch (err: any) {
      setError(err.message || "Impossibile generare la ricetta.");
    } finally {
      setIsGenerating(false);
    }
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
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-200">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
              <ChefHat className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight hidden sm:block">Chef da Dispensa</h1>
          </div>
          
          <nav className="flex gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('add')}
              className={cn(
                "px-3 sm:px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors",
                activeTab === 'add' 
                  ? "bg-stone-900 text-white" 
                  : "text-stone-600 hover:bg-stone-100"
              )}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Aggiungi</span>
            </button>
            <button
              onClick={() => setActiveTab('pantry')}
              className={cn(
                "px-3 sm:px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors",
                activeTab === 'pantry' 
                  ? "bg-stone-900 text-white" 
                  : "text-stone-600 hover:bg-stone-100"
              )}
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Dispensa</span>
            </button>
            <button
              onClick={() => setActiveTab('recipe')}
              className={cn(
                "px-3 sm:px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors",
                activeTab === 'recipe' 
                  ? "bg-stone-900 text-white" 
                  : "text-stone-600 hover:bg-stone-100"
              )}
            >
              <Utensils className="w-4 h-4" />
              <span className="hidden sm:inline">Ricette</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <section className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-8">
                <div className="text-center mb-8">
                  <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
                    <Plus className="w-6 h-6" />
                  </div>
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
                        className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                      />
                    </div>
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-stone-700 mb-1">Data di Scadenza</label>
                      <input
                        type="date"
                        id="date"
                        value={newProductDate}
                        onChange={(e) => setNewProductDate(e.target.value)}
                        className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-100">
                    <button
                      type="submit"
                      disabled={!newProductName || !newProductDate}
                      className="flex-1 bg-stone-900 text-white px-4 py-3 rounded-xl font-medium hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
                        className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3 rounded-xl font-medium hover:bg-emerald-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
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
              <section className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-stone-900">La Tua Dispensa</h2>
                    <p className="text-sm text-stone-500 mt-1">Gestisci i tuoi ingredienti e le loro scadenze</p>
                  </div>
                  <span className="text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    {products.length} {products.length === 1 ? 'prodotto' : 'prodotti'}
                  </span>
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
                          className="flex items-center justify-between p-4 rounded-xl border border-stone-200 bg-white hover:border-emerald-200 hover:shadow-sm transition-all group"
                        >
                          <div>
                            <p className="font-semibold text-stone-900 text-lg">{product.name}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className={cn("text-xs px-2.5 py-1 rounded-full border font-medium", getExpiryColor(product.expirationDate))}>
                                {getExpiryText(product.expirationDate)}
                              </span>
                              <span className="text-sm text-stone-500 capitalize flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(parseISO(product.expirationDate), 'd MMM yyyy', { locale: it })}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label="Elimina prodotto"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
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
              <section className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Genera Ricetta</h2>
                    <p className="text-sm text-stone-500">
                      Ottieni una ricetta usando i tuoi ingredienti in scadenza.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                      <Users className="w-4 h-4 text-stone-500" />
                      <label htmlFor="servings" className="sr-only">Porzioni</label>
                      <input
                        type="number"
                        id="servings"
                        min="1"
                        max="20"
                        value={servings}
                        onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                        className="w-12 bg-transparent text-center font-medium focus:outline-none"
                      />
                      <span className="text-sm text-stone-500">persone</span>
                    </div>
                    <button
                      onClick={handleGenerateRecipe}
                      disabled={isGenerating || products.length === 0}
                      className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm shadow-emerald-600/20"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cucinando...
                        </>
                      ) : (
                        <>
                          <ChefHat className="w-4 h-4" />
                          Genera
                        </>
                      )}
                    </button>
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
                  </motion.div>
                ) : (
                  <div className="text-center py-16 text-stone-500 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                    <ChefHat className="w-16 h-16 mx-auto mb-4 text-stone-300" />
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
    </div>
  );
}
