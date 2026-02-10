'use client'

// NOTE: Supabase types for new tables (conversations, messages, etc.)
// will resolve after running migration_v2_departments.sql and regenerating types.
// Until then, some queries below use @ts-ignore to bypass 'never' type errors.

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
    ConversationWithDetails,
    MessageWithSender,
    SendMessageInput,
    CreateConversationInput,
} from '@/types/chat'

// ============================================
// Query Keys
// ============================================

export const chatKeys = {
    all: ['chat'] as const,
    conversations: () => [...chatKeys.all, 'conversations'] as const,
    conversation: (id: string) => [...chatKeys.all, 'conversation', id] as const,
    messages: (conversationId: string) => [...chatKeys.all, 'messages', conversationId] as const,
    unreadCount: () => [...chatKeys.all, 'unread'] as const,
}

// ============================================
// Fetch all conversations for current user
// ============================================

export function useConversations(userId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: chatKeys.conversations(),
        enabled: !!userId,
        queryFn: async () => {
            // Get conversation IDs where user is a participant
            const { data: participations, error: pError } = await (supabase
                .from('conversation_participants') as any)
                .select('conversation_id')
                .eq('user_id', userId)

            if (pError) throw pError
            if (!participations?.length) return []

            const convIds = participations.map((p: any) => p.conversation_id)

            // Get conversations with participants
            const { data: conversations, error: cError } = await (supabase
                .from('conversations') as any)
                .select(`
                    *,
                    participants:conversation_participants(
                        *,
                        user:users(id, name, email, avatar_url, role)
                    )
                `)
                .in('id', convIds)
                .order('last_message_at', { ascending: false })

            if (cError) throw cError

            // Get last message for each conversation + unread count
            const result: ConversationWithDetails[] = await Promise.all(
                (conversations ?? []).map(async (conv: any) => {
                    // Last message
                    const { data: lastMsg } = await (supabase
                        .from('messages') as any)
                        .select(`
                            *,
                            sender:users!messages_sender_id_fkey(id, name, avatar_url, role)
                        `)
                        .eq('conversation_id', conv.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single()

                    // Find user's last_read_at for unread count
                    const myParticipation = (conv.participants as any[])?.find(
                        (p: any) => p.user_id === userId
                    )
                    const lastReadAt = myParticipation?.last_read_at

                    // Unread messages count
                    let unreadQuery = (supabase
                        .from('messages') as any)
                        .select('id', { count: 'exact', head: true })
                        .eq('conversation_id', conv.id)
                        .neq('sender_id', userId)

                    if (lastReadAt) {
                        unreadQuery = unreadQuery.gt('created_at', lastReadAt)
                    }

                    const { count } = await unreadQuery

                    return {
                        ...conv,
                        last_message: lastMsg as MessageWithSender | null,
                        unread_count: count ?? 0,
                    } as ConversationWithDetails
                })
            )

            return result
        },
        refetchInterval: 30_000, // Refetch every 30s as backup
    })
}

// ============================================
// Fetch messages for a conversation (paginated)
// ============================================

const MESSAGES_PAGE_SIZE = 50

export function useMessages(conversationId: string) {
    const supabase = createClient()

    return useInfiniteQuery({
        queryKey: chatKeys.messages(conversationId),
        enabled: !!conversationId,
        initialPageParam: 0,
        queryFn: async ({ pageParam = 0 }) => {
            const from = pageParam * MESSAGES_PAGE_SIZE
            const to = from + MESSAGES_PAGE_SIZE - 1

            const { data, error } = await (supabase
                .from('messages') as any)
                .select(`
                    *,
                    sender:users!messages_sender_id_fkey(id, name, avatar_url, role)
                `)
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: false })
                .range(from, to)

            if (error) throw error
            return (data ?? []) as MessageWithSender[]
        },
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < MESSAGES_PAGE_SIZE) return undefined
            return allPages.length
        },
    })
}

