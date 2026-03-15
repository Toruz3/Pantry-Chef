import { useState } from 'react';
import { Product, GeneratedRecipe } from '../types';
import { generateRecipe } from '../services/gemini';

export function useRecipe(setProducts: React.Dispatch<React.SetStateAction<Product[]>>) {
  const [recipe, setRecipe]                 = useState<GeneratedRecipe | null>(null);
  const [isGenerating, setIsGenerating]     = useState(false);
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [isRecipeConfirmed, setIsRecipeConfirmed] = useState(false);
  const [editedUsedProducts, setEditedUsedProducts] = useState<GeneratedRecipe['usedProducts']>([]);

  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [selectedMealType, setSelectedMealType] =
    useState<'colazione' | 'pranzo' | 'cena' | 'spuntino' | null>(null);

  // Guard lives in the caller (App.tsx); hook just opens the modal.
  const openPreferencesModal = (mealType: 'colazione' | 'pranzo' | 'cena' | 'spuntino') => {
    setSelectedMealType(mealType);
    setShowPreferencesModal(true);
  };

  const handleGenerateRecipe = async (
    sortedProducts: Product[],
    servings: number,
    useMicrowave: boolean,
    useAirFryer: boolean,
    userPreferences: string,          // ← now a real parameter, not stale state
    setError: (msg: string) => void
  ) => {
    if (!selectedMealType) return;

    setShowPreferencesModal(false);
    setIsGenerating(true);
    setRecipe(null);
    setIsRecipeConfirmed(false);

    try {
      const generated = await generateRecipe(
        sortedProducts,
        servings,
        selectedMealType,
        { microwave: useMicrowave, airFryer: useAirFryer },
        userPreferences,
        false
      );
      setRecipe(generated);
      setEditedUsedProducts(generated.usedProducts || []);
      setIsEditingRecipe(false);
    } catch (err: any) {
      setError(err.message || 'Impossibile generare la ricetta.');
    } finally {
      setIsGenerating(false);
      setSelectedMealType(null);
    }
  };

  const handleConfirmRecipe = () => {
    if (!recipe || isRecipeConfirmed) return;

    setProducts(prev => {
      const updated = [...prev];
      editedUsedProducts.forEach(usedItem => {
        const idx = updated.findIndex(p => p.id === usedItem.productId);
        if (idx !== -1) {
          const newQty = updated[idx].quantity - usedItem.quantity;
          if (newQty <= 0) updated.splice(idx, 1);
          else updated[idx] = { ...updated[idx], quantity: newQty };
        }
      });
      return updated;
    });

    setIsRecipeConfirmed(true);
  };

  const handleEditedQuantityChange = (index: number, newQuantity: string) => {
    const num = newQuantity === '' ? 0 : Number(newQuantity);
    setEditedUsedProducts(prev =>
      prev.map((item, i) => (i === index ? { ...item, quantity: num } : item))
    );
  };

  return {
    recipe, setRecipe,
    isGenerating,
    isEditingRecipe, setIsEditingRecipe,
    isRecipeConfirmed,
    editedUsedProducts,
    showPreferencesModal, setShowPreferencesModal,
    selectedMealType,
    openPreferencesModal,
    handleGenerateRecipe,
    handleConfirmRecipe,
    handleEditedQuantityChange,
  };
}