import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { Role } from '@backend/shared/constants/roles';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user as ADMIN only
    const auth = authenticateAndAuthorize(request, [Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Parse form data containing the banner file
    const formData = await request.formData();
    const file = formData.get('bannerFile') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, data: null, error: 'Banner file is required.' },
        { status: 400 }
      );
    }

    // 3. Save banner file to public/uploads/banners
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

    const filename = `banner_${Date.now()}${fileExtension}`;
    
    // Dynamically resolve upload path depending on whether server is running from root or frontend folder
    let uploadDir = '';
    if (process.cwd().endsWith('frontend')) {
      uploadDir = path.join(process.cwd(), 'public', 'uploads', 'banners');
    } else {
      uploadDir = path.join(process.cwd(), 'frontend', 'public', 'uploads', 'banners');
    }

    // Create directories if they do not exist
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const bannerUrl = `/uploads/banners/${filename}`;

    return NextResponse.json({
      success: true,
      data: { bannerUrl },
      error: null
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || 'An error occurred during banner upload.' },
      { status: 500 }
    );
  }
}
