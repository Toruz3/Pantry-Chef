import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client
// We use the environment variable provided by the platform
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ExtractedProduct {
  name: string;
  expirationDate: string | null;
}

export interface GeneratedRecipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  servings: number;
}

export async function analyzeProductImage(base64Image: string, mimeType: string): Promise<ExtractedProduct> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Analizza questa immagine di un prodotto alimentare. Estrai il nome del prodotto (in italiano) e la data di scadenza. Restituisci il risultato come oggetto JSON con 'name' (stringa) e 'expirationDate' (stringa nel formato YYYY-MM-DD). Se non riesci a trovare la data di scadenza o il nome, restituisci null per quel campo. Non includere alcuna formattazione markdown, solo il JSON grezzo.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "Il nome del prodotto alimentare in italiano.",
            },
            expirationDate: {
              type: Type.STRING,
              description: "La data di scadenza del prodotto nel formato YYYY-MM-DD. Null se non trovata.",
            },
          },
          required: ["name"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Nessuna risposta da Gemini");
    
    return JSON.parse(text) as ExtractedProduct;
  } catch (error) {
    console.error("Errore durante l'analisi dell'immagine:", error);
    throw new Error("Impossibile analizzare l'immagine. Riprova.");
  }
}

export async function generateRecipe(products: { name: string; expirationDate: string }[], servings: number): Promise<GeneratedRecipe> {
  try {
    const productsList = products
      .map((p) => `- ${p.name} (Scade: ${p.expirationDate})`)
      .join("\n");

    const prompt = `
Ho i seguenti prodotti alimentari che devo consumare prima che scadano:
${productsList}

Genera una ricetta per esattamente ${servings} persone. 
Dai la priorità all'utilizzo degli ingredienti che scadono prima. Puoi dare per scontato che io abbia gli ingredienti base di una dispensa (sale, pepe, olio, acqua, ecc.).
Adatta le quantità degli ingredienti specificamente per ${servings} persone.
Scrivi l'intera ricetta in ITALIANO.

Restituisci la ricetta come oggetto JSON con la seguente struttura:
- title: stringa (titolo della ricetta)
- ingredients: array di stringhe (con quantità)
- instructions: array di stringhe (passo dopo passo)
- prepTime: stringa (es. "30 minuti")
- servings: numero (deve essere ${servings})
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            ingredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            prepTime: { type: Type.STRING },
            servings: { type: Type.NUMBER },
          },
          required: ["title", "ingredients", "instructions", "prepTime", "servings"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Nessuna risposta da Gemini");

    return JSON.parse(text) as GeneratedRecipe;
  } catch (error) {
    console.error("Errore durante la generazione della ricetta:", error);
    throw new Error("Impossibile generare la ricetta. Riprova.");
  }
}
