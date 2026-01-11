import { Platform } from 'react-native';
import Constants from 'expo-constants';
// Use type-only import to avoid runtime crash in Expo Go
import type {
    MaxAdContentRating as MaxAdContentRatingType,
    BannerAd as NativeBannerAd,
    InterstitialAd as NativeInterstitialAd,
    AdEventType
} from 'react-native-google-mobile-ads';

// Lazy load the module safely
let mobileAds: any = null;
let MaxAdContentRating: any = null;

try {
    const mobileAdsModule = require('react-native-google-mobile-ads');
    mobileAds = mobileAdsModule.default;
    MaxAdContentRating = mobileAdsModule.MaxAdContentRating;
} catch (error) {
    console.log('[AdMob] Native module not available (Expo Go)');
}

// Ad Unit IDs Configuration
// IMPORTANT: Replace these with your actual AdMob Ad Unit IDs from console.firebase.google.com

const PRODUCTION_AD_UNITS = {
    banner: {
        ios: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX', // Replace with your iOS Banner ID
        android: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX', // Replace with your Android Banner ID
    },
    interstitial: {
        ios: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX', // Replace with your iOS Interstitial ID
        android: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX', // Replace with your Android Interstitial ID
    },
    rewarded: {
        ios: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX', // Replace with your iOS Rewarded ID
        android: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX', // Replace with your Android Rewarded ID
    },
    native: {
        ios: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX', // Replace with your iOS Native ID
        android: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX', // Replace with your Android Native ID
    },
    appOpen: {
        ios: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX', // Replace with your iOS App Open ID
        android: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX', // Replace with your Android App Open ID
    },
} as const;

// Test Ad Unit IDs (provided by Google for testing)
const TEST_AD_UNITS = {
    banner: {
        ios: 'ca-app-pub-3940256099942544/2934735716',
        android: 'ca-app-pub-3940256099942544/6300978111',
    },
    interstitial: {
        ios: 'ca-app-pub-3940256099942544/4411468910',
        android: 'ca-app-pub-3940256099942544/1033173712',
    },
    rewarded: {
        ios: 'ca-app-pub-3940256099942544/1712485313',
        android: 'ca-app-pub-3940256099942544/5224354917',
    },
    native: {
        ios: 'ca-app-pub-3940256099942544/3986624511',
        android: 'ca-app-pub-3940256099942544/2247696110',
    },
    appOpen: {
        ios: 'ca-app-pub-3940256099942544/5662855259',
        android: 'ca-app-pub-3940256099942544/9257395921',
    },
} as const;

type AdType = keyof typeof PRODUCTION_AD_UNITS;
type AdMobPlatform = 'ios' | 'android';

/**
 * AdMob Service
 * Manages ad initialization, configuration, and utilities
 */
class AdMobService {
    private initialized = false;
    private isPremiumUser = false;
    private isNativeModuleAvailable = true;

    constructor() {
        // Detect if we are in Expo Go or if native module is missing
        const isExpoGo = Constants.executionEnvironment === 'storeClient';
        if (isExpoGo) {
            console.log('[AdMob] Running in Expo Go - Native modules disabled');
            this.isNativeModuleAvailable = false;
        }
    }

    // Ad frequency control
    private lastInterstitialTime = 0;
    private lastAppOpenTime = 0;
    private interstitialCountThisHour = 0;
    private lastHourlyReset = Date.now();

