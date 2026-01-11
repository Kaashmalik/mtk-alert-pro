import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    useAnimatedGestureHandler,
    runOnJS,
    SlideInRight,
    SlideOutRight,
    Layout
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { Clock, AlertTriangle, ChevronRight } from 'lucide-react-native';
import { designSystem } from '@/theme/design-system';

interface AlertCardProps {
    id: string;
    type: 'person' | 'vehicle' | 'motion' | 'face';
    confidence: number;
    timestamp: Date;
    thumbnailUrl?: string;
    cameraName: string;
    isRead?: boolean;
    onPress: (id: string) => void;
    onDismiss?: (id: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export const AlertCard: React.FC<AlertCardProps> = ({
    id,
    type,
    confidence,
    timestamp,
    thumbnailUrl,
    cameraName,
    isRead = false,
    onPress,
    onDismiss,
}) => {
    const translateX = useSharedValue(0);
    const itemHeight = useSharedValue(80); // Estimate

    const iconMap = {
        person: '👤',
        vehicle: '🚗',
        motion: '💨',
        face: '🔍',
    };

    const gestureHandler = useAnimatedGestureHandler({
        onStart: (_, ctx: any) => {
            ctx.startX = translateX.value;
        },
        onActive: (event, ctx) => {
            // Only allow swiping left
            if (event.translationX < 0) {
                translateX.value = ctx.startX + event.translationX;
            }
        },
        onEnd: (event) => {
            if (event.translationX < -SWIPE_THRESHOLD) {
                translateX.value = withTiming(-SCREEN_WIDTH, {}, () => {
                    if (onDismiss) {
                        runOnJS(onDismiss)(id);
                    }
                });
            } else {
                translateX.value = withSpring(0);
            }
        },
    });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Animated.View
            entering={SlideInRight}
            exiting={SlideOutRight}
            layout={Layout.springify()}
            style={styles.wrapper}
        >
            <View style={styles.backgroundContainer}>
                <View style={styles.deleteAction}>
                    <Text style={styles.deleteText}>Dismiss</Text>
                </View>
            </View>

            <PanGestureHandler onGestureEvent={gestureHandler} activeOffsetX={[-10, 10]}>
                <Animated.View style={[styles.container, isRead && styles.containerRead, animatedStyle]}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => onPress(id)}
                        style={styles.touchable}
                    >
                        {/* Thumbnail */}
                        <View style={styles.thumbnailContainer}>
                            {thumbnailUrl ? (
                                <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
                            ) : (
                                <View style={[styles.thumbnail, styles.placeholder]}>
                                    <AlertTriangle size={24} color={designSystem.colors.status.warning} />
                                </View>
                            )}
                        </View>

                        {/* Content */}
                        <View style={styles.content}>
                            <View style={styles.header}>
                                <Text style={styles.title}>
                                    {iconMap[type]} {type.charAt(0).toUpperCase() + type.slice(1)} Detected
                                </Text>
                                <Text style={styles.confidence}>
                                    {Math.round(confidence * 100)}%
                                </Text>
                            </View>

                            <Text style={styles.subtitle}>{cameraName}</Text>

                            <View style={styles.footer}>
                                <Clock size={12} color={designSystem.colors.text.muted} />
                                <Text style={styles.time}>{formatTime(timestamp)}</Text>
                            </View>
                        </View>

                        {/* Action Icon */}
                        <ChevronRight size={20} color={designSystem.colors.text.muted} />
                    </TouchableOpacity>
                </Animated.View>
            </PanGestureHandler>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: designSystem.spacing.sm,
        position: 'relative',
    },
    backgroundContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: designSystem.colors.status.danger,
        borderRadius: designSystem.layout.radius.lg,
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingRight: designSystem.spacing.lg,
    },
    deleteAction: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: designSystem.typography.size.sm,
    },
    container: {
        backgroundColor: designSystem.colors.background.secondary,
        borderRadius: designSystem.layout.radius.lg,
        overflow: 'hidden',
        borderLeftWidth: 4,
        borderLeftColor: designSystem.colors.status.warning,
    },
    containerRead: {
        opacity: 0.6,
    },
    touchable: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: designSystem.spacing.md,
    },
    thumbnailContainer: {
        marginRight: designSystem.spacing.md,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: designSystem.layout.radius.md,
    },
    placeholder: {
        backgroundColor: designSystem.colors.background.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        color: designSystem.colors.text.primary,
        fontSize: designSystem.typography.size.base,
        fontWeight: '600',
    },
    confidence: {
        color: designSystem.colors.status.warning,
        fontSize: designSystem.typography.size.xs,
        fontWeight: '700',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    subtitle: {
        color: designSystem.colors.text.secondary,
        fontSize: designSystem.typography.size.sm,
        marginBottom: designSystem.spacing.xs,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    time: {
        color: designSystem.colors.text.muted,
        fontSize: designSystem.typography.size.xs,
        marginLeft: 4,
    },
});
