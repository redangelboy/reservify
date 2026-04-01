import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get("session")?.value;
    
    if (!session) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const data = JSON.parse(session);
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}