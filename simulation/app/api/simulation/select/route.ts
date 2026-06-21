import { NextResponse } from "next/server";
import {
  AISelectionRateLimitError,
  getAIComponentSelection,
} from "@/lib/simulation/aiComponentSelector";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { productIdea?: unknown };
    const productIdea =
      typeof body.productIdea === "string" ? body.productIdea.trim() : "";

    if (productIdea.length < 2 || productIdea.length > 500) {
      return NextResponse.json(
        { error: "Please provide a product idea between 2 and 500 characters." },
        { status: 400 },
      );
    }

    const result = await getAIComponentSelection(productIdea);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI component selection failed:", error);
    if (error instanceof AISelectionRateLimitError) {
      return NextResponse.json(
        {
          canBuild: false,
          confidence: "low",
          message: null,
          errorMessage: `Gemini's free tier is handling too many requests. Please wait about ${error.retryAfterSeconds} seconds, then try again.`,
          errorCode: "RATE_LIMIT",
          retryAfterSeconds: error.retryAfterSeconds,
          steps: [],
          processSteps: [],
        },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSeconds) },
        },
      );
    }
    return NextResponse.json(
      {
        canBuild: false,
        confidence: "low",
        message: null,
        errorMessage:
          "We could not analyse your idea right now. Please try again in a moment.",
        steps: [],
        processSteps: [],
      },
      { status: 503 },
    );
  }
}
