import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';
import { categorizeProduct } from '../services/gemini';
import { haptics } from '../utils/haptics';
import { showUndoToast } from '../utils/undoToast';
import { useProductFilters } from './useProductFilters';

export function useProducts() {
  const { householdId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!householdId) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const storedProducts = localStorage.getItem(`products_${householdId}`);
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    } else {
      setProducts([]);
    }
    setIsLoading(false);
  }, [householdId]);

  // Save products to local storage whenever they change
  useEffect(() => {
    if (householdId && !isLoading) {
      localStorage.setItem(`products_${householdId}`, JSON.stringify(products));
    }
  }, [products, householdId, isLoading]);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const { sortBy, setSortBy, sortedProducts, groupedProducts } = useProductFilters(products);

  const addProduct = async (
    productData: {
      name: string;
      expirationDate: string;
      quantity: number;
      unit: string;
    },
    onSuccess?: () => void,
    onError?: (msg: string) => void
  ) => {
    const trimmedName = productData.name.trim();
    if (!trimmedName) {
      if (onError) onError("Il nome del prodotto non può essere vuoto.");
      return;
    }
    if (trimmedName.length > 100) {
      if (onError) onError("Il nome del prodotto non può superare i 100 caratteri.");
      return;
    }
    
    if (!productData.expirationDate) {
      if (onError) onError("Seleziona una data di scadenza.");
      return;
    }

    const selectedDate = new Date(productData.expirationDate);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    if (selectedDate < twoYearsAgo) {
      if (onError) onError("La data di scadenza non può essere anteriore di più di 2 anni rispetto ad oggi.");
      return;
    }

    if (productData.quantity === undefined || productData.quantity === null || isNaN(productData.quantity)) {
      if (onError) onError("Inserisci una quantità.");
      return;
    }

    if (!householdId) {
      if (onError) onError("Errore: nessun nucleo familiare selezionato.");
      return;
    }

    setIsCategorizing(true);
    try {
      const category = await categorizeProduct(trimmedName);

      const newProduct: Product = {
        id: uuidv4(),
        householdId,
        name: trimmedName,
        expirationDate: productData.expirationDate,
        quantity: Number(productData.quantity),
        unit: productData.unit,
        category: category,
        location: 'dispensa',
        createdAt: Date.now(),
        addedAt: new Date().toISOString()
      };

      setProducts(prev => [...prev, newProduct]);
      
      haptics.success();
      if (onSuccess) onSuccess();
    } catch (err) {
      if (onError) onError("Errore durante l'aggiunta del prodotto.");
      console.error(err);
    } finally {
      setIsCategorizing(false);
    }
  };

  const addProducts = async (newProducts: Omit<Product, 'id'>[]) => {
    if (!householdId) return;
    const productsToAdd = newProducts.map(p => ({
      ...p,
      id: uuidv4(),
      householdId,
      location: p.location || 'dispensa',
      addedAt: new Date().toISOString()
    }));
    setProducts(prev => [...prev, ...productsToAdd]);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!householdId) return;
    haptics.medium();
    const productToDelete = products.find(p => p.id === id);
    if (!productToDelete) return;

    setProducts(prev => prev.filter(p => p.id !== id));

    showUndoToast('Prodotto eliminato', async () => {
      setProducts(prev => [...prev, productToDelete]);
    });
  };

  const handleConsumeProduct = async (id: string, quantityToConsume: number = 1) => {
    if (!householdId) return;
    haptics.success();
    
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const newQuantity = product.quantity - quantityToConsume;
    const originalQuantity = product.quantity;

    if (newQuantity <= 0) {
      setProducts(prev => prev.filter(p => p.id !== id));
    } else {
      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, quantity: newQuantity } : p
      ));
    }

    showUndoToast('Prodotto consumato', async () => {
      if (newQuantity <= 0) {
        setProducts(prev => [...prev, product]);
      } else {
        setProducts(prev => prev.map(p => 
          p.id === id ? { ...p, quantity: originalQuantity } : p
        ));
      }
    });
  };

  const handleWasteProduct = async (id: string, quantityToWaste: number = 1) => {
    if (!householdId) return;
    haptics.medium();
    
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const newQuantity = product.quantity - quantityToWaste;
    const originalQuantity = product.quantity;

    if (newQuantity <= 0) {
      setProducts(prev => prev.filter(p => p.id !== id));
    } else {
      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, quantity: newQuantity } : p
      ));
    }

    showUndoToast('Prodotto buttato', async () => {
      if (newQuantity <= 0) {
        setProducts(prev => [...prev, product]);
      } else {
        setProducts(prev => prev.map(p => 
          p.id === id ? { ...p, quantity: originalQuantity } : p
        ));
      }
    });
  };

  const consumeProducts = async (usedProducts: { productId: string; quantity: number }[]) => {
    if (!householdId) return;
    
    setProducts(prev => {
      let next = [...prev];
      for (const usedItem of usedProducts) {
        const productIndex = next.findIndex(p => p.id === usedItem.productId);
        if (productIndex !== -1) {
          const product = next[productIndex];
          const newQty = product.quantity - usedItem.quantity;
          if (newQty <= 0) {
            next.splice(productIndex, 1);
          } else {
            next[productIndex] = { ...product, quantity: newQty };
          }
        }
      }
      return next;
    });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
  };

  const handleSaveEdit = async (id: string, updatedProduct: Partial<Product>) => {
    if (!id || !householdId) return;

    haptics.success();
    
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updatedProduct, isEstimate: false } : p
    ));
    setEditingProductId(null);
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
  };

  const clearProducts = async () => {
    if (!householdId) return;
    haptics.heavy();
    
    const originalProducts = [...products];
    
    setProducts([]);
    setShowClearConfirm(false);
  };

  return {
    products,
    isLoading,
    addProducts,
    sortBy,
    setSortBy,
    showClearConfirm,
    setShowClearConfirm,
    isCategorizing,
    editingProductId,
    sortedProducts,
    groupedProducts,
    addProduct,
    handleDeleteProduct,
    handleConsumeProduct,
    handleWasteProduct,
    consumeProducts,
    handleEditProduct,
    handleSaveEdit,
    handleCancelEdit,
    clearProducts
  };
}
