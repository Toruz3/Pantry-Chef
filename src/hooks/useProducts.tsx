import { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Product, Category, CATEGORIES } from '../types';
import { SortOption } from '../constants/sortOptions';
import { PRODUCT_UNITS } from '../constants/units';
import { categorizeProduct } from '../services/gemini';
import { haptics } from '../utils/haptics';
import { showUndoToast } from '../utils/undoToast';
import { useProductFilters } from './useProductFilters';
import toast from 'react-hot-toast';

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
    const q = query(collection(db, 'products'), where('householdId', '==', householdId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedProducts: Product[] = [];
      snapshot.forEach((doc) => {
        loadedProducts.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(loadedProducts);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [householdId]);

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

      const newProduct = {
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

      await addDoc(collection(db, 'products'), newProduct);
      
      haptics.success();
      if (onSuccess) onSuccess();
    } catch (err) {
      if (onError) onError("Errore durante l'aggiunta del prodotto.");
      handleFirestoreError(err, OperationType.CREATE, 'products');
    } finally {
      setIsCategorizing(false);
    }
  };

  const addProducts = async (newProducts: Omit<Product, 'id'>[]) => {
    if (!householdId) return;
    try {
      const batch = writeBatch(db);
      newProducts.forEach(p => {
        const docRef = doc(collection(db, 'products'));
        batch.set(docRef, {
          ...p,
          householdId,
          location: p.location || 'dispensa',
          addedAt: new Date().toISOString()
        });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!householdId) return;
    haptics.medium();
    const productToDelete = products.find(p => p.id === id);
    if (!productToDelete) return;

    showUndoToast('Prodotto eliminato', async () => {
      try {
        await setDoc(doc(db, 'products', id), productToDelete);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `products/${id}`);
      }
    });

    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleConsumeProduct = async (id: string, quantityToConsume: number = 1) => {
    if (!householdId) return;
    haptics.success();
    try {
      const product = products.find(p => p.id === id);
      if (!product) return;
      
      const newQuantity = product.quantity - quantityToConsume;
      const originalQuantity = product.quantity;

      showUndoToast('Prodotto consumato', async () => {
        try {
          if (newQuantity <= 0) {
            await setDoc(doc(db, 'products', id), product);
          } else {
            await updateDoc(doc(db, 'products', id), { quantity: originalQuantity });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
        }
      });

      if (newQuantity <= 0) {
        await deleteDoc(doc(db, 'products', id));
      } else {
        await updateDoc(doc(db, 'products', id), { quantity: newQuantity });
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const handleWasteProduct = async (id: string, quantityToWaste: number = 1) => {
    if (!householdId) return;
    haptics.medium();
    try {
      const product = products.find(p => p.id === id);
      if (!product) return;
      
      const newQuantity = product.quantity - quantityToWaste;
      const originalQuantity = product.quantity;

      showUndoToast('Prodotto buttato', async () => {
        try {
          if (newQuantity <= 0) {
            await setDoc(doc(db, 'products', id), product);
          } else {
            await updateDoc(doc(db, 'products', id), { quantity: originalQuantity });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
        }
      });

      if (newQuantity <= 0) {
        await deleteDoc(doc(db, 'products', id));
      } else {
        await updateDoc(doc(db, 'products', id), { quantity: newQuantity });
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const consumeProducts = async (usedProducts: { productId: string; quantity: number }[]) => {
    if (!householdId) return;
    try {
      const batch = writeBatch(db);
      for (const usedItem of usedProducts) {
        const product = products.find(p => p.id === usedItem.productId);
        if (product) {
          const newQty = product.quantity - usedItem.quantity;
          const docRef = doc(db, 'products', product.id);
          if (newQty <= 0) {
            batch.delete(docRef);
          } else {
            batch.update(docRef, { quantity: newQty });
          }
        }
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'products');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
  };

  const handleSaveEdit = async (id: string, updatedProduct: Partial<Product>) => {
    if (!id || !householdId) return;

    haptics.success();
    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, {
        ...updatedProduct,
        isEstimate: false
      });
      setEditingProductId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
  };

  const clearProducts = async () => {
    if (!householdId) return;
    haptics.heavy();
    try {
      const batch = writeBatch(db);
      products.forEach(p => {
        batch.delete(doc(db, 'products', p.id));
      });
      await batch.commit();
      setShowClearConfirm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'products');
    }
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
