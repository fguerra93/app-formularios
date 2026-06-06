import { NextResponse } from "next/server";
import { configuracionRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

/**
 * Public config endpoint - only exposes safe, non-sensitive config keys.
 */
const PUBLIC_KEYS = ["ga4_measurement_id", "social_proof_activo"];

export async function GET() {
  try {
    const config = await configuracionRepo.getMany(PUBLIC_KEYS);
    return NextResponse.json(config);
  } catch (e) {
    console.error("Error fetching public config:", e);
    return NextResponse.json({});
  }
}
