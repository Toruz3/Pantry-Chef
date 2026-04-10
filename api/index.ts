console.log("Initializing api/index.ts...");

export const maxDuration = 60;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  console.log("Handler called with URL:", req.url);
  try {
    const path = req.url.split('?')[0];

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (path === '/api/gemini/generate-recipe') {
      console.log("Using GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "SET" : "UNSET", "API_KEY:", process.env.API_KEY ? "SET" : "UNSET");
      
      let key = process.env.GEMINI_API_KEY;
      if (!key || key === "MY_GEMINI_API_KEY") {
        key = process.env.API_KEY;
      }
      if (!key || key === "MY_GEMINI_API_KEY") {
        return res.status(500).json({ error: "API Key not configured" });
      }

      const { products, servings, mealType, appliances, userPreferences, numberOfRecipes } = req.body;
      
      const prompt = `Genera ${numberOfRecipes || 1} ricetta per ${mealType} per ${servings} persone. Prodotti: ${JSON.stringify(products)}.`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(500).json({ error: `Gemini API Error: ${errText}` });
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      
      return res.json([{
        title: "Ricetta di Test",
        ingredients: ["Test"],
        instructions: ["Test"],
        prepTime: "10 min",
        servings: servings,
        usedProducts: []
      }]);
    }

    return res.status(404).json({ error: 'Not Found' });
  } catch (error: any) {
    console.error("Vercel Serverless Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error", stack: error.stack });
  }
}
