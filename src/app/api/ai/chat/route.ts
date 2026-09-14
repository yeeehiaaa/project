import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_INSTRUCTION = `
You are MediConnect AI, a healthcare assistant.

Your role is to:
- Help patients understand health information.
- Explain symptoms, medications, laboratory results, and general health concepts.
- Ask useful follow-up questions when appropriate.
- Help patients understand what type of healthcare professional they may need.

Important safety rules:
- You are NOT a doctor.
- Never claim to provide a definitive diagnosis.
- Never prescribe medication or tell a patient to change a prescribed treatment.
- For potentially serious or emergency symptoms, recommend urgent medical care or emergency medical services.
- Encourage consultation with a qualified healthcare professional when appropriate.
- Be clear, calm, professional, and empathetic.
- Respond in the same language as the patient whenever possible.

This is an AI assistance and orientation tool, not a replacement for professional medical care.
`;

async function generateWithRetry(
  modelName: string,
  message: string,
  retries = 2
) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(message);
      return result.response.text();
    } catch (error: any) {
      console.error(
        `Gemini ${modelName} attempt ${attempt + 1} failed:`,
        error?.message
      );

      const status = error?.status;

      // Retry only temporary server/rate-limit errors.
      if (
        attempt < retries &&
        (status === 503 || status === 429 || status === 500)
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );

        continue;
      }

      throw error;
    }
  }

  throw new Error("Gemini request failed.");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body?.message;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    /*
     * Primary model
     */
    try {
      const response = await generateWithRetry(
        "gemini-3.6-flash",
        message,
        2
      );

      return NextResponse.json({
        success: true,
        message: response,
      });
    } catch (primaryError: any) {
      console.error(
        "Primary Gemini model failed:",
        primaryError?.message
      );

      /*
       * Fallback model
       */
      try {
        const response = await generateWithRetry(
          "gemini-3.5-flash",
          message,
          1
        );

        return NextResponse.json({
          success: true,
          message: response,
        });
      } catch (fallbackError: any) {
        console.error(
          "Fallback Gemini model failed:",
          fallbackError?.message
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "The AI service is temporarily unavailable. Please try again in a moment.",
          },
          { status: 503 }
        );
      }
    }
  } catch (error: any) {
    console.error("========== GEMINI API ERROR ==========");
    console.error("Message:", error?.message);
    console.error("Status:", error?.status);
    console.error("Code:", error?.code);
    console.error("Full error:", error);
    console.error("======================================");

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to process your request right now. Please try again.",
      },
      { status: 500 }
    );
  }
}