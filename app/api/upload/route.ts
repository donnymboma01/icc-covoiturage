import { writeFile, mkdir } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData()
        const file: File | null = data.get('file') as unknown as File
        const userId = data.get('userId') as string

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes);

        const uploadDir = path.join(process.cwd(), 'public/uploads/profile-pictures')
        await mkdir(uploadDir, { recursive: true })

        const filename = `${userId}-${Date.now()}-${file.name}`
        const filepath = path.join(uploadDir, filename)

        await writeFile(filepath, buffer)

        return NextResponse.json({
            success: true,
            filepath: `/uploads/profile-pictures/${filename}`
        })
    } catch (error) {
        console.error(error);
        return NextResponse.json({
            success: false,
            error: 'Upload failed'
        })
    }
}
