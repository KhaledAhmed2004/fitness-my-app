export type ExtractedNutrition = {
  name?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingSize?: string;
};

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export async function extractNutritionFromImage(base64Image: string): Promise<ExtractedNutrition | null> {
  if (!GEMINI_API_KEY) {
    console.warn('No Gemini API Key found in EXPO_PUBLIC_GEMINI_API_KEY');
    return null;
  }

  const prompt = `
You are a nutrition extraction AI. I am providing you with an image of a food nutrition label and/or the packaging.
Please extract the nutritional information.
Focus on extracting the total calories, protein, carbohydrates, and fat per serving or per 100g, whatever is clearly visible. If both are available, prefer 'per serving' and note the serving size.
Return ONLY a raw valid JSON object (without markdown code blocks, do not include \`\`\`json or \`\`\`) with the following exact structure:
{
  "name": "Food name if identifiable from the package, else leave null",
  "calories": number (calories / kcal),
  "proteinG": number (protein in grams),
  "carbsG": number (total carbohydrates in grams),
  "fatG": number (total fat in grams),
  "servingSize": "String describing the serving size if available, else null"
}
If any value is not found, use 0 for numbers and null for strings.
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Keep it low for deterministic JSON output
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      console.error('No text response from Gemini');
      return null;
    }

    // Clean up potential markdown formatting if the model disobeys and includes it
    const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed: ExtractedNutrition = JSON.parse(cleanJson);
      return parsed;
    } catch (parseError) {
      console.error('Failed to parse JSON from Gemini:', textResponse);
      return null;
    }
  } catch (error) {
    console.error('Network or unknown error during Gemini API call:', error);
    return null;
  }
}
