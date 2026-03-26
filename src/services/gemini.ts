import { ExtractedProduct, AudioExtractedProduct, GeneratedRecipe, Category, ReceiptExtractedProduct } from "../types";

export async function processReceiptImage(base64Image: string, mimeType: string): Promise<ReceiptExtractedProduct[]> {
  const response = await fetch('/api/gemini/process-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image, mimeType }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process receipt image');
  }
  return response.json();
}

export async function categorizeProduct(productName: string): Promise<Category> {
  const response = await fetch('/api/gemini/categorize-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productName }),
  });
  if (!response.ok) {
    const error = await response.json();
    console.error(error.error || 'Failed to categorize product');
    return "Altro";
  }
  const data = await response.json();
  return data.category;
}

export async function analyzeProductImage(base64Image: string, mimeType: string): Promise<ExtractedProduct> {
  const response = await fetch('/api/gemini/analyze-product-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image, mimeType }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze product image');
  }
  return response.json();
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const response = await fetch('/api/gemini/transcribe-audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Audio, mimeType }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to transcribe audio');
  }
  const data = await response.json();
  return data.text;
}

export async function analyzeAudioProducts(base64Audio: string, mimeType: string): Promise<AudioExtractedProduct[]> {
  const response = await fetch('/api/gemini/analyze-audio-products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Audio, mimeType }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze audio products');
  }
  return response.json();
}

export async function generateRecipe(
  products: { id: string; name: string; expirationDate: string; quantity: number; unit: string }[], 
  servings: number,
  mealType: 'colazione' | 'pranzo' | 'cena' | 'spuntino',
  appliances: { microwave: boolean; airFryer: boolean },
  userPreferences?: string,
  numberOfRecipes: number = 3,
  generateImage: boolean = false
): Promise<GeneratedRecipe[]> {
  const response = await fetch('/api/gemini/generate-recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products, servings, mealType, appliances, userPreferences, numberOfRecipes, generateImage }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate recipe');
  }
  return response.json();
}