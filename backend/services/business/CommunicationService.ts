import { discussionRepository, DiscussionPost } from '../../repositories/DiscussionRepository';
import { announcementRepository, Announcement } from '../../repositories/AnnouncementRepository';
import { messageRepository, Conversation, Message } from '../../repositories/MessageRepository';
import { courseRepository } from '../../repositories/CourseRepository';
import { Role } from '../../shared/constants/roles';

export class CommunicationService {
  /**
   * Helper: Check if user is course instructor or admin
   */
  private async checkInstructorOrAdmin(courseId: string, userId: string, role: Role): Promise<void> {
    if (role === Role.ADMIN) return;
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Course not found.');
    }
    if (course.instructorId !== userId) {
      throw new Error('Access denied: You are not the instructor of this course.');
    }
  }

  // --- DISCUSSION BOARD BOARD ---

  async getDiscussionsByCourse(courseId: string): Promise<DiscussionPost[]> {
    return discussionRepository.findByCourseId(courseId);
  }

  async createDiscussionPost(
    courseId: string,
    userId: string,
    content: string,
    parentId?: string | null
  ): Promise<DiscussionPost> {
    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty.');
    }
    return discussionRepository.create({ courseId, userId, content, parentId });
  }

  async deleteDiscussionPost(postId: string, userId: string, role: Role): Promise<void> {
    const post = await discussionRepository.findById(postId);
    if (!post) {
      throw new Error('Post not found.');
    }

    // Admins, Course Instructors, or the Post Author themselves can delete a post
    if (role !== Role.ADMIN && post.userId !== userId) {
      // Check if user is course instructor
      const course = await courseRepository.findById(post.courseId);
      if (!course || course.instructorId !== userId) {
        throw new Error('Access denied: You do not have permission to delete this post.');
      }
    }

    await discussionRepository.delete(postId);
  }

  // --- ANNOUNCEMENTS ---

  async getAnnouncementsByCourse(courseId: string): Promise<Announcement[]> {
    return announcementRepository.findByCourseId(courseId);
  }

  async createAnnouncement(
    courseId: string,
    title: string,
    content: string,
    userId: string,
    role: Role
  ): Promise<Announcement> {
    await this.checkInstructorOrAdmin(courseId, userId, role);

    if (!title || title.trim().length === 0) {
      throw new Error('Title cannot be empty.');
    }
    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty.');
    }

    return announcementRepository.create({ courseId, title, content });
  }

  async deleteAnnouncement(announcementId: string, userId: string, role: Role): Promise<void> {
    const announcement = await announcementRepository.findById(announcementId);
    if (!announcement) {
      throw new Error('Announcement not found.');
    }

    await this.checkInstructorOrAdmin(announcement.courseId, userId, role);
    await announcementRepository.delete(announcementId);
  }

  // --- DIRECT MESSAGING ---

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return messageRepository.getUserConversations(userId);
  }

  async startConversation(userId1: string, userId2: string): Promise<string> {
    if (userId1 === userId2) {
      throw new Error('Cannot start a conversation with yourself.');
    }
    return messageRepository.createConversation(userId1, userId2);
  }

  async getMessages(conversationId: string, userId: string): Promise<Message[]> {
    const isParticipant = await messageRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new Error('Access denied: You are not a participant in this conversation.');
    }
    return messageRepository.getMessagesByConversationId(conversationId);
  }

  async sendDirectMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    const isParticipant = await messageRepository.isParticipant(conversationId, senderId);
    if (!isParticipant) {
      throw new Error('Access denied: You are not a participant in this conversation.');
    }
    if (!content || content.trim().length === 0) {
      throw new Error('Message content cannot be empty.');
    }
    return messageRepository.sendMessage(conversationId, senderId, content);
  }
}

export const communicationService = new CommunicationService();
export default communicationService;
