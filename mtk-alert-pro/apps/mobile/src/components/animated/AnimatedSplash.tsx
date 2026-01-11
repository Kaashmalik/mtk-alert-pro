import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    runOnJS
} from 'react-native-reanimated';
import { Camera } from 'lucide-react-native';
import { designSystem } from '@/theme/design-system';

interface AnimatedSplashProps {
    onAnimationComplete: () => void;
}

export const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onAnimationComplete }) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const ringScale = useSharedValue(0);

    useEffect(() => {
        // Start animation sequence
        scale.value = withSequence(
            withTiming(1.2, { duration: 600 }),
            withSpring(1, { damping: 10 })
        );

        opacity.value = withTiming(1, { duration: 800 });

        // Ripple effect
        ringScale.value = withTiming(3, { duration: 1500 }, (finished) => {
            if (finished && onAnimationComplete) {
                runOnJS(onAnimationComplete)();
            }
        });
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ringScale.value }],
        opacity: 1 - ringScale.value / 3,
    }));

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.ring, ringStyle]} />
            <Animated.View style={[styles.logoContainer, logoStyle]}>
                <Camera size={64} color="#FFF" />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: designSystem.colors.background.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: designSystem.colors.primary[500],
        alignItems: 'center',
        justifyContent: 'center',
        ...designSystem.shadows.glow.primary,
        zIndex: 10,
    },
    ring: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: designSystem.colors.primary[400],
    },
});
