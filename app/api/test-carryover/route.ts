import { NextRequest, NextResponse } from "next/server";

// Test endpoint to manually trigger carryover for testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date } = body;
    
    if (!date) {
      return NextResponse.json(
        { error: "Date is required (format: YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // Call the carryover API
    const carryoverResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/scheduled-videos/carryover`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date }),
      }
    );

    const carryoverResult = await carryoverResponse.json();

    return NextResponse.json({
      success: true,
      message: `Test carryover triggered for ${date}`,
      carryoverResult,
    });
  } catch (error) {
    console.error("Error in test carryover:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to check current status
export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    return NextResponse.json({
      message: "Test carryover endpoint",
      today,
      yesterday: yesterdayStr,
      instructions: {
        check: `GET /api/scheduled-videos/carryover?date=${yesterdayStr}`,
        trigger: `POST /api/test-carryover with body: { "date": "${yesterdayStr}" }`,
      },
    });
  } catch (error) {
    console.error("Error in test carryover GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}