import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET() {
  const authenticated = await verifyAuth();
  return NextResponse.json({ authenticated });
}
