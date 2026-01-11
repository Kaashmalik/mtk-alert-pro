import React from 'react';
import { StyleSheet, View } from 'react-native';
import { adMobService } from '@/lib/ads/adMobService';

// Safe import - wrap in try-catch to prevent Expo Go crashes
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

try {
    const admobModule = require('react-native-google-mobile-ads');
    BannerAd = admobModule.BannerAd;
    BannerAdSize = admobModule.BannerAdSize;
    TestIds = admobModule.TestIds;
} catch (e) {
    console.log('[BannerAd] Native module not available');
    // Create mock
    BannerAdSize = { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' };
}

interface BannerAdProps {
    size?: typeof BannerAdSize;
    style?: any;
}

/**
 * Banner Ad Component
 * Displays a banner advertisement at bottom of screen
 */
export const AdBanner: React.FC<BannerAdProps> = ({
    size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
    style
}) => {
    // Don't show ads if native module is missing (Expo Go) or for premium users
    if (!adMobService.isNativeAvailable() || !adMobService.shouldShowAds()) {
        return null;
    }

    return (
        <View style={[styles.container, style]}>
            <BannerAd
                unitId={adMobService.getAdUnitId('banner')}
                size={size}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: false,
                }}
                onAdLoaded={() => {
                    console.log('[AdBanner] Ad loaded successfully');
                }}
                onAdFailedToLoad={(error: Error) => {
                    console.error('[AdBanner] Failed to load ad:', error.message);
                }}
                onAdOpened={() => {
                    console.log('[AdBanner] Ad opened');
                }}
                onAdClosed={() => {
                    console.log('[AdBanner] Ad closed');
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
});
