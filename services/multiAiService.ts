
import { GoogleGenAI } from "@google/genai";
import { AiProvider, SocialSettings } from "../types";

export interface AiRequest {
  prompt: string;
  systemInstruction?: string;
  settings: SocialSettings;
}

export const askAi = async ({ prompt, systemInstruction, settings }: AiRequest): Promise<string> => {
  // استخدام Gemini كخيار افتراضي أو إذا تم اختياره
  if (settings.aiProvider === AiProvider.Gemini) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || "أنت محاسب خبير في سوق القات اليمني.",
          temperature: 0.7,
        }
      });
      return response.text || "عذراً، لم أستطع معالجة الطلب حالياً.";
    } catch (err) {
      console.error("Gemini MultiAi Error:", err);
      return "خطأ في الاتصال بـ Google AI.";
    }
  }

  // التكامل مع OpenAI
  if (settings.aiProvider === AiProvider.OpenAI && settings.openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemInstruction || "أنت خبير مالي ومحاسبي." },
            { role: "user", content: prompt }
          ]
        })
      });
      const data = await res.json();
      return data.choices[0].message.content;
    } catch (e) {
      return "خطأ في الاتصال بـ OpenAI. تأكد من مفتاح الربط.";
    }
  }

  // التكامل مع DeepSeek
  if (settings.aiProvider === AiProvider.DeepSeek && settings.deepseekKey) {
    try {
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.deepseekKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemInstruction || "أنت خبير بيانات ذكي." },
            { role: "user", content: prompt }
          ]
        })
      });
      const data = await res.json();
      return data.choices[0].message.content;
    } catch (e) {
      return "خطأ في الاتصال بـ DeepSeek. يرجى التحقق من الرصيد والمفتاح.";
    }
  }

  return "الرجاء ضبط إعدادات الذكاء الاصطناعي في لوحة الإعدادات.";
};
