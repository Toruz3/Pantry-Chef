import { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { Product, Category, CATEGORIES } from '../types';
import { SortOption } from '../constants/sortOptions';
import { PRODUCT_UNITS } from '../constants/units';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => {
    const salvatiV1 = localStorage.getItem('miaDispensa_v1');
    if (salvatiV1) {
      return JSON.parse(salvatiV1);
    }
    
    // Migration from old version
    const salvatiOld = localStorage.getItem('miaDispensa');
    if (salvatiOld) {
      const parsed = JSON.parse(salvatiOld);
      localStorage.setItem('miaDispensa_v1', salvatiOld);
      localStorage.removeItem('miaDispensa');
      return parsed;
    }
    
    return [];
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('miaDispensa_v1', JSON.stringify(products));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [products]);

  const [sortBy, setSortBy] = useState<SortOption>(SortOption.ExpiryAsc);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [newProductName, setNewProductName] = useState('');
  const [newProductDate, setNewProductDate] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState<number | ''>('');
  const [newProductUnit, setNewProductUnit] = useState('g');
  const [newProductCategory, setNewProductCategory] = useState<string>('Altro');

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductDate, setEditProductDate] = useState('');
  const [editProductQuantity, setEditProductQuantity] = useState<number | ''>('');
  const [editProductUnit, setEditProductUnit] = useState('g');
  const [editProductCategory, setEditProductCategory] = useState<string>('Altro');

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

  const handleAddProduct = (e?: React.FormEvent, onSuccess?: () => void, onError?: (msg: string) => void) => {
    if (e) e.preventDefault();
    
    const trimmedName = newProductName.trim();
    if (!trimmedName) {
      if (onError) onError("Il nome del prodotto non può essere vuoto.");
      return;
    }
    if (trimmedName.length > 100) {
      if (onError) onError("Il nome del prodotto non può superare i 100 caratteri.");
      return;
    }
    
    if (!newProductDate) {
      if (onError) onError("Seleziona una data di scadenza.");
      return;
    }

    const selectedDate = new Date(newProductDate);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    if (selectedDate < twoYearsAgo) {
      if (onError) onError("La data di scadenza non può essere anteriore di più di 2 anni rispetto ad oggi.");
      return;
    }

    if (newProductQuantity === '') {
      if (onError) onError("Inserisci una quantità.");
      return;
    }

    const newProduct: Product = {
      id: uuidv4(),
      name: trimmedName,
      expirationDate: newProductDate,
      quantity: Number(newProductQuantity),
      unit: newProductUnit,
      category: newProductCategory,
      createdAt: Date.now(),
    };

    setProducts((prev) => [...prev, newProduct]);
    setNewProductName('');
    setNewProductDate('');
    setNewProductQuantity('');
    setNewProductUnit('g');
    setNewProductCategory('Altro');
    if (onSuccess) onSuccess();
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
    setEditProductCategory(product.category || 'Altro');
  };

  const handleSaveEdit = () => {
    if (!editingProductId || !editProductName || !editProductDate || editProductQuantity === '') return;

    setProducts(prev => prev.map(p => 
      p.id === editingProductId 
        ? { ...p, name: editProductName, quantity: Number(editProductQuantity), unit: editProductUnit, expirationDate: editProductDate, category: editProductCategory }
        : p
    ));
    setEditingProductId(null);
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
  };

  const clearProducts = () => {
    setProducts([]);
    setShowClearConfirm(false);
  };

  return {
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
  };
}
