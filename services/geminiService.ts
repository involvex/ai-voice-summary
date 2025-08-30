import { GoogleGenAI, Type } from "@google/genai";
import type { SummaryResult } from '../types.ts';

export async function summarizeAudio(
  base64Audio: string, 
  mimeType: string, 
  language: string,
  apiKey: string
): Promise<SummaryResult> {
  if (!apiKey) {
    throw new Error("Gemini API key is not provided.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-2.5-flash";

  const audioPart = {
    inlineData: {
      data: base64Audio,
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: `You are an expert audio analyst. Listen to this audio carefully. 
    1. Provide a concise summary of the audio content in 2-5 lines.
    2. Suggest 3 short, distinct, and plausible replies to the message.
    3. The entire response, including summary and replies, must be in ${language}.
    4. Your response must be in JSON format according to the provided schema.`,
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [audioPart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: `A 2-5 line summary of the audio in ${language}.`,
            },
            replies: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: `An array of 3 short, possible replies in ${language}.`,
            },
          },
          required: ["summary", "replies"],
        },
      },
    });

    const jsonText = response.text.trim();
    // Validate if the text is a valid JSON.
    try {
        const parsedResult = JSON.parse(jsonText);
        // Basic validation of the parsed structure
        if (parsedResult && typeof parsedResult.summary === 'string' && Array.isArray(parsedResult.replies)) {
            return parsedResult as SummaryResult;
        } else {
            throw new Error("Parsed JSON does not match the expected structure.");
        }
    } catch(e) {
        console.error("Failed to parse JSON response:", jsonText);
        throw new Error("The API returned an invalid JSON format. The raw response was: " + jsonText);
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get a response from the AI model.");
  }
}