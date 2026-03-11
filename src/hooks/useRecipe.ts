import { useState } from 'react';
import { Product, GeneratedRecipe } from '../types';
import { generateRecipe } from '../services/gemini';

export function useRecipe(setProducts: React.Dispatch<React.SetStateAction<Product[]>>) {
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [isRecipeConfirmed, setIsRecipeConfirmed] = useState(false);
  const [editedUsedProducts, setEditedUsedProducts] = useState<GeneratedRecipe['usedProducts']>([]);
  
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'colazione' | 'pranzo' | 'cena' | 'spuntino' | null>(null);
  const [userPreferences, setUserPreferences] = useState('');

  const openPreferencesModal = (mealType: 'colazione' | 'pranzo' | 'cena' | 'spuntino', products: Product[], setError: (msg: string) => void) => {
    if (products.length === 0) {
      setError("Per favore, aggiungi prima qualche prodotto.");
      return;
    }
    setSelectedMealType(mealType);
    setUserPreferences('');
    setShowPreferencesModal(true);
  };

  const handleGenerateRecipe = async (
    sortedProducts: Product[],
    servings: number,
    useMicrowave: boolean,
    useAirFryer: boolean,
    setError: (msg: string | null) => void
  ) => {
    if (!selectedMealType) return;
    
    setShowPreferencesModal(false);
    setError(null);
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
        false // generateImage flag
      );
      setRecipe(generated);
      setEditedUsedProducts(generated.usedProducts || []);
      setIsEditingRecipe(false);
    } catch (err: any) {
      setError(err.message || "Impossibile generare la ricetta.");
    } finally {
      setIsGenerating(false);
      setSelectedMealType(null);
    }
  };

  const handleConfirmRecipe = () => {
    if (!recipe || isRecipeConfirmed) return;

    setProducts((prev) => {
      let updatedProducts = [...prev];
      
      editedUsedProducts.forEach((usedItem) => {
        const productIndex = updatedProducts.findIndex(p => p.id === usedItem.productId);
        if (productIndex !== -1) {
          const newQuantity = updatedProducts[productIndex].quantity - usedItem.quantity;
          if (newQuantity <= 0) {
            // Remove product if quantity is 0 or less
            updatedProducts.splice(productIndex, 1);
          } else {
            // Update quantity
            updatedProducts[productIndex] = {
              ...updatedProducts[productIndex],
              quantity: newQuantity
            };
          }
        }
      });

      return updatedProducts;
    });

    setIsRecipeConfirmed(true);
  };

  const handleEditedQuantityChange = (index: number, newQuantity: string) => {
    const numValue = newQuantity === '' ? 0 : Number(newQuantity);
    setEditedUsedProducts(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, quantity: numValue } : item
      )
    );
  };

  return {
    recipe,
    setRecipe,
    isGenerating,
    isEditingRecipe,
    setIsEditingRecipe,
    isRecipeConfirmed,
    editedUsedProducts,
    showPreferencesModal,
    setShowPreferencesModal,
    selectedMealType,
    userPreferences,
    setUserPreferences,
    openPreferencesModal,
    handleGenerateRecipe,
    handleConfirmRecipe,
    handleEditedQuantityChange
  };
}
