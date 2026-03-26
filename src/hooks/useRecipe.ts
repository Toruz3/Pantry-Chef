import { useState } from 'react';
import { Product, GeneratedRecipe } from '../types';
import { generateRecipe } from '../services/gemini';
import { haptics } from '../utils/haptics';

export function useRecipe(consumeProducts: (usedProducts: { productId: string; quantity: number }[]) => Promise<void>) {
  const [recipes, setRecipes]                 = useState<GeneratedRecipe[] | null>(null);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState<number>(0);
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
    userPreferences: string,
    numberOfRecipes: number,
    setError: (msg: string) => void
  ) => {
    if (!selectedMealType) return;

    haptics.medium();
    setShowPreferencesModal(false);
    setIsGenerating(true);
    setRecipes(null);
    setSelectedRecipeIndex(0);
    setIsRecipeConfirmed(false);

    try {
      const generated = await generateRecipe(
        sortedProducts,
        servings,
        selectedMealType,
        { microwave: useMicrowave, airFryer: useAirFryer },
        userPreferences,
        numberOfRecipes,
        false
      );
      setRecipes(generated);
      setEditedUsedProducts(generated[0]?.usedProducts || []);
      setIsEditingRecipe(false);
      haptics.success();
    } catch (err: any) {
      setError(err.message || 'Impossibile generare la ricetta.');
      haptics.error();
    } finally {
      setIsGenerating(false);
      setSelectedMealType(null);
    }
  };

  const handleSelectRecipe = (index: number) => {
    if (!recipes || !recipes[index]) return;
    setSelectedRecipeIndex(index);
    setEditedUsedProducts(recipes[index].usedProducts || []);
    setIsEditingRecipe(false);
  };

  const handleConfirmRecipe = async () => {
    if (!recipes || isRecipeConfirmed) return;

    haptics.success();
    await consumeProducts(editedUsedProducts);
    setIsRecipeConfirmed(true);
  };

  const handleEditedQuantityChange = (index: number, newQuantity: string) => {
    const num = newQuantity === '' ? 0 : Number(newQuantity);
    setEditedUsedProducts(prev =>
      prev.map((item, i) => (i === index ? { ...item, quantity: num } : item))
    );
  };

  return {
    recipes, setRecipes,
    selectedRecipeIndex, handleSelectRecipe,
    recipe: recipes ? recipes[selectedRecipeIndex] : null,
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