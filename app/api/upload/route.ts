import { writeFile, mkdir } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const userId = data.get("userId") as string;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" });
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error:
          "File type not supported. Please upload JPEG, PNG or WebP images only.",
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: "File size exceeds 10MB limit",
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(
      process.cwd(),
      "public/uploads/profile-pictures"
    );
    await mkdir(uploadDir, { recursive: true });

    const fileExtension = path.extname(file.name);
    const filename = `${userId}-${Date.now()}${fileExtension}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({
      success: true,
      filepath: `/uploads/profile-pictures/${filename}`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({
      success: false,
      error: "Upload failed. Please try again.",
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

// import { writeFile, mkdir } from 'fs/promises'
// import { NextRequest, NextResponse } from 'next/server'
// import path from 'path'

// export async function POST(request: NextRequest) {
//     try {
//         const data = await request.formData()
//         const file: File | null = data.get('file') as unknown as File
//         const userId = data.get('userId') as string

//         if (!file) {
//             return NextResponse.json({ success: false, error: 'No file provided' })
//         }

//         const bytes = await file.arrayBuffer()
//         const buffer = Buffer.from(bytes);

//         const uploadDir = path.join(process.cwd(), 'public/uploads/profile-pictures')
//         await mkdir(uploadDir, { recursive: true })

//         const filename = `${userId}-${Date.now()}-${file.name}`
//         const filepath = path.join(uploadDir, filename)

//         await writeFile(filepath, buffer)

//         return NextResponse.json({
//             success: true,
//             filepath: `/uploads/profile-pictures/${filename}`
//         })
//     } catch (error) {
//         console.error(error);
//         return NextResponse.json({
//             success: false,
//             error: 'Upload failed'
//         })
//     }
// }
