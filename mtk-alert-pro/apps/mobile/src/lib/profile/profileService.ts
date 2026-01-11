/**
 * Profile Service
 * Handles profile CRUD operations with Supabase
 * 
 * @module lib/profile/profileService
 */

import { supabase } from '@/lib/supabase/client';
import { logError } from '@/lib/utils/errorHandler';

// ============================================================================
// Types
// ============================================================================

export interface UserProfile {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProfileUpdateData {
    displayName?: string;
    phone?: string;
    avatarUrl?: string;
}

export interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
}

// ============================================================================
// Profile Operations
// ============================================================================

/**
 * Get current user's profile
 */
export async function getProfile(): Promise<UserProfile | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        return {
            id: data.id,
            email: user.email || '',
            displayName: data.display_name || '',
            avatarUrl: data.avatar_url,
            phone: data.phone,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
        };
    } catch (error) {
        console.error('[ProfileService] Get profile error:', error);
        logError(error, 'ProfileService.getProfile');
        return null;
    }
}

/**
 * Update user profile
 */
export async function updateProfile(data: ProfileUpdateData): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (data.displayName !== undefined) {
            updates.display_name = data.displayName;
        }
        if (data.phone !== undefined) {
            updates.phone = data.phone;
        }
        if (data.avatarUrl !== undefined) {
            updates.avatar_url = data.avatarUrl;
        }

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) throw error;

        // Also update auth metadata
        if (data.displayName) {
            await supabase.auth.updateUser({
                data: { display_name: data.displayName }
            });
        }

        console.log('[ProfileService] Profile updated');
        return true;
    } catch (error) {
        console.error('[ProfileService] Update profile error:', error);
        logError(error, 'ProfileService.updateProfile');
        return false;
    }
}

/**
 * Change user password
 */
export async function changePassword(data: PasswordChangeData): Promise<{ success: boolean; error?: string }> {
    try {
        // First verify current password by re-authenticating
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) throw new Error('Not authenticated');

        // Re-authenticate with current password
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: data.currentPassword,
        });

        if (signInError) {
            return { success: false, error: 'Current password is incorrect' };
        }

        // Update to new password
        const { error: updateError } = await supabase.auth.updateUser({
            password: data.newPassword,
        });

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        console.log('[ProfileService] Password changed');
        return { success: true };
    } catch (error) {
        console.error('[ProfileService] Change password error:', error);
        logError(error, 'ProfileService.changePassword');
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to change password'
        };
    }
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(uri: string): Promise<string | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Read file and convert to blob
        const response = await fetch(uri);
        const blob = await response.blob();

        const fileExt = uri.split('.').pop() || 'jpg';
        const fileName = `${user.id}/avatar.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(fileName, blob, {
                upsert: true,
                contentType: `image/${fileExt}`,
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        // Update profile with avatar URL
        await updateProfile({ avatarUrl: publicUrl });

        console.log('[ProfileService] Avatar uploaded:', publicUrl);
        return publicUrl;
    } catch (error) {
        console.error('[ProfileService] Upload avatar error:', error);
        logError(error, 'ProfileService.uploadAvatar');
        return null;
    }
}

/**
 * Delete user account
 */
export async function deleteAccount(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Delete profile data first
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id);

        if (profileError) {
            console.warn('[ProfileService] Profile delete warning:', profileError);
        }

        // Note: Actual user deletion requires admin API
        // For now, sign out the user
        await supabase.auth.signOut();

        console.log('[ProfileService] Account deletion initiated');
        return true;
    } catch (error) {
        console.error('[ProfileService] Delete account error:', error);
        logError(error, 'ProfileService.deleteAccount');
        return false;
    }
}

/**
 * Restore purchases (verify subscription status)
 */
export async function restorePurchases(): Promise<{ restored: boolean; tier?: string }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('profiles')
            .select('subscription_tier, subscription_expires_at')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        const tier = data?.subscription_tier || 'free';
        const expiresAt = data?.subscription_expires_at;

        // Check if subscription is still valid
        const isValid = expiresAt && new Date(expiresAt) > new Date();

        if (isValid && tier !== 'free') {
            console.log('[ProfileService] Subscription restored:', tier);
            return { restored: true, tier };
        }

        return { restored: false };
    } catch (error) {
        console.error('[ProfileService] Restore purchases error:', error);
        logError(error, 'ProfileService.restorePurchases');
        return { restored: false };
    }
}

// Export singleton
export const profileService = {
    getProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAccount,
    restorePurchases,
};

export default profileService;
