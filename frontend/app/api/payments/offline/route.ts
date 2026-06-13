import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { Role } from '@backend/shared/constants/roles';
import { paymentController } from '@backend/api/controllers/PaymentController';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user as STUDENT
    const auth = authenticateAndAuthorize(request, [Role.STUDENT]);
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Parse form data containing the receipt file
    const formData = await request.formData();
    const courseId = formData.get('courseId') as string;
    const amount = formData.get('amount') as string;
    const file = formData.get('receiptFile') as File | null;

    if (!courseId || !amount || !file) {
      return NextResponse.json(
        { success: false, data: null, error: 'Course ID, amount, and receipt file are required.' },
        { status: 400 }
      );
    }

    // 3. Save receipt file to frontend/public/uploads/receipts
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExtension = path.extname(file.name) || '.jpg';
    const filename = `${auth.user.userId}_${courseId}_${Date.now()}${fileExtension}`;
    
    // Dynamically resolve upload path depending on whether server is running from root or frontend folder
    let uploadDir = '';
    if (process.cwd().endsWith('frontend')) {
      uploadDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
    } else {
      uploadDir = path.join(process.cwd(), 'frontend', 'public', 'uploads', 'receipts');
    }

    // Create directories if they do not exist
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const receiptUrl = `/uploads/receipts/${filename}`;

    // 4. Save metadata in backend via Controller
    const result = await paymentController.submitPayment(auth.user.userId, {
      courseId,
      amount,
      receiptUrl,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || 'An error occurred during payment submission.' },
      { status: 500 }
    );
  }
}
