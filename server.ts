import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";

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

// TTS Endpoint (replaces client-side Speech SDK)
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voiceProfile } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required for speech synthesis" });
    }

    let geminiVoice = "Puck";
    if (voiceProfile === "sedaris") geminiVoice = "Aoede";
    if (voiceProfile === "bourdain") geminiVoice = "Charon";

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say clearly and professionally: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: geminiVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: "Failed to generate audio content" });
    }

    res.json({ base64Audio });
  } catch (error: any) {
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
