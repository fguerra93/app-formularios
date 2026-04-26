import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { fileName, folderName, contentType } = await request.json();

    if (!fileName || !folderName) {
      return NextResponse.json(
        { error: "fileName and folderName are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const filePath = `${folderName}/${fileName}`;

    const { data, error } = await supabase.storage
      .from("formularios-archivos")
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error("Error creating signed URL:", error);
      return NextResponse.json(
        { error: "Error generando URL de subida" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("formularios-archivos")
      .getPublicUrl(filePath);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      publicUrl,
    });
  } catch (err) {
    console.error("Upload URL error:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
