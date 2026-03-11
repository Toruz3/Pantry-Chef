import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedProduct, AudioExtractedProduct, GeneratedRecipe } from "../types";

export async function analyzeProductImage(base64Image: string, mimeType: string): Promise<ExtractedProduct> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1] || base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Analizza questa immagine di un prodotto alimentare. Estrai il nome del prodotto (in italiano), la data di scadenza e la categoria. Le categorie consentite sono: 'Latticini', 'Carne e Pesce', 'Frutta e Verdura', 'Dispensa Secca', 'Surgelati', 'Bevande', 'Snack e Dolci', 'Altro'. Restituisci il risultato come oggetto JSON con 'name' (stringa), 'expirationDate' (stringa nel formato YYYY-MM-DD) e 'category' (stringa). Se non riesci a trovare la data di scadenza o il nome, restituisci null per quel campo. Non includere alcuna formattazione markdown, solo il JSON grezzo.",
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
            category: {
              type: Type.STRING,
              description: "La categoria del prodotto (es. Latticini, Carne e Pesce, Frutta e Verdura, Dispensa Secca, Surgelati, Bevande, Snack e Dolci, Altro).",
            },
          },
          required: ["name"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Nessuna risposta da Gemini");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Errore durante l'analisi dell'immagine:", error);
    throw error;
  }
}

export async function analyzeAudioProducts(base64Audio: string, mimeType: string): Promise<AudioExtractedProduct[]> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio.split(',')[1] || base64Audio,
              mimeType: mimeType,
            },
          },
          {
            text: "Analizza questo audio in cui l'utente elenca dei prodotti da aggiungere alla dispensa. Estrai una lista di prodotti con nome, quantità, unità di misura (g, kg, ml, l, pz, scatolette, confezioni), data di scadenza (formato YYYY-MM-DD) e categoria. Le categorie consentite sono: 'Latticini', 'Carne e Pesce', 'Frutta e Verdura', 'Dispensa Secca', 'Surgelati', 'Bevande', 'Snack e Dolci', 'Altro'. Se la data di scadenza non è specificata o non è chiara, restituisci null per quel campo. Se la quantità non è specificata, usa 1. Se l'unità non è specificata, usa 'pz'. Restituisci il risultato come array JSON.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "Il nome del prodotto alimentare in italiano.",
              },
              quantity: {
                type: Type.NUMBER,
                description: "La quantità del prodotto.",
              },
              unit: {
                type: Type.STRING,
                description: "L'unità di misura (g, kg, ml, l, pz, scatolette, confezioni).",
              },
              expirationDate: {
                type: Type.STRING,
                description: "La data di scadenza del prodotto nel formato YYYY-MM-DD. Null se non trovata.",
              },
              category: {
                type: Type.STRING,
                description: "La categoria del prodotto (es. Latticini, Carne e Pesce, Frutta e Verdura, Dispensa Secca, Surgelati, Bevande, Snack e Dolci, Altro).",
              },
            },
            required: ["name", "quantity", "unit"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Nessuna risposta da Gemini");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Errore durante l'analisi dell'audio:", error);
    throw error;
  }
}

export async function generateRecipeImage(title: string, ingredients: string[]): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Un piatto invitante e delizioso: ${title}. Ingredienti principali: ${ingredients.join(', ')}. Fotografia food photography professionale, illuminazione naturale, alta qualità, appetitoso, impiattamento elegante.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating recipe image:", error);
    return null;
  }
}

export async function generateRecipe(
  products: { id: string; name: string; expirationDate: string; quantity: number; unit: string }[], 
  servings: number,
  mealType: 'colazione' | 'pranzo' | 'cena' | 'spuntino',
  appliances: { microwave: boolean; airFryer: boolean },
  userPreferences?: string,
  generateImage: boolean = false
): Promise<GeneratedRecipe> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const productsList = products
      .map((p: any) => `- ID: ${p.id} | ${p.name} | Quantità: ${p.quantity} ${p.unit} | Scade: ${p.expirationDate}`)
      .join("\n");

    let mealContext = "";
    if (mealType === 'colazione') {
      mealContext = "La ricetta deve essere per la COLAZIONE.";
    } else if (mealType === 'pranzo') {
      mealContext = "La ricetta deve essere per il PRANZO (preferibilmente un piatto di pasta o un primo piatto sostanzioso).";
    } else if (mealType === 'cena') {
      mealContext = "La ricetta deve essere per la CENA (preferibilmente un secondo piatto o un pasto leggero).";
    } else if (mealType === 'spuntino') {
      mealContext = "La ricetta deve essere per uno SPUNTINO (preferibilmente qualcosa di veloce, leggero o uno snack).";
    }

    let appliancesContext = "";
    const availableAppliances = [];
    if (appliances.microwave) availableAppliances.push("microonde");
    if (appliances.airFryer) availableAppliances.push("friggitrice ad aria");
    
    if (availableAppliances.length > 0) {
      appliancesContext = `Ho a disposizione i seguenti elettrodomestici extra: ${availableAppliances.join(" e ")}. Prova a includerli nella preparazione se ha senso per la ricetta.`;
    }

    let preferencesContext = "";
    if (userPreferences && userPreferences.trim() !== "") {
      preferencesContext = `Richieste specifiche dell'utente: "${userPreferences.trim()}". Tieni conto di queste richieste nella generazione della ricetta.`;
    }

    const prompt = `
Ho i seguenti prodotti alimentari che devo consumare prima che scadano:
${productsList}

Genera una ricetta per esattamente ${servings} persone. 
${mealContext}
${appliancesContext}
${preferencesContext}

Dai la priorità all'utilizzo degli ingredienti che scadono prima. Puoi dare per scontato che io abbia gli ingredienti base di una dispensa (sale, pepe, olio, acqua, ecc.) e i normali strumenti da cucina (fornelli, forno).
Adatta le quantità degli ingredienti specificamente per ${servings} persone, ma NON superare le quantità disponibili nella mia dispensa per i prodotti elencati.
Scrivi l'intera ricetta in ITALIANO.

Restituisci la ricetta come oggetto JSON con la seguente struttura:
- title: stringa (titolo della ricetta)
- ingredients: array di stringhe (con quantità, es. "200g di pasta")
- instructions: array di stringhe (passo dopo passo)
- prepTime: stringa (es. "30 minuti")
- servings: numero (deve essere ${servings})
- usedProducts: array di oggetti che rappresentano i prodotti della mia dispensa utilizzati in questa ricetta. Ogni oggetto deve avere:
  - productId: stringa (l'ID esatto del prodotto fornito nell'elenco)
  - name: stringa (il nome del prodotto)
  - quantity: numero (la quantità utilizzata, deve essere un numero)
  - unit: stringa (l'unità di misura, es. "g", "ml", "pz")
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
            usedProducts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING },
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                },
                required: ["productId", "name", "quantity", "unit"],
              }
            }
          },
          required: ["title", "ingredients", "instructions", "prepTime", "servings", "usedProducts"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Nessuna risposta da Gemini");

    const recipeData = JSON.parse(text);
    
    if (generateImage) {
      try {
        const imageUrl = await generateRecipeImage(recipeData.title, recipeData.ingredients);
        if (imageUrl) {
          recipeData.imageUrl = imageUrl;
        }
      } catch (imageError) {
        console.error("Failed to generate image, continuing without it", imageError);
      }
    }
    
    return recipeData;
  } catch (error) {
    console.error("Errore durante la generazione della ricetta:", error);
    throw error;
  }
}