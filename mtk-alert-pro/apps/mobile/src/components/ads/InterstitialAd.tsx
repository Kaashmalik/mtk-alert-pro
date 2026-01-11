import { useEffect, useRef, useState } from 'react';
import { adMobService } from '@/lib/ads/adMobService';

// Safe import - wrap in try-catch to prevent Expo Go crashes
let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;

try {
    const admobModule = require('react-native-google-mobile-ads');
    InterstitialAd = admobModule.InterstitialAd;
    AdEventType = admobModule.AdEventType;
    TestIds = admobModule.TestIds;
} catch (e) {
    console.log('[InterstitialAd] Native module not available');
}

/**
 * Interstitial Ad Hook
 * Manages loading and showing full-screen interstitial ads
 * 
 * Usage:
 * const { show, isLoaded } = useInterstitialAd();
 * 
 * // Show ad when appropriate
 * if (isLoaded) {
 *   await show();
 * }
 */
export const useInterstitialAd = () => {
    const adRef = useRef<typeof InterstitialAd | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Don't load ads if native module is missing or for premium users
        if (!adMobService.isNativeAvailable() || !adMobService.shouldShowAds()) {
            return;
        }

        // Create interstitial ad instance
        const interstitial = InterstitialAd.createForAdRequest(
            adMobService.getAdUnitId('interstitial'),
            {
                requestNonPersonalizedAdsOnly: false,
            }
        );

        // Ad loaded successfully
        const loadedListener = interstitial.addAdEventListener(
            AdEventType.LOADED,
            () => {
                setIsLoaded(true);
                console.log('[Interstitial] Ad loaded and ready');
            }
        );

        // Ad closed by user
        const closedListener = interstitial.addAdEventListener(
            AdEventType.CLOSED,
            () => {
                setIsLoaded(false);
                adMobService.recordInterstitialShown();
                console.log('[Interstitial] Ad closed, preloading next ad');

                // Preload next ad
                setTimeout(() => {
                    interstitial.load();
                }, 1000);
            }
        );

        // Ad failed to load
        const errorListener = interstitial.addAdEventListener(
            AdEventType.ERROR,
            (error: any) => {
                setIsLoaded(false);
                console.error('[Interstitial] Ad error:', error);
            }
        );

        // Load the ad
        interstitial.load();
        adRef.current = interstitial;

        // Cleanup
        return () => {
            loadedListener();
            closedListener();
            errorListener();
        };
    }, []);

    /**
     * Show the interstitial ad
     * Returns true if ad was shown, false otherwise
     */
    const show = async (): Promise<boolean> => {
        // Check if ads should be shown
        if (!adMobService.shouldShowAds()) {
            console.log('[Interstitial] Skipped: Premium user');
            return false;
        }

        // Check frequency caps
        if (!adMobService.canShowInterstitial()) {
            console.log('[Interstitial] Skipped: Frequency cap limit');
            return false;
        }

        // Check if native module is available
        if (!adMobService.isNativeAvailable()) {
            console.log('[Interstitial] Mock: Native module missing, continuing without ad');
            return true; // Return true to not block the app flow
        }

        // Check if ad is loaded
        if (!isLoaded || !adRef.current) {
            console.log('[Interstitial] Skipped: Ad not loaded');
            return false;
        }

        try {
            await adRef.current.show();
            console.log('[Interstitial] Ad shown successfully');
            return true;
        } catch (error) {
            console.error('[Interstitial] Failed to show ad:', error);
            setIsLoaded(false);
            return false;
        }
    };

    return { show, isLoaded };
};