    /**
     * Initialize AdMob
     * Should be called once on app startup
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            console.log('[AdMob] Already initialized');
            return;
        }

        if (!this.isNativeModuleAvailable || !mobileAds) {
            console.log('[AdMob] Using mock initialization (Native module missing)');
            this.initialized = true;
            return;
        }

        try {
            await mobileAds().initialize();

            if (MaxAdContentRating) {
                // Configure ad settings
                await mobileAds().setRequestConfiguration({
                    maxAdContentRating: MaxAdContentRating.PG,
                    tagForChildDirectedTreatment: false,
                    tagForUnderAgeOfConsent: false,
                });
            }

            this.initialized = true;
            console.log('[AdMob] Initialized successfully');
        } catch (error) {
            console.error('[AdMob] Initialization failed:', error);
            this.isNativeModuleAvailable = false;
            this.initialized = true; // Set to initialized to prevent infinite retry loops
        }
    }

    /**
     * Check if AdMob is initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Get Ad Unit ID for specific ad type and platform
     * @param type Ad type (banner, interstitial, etc.)
     * @param useTestAds Use test ads (default: true in __DEV__)
     */
    getAdUnitId(type: AdType, useTestAds = __DEV__): string {
        const units = useTestAds ? TEST_AD_UNITS : PRODUCTION_AD_UNITS;
        const platform = Platform.OS as AdMobPlatform;

        const adUnit = units[type]?.[platform];

        if (!adUnit) {
            console.warn(`[AdMob] No ad unit found for type:${type} platform:${platform}`);
            // Fallback to test ad unit
            return TEST_AD_UNITS[type][platform];
        }

        return adUnit;
    }

    /**
     * Set premium user status
     * Premium users don't see ads
     */
    setPremiumStatus(isPremium: boolean): void {
        this.isPremiumUser = isPremium;
        console.log(`[AdMob] Premium status: ${isPremium}`);
    }

    /**
     * Check if ads should be displayed
     * Returns false for premium users
     */
    shouldShowAds(): boolean {
        // In Expo Go, we never show ads because the native component will crash
        if (!this.isNativeModuleAvailable) return false;
        return !this.isPremiumUser;
    }

    /**
     * Check if the native AdMob module is actually available in this binary
     */
    isNativeAvailable(): boolean {
        return this.isNativeModuleAvailable;
    }

    /**
     * Check if interstitial ad can be shown based on frequency caps
     * Limits: 1 per 3 minutes, max 5 per hour
     */
    canShowInterstitial(): boolean {
        if (!this.shouldShowAds()) return false;

        const now = Date.now();
        const timeSinceLastAd = now - this.lastInterstitialTime;

        // Reset hourly counter if an hour has passed
        if (now - this.lastHourlyReset > 3600000) {
            this.interstitialCountThisHour = 0;
            this.lastHourlyReset = now;
        }

        // Check minimum time between ads (3 minutes)
        if (timeSinceLastAd < 180000) {
            console.log('[AdMob] Interstitial blocked: too soon since last ad');
            return false;
        }

        // Check hourly limit (5 per hour)
        if (this.interstitialCountThisHour >= 5) {
            console.log('[AdMob] Interstitial blocked: hourly limit reached');
            return false;
        }

        return true;
    }

    /**
     * Record that an interstitial was shown
     */
    recordInterstitialShown(): void {
        this.lastInterstitialTime = Date.now();
        this.interstitialCountThisHour++;
        console.log(`[AdMob] Interstitial shown (${this.interstitialCountThisHour}/5 this hour)`);
    }

    /**
     * Check if app open ad can be shown
     * Limit: Max 2 per day (1 every 12 hours)
     */
    canShowAppOpen(): boolean {
        if (!this.shouldShowAds()) return false;

        const now = Date.now();
        const timeSinceLastAd = now - this.lastAppOpenTime;

        // Limit: 12 hours between app open ads
        if (timeSinceLastAd < 43200000) {
            console.log('[AdMob] App Open blocked: shown recently');
            return false;
        }

        return true;
    }

    /**
     * Record that an app open ad was shown
     */
    recordAppOpenShown(): void {
        this.lastAppOpenTime = Date.now();
        console.log('[AdMob] App Open ad shown');
    }

    /**
     * Reset all frequency caps (for testing)
     */
    resetFrequencyCaps(): void {
        this.lastInterstitialTime = 0;
        this.lastAppOpenTime = 0;
        this.interstitialCountThisHour = 0;
        this.lastHourlyReset = Date.now();
        console.log('[AdMob] Frequency caps reset');
    }
}

// Export singleton instance
export const adMobService = new AdMobService();

// Export types
export type { AdType };
