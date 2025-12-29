
import { GoogleGenAI, Modality } from "@google/genai";
import { decodeAudio } from "./audioUtils";
import { AiDialect } from "../types";

export async function generateVoiceReminder(text: string, dialect: AiDialect = AiDialect.Sanaani, gender: 'male' | 'female' = 'male'): Promise<Uint8Array | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // تخصيص الأسلوب بناءً على اللهجة المختارة
    let stylePrompt = "بلهجة يمنية مهذبة";
    if (dialect === AiDialect.Sanaani) stylePrompt = "بلهجة صنعانية عريقة وودودة جداً، استخدم عبارات مثل 'يا خبير' و'حياك الله'";
    else if (dialect === AiDialect.Adeni) stylePrompt = "بلهجة عدنية لطيفة وسلسة، بأسلوب راقي";
    else if (dialect === AiDialect.Hadrami) stylePrompt = "بلهجة حضرمية رصينة ومهذبة جداً";
    
    const voiceName = gender === 'male' ? 'Kore' : 'Puck';

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `${stylePrompt}: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return decodeAudio(base64Audio);
    }
    return null;
  } catch (error) {
    console.error("TTS Generation Error:", error);
    return null;
  }
}
