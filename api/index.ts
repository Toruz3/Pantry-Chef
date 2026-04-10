import {
  processReceiptImage,
  categorizeProduct,
  analyzeProductImage,
  transcribeAudio,
  analyzeAudioProducts,
  generateRecipe
} from "../src/server/gemini";

export const maxDuration = 60;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  try {
    // req.url might contain query parameters, so we extract just the pathname
    const path = req.url.split('?')[0];

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    switch (path) {
      case '/api/gemini/process-receipt': {
        const { base64Image, mimeType } = req.body;
        const result = await processReceiptImage(base64Image, mimeType);
        return res.json(result);
      }
      case '/api/gemini/categorize-product': {
        const { productName } = req.body;
        const result = await categorizeProduct(productName);
        return res.json({ category: result });
      }
      case '/api/gemini/analyze-product-image': {
        const { base64Image, mimeType } = req.body;
        const result = await analyzeProductImage(base64Image, mimeType);
        return res.json(result);
      }
      case '/api/gemini/transcribe-audio': {
        const { base64Audio, mimeType } = req.body;
        const result = await transcribeAudio(base64Audio, mimeType);
        return res.json({ text: result });
      }
      case '/api/gemini/analyze-audio-products': {
        const { base64Audio, mimeType } = req.body;
        const result = await analyzeAudioProducts(base64Audio, mimeType);
        return res.json(result);
      }
      case '/api/gemini/generate-recipe': {
        console.log("Using GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "SET" : "UNSET", "API_KEY:", process.env.API_KEY ? "SET" : "UNSET");
        const { products, servings, mealType, appliances, userPreferences, numberOfRecipes, generateImage } = req.body;
        const result = await generateRecipe(products, servings, mealType, appliances, userPreferences, numberOfRecipes, generateImage);
        return res.json(result);
      }
      default:
        return res.status(404).json({ error: 'Not Found' });
    }
  } catch (error: any) {
    console.error("Vercel Serverless Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
