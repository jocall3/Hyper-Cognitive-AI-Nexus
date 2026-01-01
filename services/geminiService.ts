import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Check process.env.API_KEY");
  }
  return new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY_FOR_DEMO' });
};

export const generateText = async (prompt: string, modelId: string = "gemini-3-flash-preview", systemInstruction?: string) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: modelId.includes('gemini-3') ? { thinkingBudget: 0 } : undefined // disable thinking for speed in chat
      }
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini GenerateText Error:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const ai = getAIClient();
    // Using generateContent for nano banana series as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");
  } catch (error) {
    console.error("Gemini GenerateImage Error:", error);
    throw error;
  }
};

export const streamText = async function* (prompt: string, modelId: string = "gemini-3-flash-preview", systemInstruction?: string) {
  try {
    const ai = getAIClient();
    const responseStream = await ai.models.generateContentStream({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Gemini StreamText Error:", error);
    yield " [Error generating stream]";
  }
};

export const analyzeImage = async (imageFile: File, prompt: string): Promise<string> => {
    try {
        const ai = getAIClient();
        
        // Convert File to Base64
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Remove data URL prefix (e.g., "data:image/png;base64,")
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
        });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: imageFile.type,
                            data: base64Data
                        }
                    },
                    { text: prompt }
                ]
            }
        });
        return response.text || "No analysis generated.";
    } catch (error) {
        console.error("Gemini Vision Error:", error);
        return "Failed to analyze image.";
    }
}
