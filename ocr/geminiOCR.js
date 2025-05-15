import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function extractTextFromImage(filePath) {
  const imageBase64 = fs.readFileSync(filePath, { encoding: 'base64' });

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Read this image as if you are reading it visually, in natural top-to-bottom order.
                    Return all text exactly as it appears, and convert any math into **AsciiMath** format inline (not separately).
                    Keep the flow natural — like reading a textbook or handwritten notes.`,
          },
          {
            inlineData: {
              mimeType: "image/png",
              data: imageBase64,
            },
          },
        ],
      },
    ],
  };

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${process.env.GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const output = response.data.candidates[0].content.parts[0].text.trim();
    return output;
  } catch (err) {
    console.error("Gemini OCR error:", err.response?.data || err.message);
    throw new Error("Failed to extract text from image.");
  } finally {
    fs.unlinkSync(filePath); // Clean up uploaded image
  }
}