// ============================================
// Send a message
// ============================================

export function useSendMessage() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (input: SendMessageInput & { sender_id: string }) => {
            const { data, error } = await (supabase
                .from('messages') as any)
                .insert({
                    conversation_id: input.conversation_id,
                    sender_id: input.sender_id,
                    content: input.content,
                    message_type: input.message_type || 'text',
                    file_url: input.file_url || null,
                    file_name: input.file_name || null,
                })
                .select(`
                    *,
                    sender:users!messages_sender_id_fkey(id, name, avatar_url, role)
                `)
                .single()

            if (error) throw error
            return data as MessageWithSender
        },
        onSuccess: (newMessage) => {
            // Optimistic: prepend message to cache
            queryClient.setQueryData(
                chatKeys.messages(newMessage.conversation_id),
                (old: any) => {
                    if (!old) return { pages: [[newMessage]], pageParams: [0] }
                    const newPages = [...old.pages]
                    newPages[0] = [newMessage, ...(newPages[0] || [])]
                    return { ...old, pages: newPages }
                }
            )
            // Refresh conversation list for updated last_message
            queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
        },
    })
}

// ============================================
// Create a conversation
// ============================================

export function useCreateConversation() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (input: CreateConversationInput & { creator_id: string }) => {
            // Check if conversation already exists between these participants
            const allParticipants = [input.creator_id, ...input.participant_ids]

            // Create conversation
            const { data: conversation, error: convError } = await (supabase
                .from('conversations') as any)
                .insert({
                    project_id: input.project_id || null,
                    department: input.department || null,
                })
                .select()
                .single()

            if (convError) throw convError

            // Add all participants
            const participants = allParticipants.map(uid => ({
                conversation_id: conversation.id,
                user_id: uid,
            }))

            const { error: partError } = await (supabase
                .from('conversation_participants') as any)
                .insert(participants)

            if (partError) throw partError

            // Send initial message if provided
            if (input.initial_message) {
                await (supabase
                    .from('messages') as any)
                    .insert({
                        conversation_id: conversation.id,
                        sender_id: input.creator_id,
                        content: input.initial_message,
                        message_type: 'text',
                    })
            }

            return conversation
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
        },
    })
}

// ============================================
// Mark messages as read
// ============================================

export function useMarkMessagesRead() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ conversationId, userId }: { conversationId: string; userId: string }) => {
            // Update participant last_read_at
            const { error } = await (supabase
                .from('conversation_participants') as any)
                .update({ last_read_at: new Date().toISOString() })
                .eq('conversation_id', conversationId)
                .eq('user_id', userId)

            if (error) throw error

            // Mark all unread messages in this conversation as read
            await (supabase
                .from('messages') as any)
                .update({ is_read: true })
                .eq('conversation_id', conversationId)
                .neq('sender_id', userId)
                .eq('is_read', false)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
            queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() })
        },
    })
}

// ============================================
// Total unread messages count
// ============================================

export function useUnreadCount(userId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: chatKeys.unreadCount(),
        enabled: !!userId,
        queryFn: async () => {
            // Get all conversation IDs
            const { data: participations } = await (supabase
                .from('conversation_participants') as any)
                .select('conversation_id, last_read_at')
                .eq('user_id', userId)

            if (!participations?.length) return 0

            let total = 0
            for (const p of participations) {
                let query = (supabase
                    .from('messages') as any)
                    .select('id', { count: 'exact', head: true })
                    .eq('conversation_id', p.conversation_id)
                    .neq('sender_id', userId)

                if (p.last_read_at) {
                    query = query.gt('created_at', p.last_read_at)
                }

                const { count } = await query
                total += count ?? 0
            }

            return total
        },
        refetchInterval: 15_000,
    })
}

// ============================================
// Real-time chat subscription
// ============================================

