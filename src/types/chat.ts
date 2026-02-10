// ============================================
// Chat & Messaging Types
// ============================================

import type { Conversation, ConversationParticipant, Message, User, MessageType } from './database'

/**
 * Conversation with participant details and last message preview
 */
export interface ConversationWithDetails extends Conversation {
    participants: ConversationParticipantWithUser[]
    last_message?: MessageWithSender | null
    unread_count: number
}

/**
 * Participant with user info
 */
export interface ConversationParticipantWithUser extends ConversationParticipant {
    user: Pick<User, 'id' | 'name' | 'email' | 'avatar_url' | 'role'>
}

/**
 * Message with sender info
 */
export interface MessageWithSender extends Message {
    sender: Pick<User, 'id' | 'name' | 'avatar_url' | 'role'>
}

/**
 * Input for creating a new conversation
 */
export interface CreateConversationInput {
    participant_ids: string[]
    project_id?: string
    department?: string
    initial_message?: string
}

/**
 * Input for sending a message
 */
export interface SendMessageInput {
    conversation_id: string
    content: string
    message_type?: MessageType
    file_url?: string
    file_name?: string
}

/**
 * Typing indicator state
 */
export interface TypingState {
    user_id: string
    user_name: string
    conversation_id: string
    is_typing: boolean
}

/**
 * Chat presence state
 */
export interface PresenceState {
    user_id: string
    online_at: string
    is_typing?: boolean
}
