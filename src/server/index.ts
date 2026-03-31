import express from "express";
import {
  processReceiptImage,
  categorizeProduct,
  analyzeProductImage,
  transcribeAudio,
  analyzeAudioProducts,
  generateRecipe
} from "./gemini";

// Only load dotenv in development
if (process.env.NODE_ENV !== "production") {
  import("dotenv/config").catch(() => {});
}

const app = express();
const PORT = 3000;

console.log("Starting server...");
console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
console.log("API_KEY exists:", !!process.env.API_KEY);

// Increase payload limit for base64 images/audio
app.use(express.json({ limit: '50mb' }));

// API Routes
app.post("/api/gemini/process-receipt", async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;
    const result = await processReceiptImage(base64Image, mimeType);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/gemini/categorize-product", async (req, res) => {
  try {
    const { productName } = req.body;
    const result = await categorizeProduct(productName);
    res.json({ category: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/gemini/analyze-product-image", async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;
    const result = await analyzeProductImage(base64Image, mimeType);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/gemini/transcribe-audio", async (req, res) => {
  try {
    const { base64Audio, mimeType } = req.body;
    const result = await transcribeAudio(base64Audio, mimeType);
    res.json({ text: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/gemini/analyze-audio-products", async (req, res) => {
  try {
    const { base64Audio, mimeType } = req.body;
    const result = await analyzeAudioProducts(base64Audio, mimeType);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/gemini/generate-recipe", async (req, res) => {
  try {
    const { products, servings, mealType, appliances, userPreferences, numberOfRecipes, generateImage } = req.body;
    const result = await generateRecipe(products, servings, mealType, appliances, userPreferences, numberOfRecipes, generateImage);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  // In development, we rely on the standard Vite dev server setup
  // rather than trying to dynamically import it here to avoid Vercel build issues
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
