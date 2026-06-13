import { supabase } from '../core/config/supabase';
import crypto from 'crypto';

export interface Conversation {
  id: string;
  createdAt: string;
  participants?: {
    userId: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      role: string;
    };
  }[];
  lastMessage?: Message | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

export class MessageRepository {
  /**
   * Find a conversation ID between two specific users
   */
  async findConversationBetweenUsers(userId1: string, userId2: string): Promise<string | null> {
    // 1. Get user1's conversation IDs
    const { data: part1, error: err1 } = await supabase
      .from('ConversationParticipant')
      .select('conversationId')
      .eq('userId', userId1);

    if (err1) throw new Error(`Database error: ${err1.message}`);
    if (!part1 || part1.length === 0) return null;

    const convIds = part1.map((p) => p.conversationId);

    // 2. See if user2 is in any of these conversations
    const { data: part2, error: err2 } = await supabase
      .from('ConversationParticipant')
      .select('conversationId')
      .in('conversationId', convIds)
      .eq('userId', userId2)
      .maybeSingle();

    if (err2) throw new Error(`Database error: ${err2.message}`);
    return part2 ? part2.conversationId : null;
  }

  /**
   * Create a conversation between two users
   */
  async createConversation(userId1: string, userId2: string): Promise<string> {
    const existing = await this.findConversationBetweenUsers(userId1, userId2);
    if (existing) return existing;

    const conversationId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Insert Conversation
    const { error: convErr } = await supabase
      .from('Conversation')
      .insert({ id: conversationId, createdAt: now });

    if (convErr) throw new Error(`Database error creating conversation: ${convErr.message}`);

    // 2. Insert Participants
    const { error: partErr } = await supabase
      .from('ConversationParticipant')
      .insert([
        { id: crypto.randomUUID(), conversationId, userId: userId1 },
        { id: crypto.randomUUID(), conversationId, userId: userId2 },
      ]);

    if (partErr) throw new Error(`Database error creating participants: ${partErr.message}`);

    return conversationId;
  }

  /**
   * Fetch all conversations for a user including other participant profiles and the last message
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    // 1. Find all conversation IDs where the user is a participant
    const { data: participants, error: partErr } = await supabase
      .from('ConversationParticipant')
      .select('conversationId')
      .eq('userId', userId);

    if (partErr) throw new Error(`Database error: ${partErr.message}`);
    if (!participants || participants.length === 0) return [];

    const convIds = participants.map((p) => p.conversationId);

    // 2. Fetch all members for all convIds in a single query (batching)
    const { data: allMembers, error: memErr } = await supabase
      .from('ConversationParticipant')
      .select('conversationId, userId, user:User(id, fullName, email, role)')
      .in('conversationId', convIds);

    if (memErr) throw new Error(`Database error: ${memErr.message}`);

    // Group members by conversationId in memory
    const membersMap = new Map<string, any[]>();
    (allMembers || []).forEach((m: any) => {
      const list = membersMap.get(m.conversationId) || [];
      list.push({
        userId: m.userId,
        user: Array.isArray(m.user) ? m.user[0] : m.user,
      });
      membersMap.set(m.conversationId, list);
    });

    // 3. Fetch latest message for every conversation in a single batch
    const { data: latestMessages, error: latestErr } = await supabase
      .from('Message')
      .select('id, conversationId, senderId, receiverId, content, sentAt')
      .in('conversationId', convIds)
      .order('sentAt', { ascending: false });

    if (latestErr) throw new Error(`Database error: ${latestErr.message}`);

    const latestMessageByConversation = new Map<string, any>();
    (latestMessages || []).forEach((msg: any) => {
      if (!latestMessageByConversation.has(msg.conversationId)) {
        latestMessageByConversation.set(msg.conversationId, msg);
      }
    });

    const conversations = convIds.map((cId) => {
      const conversationParticipants = membersMap.get(cId) || [];
      const rawMsg = latestMessageByConversation.get(cId) || null;
      let lastMessage: Message | null = null;

      if (rawMsg) {
        const senderPart = conversationParticipants.find((p) => p.userId === rawMsg.senderId);
        lastMessage = {
          ...rawMsg,
          conversationId: cId,
          createdAt: rawMsg.sentAt,
          sender: senderPart ? senderPart.user : null,
        } as any;
      }

      return {
        id: cId,
        createdAt: new Date().toISOString(), // placeholder
        participants: conversationParticipants,
        lastMessage,
      };
    });

    // Sort by last message time or conversation creation order
    return conversations.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  /**
   * Fetch messages in a conversation
   */
  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    // 1. Get the participants for the conversationId
    const { data: participants, error: partErr } = await supabase
      .from('ConversationParticipant')
      .select('userId')
      .eq('conversationId', conversationId);

    if (partErr) throw new Error(`Database error: ${partErr.message}`);
    if (!participants || participants.length < 2) return [];

    const userId1 = participants[0].userId;
    const userId2 = participants[1].userId;

    // 2. Fetch messages between these two users
    const { data: messages, error } = await supabase
      .from('Message')
      .select('*')
      .eq('conversationId', conversationId)
      .order('sentAt', { ascending: true });

    if (error) throw new Error(`Database error: ${error.message}`);
    if (!messages || messages.length === 0) return [];

    // Map sentAt to createdAt for frontend compatibility
    const formattedMessages = messages.map((m: any) => ({
      ...m,
      conversationId,
      createdAt: m.sentAt,
    }));

    // 3. Fetch sender profiles
    const senderIds = Array.from(new Set(formattedMessages.map((m: any) => m.senderId)));
    const { data: users, error: userErr } = await supabase
      .from('User')
      .select('id, fullName, email, role')
      .in('id', senderIds);

    if (userErr) throw new Error(`Database error: ${userErr.message}`);

    const userMap = new Map<string, any>();
    (users || []).forEach((u) => userMap.set(u.id, u));

    return formattedMessages.map((m: any) => ({
      ...m,
      sender: userMap.get(m.senderId) || null,
    }));
  }

  /**
   * Save a message
   */
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    // 1. Find the recipient in the conversation
    const { data: participants, error: partErr } = await supabase
      .from('ConversationParticipant')
      .select('userId')
      .eq('conversationId', conversationId);

    if (partErr) throw new Error(`Database error: ${partErr.message}`);
    if (!participants || participants.length === 0) {
      throw new Error('Conversation has no participants.');
    }

    const recipient = participants.find((p) => p.userId !== senderId);
    if (!recipient) {
      throw new Error('Recipient not found in conversation.');
    }

    const receiverId = recipient.userId;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      conversationId,
      senderId,
      receiverId,
      content,
      sentAt: now,
    };

    const { data: createdMsg, error } = await supabase
      .from('Message')
      .insert(insertData)
      .select('*')
      .single();

    if (error) throw new Error(`Database error: ${error.message}`);

    // Fetch sender profile
    const { data: user, error: userErr } = await supabase
      .from('User')
      .select('id, fullName, email, role')
      .eq('id', senderId)
      .single();

    if (userErr) throw new Error(`Database error: ${userErr.message}`);

    return {
      ...createdMsg,
      conversationId,
      createdAt: createdMsg.sentAt,
      sender: user,
    };
  }

  /**
   * Check if a user is participant of a conversation
   */
  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('ConversationParticipant')
      .select('*')
      .eq('conversationId', conversationId)
      .eq('userId', userId)
      .maybeSingle();

    if (error) throw new Error(`Database error: ${error.message}`);
    return !!data;
  }
}

export const messageRepository = new MessageRepository();
export default messageRepository;
