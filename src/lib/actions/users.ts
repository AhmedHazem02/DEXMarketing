'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/** Roles that require a department to be set */
const DEPARTMENT_REQUIRED_ROLES = ['team_leader', 'creator', 'videographer', 'editor', 'photographer'] as const

/** Auto-assign department based on role if not explicitly provided */
function resolveDepartment(role: string, department?: string): string | null {
    if (department) return department
    if (['videographer', 'editor', 'photographer'].includes(role)) return 'photography'
    if (role === 'creator') return 'content'
    return null
}

export async function createUser(data: {
    email: string
    name: string
    role: string
    department?: string
    password?: string
}) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
        return { success: false, error: 'تكوين الخادم (Server Config) غير مكتمل. يرجى إضافة مفتاح الخدمة.' }
    }

    const department = resolveDepartment(data.role, data.department)

    // Validate: department-specific roles must have a department
    if (DEPARTMENT_REQUIRED_ROLES.includes(data.role as any) && !department) {
        return { success: false, error: 'هذا الدور يتطلب تحديد القسم (photography أو content)' }
    }

    const supabase = createAdminClient()

    // Create user in Supabase Auth
    const { data: user, error } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password || '12345678',
        email_confirm: true,
        user_metadata: {
            name: data.name,
            role: data.role,
            department,
        }
    })

    if (error) {
        console.error('Create User Error:', error)
        return { success: false, error: error.message }
    }

    if (user.user) {
        // Update public.users to ensure role & department are correct
        // department column added via migration_v2_departments
        const { error: updateError } = await (supabase
            .from('users') as any)
            .update({
                name: data.name,
                role: data.role,
                department,
            })
            .eq('id', user.user.id)

        if (updateError) console.error('Profile Update Error:', updateError)

        // Auto-create client record for client role
        if (data.role === 'client') {
            const { error: clientError } = await supabase
                .from('clients')
                .insert({
                    user_id: user.user.id,
                    name: data.name,
                    email: data.email,
                    company: 'New Client',
                } as any)
            if (clientError) console.error('Client Record Create Error:', clientError)
        }
    }

    revalidatePath('/[locale]/(dashboard)/admin/users')
    return { success: true, user: user.user }
}

/**
 * Update current user profile (name, phone, avatar)
 */
export async function updateProfile(data: {
    userId: string
    name?: string
    phone?: string
    avatar_url?: string
}) {
    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url

    const { data: updatedUser, error } = await supabase
        .from('users')
        // @ts-ignore - Supabase types don't match our schema yet
        .update(updateData)
        .eq('id', data.userId)
        .select()
        .single()

    if (error) {
        console.error('Update Profile Error:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/[locale]/(dashboard)/account')
    revalidatePath('/[locale]/(dashboard)/profile')
    return { success: true, user: updatedUser }
}

/**
 * Update user email (requires admin)
 */
export async function updateEmail(userId: string, newEmail: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        email: newEmail,
        email_confirm: true
    })

    if (error) {
        console.error('Update Email Error:', error)
        return { success: false, error: error.message }
    }

    // Update in users table too
    await supabase
        .from('users')
        // @ts-ignore - Supabase types don't match our schema yet
        .update({ email: newEmail })
        .eq('id', userId)

    revalidatePath('/[locale]/(dashboard)/account')
    return { success: true, user: data.user }
}

/**
 * Update user password
 */
export async function updatePassword(userId: string, newPassword: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
    })

    if (error) {
        console.error('Update Password Error:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Delete user account
 */
export async function deleteAccount(userId: string) {
    const supabase = createAdminClient()

    // First, deactivate the user
    await supabase
        .from('users')
        // @ts-ignore - Supabase types don't match our schema yet
        .update({ is_active: false })
        .eq('id', userId)

    // Then delete from auth
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
        console.error('Delete Account Error:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}
