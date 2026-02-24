'use client'

import { useState, useEffect, useRef, useMemo, memo } from 'react'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
    MessageSquare, Send, Paperclip, Search, ArrowLeft,
    Loader2, Check, CheckCheck, User as UserIcon
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import {
    useConversations,
    useMessages,
    useSendMessage,
    useMarkMessagesRead,
    useChatRealtime,
    useTypingIndicator,
} from '@/hooks/use-chat'
import type { ConversationWithDetails, MessageWithSender } from '@/types/chat'

// ============================================
// Conversation List Sidebar
// ============================================

interface ConversationListProps {
    userId: string
    activeConversationId: string | null
    onSelect: (id: string) => void
}

export function ConversationList({ userId, activeConversationId, onSelect }: ConversationListProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [search, setSearch] = useState('')
    const { data: conversations, isLoading } = useConversations(userId)

    const filtered = useMemo(() => {
        if (!conversations) return []
        if (!search) return conversations
        return conversations.filter(conv => {
            const otherParticipant = conv.participants?.find(p => p.user_id !== userId)
            return otherParticipant?.user?.name?.toLowerCase().includes(search.toLowerCase())
        })
    }, [conversations, search, userId])

    return (
        <div className="flex flex-col h-full border-r">
            <div className="p-4 border-b space-y-3">
                <h2 className="font-semibold text-lg">
                    {isAr ? 'المحادثات' : 'Conversations'}
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={isAr ? 'بحث...' : 'Search...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 rtl:pl-3 rtl:pr-9"
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                {isLoading ? (
                    <div className="space-y-2 p-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center gap-3 p-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-24 mb-1" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">{isAr ? 'لا توجد محادثات' : 'No conversations yet'}</p>
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {filtered.map((conv) => (
                            <ConversationItem
                                key={conv.id}
                                conversation={conv}
                                userId={userId}
                                isActive={activeConversationId === conv.id}
                                onClick={() => onSelect(conv.id)}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}

// ============================================
// Conversation Item
// ============================================

interface ConversationItemProps {
    conversation: ConversationWithDetails
    userId: string
    isActive: boolean
    onClick: () => void
}

const ConversationItem = memo(function ConversationItem({ conversation, userId, isActive, onClick }: ConversationItemProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const otherParticipant = conversation.participants?.find(p => p.user_id !== userId)
    const name = otherParticipant?.user?.name || (isAr ? 'مستخدم' : 'User')
    const avatar = otherParticipant?.user?.avatar_url
    const role = otherParticipant?.user?.role

    const lastMessage = conversation.last_message
    const lastMessageTime = lastMessage?.created_at
        ? formatMessageTime(lastMessage.created_at, isAr)
        : ''

    const lastMessagePreview = lastMessage?.content
        ? lastMessage.content.length > 40
            ? lastMessage.content.slice(0, 40) + '...'
            : lastMessage.content
        : lastMessage?.message_type === 'image'
            ? (isAr ? '📷 صورة' : '📷 Image')
            : lastMessage?.message_type === 'file'
                ? (isAr ? '📎 ملف' : '📎 File')
                : ''

    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-start',
                isActive
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted/50'
            )}
        >
            <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={avatar || undefined} />
                <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{lastMessageTime}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate">{lastMessagePreview}</p>
                    {conversation.unread_count > 0 && (
                        <Badge variant="default" className="h-5 min-w-5 px-1.5 text-[10px] shrink-0">
                            {conversation.unread_count}
                        </Badge>
                    )}
                </div>
            </div>
        </button>
    )
})

// ============================================
// Chat Window
// ============================================

interface ChatWindowProps {
    conversationId: string
    userId: string
    userName: string
    onBack?: () => void
}

export function ChatWindow({ conversationId, userId, userName, onBack }: ChatWindowProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [message, setMessage] = useState('')
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const { data: messagePages, isLoading, fetchNextPage, hasNextPage } = useMessages(conversationId)
    const sendMessage = useSendMessage()
    const markRead = useMarkMessagesRead()
    const markReadRef = useRef(markRead)
    markReadRef.current = markRead
    const { data: conversations } = useConversations(userId)

    // Real-time subscription
    useChatRealtime(conversationId, userId)

    // Typing indicator
    const { setTyping, getTypingUsers } = useTypingIndicator(conversationId, userId, userName)

    // Get other participant info
    const currentConversation = conversations?.find(c => c.id === conversationId)
    const otherParticipant = currentConversation?.participants?.find(p => p.user_id !== userId)
    const otherName = otherParticipant?.user?.name || (isAr ? 'مستخدم' : 'User')
    const otherAvatar = otherParticipant?.user?.avatar_url
    const otherRole = otherParticipant?.user?.role

    // Flatten messages (they come in pages, newest first)
    const messages = useMemo(() => {
        if (!messagePages?.pages) return []
        return messagePages.pages.flat().reverse()
    }, [messagePages])

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages.length])

    // Mark messages as read when viewing
    useEffect(() => {
        if (conversationId && userId) {
            markReadRef.current.mutate({ conversationId, userId })
        }
    }, [conversationId, userId])

    const handleSend = async () => {
        const trimmed = message.trim()
        if (!trimmed) return

        setMessage('')
        setTyping(false)

        try {
            await sendMessage.mutateAsync({
                conversation_id: conversationId,
                sender_id: userId,
                content: trimmed,
                message_type: 'text',
            })
        } catch {
            toast.error(isAr ? 'فشل إرسال الرسالة' : 'Failed to send message')
        }

        inputRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value)
        setTyping(e.target.value.length > 0)
    }

    const getRoleLabel = (role?: string) => {
        if (!role) return ''
        const labels: Record<string, { en: string; ar: string }> = {
            team_leader: { en: 'Team Leader', ar: 'قائد الفريق' },
            client: { en: 'Client', ar: 'عميل' },
            admin: { en: 'Admin', ar: 'مدير' },
        }
        return isAr ? labels[role]?.ar || role : labels[role]?.en || role
    }

    return (
        <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <Avatar className="h-9 w-9">
                    <AvatarImage src={otherAvatar || undefined} />
                    <AvatarFallback>{otherName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-medium text-sm">{otherName}</p>
                    <p className="text-xs text-muted-foreground">{getRoleLabel(otherRole)}</p>
                </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Load more */}
                {hasNextPage && (
                    <div className="flex justify-center">
                        <Button variant="ghost" size="sm" onClick={() => fetchNextPage()}>
                            {isAr ? 'تحميل المزيد' : 'Load More'}
                        </Button>
                    </div>
                )}

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={cn('flex gap-2', i % 2 === 0 ? 'justify-end' : '')}>
                                <Skeleton className="h-12 w-48 rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
                        <p className="text-sm">{isAr ? 'ابدأ المحادثة...' : 'Start the conversation...'}</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((msg, idx) => {
                            const isMine = msg.sender_id === userId
                            const showDate = idx === 0 || !isSameDay(
                                new Date(messages[idx - 1].created_at),
                                new Date(msg.created_at)
                            )
                            return (
                                <div key={msg.id}>
                                    {showDate && (
                                        <div className="flex justify-center my-4">
                                            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                                {formatDateLabel(msg.created_at, isAr)}
                                            </span>
                                        </div>
                                    )}
                                    <MessageBubble message={msg} isMine={isMine} isAr={isAr} />
                                </div>
                            )
                        })}
                    </AnimatePresence>
                )}

                {/* Typing indicator */}
                {getTypingUsers().length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        <span>{isAr ? 'يكتب...' : 'typing...'}</span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="border-t p-4">
                <div className="flex items-center gap-2">
                    <Input
                        ref={inputRef}
                        value={message}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isAr ? 'اكتب رسالة...' : 'Type a message...'}
                        className="flex-1"
                        dir={isAr ? 'rtl' : 'ltr'}
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!message.trim() || sendMessage.isPending}
                    >
                        {sendMessage.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ============================================
// Message Bubble
// ============================================

interface MessageBubbleProps {
    message: MessageWithSender
    isMine: boolean
    isAr: boolean
}

const MessageBubble = memo(function MessageBubble({ message, isMine, isAr }: MessageBubbleProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('flex gap-2', isMine ? 'justify-end' : 'justify-start')}
        >
            {!isMine && (
                <Avatar className="h-7 w-7 mt-1 shrink-0">
                    <AvatarImage src={message.sender?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                        {message.sender?.name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                </Avatar>
            )}
            <div
                className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2',
                    isMine
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                )}
            >
                {message.message_type === 'image' && message.file_url ? (
                    <img
                        src={message.file_url}
                        alt={message.file_name || 'image'}
                        className="rounded-lg max-w-full max-h-64 object-contain"
                        loading="lazy"
                    />
                ) : message.message_type === 'file' && message.file_url ? (
                    <a
                        href={message.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 underline"
                    >
                        <Paperclip className="h-3.5 w-3.5" />
                        {message.file_name || (isAr ? 'ملف' : 'File')}
                    </a>
                ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                )}
                <div className={cn(
                    'flex items-center gap-1 mt-1',
                    isMine ? 'justify-end' : 'justify-start'
                )}>
                    <span className={cn(
                        'text-[10px]',
                        isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                        {format(new Date(message.created_at), 'p', { locale: isAr ? ar : enUS })}
                    </span>
                    {isMine && (
                        message.is_read
                            ? <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                            : <Check className="h-3 w-3 text-primary-foreground/70" />
                    )}
                </div>
            </div>
        </motion.div>
    )
})

// ============================================
// Empty Chat State
// ============================================

export function EmptyChat() {
    const locale = useLocale()
    const isAr = locale === 'ar'

    return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-1">
                {isAr ? 'اختر محادثة' : 'Select a conversation'}
            </h3>
            <p className="text-sm">
                {isAr ? 'اختر محادثة من القائمة لبدء المراسلة' : 'Choose a conversation from the list to start messaging'}
            </p>
        </div>
    )
}

// ============================================
// Full Chat Layout (2-panel)
// ============================================

interface ChatLayoutProps {
    userId: string
    userName: string
}

export function ChatLayout({ userId, userName }: ChatLayoutProps) {
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [mobileShowChat, setMobileShowChat] = useState(false)

    const handleSelect = (id: string) => {
        setActiveConversationId(id)
        setMobileShowChat(true)
    }

    const handleBack = () => {
        setMobileShowChat(false)
    }

    return (
        <div className="flex h-[calc(100vh-10rem)] rounded-lg border overflow-hidden bg-background">
            {/* Conversation List - hidden on mobile when chat is open */}
            <div className={cn(
                'w-full md:w-80 lg:w-96 shrink-0',
                mobileShowChat ? 'hidden md:flex md:flex-col' : 'flex flex-col'
            )}>
                <ConversationList
                    userId={userId}
                    activeConversationId={activeConversationId}
                    onSelect={handleSelect}
                />
            </div>

            {/* Chat Window */}
            <div className={cn(
                'flex-1',
                !mobileShowChat ? 'hidden md:flex md:flex-col' : 'flex flex-col'
            )}>
                {activeConversationId ? (
                    <ChatWindow
                        conversationId={activeConversationId}
                        userId={userId}
                        userName={userName}
                        onBack={handleBack}
                    />
                ) : (
                    <EmptyChat />
                )}
            </div>
        </div>
    )
}

// ============================================
// Utility Functions
// ============================================

function formatMessageTime(dateStr: string, isAr: boolean): string {
    const date = new Date(dateStr)
    if (isToday(date)) {
        return format(date, 'p', { locale: isAr ? ar : enUS })
    }
    if (isYesterday(date)) {
        return isAr ? 'أمس' : 'Yesterday'
    }
    return format(date, 'MM/dd', { locale: isAr ? ar : enUS })
}

function formatDateLabel(dateStr: string, isAr: boolean): string {
    const date = new Date(dateStr)
    if (isToday(date)) return isAr ? 'اليوم' : 'Today'
    if (isYesterday(date)) return isAr ? 'أمس' : 'Yesterday'
    return format(date, 'PPP', { locale: isAr ? ar : enUS })
}


