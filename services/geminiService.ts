import { GoogleGenAI, Type, Schema } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const suggestSubtasks = async (taskText: string): Promise<string[]> => {
  if (!apiKey) {
    console.warn("API Key is missing. Skipping AI suggestion.");
    return [];
  }

  try {
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        subtasks: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A list of 3-5 actionable subtasks to complete the main goal."
        }
      },
      required: ["subtasks"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Break down the following task into smaller, actionable steps: "${taskText}". keep it brief and direct. Language: Thai.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    const result = JSON.parse(jsonText) as { subtasks: string[] };
    return result.subtasks || [];
  } catch (error) {
    console.error("Error generating subtasks:", error);
    return [];
  }
};