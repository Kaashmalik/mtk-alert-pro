import { useEffect, useState } from 'react';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    LAST_REVIEW_PROMPT: 'last-review-prompt',
    HAPPY_MOMENT_PREFIX: 'happy-moment-',
    REVIEW_REQUESTED_COUNT: 'review-requested-count',
};

// Minimum days between review prompts
const MIN_DAYS_BETWEEN_PROMPTS = 90;

// Happy moment thresholds
const HAPPY_MOMENT_THRESHOLDS = {
    'alert-detected': 3,    // After 3 successful detections
    'camera-added': 2,       // After adding 2nd camera
    'week-active': 7,        // After 7 days of daily use
    'feature-used': 5,       // After using 5 different features
} as const;

type HappyMoment = keyof typeof HAPPY_MOMENT_THRESHOLDS;

/**
 * Review Manager
 * Handles in-app review prompts using best practices
 * 
 * Features:
 * - Smart timing based on "happy moments"
 * - Respects frequency limits (90 days between prompts)
 * - Native review dialog (no external redirect)
 * - Non-intrusive prompting
 */
class ReviewManager {
    /**
     * Check if we should prompt for a review
     */
    async shouldPromptReview(): Promise<boolean> {
        try {
            // Check if platform supports in-app reviews
            if (!(await StoreReview.hasAction())) {
                console.log('[ReviewManager] In-app reviews not supported');
                return false;
            }

            // Check if enough time has passed since last prompt
            const lastPrompt = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REVIEW_PROMPT);

            if (lastPrompt) {
                const daysSinceLastPrompt =
                    (Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24);

                if (daysSinceLastPrompt < MIN_DAYS_BETWEEN_PROMPTS) {
                    console.log(`[ReviewManager] Too soon since last prompt (${Math.floor(daysSinceLastPrompt)} days)`);
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('[ReviewManager] Error checking prompt eligibility:', error);
            return false;
        }
    }

    /**
     * Prompt user for review
     * 
     * This uses the native in-app review dialog which:
     * - Doesn't interrupt the user experience
     * - Doesn't require leaving the app
     * - Can only be shown a limited number of times per year (iOS/Android limit)
     */
    async promptReview(): Promise<void> {
        if (!(await this.shouldPromptReview())) {
            return;
        }

        try {
            await StoreReview.requestReview();

            // Record this prompt
            await AsyncStorage.setItem(
                STORAGE_KEYS.LAST_REVIEW_PROMPT,
                Date.now().toString()
            );

            // Increment counter
            const count = await AsyncStorage.getItem(STORAGE_KEYS.REVIEW_REQUESTED_COUNT);
            const newCount = count ? parseInt(count) + 1 : 1;
            await AsyncStorage.setItem(
                STORAGE_KEYS.REVIEW_REQUESTED_COUNT,
                newCount.toString()
            );

            console.log(`[ReviewManager] Review prompt shown (total: ${newCount})`);
        } catch (error) {
            console.error('[ReviewManager] Error prompting review:', error);
        }
    }

    /**
     * Record a "happy moment" and potentially trigger review
     * 
     * Happy moments are positive user interactions that indicate satisfaction:
     * - User successfully detects with AI
     * - User adds multiple cameras
     * - User uses the app consistently for a week
     */
    async onHappyMoment(moment: HappyMoment): Promise<void> {
        try {
            const key = `${STORAGE_KEYS.HAPPY_MOMENT_PREFIX}${moment}`;
            const countStr = await AsyncStorage.getItem(key);
            const currentCount = countStr ? parseInt(countStr) : 0;
            const newCount = currentCount + 1;

            // Save new count
            await AsyncStorage.setItem(key, newCount.toString());

            console.log(`[ReviewManager] Happy moment '${moment}': ${newCount}/${HAPPY_MOMENT_THRESHOLDS[moment]}`);

            // Check if threshold reached
            if (newCount >= HAPPY_MOMENT_THRESHOLDS[moment]) {
                console.log(`[ReviewManager] Threshold reached for '${moment}', prompting review`);
                await this.promptReview();

                // Reset counter after prompting
                await AsyncStorage.removeItem(key);
            }
        } catch (error) {
            console.error('[ReviewManager] Error recording happy moment:', error);
        }
    }

    /**
     * Get statistics about review prompts
     */
    async getStatistics(): Promise<{
        totalPromptsShown: number;
        daysSinceLastPrompt: number | null;
        happyMoments: Record<HappyMoment, number>;
    }> {
        const totalPromptsShown = parseInt(
            (await AsyncStorage.getItem(STORAGE_KEYS.REVIEW_REQUESTED_COUNT)) || '0'
        );

        const lastPromptStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REVIEW_PROMPT);
        const daysSinceLastPrompt = lastPromptStr
            ? Math.floor((Date.now() - parseInt(lastPromptStr)) / (1000 * 60 * 60 * 24))
            : null;

        const happyMoments: Record<HappyMoment, number> = {} as any;
        for (const moment of Object.keys(HAPPY_MOMENT_THRESHOLDS) as HappyMoment[]) {
            const key = `${STORAGE_KEYS.HAPPY_MOMENT_PREFIX}${moment}`;
            const count = await AsyncStorage.getItem(key);
            happyMoments[moment] = count ? parseInt(count) : 0;
        }

        return {
            totalPromptsShown,
            daysSinceLastPrompt,
            happyMoments,
        };
    }

    /**
     * Reset all review data (for testing)
     */
    async reset(): Promise<void> {
        await AsyncStorage.removeItem(STORAGE_KEYS.LAST_REVIEW_PROMPT);
        await AsyncStorage.removeItem(STORAGE_KEYS.REVIEW_REQUESTED_COUNT);

        for (const moment of Object.keys(HAPPY_MOMENT_THRESHOLDS)) {
            await AsyncStorage.removeItem(`${STORAGE_KEYS.HAPPY_MOMENT_PREFIX}${moment}`);
        }

        console.log('[ReviewManager] All data reset');
    }
}

// Export singleton instance
export const reviewManager = new ReviewManager();

// Export types
export type { HappyMoment };
