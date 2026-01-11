/**
 * Automation Store
 * Manages camera automation state with Zustand
 */

import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { logError, createAppError } from '@/lib/utils/errorHandler';
import {
    isWithinSchedule,
    getCurrentTime,
    getCurrentDay,
    validateSchedule,
} from '@/lib/automation/automationService';
import type {
    CameraAutomation,
    CameraAutomationDB,
    CreateAutomationInput,
    UpdateAutomationInput,
    DayOfWeek,
} from '@/types/automation';

/**
 * Automation store state
 */
interface AutomationState {
    // State
    automations: CameraAutomation[];
    isLoading: boolean;
    error: string | null;
    lastCheckTime: Date | null;

    // Actions
    fetchAutomations: () => Promise<void>;
    createAutomation: (input: CreateAutomationInput) => Promise<CameraAutomation>;
    updateAutomation: (id: string, updates: UpdateAutomationInput) => Promise<void>;
    deleteAutomation: (id: string) => Promise<void>;
    toggleAutomation: (id: string) => Promise<void>;
    checkAutomations: () => Promise<void>;
    getAutomationsForCamera: (cameraId: string) => CameraAutomation[];
    clearError: () => void;
    reset: () => void;
}

/**
 * Initial state
 */
const initialState = {
    automations: [],
    isLoading: false,
    error: null,
    lastCheckTime: null,
};

/**
 * Convert database record to CameraAutomation
 */
function dbToAutomation(db: CameraAutomationDB): CameraAutomation {
    return {
        id: db.id,
        cameraId: db.camera_id,
        userId: db.user_id,
        name: db.name,
        enabled: db.enabled,
        schedule: {
            startTime: db.start_time,
            endTime: db.end_time,
            recurring: db.recurring,
            daysOfWeek: (db.days_of_week as DayOfWeek[]) || undefined,
        },
        action: db.action,
        createdAt: new Date(db.created_at),
        updatedAt: new Date(db.updated_at),
    };
}

/**
 * Convert CameraAutomation to database record
 */
function automationToDb(automation: Partial<CameraAutomation>): Partial<CameraAutomationDB> {
    const db: Partial<CameraAutomationDB> = {};

    if (automation.cameraId) db.camera_id = automation.cameraId;
    if (automation.name !== undefined) db.name = automation.name;
    if (automation.enabled !== undefined) db.enabled = automation.enabled;
    if (automation.action) db.action = automation.action;

    if (automation.schedule) {
        db.start_time = automation.schedule.startTime;
        db.end_time = automation.schedule.endTime;
        db.recurring = automation.schedule.recurring;
        db.days_of_week = automation.schedule.daysOfWeek || null;
    }

    return db;
}

/**
 * Automation Zustand store
 */
export const useAutomationStore = create<AutomationState>((set, get) => ({
    ...initialState,

    /**
     * Fetch all automations for current user
     */
    fetchAutomations: async () => {
        if (!isSupabaseConfigured) {
            console.warn('[AutomationStore] Supabase not configured');
            set({ automations: [], isLoading: false });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const { data, error } = await supabase
                .from('camera_automations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const automations = (data || []).map(dbToAutomation);
            set({ automations, error: null });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch automations';
            logError(error, 'AutomationStore.fetchAutomations');
            set({ error: message });
        } finally {
            set({ isLoading: false });
        }
    },

    /**
     * Create a new automation
     */
    createAutomation: async (input) => {
        // Validate schedule
        const validationError = validateSchedule(input.schedule);
        if (validationError) {
            throw createAppError('VALIDATION_ERROR', validationError);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw createAppError('AUTH_ERROR', 'User not authenticated');
        }

        const dbData = automationToDb({
            ...input,
            userId: user.id,
        });

        const { data, error } = await supabase
            .from('camera_automations')
            .insert({
                ...dbData,
                user_id: user.id,
            })
            .select()
            .single();

        if (error) {
            logError(error, 'AutomationStore.createAutomation');
            throw createAppError('CAMERA_ERROR', error.message);
        }

        const newAutomation = dbToAutomation(data);
        set({ automations: [newAutomation, ...get().automations] });

        return newAutomation;
    },

    /**
     * Update an existing automation
     */
    updateAutomation: async (id, updates) => {
        // Validate schedule if provided
        if (updates.schedule) {
            const validationError = validateSchedule(updates.schedule);
            if (validationError) {
                throw createAppError('VALIDATION_ERROR', validationError);
            }
        }

        const dbData = automationToDb(updates);

        const { error } = await supabase
            .from('camera_automations')
            .update({
                ...dbData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            logError(error, 'AutomationStore.updateAutomation');
            throw createAppError('CAMERA_ERROR', error.message);
        }

        set({
            automations: get().automations.map((a) =>
                a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
            ),
        });
    },

    /**
     * Delete an automation
     */
    deleteAutomation: async (id) => {
        const { error } = await supabase
            .from('camera_automations')
            .delete()
            .eq('id', id);

        if (error) {
            logError(error, 'AutomationStore.deleteAutomation');
            throw createAppError('CAMERA_ERROR', error.message);
        }

        set({
            automations: get().automations.filter((a) => a.id !== id),
        });
    },

    /**
     * Toggle automation enabled state
     */
    toggleAutomation: async (id) => {
        const automation = get().automations.find((a) => a.id === id);
        if (!automation) return;

        await get().updateAutomation(id, { enabled: !automation.enabled });
    },

    /**
     * Check all automations and update active states
     * Should be called periodically (e.g., every minute)
     */
    checkAutomations: async () => {
        const currentTime = getCurrentTime();
        const currentDay = getCurrentDay();
        const now = new Date();

        const { automations } = get();
        const updatedAutomations = automations.map((automation) => {
            if (!automation.enabled) {
                return { ...automation, isCurrentlyActive: false };
            }

            const shouldBeActive = isWithinSchedule(
                currentTime,
                currentDay,
                automation.schedule
            );

            return {
                ...automation,
                isCurrentlyActive: shouldBeActive,
            };
        });

        set({
            automations: updatedAutomations,
            lastCheckTime: now,
        });
    },

    /**
     * Get all automations for a specific camera
     */
    getAutomationsForCamera: (cameraId) => {
        return get().automations.filter((a) => a.cameraId === cameraId);
    },

    /**
     * Clear error state
     */
    clearError: () => set({ error: null }),

    /**
     * Reset store to initial state
     */
    reset: () => set(initialState),
}));
