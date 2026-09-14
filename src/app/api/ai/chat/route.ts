import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

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

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: `
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
      `,
    });

    const result = await model.generateContent(message);
    const response = result.response;

    return NextResponse.json({
      success: true,
      message: response.text(),
    });
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
        error: error?.message || "Unable to process the AI request.",
      },
      { status: 500 }
    );
  }
}