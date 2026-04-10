import { create } from 'zustand';
import { Product } from '../types';
import { Settings } from '../hooks/useSettings';

interface AppState {
  // Products
  products: Product[];
  setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void;
  isLoadingProducts: boolean;
  setIsLoadingProducts: (loading: boolean) => void;
  
  // Settings
  settings: Settings | null;
  setSettings: (settings: Settings | null) => void;
  
  // Stats
  stats: any;
  setStats: (stats: any) => void;
}

export const useStore = create<AppState>((set) => ({
  products: [],
  setProducts: (updater) => set((state) => ({
    products: typeof updater === 'function' ? updater(state.products) : updater
  })),
  isLoadingProducts: true,
  setIsLoadingProducts: (loading) => set({ isLoadingProducts: loading }),
  
  settings: null,
  setSettings: (settings) => set({ settings }),
  
  stats: null,
  setStats: (stats) => set({ stats }),
}));
