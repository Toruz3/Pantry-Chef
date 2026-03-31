import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import {
  processReceiptImage,
  categorizeProduct,
  analyzeProductImage,
  transcribeAudio,
  analyzeAudioProducts,
  generateRecipe
} from "./gemini";

const app = express();
const PORT = 3000;

async function startServer() {
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
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Vercel handles static files, so we don't need this in production on Vercel
    // app.use(express.static("dist"));
  }

  if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