export function useChatRealtime(conversationId: string, userId: string) {
    const queryClient = useQueryClient()
    const supabase = createClient()

    useEffect(() => {
        if (!conversationId) return

        const channel = supabase
            .channel(`chat:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                async (payload) => {
                    const newMessage = payload.new as any

                    // Skip if sent by current user (already handled optimistically)
                    if (newMessage.sender_id === userId) return

                    // Fetch full message with sender info
                    const { data } = await (supabase
                        .from('messages') as any)
                        .select(`
                            *,
                            sender:users!messages_sender_id_fkey(id, name, avatar_url, role)
                        `)
                        .eq('id', newMessage.id)
                        .single()

                    if (data) {
                        queryClient.setQueryData(
                            chatKeys.messages(conversationId),
                            (old: any) => {
                                if (!old) return { pages: [[data]], pageParams: [0] }
                                const newPages = [...old.pages]
                                newPages[0] = [data, ...(newPages[0] || [])]
                                return { ...old, pages: newPages }
                            }
                        )
                    }

                    // Refresh conversations list
                    queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
                    queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversationId, userId, queryClient, supabase])
}

// ============================================
// Typing indicator (Supabase Presence)
// ============================================

export function useTypingIndicator(conversationId: string, userId: string, userName: string) {
    const supabase = createClient()
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const typingUsersRef = useRef<Map<string, string>>(new Map())

    const setTyping = useCallback((isTyping: boolean) => {
        if (!channelRef.current) return
        channelRef.current.track({
            user_id: userId,
            user_name: userName,
            is_typing: isTyping,
        })
    }, [userId, userName])

    useEffect(() => {
        if (!conversationId || !userId) return

        const channel = supabase.channel(`typing:${conversationId}`, {
            config: { presence: { key: userId } },
        })

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                typingUsersRef.current.clear()
                Object.entries(state).forEach(([key, presences]) => {
                    const presence = (presences as any[])?.[0]
                    if (presence?.is_typing && key !== userId) {
                        typingUsersRef.current.set(key, presence.user_name)
                    }
                })
            })
            .subscribe()

        channelRef.current = channel

        return () => {
            supabase.removeChannel(channel)
            channelRef.current = null
        }
    }, [conversationId, userId, supabase])

    return {
        setTyping,
        getTypingUsers: () => Array.from(typingUsersRef.current.values()),
    }
}

// ============================================
// Find or create conversation between two users
// ============================================

export function useFindOrCreateConversation() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            userId,
            otherUserId,
            department,
            projectId,
        }: {
            userId: string
            otherUserId: string
            department?: string
            projectId?: string
        }) => {
            // Find existing conversations both users are in
            const { data: myConvs } = await (supabase
                .from('conversation_participants') as any)
                .select('conversation_id')
                .eq('user_id', userId)

            if (myConvs?.length) {
                const myConvIds = myConvs.map((c: any) => c.conversation_id)

                const { data: shared } = await (supabase
                    .from('conversation_participants') as any)
                    .select('conversation_id')
                    .eq('user_id', otherUserId)
                    .in('conversation_id', myConvIds)

                // If conversations exist between them, check for 2-person conversations
                if (shared?.length) {
                    for (const s of shared) {
                        const { count } = await (supabase
                            .from('conversation_participants') as any)
                            .select('id', { count: 'exact', head: true })
                            .eq('conversation_id', s.conversation_id)

                        if (count === 2) {
                            return { conversation_id: s.conversation_id, created: false }
                        }
                    }
                }
            }

            // Create new conversation
            const { data: conv, error: convError } = await (supabase
                .from('conversations') as any)
                .insert({
                    department: department || null,
                    project_id: projectId || null,
                })
                .select()
                .single()

            if (convError) throw convError

            const { error: partError } = await (supabase
                .from('conversation_participants') as any)
                .insert([
                    { conversation_id: conv.id, user_id: userId },
                    { conversation_id: conv.id, user_id: otherUserId },
                ])

            if (partError) throw partError

            return { conversation_id: conv.id, created: true }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
        },
    })
}
