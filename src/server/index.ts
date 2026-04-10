import app from "./app";

const PORT = 3000;

console.log("Starting server...");
console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
  console.log("GEMINI_API_KEY prefix:", process.env.GEMINI_API_KEY.substring(0, 10) + "...");
}
console.log("API_KEY exists:", !!process.env.API_KEY);

// Vite middleware for development
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  // Use dynamic import with a variable to prevent Vercel's bundler from tracing it
  const viteModule = "vite";
  import(viteModule).then(async ({ createServer: createViteServer }) => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }).catch(console.error);
} else {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
