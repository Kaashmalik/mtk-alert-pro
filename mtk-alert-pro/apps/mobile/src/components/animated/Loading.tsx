import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    Easing
} from 'react-native-reanimated';
import { designSystem } from '@/theme/design-system';

interface LoadingSkeletonProps {
    width?: number | string;
    height?: number | string;
    style?: ViewStyle;
    borderRadius?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
    width = '100%',
    height = 20,
    style,
    borderRadius = designSystem.layout.radius.sm,
}) => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true // reverse
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width: width as any, height: height as any, borderRadius },
                animatedStyle,
                style,
            ]}
        />
    );
};

/**
 * Pre-configured Card Skeleton for Cameras
 */
export const CameraCardSkeleton: React.FC = () => {
    return (
        <View style={styles.cardContainer}>
            <LoadingSkeleton height={200} borderRadius={designSystem.layout.radius.xl} />
            <View style={styles.cardInfo}>
                <LoadingSkeleton width="60%" height={20} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: designSystem.colors.background.tertiary,
    },
    cardContainer: {
        marginBottom: designSystem.spacing.md,
        overflow: 'hidden',
    },
    cardInfo: {
        marginTop: designSystem.spacing.xs,
        marginLeft: designSystem.spacing.sm,
    }
});
