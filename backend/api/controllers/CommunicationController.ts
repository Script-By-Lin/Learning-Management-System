import { communicationService } from '../../services/business/CommunicationService';
import { Role } from '../../shared/constants/roles';

export class CommunicationController {
  // --- FORUMS ---

  async listDiscussions(courseId: string) {
    try {
      if (!courseId) {
        return { success: false, data: null, error: 'Course ID is required.' };
      }
      const posts = await communicationService.getDiscussionsByCourse(courseId);
      return { success: true, data: posts, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to list discussions.' };
    }
  }

  async createDiscussionPost(courseId: string, body: any, userId: string) {
    try {
      const { content, parentId } = body;
      if (!courseId) {
        return { success: false, data: null, error: 'Course ID is required.' };
      }
      if (!content) {
        return { success: false, data: null, error: 'Content is required.' };
      }
      const post = await communicationService.createDiscussionPost(courseId, userId, content, parentId);
      return { success: true, data: post, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to create post.' };
    }
  }

  async deleteDiscussionPost(postId: string, userId: string, role: Role) {
    try {
      if (!postId) {
        return { success: false, data: null, error: 'Post ID is required.' };
      }
      await communicationService.deleteDiscussionPost(postId, userId, role);
      return { success: true, data: { deleted: true }, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to delete post.' };
    }
  }

  // --- ANNOUNCEMENTS ---

  async listAnnouncements(courseId: string) {
    try {
      if (!courseId) {
        return { success: false, data: null, error: 'Course ID is required.' };
      }
      const list = await communicationService.getAnnouncementsByCourse(courseId);
      return { success: true, data: list, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to list announcements.' };
    }
  }

  async createAnnouncement(courseId: string, body: any, userId: string, role: Role) {
    try {
      const { title, content } = body;
      if (!courseId) {
        return { success: false, data: null, error: 'Course ID is required.' };
      }
      if (!title || !content) {
        return { success: false, data: null, error: 'Title and content are required.' };
      }
      const ann = await communicationService.createAnnouncement(courseId, title, content, userId, role);
      return { success: true, data: ann, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to create announcement.' };
    }
  }

  async deleteAnnouncement(announcementId: string, userId: string, role: Role) {
    try {
      if (!announcementId) {
        return { success: false, data: null, error: 'Announcement ID is required.' };
      }
      await communicationService.deleteAnnouncement(announcementId, userId, role);
      return { success: true, data: { deleted: true }, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to delete announcement.' };
    }
  }

  // --- MESSAGING ---

  async listConversations(userId: string) {
    try {
      const list = await communicationService.getUserConversations(userId);
      return { success: true, data: list, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to list conversations.' };
    }
  }

  async startConversation(body: any, userId: string) {
    try {
      const { recipientId } = body;
      if (!recipientId) {
        return { success: false, data: null, error: 'Recipient ID is required.' };
      }
      const conversationId = await communicationService.startConversation(userId, recipientId);
      return { success: true, data: { conversationId }, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to start conversation.' };
    }
  }

  async getMessages(conversationId: string, userId: string) {
    try {
      if (!conversationId) {
        return { success: false, data: null, error: 'Conversation ID is required.' };
      }
      const messages = await communicationService.getMessages(conversationId, userId);
      return { success: true, data: messages, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch messages.' };
    }
  }

  async sendDirectMessage(conversationId: string, body: any, userId: string) {
    try {
      const { content } = body;
      if (!conversationId) {
        return { success: false, data: null, error: 'Conversation ID is required.' };
      }
      if (!content) {
        return { success: false, data: null, error: 'Content is required.' };
      }
      const msg = await communicationService.sendDirectMessage(conversationId, userId, content);
      return { success: true, data: msg, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to send message.' };
    }
  }
}

export const communicationController = new CommunicationController();
export default communicationController;
