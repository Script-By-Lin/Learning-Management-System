import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@backend/middleware/authMiddleware';
import { Role } from '@backend/shared/constants/roles';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const userPayload = authenticate(request);
    if (!userPayload) {
      return NextResponse.json(
        { success: false, data: null, error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    // 2. Parse form data containing the avatar file
    const formData = await request.formData();
    const file = formData.get('avatarFile') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, data: null, error: 'Avatar file is required.' },
        { status: 400 }
      );
    }

    // 3. Save avatar file to public/uploads/avatars
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExtension = path.extname(file.name) || '.jpg';
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      return NextResponse.json(
        { success: false, data: null, error: 'Only image files are allowed (.jpg, .jpeg, .png, .webp, .gif).' },
        { status: 400 }
      );
    }

    const filename = `avatar_${userPayload.userId}_${Date.now()}${fileExtension}`;
    
    // Dynamically resolve upload path depending on whether server is running from root or frontend folder
    let uploadDir = '';
    if (process.cwd().endsWith('frontend')) {
      uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    } else {
      uploadDir = path.join(process.cwd(), 'frontend', 'public', 'uploads', 'avatars');
    }

    // Create directories if they do not exist
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    return NextResponse.json({
      success: true,
      data: { avatarUrl },
      error: null
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || 'An error occurred during avatar upload.' },
      { status: 500 }
    );
  }
}
