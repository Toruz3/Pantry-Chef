import { useMemo, useState } from 'react';
import { Product, Category, CATEGORIES } from '../types';
import { SortOption } from '../constants/sortOptions';

export function useProductFilters(products: Product[]) {
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.ExpiryAsc);

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

  return {
    sortBy,
    setSortBy,
    sortedProducts,
    groupedProducts
  };
}

