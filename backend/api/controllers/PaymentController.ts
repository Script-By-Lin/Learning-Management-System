import { courseService } from '../../services/business/CourseService';

export class PaymentController {
  /**
   * Submit student manual offline payment receipt
   */
  async submitPayment(userId: string, body: any) {
    try {
      const { courseId, amount, receiptUrl } = body;
      if (!courseId || !amount || !receiptUrl) {
        return {
          success: false,
          data: null,
          error: 'Course ID, amount, and receipt URL are required.',
        };
      }

      const payment = await courseService.submitOfflinePayment(userId, courseId, amount, receiptUrl);
      return {
        success: true,
        data: { payment },
        error: null,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to submit payment receipt.',
      };
    }
  }

  /**
   * Check offline payment status for a user and course
   */
  async checkPaymentStatus(userId: string, courseId: string) {
    try {
      if (!courseId) {
        return {
          success: false,
          data: null,
          error: 'Course ID is required.',
        };
      }

      const payment = await courseService.getOfflinePaymentStatus(userId, courseId);
      return {
        success: true,
        data: { payment },
        error: null,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to check payment status.',
      };
    }
  }

  /**
   * List all payments (Admin only)
   */
  async listPayments() {
    try {
      const payments = await courseService.getOfflinePayments();
      return {
        success: true,
        data: { payments },
        error: null,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to list payment requests.',
      };
    }
  }

  /**
   * Review/Approve/Reject offline manual payment (Admin only)
   */
  async reviewPayment(paymentId: string, body: any) {
    try {
      const { status } = body;
      if (!status || (status !== 'APPROVED' && status !== 'REJECTED')) {
        return {
          success: false,
          data: null,
          error: 'Status is required and must be either APPROVED or REJECTED.',
        };
      }

      const payment = await courseService.reviewOfflinePayment(paymentId, status);
      return {
        success: true,
        data: { payment },
        error: null,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to review payment request.',
      };
    }
  }
}

export const paymentController = new PaymentController();
export default paymentController;
