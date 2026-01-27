'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createUser(data: { email: string; name: string; role: string; password?: string }) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
        return { success: false, error: 'تكوين الخادم (Server Config) غير مكتمل. يرجى إضافة مفتاح الخدمة.' }
    }
    const supabase = createAdminClient()

    // Create user 
    const { data: user, error } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password || '12345678', // Default predictable password if not provided
        email_confirm: true,
        user_metadata: {
            name: data.name,
            role: data.role
        }
    })

    if (error) {
        console.error('Create User Error:', error)
        return { success: false, error: error.message }
    }

    // Explicitly update public user table to ensure consistent state
    // Although trigger handles insertion, specific update ensures role is correct
    if (user.user) {
        const { error: updateError } = await supabase.from('users').update({
            name: data.name,
            role: data.role as any
        }).eq('id', user.user.id)

        if (updateError) console.error('Profile Update Error:', updateError)

        // Automatically create client profile if role is client
        if (data.role === 'client') {
            const { error: clientError } = await supabase.from('clients').insert({
                user_id: user.user.id,
                name: data.name,
                email: data.email,
                company: 'New Client'
            })
            if (clientError) console.error('Client Record Create Error:', clientError)
        }
    }

    revalidatePath('/[locale]/(dashboard)/admin/users')
    return { success: true, user: user.user }
}
