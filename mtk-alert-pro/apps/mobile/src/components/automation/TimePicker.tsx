import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { designSystem } from '@/theme/design-system';

interface TimePickerProps {
    value: string; // "HH:mm" format
    onChange: (time: string) => void;
    label: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
    value,
    onChange,
    label,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hour, setHour] = useState(() => parseInt(value.split(':')[0]));
    const [minute, setMinute] = useState(() => parseInt(value.split(':')[1]));

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const handleConfirm = () => {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        onChange(timeStr);
        setIsOpen(false);
    };

    const format12Hour = (hour24: number) => {
        const period = hour24 >= 12 ? 'PM' : 'AM';
        const hour12 = hour24 % 12 || 12;
        return { hour12, period };
    };

    const { hour12, period } = format12Hour(hour);
    const displayValue = `${hour12}:${String(minute).padStart(2, '0')} ${period}`;

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            <TouchableOpacity
                style={styles.trigger}
                onPress={() => setIsOpen(true)}
                activeOpacity={0.7}
            >
                <Text style={styles.triggerText}>{displayValue}</Text>
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <TouchableOpacity onPress={() => setIsOpen(false)}>
                                <X size={24} color={designSystem.colors.text.secondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Pickers */}
                        <View style={styles.pickersContainer}>
                            {/* Hour Picker */}
                            <View style={styles.pickerColumn}>
                                <Text style={styles.pickerLabel}>Hour</Text>
                                <ScrollView
                                    style={styles.picker}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.pickerContent}
                                >
                                    {hours.map((h) => (
                                        <TouchableOpacity
                                            key={h}
                                            style={[
                                                styles.pickerItem,
                                                hour === h && styles.pickerItemSelected,
                                            ]}
                                            onPress={() => setHour(h)}
                                        >
                                            <Text
                                                style={[
                                                    styles.pickerItemText,
                                                    hour === h && styles.pickerItemTextSelected,
                                                ]}
                                            >
                                                {String(h).padStart(2, '0')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Minute Picker */}
                            <View style={styles.pickerColumn}>
                                <Text style={styles.pickerLabel}>Minute</Text>
                                <ScrollView
                                    style={styles.picker}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.pickerContent}
                                >
                                    {minutes.filter((m) => m % 5 === 0).map((m) => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[
                                                styles.pickerItem,
                                                minute === m && styles.pickerItemSelected,
                                            ]}
                                            onPress={() => setMinute(m)}
                                        >
                                            <Text
                                                style={[
                                                    styles.pickerItemText,
                                                    minute === m && styles.pickerItemTextSelected,
                                                ]}
                                            >
                                                {String(m).padStart(2, '0')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setIsOpen(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleConfirm}
                            >
                                <Text style={styles.confirmButtonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: designSystem.spacing.lg,
    },
    label: {
        fontSize: designSystem.typography.size.sm,
        fontWeight: '500',
        color: designSystem.colors.text.secondary,
        marginBottom: designSystem.spacing.sm,
    },
    trigger: {
        backgroundColor: designSystem.colors.background.secondary,
        borderRadius: designSystem.layout.radius.lg,
        paddingVertical: designSystem.spacing.md,
        paddingHorizontal: designSystem.spacing.lg,
        borderWidth: 1,
        borderColor: designSystem.colors.background.tertiary,
    },
    triggerText: {
        fontSize: designSystem.typography.size.lg,
        fontWeight: '600',
        color: designSystem.colors.text.primary,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: designSystem.spacing.xl,
    },
    modalContent: {
        backgroundColor: designSystem.colors.background.secondary,
        borderRadius: designSystem.layout.radius.xl,
        width: '100%',
        maxWidth: 400,
        ...designSystem.shadows.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: designSystem.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: designSystem.colors.background.tertiary,
    },
    modalTitle: {
        fontSize: designSystem.typography.size.lg,
        fontWeight: '600',
        color: designSystem.colors.text.primary,
    },
    pickersContainer: {
        flexDirection: 'row',
        gap: designSystem.spacing.md,
        padding: designSystem.spacing.lg,
    },
    pickerColumn: {
        flex: 1,
    },
    pickerLabel: {
        fontSize: designSystem.typography.size.sm,
        fontWeight: '500',
        color: designSystem.colors.text.secondary,
        marginBottom: designSystem.spacing.sm,
        textAlign: 'center',
    },
    picker: {
        height: 200,
    },
    pickerContent: {
        paddingVertical: designSystem.spacing.md,
    },
    pickerItem: {
        paddingVertical: designSystem.spacing.sm,
        paddingHorizontal: designSystem.spacing.md,
        borderRadius: designSystem.layout.radius.md,
        marginVertical: 2,
    },
    pickerItemSelected: {
        backgroundColor: designSystem.colors.primary[500],
    },
    pickerItemText: {
        fontSize: designSystem.typography.size.base,
        color: designSystem.colors.text.secondary,
        textAlign: 'center',
    },
    pickerItemTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: designSystem.spacing.md,
        padding: designSystem.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: designSystem.colors.background.tertiary,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: designSystem.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: designSystem.layout.radius.lg,
        backgroundColor: designSystem.colors.background.tertiary,
    },
    cancelButtonText: {
        fontSize: designSystem.typography.size.base,
        fontWeight: '600',
        color: designSystem.colors.text.secondary,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: designSystem.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: designSystem.layout.radius.lg,
        backgroundColor: designSystem.colors.primary[500],
    },
    confirmButtonText: {
        fontSize: designSystem.typography.size.base,
        fontWeight: '600',
        color: '#fff',
    },
});
