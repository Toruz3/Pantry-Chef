export interface Product {
  id: string;
  name: string;
  expirationDate: string; // YYYY-MM-DD
  quantity: number;
  unit: string;
  category?: string;
  createdAt?: number;
  imageUrl?: string;
}

export interface ExtractedProduct {
  name: string;
  expirationDate: string | null;
  category?: string;
}

export interface AudioExtractedProduct {
  name: string;
  quantity: number;
  unit: string;
  expirationDate: string | null;
  category?: string;
}

export interface UsedProduct {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface GeneratedRecipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  servings: number;
  usedProducts: UsedProduct[];
  imageUrl?: string;
}

export const CATEGORIES = [
  'Latticini',
  'Carne e Pesce',
  'Frutta e Verdura',
  'Dispensa Secca',
  'Surgelati',
  'Bevande',
  'Snack e Dolci',
  'Altro'
] as const;

export type Category = typeof CATEGORIES[number];

export const CATEGORY_EMOJIS: Record<Category, string> = {
  'Latticini': '🧀',
  'Carne e Pesce': '🥩',
  'Frutta e Verdura': '🥗',
  'Dispensa Secca': '🍝',
  'Surgelati': '❄️',
  'Bevande': '🧃',
  'Snack e Dolci': '🍪',
  'Altro': '📦'
};
