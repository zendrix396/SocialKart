import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProductListing } from "../types";

// Schema for the structured output
const listingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy, SEO-friendly product title." },
    price: { type: Type.STRING, description: "A realistic price with currency symbol (e.g. $49.99)." },
    description: { type: Type.STRING, description: "A compelling marketing description for the product (approx 50 words)." },
    features: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 4-5 key product features or benefits.",
    },
    category: { type: Type.STRING, description: "The general category of the product." },
    rating: { type: Type.NUMBER, description: "A simulated rating between 3.5 and 5.0." },
  },
  required: ["title", "price", "description", "features", "category", "rating"],
};

export const generateListingFromUrl = async (url: string): Promise<ProductListing | null> => {
  if (!process.env.API_KEY) {
    console.error("API Key is missing.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Since we cannot actually browse the live URL from the client, 
    // we ask Gemini to hallucinate a plausible product based on the URL structure or keywords,
    // or fallback to a high-quality example if the URL is generic.
    const prompt = `
      You are an expert e-commerce copywriter.
      The user has provided this URL: "${url}".
      
      Task: Create a highly professional, Amazon-style product listing for the product likely featured in this post.
      
      If the URL contains specific keywords (like 'hoodie', 'tech', 'shoes'), use them to infer the product.
      If the URL is generic or unreadable, invent a trending "Eco-Friendly Smart Water Bottle" or a "Minimalist Mechanical Keyboard" as a placeholder example.
      
      The tone should be persuasive, professional, and sales-oriented.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: listingSchema,
        systemInstruction: "You are a helpful AI assistant that generates e-commerce metadata.",
      },
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text) as ProductListing;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

