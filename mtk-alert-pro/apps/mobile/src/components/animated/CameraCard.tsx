import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    interpolate,
    Extrapolation,
    FadeIn
} from 'react-native-reanimated';
import { Camera, AlertCircle, WifiOff } from 'lucide-react-native';
import { designSystem } from '@/theme/design-system';

interface CameraCardProps {
    id: string;
    name: string;
    thumbnailUrl?: string;
    isOnline: boolean;
    hasAlert: boolean;
    onPress: (id: string) => void;
    style?: any;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const CameraCard: React.FC<CameraCardProps> = ({
    id,
    name,
    thumbnailUrl,
    isOnline,
    hasAlert,
    onPress,
    style,
}) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);

    React.useEffect(() => {
        opacity.value = withTiming(1, { duration: 500 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.96, designSystem.animations.spring.stiff);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, designSystem.animations.spring.stiff);
    };

    return (
        <AnimatedTouchable
            activeOpacity={0.9}
            onPress={() => onPress(id)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.container, animatedStyle, style]}
        >
            <View style={styles.contentContainer}>
                {/* Status Badge */}
                <View style={[
                    styles.statusBadge,
                    isOnline ? styles.statusOnline : styles.statusOffline
                ]}>
                    <View style={[
                        styles.statusDot,
                        isOnline ? styles.dotOnline : styles.dotOffline
                    ]} />
                    <Text style={styles.statusText}>{isOnline ? 'LIVE' : 'OFFLINE'}</Text>
                </View>

                {/* Thumbnail or Placeholder */}
                {thumbnailUrl ? (
                    <Image
                        source={{ uri: thumbnailUrl }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholder}>
                        <Camera size={48} color={designSystem.colors.text.tertiary} />
                    </View>
                )}

                {/* Connection Error Overlay */}
                {!isOnline && (
                    <View style={styles.offlineOverlay}>
                        <WifiOff size={32} color={designSystem.colors.text.secondary} />
                        <Text style={styles.offlineText}>Connection Lost</Text>
                    </View>
                )}

                {/* Info Area */}
                <View style={styles.footer}>
                    <Text style={styles.name} numberOfLines={1}>{name}</Text>

                    {hasAlert && (
                        <Animated.View
                            entering={FadeIn}
                            style={styles.alertBadge}
                        >
                            <AlertCircle size={14} color="#FFF" />
                            <Text style={styles.alertText}>Detection</Text>
                        </Animated.View>
                    )}
                </View>

                {/* Gradient Overlay for Text Readability */}
                <View style={styles.gradientOverlay} />
            </View>
        </AnimatedTouchable>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 16 / 9,
        marginBottom: designSystem.spacing.md,
        borderRadius: designSystem.layout.radius.xl,
        backgroundColor: designSystem.colors.background.secondary,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: designSystem.colors.border.default,
        ...designSystem.shadows.sm,
    },
    contentContainer: {
        flex: 1,
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        backgroundColor: designSystem.colors.background.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'transparent',
        // In a real implementation we would use LinearGradient here
        // For now, simple opacity view or rely on image
        borderBottomLeftRadius: designSystem.layout.radius.xl,
        borderBottomRightRadius: designSystem.layout.radius.xl,
    },
    statusBadge: {
        position: 'absolute',
        top: designSystem.spacing.sm,
        left: designSystem.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: designSystem.spacing.sm,
        paddingVertical: 4,
        borderRadius: designSystem.layout.radius.md,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statusOnline: {
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    statusOffline: {
        borderColor: 'rgba(100, 116, 139, 0.3)',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    dotOnline: {
        backgroundColor: designSystem.colors.status.success,
        ...designSystem.shadows.glow.primary,
    },
    dotOffline: {
        backgroundColor: designSystem.colors.status.inactive,
    },
    statusText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    offlineOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
    },
    offlineText: {
        color: designSystem.colors.text.secondary,
        fontSize: designSystem.typography.size.sm,
        fontWeight: '600',
        marginTop: designSystem.spacing.xs,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: designSystem.spacing.md,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        color: '#FFF',
        fontSize: designSystem.typography.size.base,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        flex: 1,
    },
    alertBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: designSystem.colors.status.danger,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: designSystem.layout.radius.sm,
        marginLeft: designSystem.spacing.sm,
    },
    alertText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
        marginLeft: 4,
        textTransform: 'uppercase',
    },
});
