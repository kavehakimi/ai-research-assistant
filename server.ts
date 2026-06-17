import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load local environment variables
dotenv.config();

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Permissive CORS middleware for cross-origin preview frames
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // API Route: Health verification
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // API Route: Generate Research Plan
  app.post("/api/generate-plan", async (req: Request, res: Response): Promise<void> => {
    try {
      const { topic, question } = req.body;

      if (!topic || !topic.trim()) {
        res.status(400).json({ error: "Research Topic is required." });
        return;
      }

      const client = getGeminiClient();
      
      const prompt = `
        You are an expert academic research advisor and distinguished PhD mentor.
        Based on the provided Research Topic and optional primary Research Question, construct a highly sophisticated, rigorous, and exhaustive Research Plan.
        
        Research Topic: "${topic}"
        Research Question: "${question || "Not specified (generate a fitting central question based on the topic)"}"
        
        Please produce a structured, high-quality, professional academic research plan. Your response must be in JSON and map exactly to these requested outputs:
        1. "suggestedTitle": A sharp, academically compelling research paper or dissertation title.
        2. "problemStatement": A comprehensive, rigorous statement of the research problem (2-3 detailed paragraphs). Identify the knowledge gap, societal/intellectual significance, and scholarly context.
        3. "objectives": An array of 3 to 5 clear, actionable, and scholarly research objectives (use active academic verbs like Investigating, Formulating, Evaluating, Conducting, etc.).
        4. "researchQuestions": An array of 3 to 5 critical secondary research questions designed to guide empirical or conceptual inquiry.
        5. "methodology": A highly detailed methodology framework including research design (e.g., mixted-methods, quantitative, qualitative), data collection protocols, and data analysis strategies appropriate for the topic.
        6. "techniques": An array of specific AI, Machine Learning, Data Science, or computational/statistical techniques that can be applied to optimize or execute this research (e.g., Natural Language Processing, Transformer architectures, Survival Analysis, causal inference, semantic network analysis, deep neural networks, anomaly detection). Each technique should include a "name" and a clear "description" of how it should be leveraged.
        7. "literatureReviewOutline": A preliminary outline consisting of 3 to 5 thematic sections. For each theme, provide a "sectionTitle" and 3-4 descriptive "bulletPoints" summarizing the scholarly focus, history, or key debates.
        8. "searchKeywords": An array of 5 to 8 high-impact, precise academic keywords and boolean query strings suitable for searches in major databases like IEEE Xplore, Google Scholar, Scopus, PubMed, or ACM Digital Library.
        9. "futureDirections": An array of 3 to 5 long-term future research avenues, prospective extensions, or adjacent problems to explore.
      `;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedTitle: {
                type: Type.STRING,
                description: "An elegant, academically rigorous paper or project title."
              },
              problemStatement: {
                type: Type.STRING,
                description: "A comprehensive paragraphs describing the research gap, background, and significance."
              },
              objectives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of research objectives."
              },
              researchQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of analytical research questions."
              },
              methodology: {
                type: Type.STRING,
                description: "Detailed description of appropriate research design, data collection, and analytical methods."
              },
              techniques: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "description"]
                },
                description: "Relevant AI, ML, or Data Science techniques to utilize."
              },
              literatureReviewOutline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sectionTitle: { type: Type.STRING },
                    bulletPoints: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["sectionTitle", "bulletPoints"]
                },
                description: "Thematic outline for a preliminary literature review."
              },
              searchKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Scholarly keywords and search queries."
              },
              futureDirections: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Promising future research horizons."
              }
            },
            required: [
              "suggestedTitle",
              "problemStatement",
              "objectives",
              "researchQuestions",
              "methodology",
              "techniques",
              "literatureReviewOutline",
              "searchKeywords",
              "futureDirections"
            ]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Received empty response from Gemini API.");
      }

      // Parse the JSON output and send back to client
      const plan = JSON.parse(responseText.trim());
      res.json(plan);

    } catch (error: any) {
      console.error("Error generating plan:", error);
      res.status(500).json({
        error: error.message || "An unexpected error occurred while generating the research plan."
      });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite dev server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving build assets in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
