import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "faces");
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("face") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "face field is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Desteklenmeyen dosya tipi: ${file.type}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Dosya cok buyuk (max ${MAX_SIZE / (1024 * 1024)} MB)` },
        { status: 400 }
      );
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${uid()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/faces/${filename}`;

    return NextResponse.json(
      {
        success: true,
        upload: {
          id: uid(),
          url: publicUrl,
          thumbnailUrl: publicUrl,
          filename,
          size: file.size,
          type: file.type,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Face upload error:", err);
    return NextResponse.json(
      { error: "Yukleme sirasinda hata olustu" },
      { status: 500 }
    );
  }
}
