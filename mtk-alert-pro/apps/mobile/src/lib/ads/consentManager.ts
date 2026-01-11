import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Define explicit enum for type safety
export enum AdsConsentStatus {
    UNKNOWN = 0,
    OBTAINED = 1,
    NOT_REQUIRED = 2,
    REQUIRED = 3,
}

// Safe import - wrap in try-catch to prevent Expo Go crashes
let AdsConsentModule: any = null;
let AdsConsentDebugGeography: any = null;

try {
    const consentModule = require('react-native-google-mobile-ads');
    AdsConsentModule = consentModule.AdsConsent;
    AdsConsentDebugGeography = consentModule.AdsConsentDebugGeography;
} catch (e) {
    console.log('[Consent] Native module not available (Expo Go)');
}

const CONSENT_STATUS_KEY = 'admob-consent-status';
const CONSENT_TIMESTAMP_KEY = 'admob-consent-timestamp';

/**
 * Consent Manager
 * Handles GDPR/CCPA consent for personalized ads
 */
class ConsentManager {
    private consentStatus: AdsConsentStatus | null = null;

    /**
     * Request and show consent form if needed
     * Should be called before initializing AdMob
     */
    async requestConsent(debugMode = __DEV__): Promise<boolean> {
        try {
            // Detect if we are in Expo Go
            const isExpoGo = Constants.executionEnvironment === 'storeClient';
            if (isExpoGo) {
                console.log('[Consent] Running in Expo Go - Native consent disabled');
                this.consentStatus = AdsConsentStatus.NOT_REQUIRED;
                return true;
            }

            if (!AdsConsentModule) {
                this.consentStatus = AdsConsentStatus.NOT_REQUIRED;
                return true;
            }

            // For testing, you can force geography
            if (debugMode && AdsConsentDebugGeography) {
                try {
                    await AdsConsentModule.setDebugGeography(AdsConsentDebugGeography.EEA);
                } catch (e) {
                    console.warn('[Consent] setDebugGeography not available');
                }
            }

            // Request consent information update
            const consentInfo = await AdsConsentModule.requestInfoUpdate();

            console.log('[Consent] Status:', consentInfo.status);
            console.log('[Consent] Is form available:', consentInfo.isConsentFormAvailable);

            // Store consent status
            this.consentStatus = consentInfo.status as AdsConsentStatus;
            await this.saveConsentStatus(this.consentStatus!);

            // Show consent form if required
            if (
                consentInfo.isConsentFormAvailable &&
                consentInfo.status === AdsConsentStatus.REQUIRED
            ) {
                console.log('[Consent] Showing consent form');
                const formResult = await AdsConsentModule.showForm();

                this.consentStatus = formResult.status as AdsConsentStatus;
                await this.saveConsentStatus(this.consentStatus);

                console.log('[Consent] Form result:', formResult.status);
                return formResult.status === AdsConsentStatus.OBTAINED;
            }

            // Consent not required or already obtained
            return consentInfo.status === AdsConsentStatus.OBTAINED ||
                consentInfo.status === AdsConsentStatus.NOT_REQUIRED;

        } catch (error) {
            console.error('[Consent] Error requesting consent:', error);
            // On error, default to showing non-personalized ads
            return false;
        }
    }

    /**
     * Check if user has given consent for personalized ads
     */
    async hasConsent(): Promise<boolean> {
        if (this.consentStatus !== null) {
            return this.consentStatus === AdsConsentStatus.OBTAINED;
        }

        // Load from storage
        const savedStatus = await AsyncStorage.getItem(CONSENT_STATUS_KEY);
        if (savedStatus) {
            this.consentStatus = (parseInt(savedStatus) as unknown) as AdsConsentStatus;
            return this.consentStatus === AdsConsentStatus.OBTAINED;
        }

        return false;
    }

    /**
     * Get current consent status
     */
    async getConsentStatus(): Promise<AdsConsentStatus | null> {
        if (this.consentStatus !== null) {
            return this.consentStatus;
        }

        const savedStatus = await AsyncStorage.getItem(CONSENT_STATUS_KEY);
        if (savedStatus) {
            return (parseInt(savedStatus) as unknown) as AdsConsentStatus;
        }

        return null;
    }

    /**
     * Reset consent (for testing or user request)
     * Shows the consent form again next time
     */
    async resetConsent(): Promise<void> {
        try {
            const isExpoGo = Constants.executionEnvironment === 'storeClient';
            if (isExpoGo || !AdsConsentModule) return;

            await AdsConsentModule.reset();
            await AsyncStorage.removeItem(CONSENT_STATUS_KEY);
            await AsyncStorage.removeItem(CONSENT_TIMESTAMP_KEY);
            this.consentStatus = null;
            console.log('[Consent] Consent reset successfully');
        } catch (error) {
            console.error('[Consent] Error resetting consent:', error);
        }
    }

    /**
     * Check if consent was given recently (within 12 months)
     * GDPR requires consent refresh annually
     */
    async isConsentExpired(): Promise<boolean> {
        const timestamp = await AsyncStorage.getItem(CONSENT_TIMESTAMP_KEY);
        if (!timestamp) return true;

        const consentDate = new Date(parseInt(timestamp));
        const now = new Date();
        const monthsSinceConsent =
            (now.getTime() - consentDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

        return monthsSinceConsent >= 12;
    }

    /**
     * Save consent status to AsyncStorage
     */
    private async saveConsentStatus(status: AdsConsentStatus): Promise<void> {
        try {
            await AsyncStorage.setItem(CONSENT_STATUS_KEY, status.toString());
            await AsyncStorage.setItem(CONSENT_TIMESTAMP_KEY, Date.now().toString());
        } catch (error) {
            console.error('[Consent] Error saving consent status:', error);
        }
    }

    /**
     * Get human-readable consent status
     */
    getConsentStatusText(status: AdsConsentStatus): string {
        switch (status) {
            case AdsConsentStatus.OBTAINED:
                return 'Consent obtained';
            case AdsConsentStatus.NOT_REQUIRED:
                return 'Consent not required';
            case AdsConsentStatus.REQUIRED:
                return 'Consent required';
            case AdsConsentStatus.UNKNOWN:
            default:
                return 'Unknown';
        }
    }
}

// Export singleton instance
export const consentManager = new ConsentManager();
