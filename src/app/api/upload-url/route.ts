import { NextRequest, NextResponse } from "next/server";
import { storageRepo } from "@/server/repositories";

export async function POST(request: NextRequest) {
  try {
    const { fileName, folderName } = await request.json();

    if (!fileName || !folderName) {
      return NextResponse.json(
        { error: "fileName and folderName are required" },
        { status: 400 }
      );
    }

    const result = await storageRepo.createSignedUploadUrl(folderName, fileName);

    return NextResponse.json({
      signedUrl: result.signedUrl,
      token: result.token,
      publicUrl: result.publicUrl,
    });
  } catch (err) {
    console.error("Upload URL error:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
