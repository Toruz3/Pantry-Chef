import { GoogleGenAI } from "@google/genai";
import {
  ExtractedProduct,
  AudioExtractedProduct,
  GeneratedRecipe,
  Category,
  ReceiptExtractedProduct,
  CATEGORIES,
} from "../types";

// ─── Client singleton ──────────────────────────────────────────────────────
function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your Vercel environment variables."
    );
  }
  return new GoogleGenAI({ apiKey });
}

const MODEL = "gemini-2.0-flash";

// ─── Helper ────────────────────────────────────────────────────────────────
function safeParseJSON<T>(text: string): T {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

// ─── processReceiptImage ──────────────────────────────────────────────────
export async function processReceiptImage(
  base64Image: string,
  mimeType: string
): Promise<ReceiptExtractedProduct[]> {
  const ai = getClient();

  const prompt = `Analizza questo scontrino e restituisci SOLO un array JSON (nessun testo extra) con i prodotti alimentari trovati.
Schema di ogni oggetto:
{
  "name": "nome del prodotto",
  "quantity": numero (usa 1 se non chiaro),
  "unit": "pz" | "g" | "kg" | "l" | "ml" | "confezioni" | "scatolette",
  "expirationDate": "YYYY-MM-DD" (stima ragionevole basata sul tipo di prodotto, es. latte = 7 giorni da oggi),
  "category": una di: ${CATEGORIES.join(", ")}
}
Includi SOLO prodotti alimentari. Ignora prodotti per la casa, cosmetici, ecc.`;

  const today = new Date().toISOString().split("T")[0];

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType as any,
              data: base64Image,
            },
          },
          {
            text: `Data di oggi: ${today}. ${prompt}`,
          },
        ],
      },
    ],
  });

  const text = result.text ?? "";
  return safeParseJSON<ReceiptExtractedProduct[]>(text);
}

// ─── categorizeProduct ────────────────────────────────────────────────────
export async function categorizeProduct(productName: string): Promise<Category> {
  const ai = getClient();

  const validCategories = CATEGORIES.join(", ");
  const prompt = `Categorizza il prodotto alimentare "${productName}" in UNA delle seguenti categorie: ${validCategories}.
Rispondi SOLO con il nome della categoria, senza nient'altro.`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = (result.text ?? "").trim();
  const matched = CATEGORIES.find(
    (c) => c.toLowerCase() === text.toLowerCase()
  );
  return (matched as Category) ?? "Altro";
}

// ─── analyzeProductImage ──────────────────────────────────────────────────
export async function analyzeProductImage(
  base64Image: string,
  mimeType: string
): Promise<ExtractedProduct> {
  const ai = getClient();

  const prompt = `Analizza questa immagine di un prodotto alimentare e restituisci SOLO un oggetto JSON:
{
  "name": "nome del prodotto",
  "expirationDate": "YYYY-MM-DD" oppure null se non visibile,
  "category": una di: ${CATEGORIES.join(", ")}
}`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: mimeType as any, data: base64Image } },
          { text: prompt },
        ],
      },
    ],
  });

  return safeParseJSON<ExtractedProduct>(result.text ?? "{}");
}

// ─── transcribeAudio ──────────────────────────────────────────────────────
export async function transcribeAudio(
  base64Audio: string,
  mimeType: string
): Promise<string> {
  const ai = getClient();

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: mimeType as any, data: base64Audio } },
          {
            text: "Trascrivi esattamente ciò che viene detto in questo audio in italiano. Restituisci SOLO il testo trascritto.",
          },
        ],
      },
    ],
  });

  return (result.text ?? "").trim();
}

// ─── analyzeAudioProducts ─────────────────────────────────────────────────
export async function analyzeAudioProducts(
  base64Audio: string,
  mimeType: string
): Promise<AudioExtractedProduct[]> {
  const ai = getClient();

  const today = new Date().toISOString().split("T")[0];

  const prompt = `Ascolta questo audio e identifica tutti i prodotti alimentari menzionati.
Restituisci SOLO un array JSON (nessun testo extra):
[{
  "name": "nome prodotto",
  "quantity": numero oppure "" se non specificato,
  "unit": "g" | "kg" | "ml" | "l" | "pz" | "scatolette" | "confezioni" oppure "" se non specificato,
  "expirationDate": "YYYY-MM-DD" oppure null,
  "category": una di: ${CATEGORIES.join(", ")},
  "isEstimate": true se quantità/unità sono stime, false altrimenti
}]
Data di oggi: ${today}.`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: mimeType as any, data: base64Audio } },
          { text: prompt },
        ],
      },
    ],
  });

  return safeParseJSON<AudioExtractedProduct[]>(result.text ?? "[]");
}

// ─── generateRecipe ───────────────────────────────────────────────────────
export async function generateRecipe(
  products: {
    id: string;
    name: string;
    expirationDate: string;
    quantity: number;
    unit: string;
  }[],
  servings: number,
  mealType: "colazione" | "pranzo" | "cena" | "spuntino",
  appliances: { microwave: boolean; airFryer: boolean },
  userPreferences?: string,
  numberOfRecipes: number = 1,
  _generateImage: boolean = false
): Promise<GeneratedRecipe[]> {
  const ai = getClient();

  // Sort by expiry to prioritise soon-to-expire ingredients
  const sorted = [...products].sort(
    (a, b) =>
      new Date(a.expirationDate).getTime() -
      new Date(b.expirationDate).getTime()
  );

  const productList = sorted
    .map(
      (p) =>
        `- ${p.name}: ${p.quantity} ${p.unit} (scade: ${p.expirationDate})`
    )
    .join("\n");

  const applianceNote = [
    appliances.microwave ? "microonde disponibile" : "",
    appliances.airFryer ? "friggitrice ad aria disponibile" : "",
  ]
    .filter(Boolean)
    .join(", ");

  const preferencesNote = userPreferences
    ? `Preferenze utente: ${userPreferences}.`
    : "";

  const prompt = `Sei uno chef italiano esperto. Genera ${numberOfRecipes} ricett${numberOfRecipes === 1 ? "a" : "e"} per ${mealType} usando PREFERIBILMENTE i prodotti in scadenza prima.

PRODOTTI DISPONIBILI:
${productList}

VINCOLI:
- Porzioni: ${servings}
- Pasto: ${mealType}
${applianceNote ? `- Elettrodomestici: ${applianceNote}` : ""}
${preferencesNote}

Restituisci SOLO un array JSON valido (nessun testo, nessun markdown):
[{
  "title": "Nome Ricetta",
  "ingredients": ["ingrediente con quantità", ...],
  "instructions": ["passo 1", "passo 2", ...],
  "prepTime": "es. 20 minuti",
  "servings": ${servings},
  "usedProducts": [
    { "productId": "id del prodotto dalla lista", "name": "nome", "quantity": numero, "unit": "unità" }
  ]
}]

Usa gli id esatti dall'elenco prodotti per usedProducts.productId.`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: 0.8,
    },
  });

  const text = result.text ?? "";
  const recipes = safeParseJSON<GeneratedRecipe[]>(text);

  // Validate: ensure it's an array
  if (!Array.isArray(recipes)) {
    throw new Error("La risposta dell'AI non è un array di ricette valido.");
  }

  return recipes;
}
