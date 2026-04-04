/**
 * Server-side Gemini integration using the REST API directly.
 * This avoids any SDK bundling issues on Vercel serverless functions.
 */
import {
  Category,
  CATEGORIES,
  ExtractedProduct,
  AudioExtractedProduct,
  GeneratedRecipe,
  ReceiptExtractedProduct,
} from "../types";

// ─── Config ────────────────────────────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.0-flash";

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY non configurata. Aggiungila nelle variabili d'ambiente di Vercel."
    );
  }
  return key;
}

function geminiUrl(model = GEMINI_MODEL): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${getApiKey()}`;
}

// ─── Core fetch helper ────────────────────────────────────────────────────

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiRequest {
  contents: Array<{ role: string; parts: GeminiPart[] }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

async function callGemini(payload: GeminiRequest): Promise<string> {
  const response = await fetch(geminiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `Errore Gemini API (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson?.error?.message ?? errMsg;
    } catch {
      errMsg = `${errMsg}: ${errText.slice(0, 200)}`;
    }
    throw new Error(errMsg);
  }

  const data = await response.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!text) {
    throw new Error("Gemini ha restituito una risposta vuota.");
  }

  return text;
}

// ─── JSON cleaner ─────────────────────────────────────────────────────────

function extractJSON(text: string): string {
  let clean = text
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  const firstBracket = clean.search(/[\[{]/);
  const lastBracket = Math.max(clean.lastIndexOf("]"), clean.lastIndexOf("}"));

  if (firstBracket !== -1 && lastBracket !== -1) {
    clean = clean.slice(firstBracket, lastBracket + 1);
  }

  return clean;
}

function safeParseJSON<T>(text: string): T {
  const cleaned = extractJSON(text);
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error("JSON parse failed. Raw text:", text.slice(0, 500));
    throw new Error(`Impossibile interpretare la risposta dell'AI: ${String(e)}`);
  }
}

// ─── processReceiptImage ──────────────────────────────────────────────────

export async function processReceiptImage(
  base64Image: string,
  mimeType: string
): Promise<ReceiptExtractedProduct[]> {
  const today = new Date().toISOString().split("T")[0];

  const text = await callGemini({
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          {
            text: `Data oggi: ${today}.
Analizza questo scontrino. Restituisci SOLO un array JSON con i prodotti alimentari trovati.
Nessun testo prima o dopo il JSON.

Schema:
[{
  "name": "nome prodotto",
  "quantity": 1,
  "unit": "pz",
  "expirationDate": "YYYY-MM-DD (stima: latte 7gg, pasta 365gg, frutta 5gg ecc.)",
  "category": "una di: Latticini, Carne e Pesce, Frutta e Verdura, Dispensa Secca, Surgelati, Bevande, Snack e Dolci, Altro"
}]

Includi SOLO prodotti alimentari.`,
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.2 },
  });

  return safeParseJSON<ReceiptExtractedProduct[]>(text);
}

// ─── categorizeProduct ────────────────────────────────────────────────────

export async function categorizeProduct(productName: string): Promise<Category> {
  try {
    const text = await callGemini({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Categorizza il prodotto alimentare "${productName}" in UNA di queste categorie: Latticini, Carne e Pesce, Frutta e Verdura, Dispensa Secca, Surgelati, Bevande, Snack e Dolci, Altro.
Rispondi con SOLE le parole della categoria, nient'altro.`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0, maxOutputTokens: 20 },
    });

    const trimmed = text.trim();
    const validCategories: Category[] = ["Latticini","Carne e Pesce","Frutta e Verdura","Dispensa Secca","Surgelati","Bevande","Snack e Dolci","Altro"];
    const match = validCategories.find(
      (c) => c.toLowerCase() === trimmed.toLowerCase()
    );
    return match ?? "Altro";
  } catch {
    return "Altro";
  }
}

// ─── analyzeProductImage ──────────────────────────────────────────────────

export async function analyzeProductImage(
  base64Image: string,
  mimeType: string
): Promise<ExtractedProduct> {
  const text = await callGemini({
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          {
            text: `Analizza questa immagine di un prodotto alimentare.
Restituisci SOLO un oggetto JSON, nessun testo extra:
{
  "name": "nome del prodotto",
  "expirationDate": "YYYY-MM-DD oppure null",
  "category": "una di: Latticini, Carne e Pesce, Frutta e Verdura, Dispensa Secca, Surgelati, Bevande, Snack e Dolci, Altro"
}`,
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.1 },
  });

  return safeParseJSON<ExtractedProduct>(text);
}

// ─── transcribeAudio ──────────────────────────────────────────────────────

export async function transcribeAudio(
  base64Audio: string,
  mimeType: string
): Promise<string> {
  const text = await callGemini({
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Audio } },
          {
            text: "Trascrivi esattamente ciò che viene detto in questo audio in italiano. Restituisci SOLO il testo trascritto, nient'altro.",
          },
        ],
      },
    ],
    generationConfig: { temperature: 0 },
  });

  return text.trim();
}

