import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, Calendar, Zap, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { designSystem } from '@/theme/design-system';
import {
    formatTimeRange,
    getRecurrenceDescription,
} from '@/lib/automation/automationService';
import type { CameraAutomation } from '@/types/automation';

interface AutomationCardProps {
    automation: CameraAutomation;
    cameraName: string;
    onPress: () => void;
    onToggle: () => void;
    index?: number;
}

export const AutomationCard: React.FC<AutomationCardProps> = ({
    automation,
    cameraName,
    onPress,
    onToggle,
    index = 0,
}) => {
    const isActive = automation.enabled && automation.isCurrentlyActive;

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 100).duration(400)}
            style={styles.container}
        >
            <TouchableOpacity
                style={styles.card}
                onPress={onPress}
                activeOpacity={0.7}
            >
                {/* Status Indicator */}
                {isActive && (
                    <View style={styles.activeIndicator}>
                        <Zap size={12} color="#fff" fill="#fff" />
                    </View>
                )}

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.automationName} numberOfLines={1}>
                            {automation.name}
                        </Text>
                        <Text style={styles.cameraName} numberOfLines={1}>
                            {cameraName}
                        </Text>
                    </View>

                    {/* Toggle Switch */}
                    <TouchableOpacity
                        style={[
                            styles.toggle,
                            automation.enabled && styles.toggleActive
                        ]}
                        onPress={(e) => {
                            e.stopPropagation();
                            onToggle();
                        }}
                        activeOpacity={0.7}
                    >
                        <View
                            style={[
                                styles.toggleThumb,
                                automation.enabled && styles.toggleThumbActive
                            ]}
                        />
                    </TouchableOpacity>
                </View>

                {/* Schedule Info */}
                <View style={styles.scheduleContainer}>
                    <View style={styles.scheduleRow}>
                        <Clock size={16} color={designSystem.colors.text.secondary} />
                        <Text style={styles.scheduleText}>
                            {formatTimeRange(automation.schedule)}
                        </Text>
                    </View>

                    <View style={styles.scheduleRow}>
                        <Calendar size={16} color={designSystem.colors.text.secondary} />
                        <Text style={styles.scheduleText}>
                            {getRecurrenceDescription(automation.schedule)}
                        </Text>
                    </View>
                </View>

                {/* Status Badge */}
                {isActive && (
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Active Now</Text>
                    </View>
                )}

                {/* Chevron */}
                <View style={styles.chevron}>
                    <ChevronRight size={20} color={designSystem.colors.text.muted} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: designSystem.spacing.md,
    },
    card: {
        backgroundColor: designSystem.colors.background.secondary,
        borderRadius: designSystem.layout.radius.xl,
        padding: designSystem.spacing.lg,
        position: 'relative',
        ...designSystem.shadows.sm,
    },
    activeIndicator: {
        position: 'absolute',
        top: designSystem.spacing.md,
        right: designSystem.spacing.md,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: designSystem.colors.primary[500],
        alignItems: 'center',
        justifyContent: 'center',
        ...designSystem.shadows.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: designSystem.spacing.md,
    },
    headerLeft: {
        flex: 1,
        marginRight: designSystem.spacing.md,
    },
    automationName: {
        fontSize: designSystem.typography.size.lg,
        fontWeight: '600',
        color: designSystem.colors.text.primary,
        marginBottom: designSystem.spacing.xs,
    },
    cameraName: {
        fontSize: designSystem.typography.size.sm,
        color: designSystem.colors.text.secondary,
    },
    toggle: {
        width: 52,
        height: 30,
        borderRadius: 15,
        backgroundColor: designSystem.colors.background.tertiary,
        padding: 2,
        justifyContent: 'center',
    },
    toggleActive: {
        backgroundColor: designSystem.colors.primary[500],
    },
    toggleThumb: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#fff',
        ...designSystem.shadows.sm,
    },
    toggleThumbActive: {
        transform: [{ translateX: 22 }],
    },
    scheduleContainer: {
        gap: designSystem.spacing.sm,
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: designSystem.spacing.sm,
    },
    scheduleText: {
        fontSize: designSystem.typography.size.base,
        color: designSystem.colors.text.secondary,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: designSystem.spacing.md,
        paddingHorizontal: designSystem.spacing.md,
        paddingVertical: designSystem.spacing.xs,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: designSystem.layout.radius.full,
        gap: designSystem.spacing.xs,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: designSystem.colors.status.success,
    },
    statusText: {
        fontSize: designSystem.typography.size.sm,
        fontWeight: '500',
        color: designSystem.colors.status.success,
    },
    chevron: {
        position: 'absolute',
        right: designSystem.spacing.lg,
        top: '50%',
        marginTop: -10,
    },
});
