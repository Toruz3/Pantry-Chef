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
import toast from 'react-hot-toast';

export function useProducts() {
  const { householdId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!householdId) {
      setProducts([]);
      return;
    }

    const q = query(collection(db, 'products'), where('householdId', '==', householdId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedProducts: Product[] = [];
      snapshot.forEach((doc) => {
        loadedProducts.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(loadedProducts);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    return () => unsubscribe();
  }, [householdId]);

  const [sortBy, setSortBy] = useState<SortOption>(SortOption.ExpiryAsc);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const dateA = new Date(a.expirationDate).getTime();
      const dateB = new Date(b.expirationDate).getTime();
      
      switch (sortBy) {
        case SortOption.ExpiryAsc:
          return dateA - dateB;
        case SortOption.ExpiryDesc:
          return dateB - dateA;
        case SortOption.AddedDesc:
          return (b.createdAt || 0) - (a.createdAt || 0);
        case SortOption.AddedAsc:
          return (a.createdAt || 0) - (b.createdAt || 0);
        case SortOption.QtyDesc:
          return b.quantity - a.quantity;
        case SortOption.QtyAsc:
          return a.quantity - b.quantity;
        case SortOption.NameAsc:
          return a.name.localeCompare(b.name);
        case SortOption.NameDesc:
          return b.name.localeCompare(a.name);
        default:
          return dateA - dateB;
      }
    });
  }, [products, sortBy]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    CATEGORIES.forEach(cat => {
      groups[cat] = [];
    });
    
    sortedProducts.forEach(product => {
      const cat = product.category && CATEGORIES.includes(product.category as Category) ? product.category : 'Altro';
      groups[cat].push(product);
    });
    
    return groups;
  }, [sortedProducts]);

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

    toast((t) => (
      <div className="flex items-center justify-between w-full gap-4">
        <span>Prodotto eliminato</span>
        <button
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              await setDoc(doc(db, 'products', id), productToDelete);
              toast.success('Azione annullata', { duration: 2000 });
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, `products/${id}`);
            }
          }}
          className="text-emerald-400 hover:text-emerald-300 font-medium text-sm px-2 py-1 rounded-md hover:bg-emerald-400/10 transition-colors"
        >
          Annulla
        </button>
      </div>
    ), { duration: 2500 });

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

      toast((t) => (
        <div className="flex items-center justify-between w-full gap-4">
          <span>Prodotto consumato</span>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                if (newQuantity <= 0) {
                  await setDoc(doc(db, 'products', id), product);
                } else {
                  await updateDoc(doc(db, 'products', id), { quantity: originalQuantity });
                }
                toast.success('Azione annullata', { duration: 2000 });
              } catch (error) {
                handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
              }
            }}
            className="text-emerald-400 hover:text-emerald-300 font-medium text-sm px-2 py-1 rounded-md hover:bg-emerald-400/10 transition-colors"
          >
            Annulla
          </button>
        </div>
      ), { duration: 2500 });

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

      toast((t) => (
        <div className="flex items-center justify-between w-full gap-4">
          <span>Prodotto buttato</span>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                if (newQuantity <= 0) {
                  await setDoc(doc(db, 'products', id), product);
                } else {
                  await updateDoc(doc(db, 'products', id), { quantity: originalQuantity });
                }
                toast.success('Azione annullata', { duration: 2000 });
              } catch (error) {
                handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
              }
            }}
            className="text-emerald-400 hover:text-emerald-300 font-medium text-sm px-2 py-1 rounded-md hover:bg-emerald-400/10 transition-colors"
          >
            Annulla
          </button>
        </div>
      ), { duration: 2500 });

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
