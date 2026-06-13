var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var app = (0, import_express.default)();
app.use(import_express.default.json());
var PORT = 3e3;
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
var SYSTEM_PROMPT = `
You are the SonicBuild AI, an expert Ultrasound Physics tutor. 
Your knowledge base is based on the "Ultrasound Physics Registry Review" study guide.
Your goal is to help students understand complex physics concepts for their registry exams (ARDMS/CCI).

Key Knowledge Points:
1. Properties of Sound:
   - Sound is a mechanical, longitudinal wave.
   - Frequency (Hz), Wavelength (mm), Period (us).
   - Relationship: \u019B = c / f. Wavelength and frequency are inversely related.
   - Speed in Soft Tissue: 1540 m/s or 1.54 mm/us ALWAYS.

2. Transducers:
   - PZT (Lead Zirconate Titanate) is the crystal material.
   - Curie point: 400\xB0C (Don't heat sterilize).
   - Crystal thickness = 1/2 wavelength. Thinner crystal = Higher frequency.
   - Backing/Damping: Shortens the pulse (SPL) \u2192 better axial resolution.
   - Matching Layer: 1/4 wavelength thick. Matches Z values (impedance bridge).
   - Near Zone (Fresnel), Far Zone (Fraunhofer).

3. Resolution:
   - Axial (LARRD): Parallel to beam. Axial Res = 1/2 SPL. Improved by high frequency & damping.
   - Lateral (LATA): Perpendicular to beam. Equals beam width. Improved by focusing.
   - Temporal: Frame rate. 

4. Doppler & Hemodynamics:
   - Doppler Shift = (2 * f * v * cos\u03B8) / c.
   - Shift is positive (towards) or negative (away).
   - Ideal angle for measurement: 0\xB0 (highest shift). Clinical limit: 60\xB0.
   - Aliasing: Occurs if shift > 1/2 PRF (Nyquist Limit).
   - Laminar vs. Turbulent flow. Reynolds # > 2000 suggests turbulence.
   - BERNOULLI EFFECT: High Velocity = Low Pressure.
   - POISEUILLE\u2019S LAW: Flow depends on pressure gradient and radius (to the 4th power).

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
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});
app.post("/api/chat", async (req, res) => {
  try {
    const { question, history = [] } = req.body;
    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }
    const contents = [
      {
        role: "user",
        parts: [{ text: "Hello. I need help studying for my ultrasound physics registry." }]
      },
      {
        role: "model",
        parts: [{ text: "I analyzed the entire study guide for you, so here is the cliffnotes version of my entire knowledge base! I'm here to save you dozens of hours of dense reading. What concept is pushing your buttons today?" }]
      },
      ...history,
      {
        role: "user",
        parts: [{ text: `${SYSTEM_PROMPT}

User Question: ${question}` }]
      }
    ];
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        maxOutputTokens: 1e3,
        temperature: 0.7
      }
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Chat Server Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});
var isTtsSuspended = false;
var ttsSuspendedUntil = 0;
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voiceProfile } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required for speech synthesis" });
    }
    if (isTtsSuspended) {
      if (Date.now() < ttsSuspendedUntil) {
        return res.json({ useBrowserFallback: true, reason: "COOLDOWN" });
      }
      isTtsSuspended = false;
    }
    let geminiVoice = "Puck";
    if (voiceProfile === "sedaris") geminiVoice = "Aoede";
    if (voiceProfile === "bourdain") geminiVoice = "Charon";
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say clearly and professionally: ${text}` }] }],
      config: {
        responseModalities: [import_genai.Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: geminiVoice }
          }
        }
      }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: "Failed to generate audio content" });
    }
    res.json({ base64Audio });
  } catch (error) {
    const errorStr = typeof error === "object" ? JSON.stringify(error) : String(error);
    const isQuotaError = errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("quota");
    const isAccessError = errorStr.includes("403") || errorStr.includes("PERMISSION_DENIED") || errorStr.includes("denied");
    if (isQuotaError || isAccessError) {
      isTtsSuspended = true;
      ttsSuspendedUntil = Date.now() + 5 * 60 * 1e3;
      console.log(`Server text-to-speech option offline; using client-side SpeechSynthesis. Suspended until: ${new Date(ttsSuspendedUntil).toISOString()}`);
      return res.json({ useBrowserFallback: true, reason: isQuotaError ? "LIMIT_EXCEEDED" : "ACCESS_DENIED" });
    }
    console.error("TTS Server Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
