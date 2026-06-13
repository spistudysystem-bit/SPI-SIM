import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality, Type } from "@google/genai";

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize GoogleGenAI client on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const SYSTEM_PROMPT = `
You are the SonicBuild AI, an expert Ultrasound Physics tutor. 
Your knowledge base is based on the "Ultrasound Physics Registry Review" study guide.
Your goal is to help students understand complex physics concepts for their registry exams (ARDMS/CCI).

Key Knowledge Points:
1. Properties of Sound:
   - Sound is a mechanical, longitudinal wave.
   - Frequency (Hz), Wavelength (mm), Period (us).
   - Relationship: ƛ = c / f. Wavelength and frequency are inversely related.
   - Speed in Soft Tissue: 1540 m/s or 1.54 mm/us ALWAYS.

2. Transducers:
   - PZT (Lead Zirconate Titanate) is the crystal material.
   - Curie point: 400°C (Don't heat sterilize).
   - Crystal thickness = 1/2 wavelength. Thinner crystal = Higher frequency.
   - Backing/Damping: Shortens the pulse (SPL) → better axial resolution.
   - Matching Layer: 1/4 wavelength thick. Matches Z values (impedance bridge).
   - Near Zone (Fresnel), Far Zone (Fraunhofer).

3. Resolution:
   - Axial (LARRD): Parallel to beam. Axial Res = 1/2 SPL. Improved by high frequency & damping.
   - Lateral (LATA): Perpendicular to beam. Equals beam width. Improved by focusing.
   - Temporal: Frame rate. 

4. Doppler & Hemodynamics:
   - Doppler Shift = (2 * f * v * cosθ) / c.
   - Shift is positive (towards) or negative (away).
   - Ideal angle for measurement: 0° (highest shift). Clinical limit: 60°.
   - Aliasing: Occurs if shift > 1/2 PRF (Nyquist Limit).
   - Laminar vs. Turbulent flow. Reynolds # > 2000 suggests turbulence.
   - BERNOULLI EFFECT: High Velocity = Low Pressure.
   - POISEUILLE’S LAW: Flow depends on pressure gradient and radius (to the 4th power).

5. Artifacts:
   - Shadowing: Beam weakened by high attenuation (stones).
   - Enhancement: Brighter echoes deep to fluid (low attenuation).
   - Mirror Image: Copy of echoes behind a specular reflector.
   - Reverberation: Multiple false echoes from bouncing between 2 interfaces.

6. Safety (ALARA):
   - As Low As Reasonably Achievable.
   - Mechanical Index (MI): Cavitation risk.
   - Thermal Index (TI): Heat risk.
   - High Gain is safer than High Output Power.

Communication Style:
- Use the "Cliffnotes" style: quantify effort, offer analogies, and simplify technical jargon.
- Be supportive but professional.
- ALWAYS remain strictly professional, polished, and clinical. Never use any vulgarity, profanity, curses, or informal expressions like "Holy Sh*t" or "Holy Shit", even as hyperbolic section or example names.
- Refer to specific "Pages" or "Modules" if relevant to keep consistent with the app's structure.
- Always offer a mnemonic if the concept is hard to remember.
`;

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Chat endpoint (replaces client-side askPhysicsAI)
app.post("/api/chat", async (req, res) => {
  try {
    const { question, history = [] } = req.body;
    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }

    const contents = [
      {
        role: "user",
        parts: [{ text: "Hello. I need help studying for my ultrasound physics registry." }],
      },
      {
        role: "model",
        parts: [{ text: "I analyzed the entire study guide for you, so here is the cliffnotes version of my entire knowledge base! I'm here to save you dozens of hours of dense reading. What concept is pushing your buttons today?" }],
      },
      ...history,
      {
        role: "user",
        parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Question: ${question}` }]
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Chat Server Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Helper to extract clean text from raw HTML body
function cleanHtmlContent(html: string): string {
  // Remove script and style tags completely
  let text = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  // Remove other HTML tags but keep their contents
  text = text.replace(/<[^>]+>/g, " ");
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

// Web Content Summarizer and Tagger Endpoint
app.post("/api/summarize", async (req, res) => {
  try {
    let { content, isUrl } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content parameter is required" });
    }

    let sourceText = content;

    // Handle URL fetching on the server side
    if (isUrl) {
      try {
        // Simple validation of URL protocol
        if (!content.startsWith("http://") && !content.startsWith("https://")) {
          return res.status(400).json({ error: "Invalid URL protocol. Must start with http:// or https://" });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const fetchResponse = await fetch(content, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!fetchResponse.ok) {
          return res.status(errorStatusMap(fetchResponse.status)).json({ 
            error: `Failed to fetch webpage. Server responded with status ${fetchResponse.status}.\n\n(Tip: Try copying and pasting the webpage's text content directly instead!)` 
          });
        }

        const htmlText = await fetchResponse.text();
        sourceText = cleanHtmlContent(htmlText);

        if (!sourceText || sourceText.length < 20) {
          return res.status(422).json({ 
            error: "Webpage contents appeared empty or unreadable.\n\n(Tip: Many modern dynamic apps load content after initialization. Try copying and pasting the webpage's visible text content directly!)" 
          });
        }
      } catch (err: any) {
        console.error("Web Fetch Error:", err);
        return res.status(502).json({ 
          error: `Could not connect to the target webpage. Error: ${err.message || err}.\n\n(Tip: Try copying and pasting the webpage's text content directly instead!)` 
        });
      }
    }

    // Truncate text context slightly if it's exceptionally long to prevent token limitations
    const maxChars = 80000;
    if (sourceText.length > maxChars) {
      sourceText = sourceText.slice(0, maxChars) + " ... [Content Truncated for Analysis]";
    }

    // Call Gemini API using gemini-3.5-flash for basic text tasks
    const modelResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze the following web content source text. Your task is to produce two items:
