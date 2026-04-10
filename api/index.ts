console.log("Initializing api/index.ts...");

export const maxDuration = 60;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

// --- Helper Functions ---
function getApiKey(): string {
  let key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY") {
    key = process.env.API_KEY;
  }
  if (!key || key === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY non configurata. Aggiungila nelle variabili d'ambiente di Vercel.");
  }
  return key;
}

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

function safeParseJSON(text: string) {
  const cleaned = extractJSON(text);
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON parse failed. Raw text:", text.slice(0, 500));
    throw new Error(`Impossibile interpretare la risposta dell'AI: ${String(e)}`);
  }
}

async function callGemini(contents: any, config: any = {}) {
  const key = getApiKey();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: config
    }),
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
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!text) {
    throw new Error("Gemini ha restituito una risposta vuota.");
  }

  return text;
}

// --- Main Handler ---
export default async function handler(req: any, res: any) {
  try {
    const path = req.url.split('?')[0];

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    switch (path) {
      case '/api/gemini/process-receipt': {
        const { base64Image, mimeType } = req.body;
        const today = new Date().toISOString().split("T")[0];
        const text = await callGemini([
          {
            role: "user",
            parts: [
              { inlineData: { mimeType, data: base64Image.split(',')[1] || base64Image } },
              {
                text: `Data oggi: ${today}. Analizza questo scontrino. Restituisci SOLO un array JSON con i prodotti alimentari trovati. Nessun testo prima o dopo il JSON. Schema: [{"name": "nome prodotto", "quantity": 1, "unit": "pz", "expirationDate": "YYYY-MM-DD (stima: latte 7gg, pasta 365gg, frutta 5gg ecc.)", "category": "una di: Latticini, Carne e Pesce, Frutta e Verdura, Dispensa Secca, Surgelati, Bevande, Snack e Dolci, Altro"}] Includi SOLO prodotti alimentari.`,
              },
            ],
          },
        ], { temperature: 0.2 });
        return res.json(safeParseJSON(text));
      }

      case '/api/gemini/categorize-product': {
        const { productName } = req.body;
        try {
          const text = await callGemini([
            {
              role: "user",
              parts: [
                {
                  text: `Categorizza il prodotto alimentare "${productName}" in UNA di queste categorie: Latticini, Carne e Pesce, Frutta e Verdura, Dispensa Secca, Surgelati, Bevande, Snack e Dolci, Altro. Rispondi con SOLE le parole della categoria, nient'altro.`,
                },
              ],
            },
          ], { temperature: 0, maxOutputTokens: 20 });
          
          const trimmed = text.trim();
          const validCategories = ["Latticini","Carne e Pesce","Frutta e Verdura","Dispensa Secca","Surgelati","Bevande","Snack e Dolci","Altro"];
          const match = validCategories.find(c => c.toLowerCase() === trimmed.toLowerCase());
          return res.json({ category: match ?? "Altro" });
        } catch (e) {
          return res.json({ category: "Altro" });
        }
      }

      case '/api/gemini/analyze-product-image': {
        const { base64Image, mimeType } = req.body;
        const text = await callGemini([
          {
            role: "user",
            parts: [
              { inlineData: { mimeType, data: base64Image.split(',')[1] || base64Image } },
              {
                text: `Analizza questa immagine di un prodotto alimentare. Restituisci SOLO un oggetto JSON, nessun testo extra: {"name": "nome del prodotto", "expirationDate": "YYYY-MM-DD oppure null", "category": "una di: Latticini, Carne e Pesce, Frutta e Verdura, Dispensa Secca, Surgelati, Bevande, Snack e Dolci, Altro"}`,
              },
            ],
          },
        ], { temperature: 0.1 });
        return res.json(safeParseJSON(text));
      }

      case '/api/gemini/transcribe-audio': {
        const { base64Audio, mimeType } = req.body;
        const text = await callGemini([
          {
            role: "user",
            parts: [
              { inlineData: { mimeType, data: base64Audio.split(',')[1] || base64Audio } },
              {
                text: "Trascrivi esattamente ciò che viene detto in questo audio in italiano. Restituisci SOLO il testo trascritto, nient'altro.",
              },
            ],
          },
        ], { temperature: 0 });
        return res.json({ text: text.trim() });
      }

      case '/api/gemini/analyze-audio-products': {
        const { base64Audio, mimeType } = req.body;
        const today = new Date().toISOString().split("T")[0];
        const text = await callGemini([
          {
            role: "user",
            parts: [
              { inlineData: { mimeType, data: base64Audio.split(',')[1] || base64Audio } },
              {
                text: `Data oggi: ${today}. Ascolta l'audio e identifica tutti i prodotti alimentari menzionati. Restituisci SOLO un array JSON, nessun testo extra: [{"name": "nome prodotto", "quantity": numero oppure "", "unit": "g | kg | ml | l | pz | scatolette | confezioni oppure ''", "expirationDate": "YYYY-MM-DD oppure null", "category": "una di: Latticini, Carne e Pesce, Frutta e Verdura, Dispensa Secca, Surgelati, Bevande, Snack e Dolci, Altro", "isEstimate": true}]`,
              },
            ],
          },
        ], { temperature: 0.2 });
        return res.json(safeParseJSON(text));
      }

      case '/api/gemini/generate-recipe': {
        const { products, servings, mealType, appliances, userPreferences, numberOfRecipes } = req.body;
        
        const sorted = [...products].sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
        const productList = sorted.map((p) => `- ID:${p.id} | ${p.name}: ${p.quantity} ${p.unit} (scade: ${p.expirationDate})`).join("\n");
        const applianceNote = [appliances.microwave && "microonde", appliances.airFryer && "friggitrice ad aria"].filter(Boolean).join(", ");

        const prompt = `Sei uno chef italiano esperto. Genera esattamente ${numberOfRecipes || 1} ricett${(numberOfRecipes || 1) === 1 ? "a" : "e"} per ${mealType}.

PRODOTTI DISPONIBILI (preferisci quelli con scadenza più vicina):
${productList}

REQUISITI:
- Porzioni: ${servings}
${applianceNote ? `- Elettrodomestici: ${applianceNote}` : ""}
${userPreferences ? `- Preferenze: ${userPreferences}` : ""}

Restituisci SOLO un array JSON valido con esattamente ${numberOfRecipes || 1} element${(numberOfRecipes || 1) === 1 ? "o" : "i"}.
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
}]`;

        const text = await callGemini([
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ], { temperature: 0.8, maxOutputTokens: 8192 });

        const recipes = safeParseJSON(text);
        if (!Array.isArray(recipes) || recipes.length === 0) {
          throw new Error("L'AI non ha generato ricette valide. Riprova.");
        }
        return res.json(recipes);
      }

      default:
        return res.status(404).json({ error: 'Not Found' });
    }
  } catch (error: any) {
    console.error("Vercel Serverless Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
