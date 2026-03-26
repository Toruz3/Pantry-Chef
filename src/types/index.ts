export interface Product {
  id: string;
  householdId?: string;
  name: string;
  expirationDate: string; // YYYY-MM-DD
  quantity: number;
  unit: string;
  category?: string;
  location?: string;
  createdAt?: number;
  addedAt?: string;
  imageUrl?: string;
  isEstimate?: boolean;
}

export interface ExtractedProduct {
  name: string;
  expirationDate: string | null;
  category?: string;
}

export interface AudioExtractedProduct {
  name: string;
  quantity: number | '';
  unit: string | '';
  expirationDate: string | null;
  category?: string;
  isEstimate?: boolean;
}

export interface ReceiptExtractedProduct {
  name: string;
  quantity: number;
  unit: string;
  expirationDate: string;
  category: string;
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

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  xpReward: number;
  isCompleted: boolean;
  expiresAt: number; // timestamp
}

export interface UserStats {
  itemsConsumed: number;
  itemsWasted: number;
  currentStreak: number;
  bestStreak: number;
  lastActionDate: string | null;
  badges: Badge[];
  weeklyChallenges?: WeeklyChallenge[];
  moneySaved?: number;
  wasteByCategory?: Record<string, number>;
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