1. A highly concise summary (exactly 1 to 3 sentences) capturing the main topic and key takeaways of the content. Do not exceed 3 sentences.
2. A high-quality list of 3 to 6 highly specific, relevant keywords or tags related to the page content.

Source Web Content:
"""
${sourceText}
"""`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A professional, concise summary (exactly 1 to 3 sentences) capturing the main topic and raw takeaways of the content. Do not use markdown inside this summary string."
            },
            tags: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "A list of 3 to 6 highly relevant, specific keyword tags related to the content."
            }
          },
          required: ["summary", "tags"]
        }
      }
    });

    const outputText = modelResponse.text?.trim() || "{}";
    const resultObj = JSON.parse(outputText);
    
    res.json({
      summary: resultObj.summary || "No summary generated.",
      tags: resultObj.tags || [],
      characterCountAnalyzed: sourceText.length
    });

  } catch (error: any) {
    console.error("Summarizer Endpoint Error:", error);
    res.status(500).json({ error: error.message || "Failed to process summary analysis." });
  }
});

// Helper map to normalize HTTP status responses
function errorStatusMap(status: number): number {
  if (status >= 400 && status < 500) return status;
  return 502;
}

// Tracks if Gemini TTS is experiencing quota limits or permission issues.
// Let it auto-recover after 5 minutes, gracefully falling back to browser SpeechSynthesis.
let isTtsSuspended = false;
let ttsSuspendedUntil = 0;

// ElevenLabs configuration and default voice mappings
const ELEVENLABS_VOICES: Record<string, string> = {
  standard: process.env.ELEVENLABS_STANDARD_VOICE_ID || process.env.VITE_ELEVENLABS_STANDARD_VOICE_ID || "21m00Tcm4TlvDq8ikWAM", // Rachel (Warm/Narrative)
  bourdain: process.env.ELEVENLABS_BOURDAIN_VOICE_ID || process.env.VITE_ELEVENLABS_BOURDAIN_VOICE_ID || "TxGEqnHWrfWFTfGW9XjX", // Bourdain (Rugged/Male)
  sedaris: process.env.ELEVENLABS_SEDARIS_VOICE_ID || process.env.VITE_ELEVENLABS_SEDARIS_VOICE_ID || "pNInz6obbf5AWCG1MD1p", // Sedaris (Witty/Expressive)
  british: process.env.ELEVENLABS_BRITISH_VOICE_ID || process.env.VITE_ELEVENLABS_BRITISH_VOICE_ID || "N2lVSClvYgDxBhZgNLgH", // Callum (British Male Professional)
};

// TTS Endpoint (replaces client-side Speech SDK)
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voiceProfile } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required for speech synthesis" });
    }

    const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY;
    const profileKey = voiceProfile || "british";
    const voiceId = ELEVENLABS_VOICES[profileKey] || ELEVENLABS_VOICES["british"];

    let base64Audio: string | null = null;
    let fallbackToGemini = false;

    // 1. Try ElevenLabs TTS if an API key is provided
    if (elevenLabsApiKey) {
      try {
        console.log(`[TTS] Requesting ElevenLabs speech synthesis for profile: ${profileKey} (voiceId: ${voiceId})`);
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=pcm_24000`, {
          method: "POST",
          headers: {
            "xi-api-key": elevenLabsApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        });

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          base64Audio = Buffer.from(arrayBuffer).toString("base64");
          console.log(`[TTS] ElevenLabs audio successfully generated.`);
        } else {
          const errorMsg = await response.text();
          console.warn(`[TTS] ElevenLabs API failed with status ${response.status}: ${errorMsg}. Falling back to Gemini.`);
          fallbackToGemini = true;
        }
      } catch (err: any) {
        console.warn(`[TTS] ElevenLabs connection error occurred: ${err?.message || err}. Falling back to Gemini.`);
        fallbackToGemini = true;
      }
    } else {
      console.log(`[TTS] No ElevenLabs API Key discovered. Relying on default Gemini TTS system.`);
      fallbackToGemini = true;
    }

    // 2. Fall back to Gemini TTS if ElevenLabs was not used or failed
    if (fallbackToGemini || !base64Audio) {
      // Check if Gemini TTS is currently in cooldown/suspended state
      if (isTtsSuspended) {
        if (Date.now() < ttsSuspendedUntil) {
          return res.json({ useBrowserFallback: true, reason: "COOLDOWN" });
        }
        isTtsSuspended = false; // Reset cooldown after time has elapsed
      }

      let geminiVoice = "Puck";
      if (voiceProfile === "sedaris") geminiVoice = "Kore";
      if (voiceProfile === "bourdain") geminiVoice = "Charon";
      if (voiceProfile === "british") geminiVoice = "Zephyr";

      let sysPrompt = `Say clearly and professionally: ${text}`;
      if (voiceProfile === "british") {
        sysPrompt = `Say clearly, professionally, and with a fine, distinct articulate British (United Kingdom) accent, like an experienced clinical ultrasound lecturer from Great Britain: ${text}`;
      }

      console.log(`[TTS] Executing backup Gemini speech synthesis (voice: ${geminiVoice})...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: sysPrompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: geminiVoice },
            },
          },
        },
      });

      const geminiBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!geminiBase64) {
        return res.status(500).json({ error: "Failed to generate audio content from both ElevenLabs and backup Gemini system." });
      }

      base64Audio = geminiBase64;
    }

    res.json({ base64Audio });
  } catch (error: any) {
    const errorStr = typeof error === "object" ? JSON.stringify(error) : String(error);
    const isQuotaError = errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("quota");
    const isAccessError = errorStr.includes("403") || errorStr.includes("PERMISSION_DENIED") || errorStr.includes("denied");

    if (isQuotaError || isAccessError) {
      isTtsSuspended = true;
      // Suspend for 5 minutes to gracefully bypass persistent quota issues
      ttsSuspendedUntil = Date.now() + 5 * 60 * 1000;
      console.log(`Server text-to-speech option offline; using client-side SpeechSynthesis. Suspended until: ${new Date(ttsSuspendedUntil).toISOString()}`);
      return res.json({ useBrowserFallback: true, reason: isQuotaError ? "LIMIT_EXCEEDED" : "ACCESS_DENIED" });
    }

    console.error("TTS Server Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
