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
    return res.json({ success: true, message: "API is working", path: req.url });
  } catch (error: any) {
    console.error("Vercel Serverless Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