// ─── analyzeAudioProducts ─────────────────────────────────────────────────

export async function analyzeAudioProducts(
  base64Audio: string,
  mimeType: string
): Promise<AudioExtractedProduct[]> {
  const today = new Date().toISOString().split("T")[0];

  const text = await callGemini({
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Audio } },
          {
            text: `Data oggi: ${today}.
Ascolta l'audio e identifica tutti i prodotti alimentari menzionati.
Restituisci SOLO un array JSON, nessun testo extra:
[{
  "name": "nome prodotto",
  "quantity": numero oppure "",
  "unit": "g | kg | ml | l | pz | scatolette | confezioni oppure ''",
  "expirationDate": "YYYY-MM-DD oppure null",
  "category": "una di: Latticini, Carne e Pesce, Frutta e Verdura, Dispensa Secca, Surgelati, Bevande, Snack e Dolci, Altro",
  "isEstimate": true
}]`,
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.2 },
  });

  return safeParseJSON<AudioExtractedProduct[]>(text);
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
  _generateImage = false
): Promise<GeneratedRecipe[]> {
  const sorted = [...products].sort(
    (a, b) =>
      new Date(a.expirationDate).getTime() -
      new Date(b.expirationDate).getTime()
  );

  const productList = sorted
    .map((p) => `- ID:${p.id} | ${p.name}: ${p.quantity} ${p.unit} (scade: ${p.expirationDate})`)
    .join("\n");

  const applianceNote = [
    appliances.microwave && "microonde",
    appliances.airFryer && "friggitrice ad aria",
  ]
    .filter(Boolean)
    .join(", ");

  const text = await callGemini({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Sei uno chef italiano esperto. Genera esattamente ${numberOfRecipes} ricett${numberOfRecipes === 1 ? "a" : "e"} per ${mealType}.

PRODOTTI DISPONIBILI (preferisci quelli con scadenza più vicina):
${productList}

REQUISITI:
- Porzioni: ${servings}
${applianceNote ? `- Elettrodomestici: ${applianceNote}` : ""}
${userPreferences ? `- Preferenze: ${userPreferences}` : ""}

Restituisci SOLO un array JSON valido con esattamente ${numberOfRecipes} element${numberOfRecipes === 1 ? "o" : "i"}.
Nessun testo prima o dopo, nessun markdown, nessun backtick.

[{
  "title": "Nome della Ricetta",
  "ingredients": ["200g pasta", "2 uova", "sale q.b."],
  "instructions": ["Passo 1: ...", "Passo 2: ..."],
  "prepTime": "20 minuti",
  "servings": ${servings},
  "usedProducts": [
    { "productId": "ID_ESATTO_DALLA_LISTA_SOPRA", "name": "nome", "quantity": 200, "unit": "g" }
  ]
}]`,
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
  });

  const recipes = safeParseJSON<GeneratedRecipe[]>(text);

  if (!Array.isArray(recipes) || recipes.length === 0) {
    throw new Error("L'AI non ha generato ricette valide. Riprova.");
  }

  return recipes;
}
