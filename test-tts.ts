import { GoogleGenAI, Modality } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  try {
    console.log("Calling TTS...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ parts: [{ text: "Hello world" }] }],
    });
    console.log("Success! Audio returned:", response.text);
  } catch(e) {
    console.log("Failed:", e);
  }
}
main();
