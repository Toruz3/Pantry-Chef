import { ExtractedProduct, AudioExtractedProduct, GeneratedRecipe, Category, ReceiptExtractedProduct } from "../types";

// Helper: prova a parsare JSON, altrimenti lancia un errore leggibile
async function parseResponse(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    // Vercel / server ha restituito HTML o testo di errore
    const short = text.slice(0, 200);
    throw new Error(`Errore del server (${response.status}): ${short}`);
  }
}

async function safeFetch(url: string, body: object): Promise<any> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (networkErr: any) {
    throw new Error(`Errore di rete: ${networkErr.message}`);
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data?.error || `Errore del server (${response.status})`);
  }

  return data;
}

export async function processReceiptImage(
  base64Image: string,
  mimeType: string
): Promise<ReceiptExtractedProduct[]> {
  return safeFetch("/api/gemini/process-receipt", { base64Image, mimeType });
}

export async function categorizeProduct(productName: string): Promise<Category> {
  try {
    const data = await safeFetch("/api/gemini/categorize-product", { productName });
    return data.category;
  } catch (err) {
    console.error("categorizeProduct error:", err);
    return "Altro";
  }
}

export async function analyzeProductImage(
  base64Image: string,
  mimeType: string
): Promise<ExtractedProduct> {
  return safeFetch("/api/gemini/analyze-product-image", { base64Image, mimeType });
}

export async function transcribeAudio(
  base64Audio: string,
  mimeType: string
): Promise<string> {
  const data = await safeFetch("/api/gemini/transcribe-audio", { base64Audio, mimeType });
  return data.text;
}

export async function analyzeAudioProducts(
  base64Audio: string,
  mimeType: string
): Promise<AudioExtractedProduct[]> {
  return safeFetch("/api/gemini/analyze-audio-products", { base64Audio, mimeType });
}

export async function generateRecipe(
  products: { id: string; name: string; expirationDate: string; quantity: number; unit: string }[],
  servings: number,
  mealType: "colazione" | "pranzo" | "cena" | "spuntino",
  appliances: { microwave: boolean; airFryer: boolean },
  userPreferences?: string,
  numberOfRecipes: number = 3,
  generateImage: boolean = false
): Promise<GeneratedRecipe[]> {
  return safeFetch("/api/gemini/generate-recipe", {
    products,
    servings,
    mealType,
    appliances,
    userPreferences,
    numberOfRecipes,
    generateImage,
  });
}
