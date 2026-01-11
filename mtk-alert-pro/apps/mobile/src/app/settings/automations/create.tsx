import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useAutomationStore, useCameraStore } from '@/stores';
import { designSystem } from '@/theme/design-system';
import { TimePicker } from '@/components/automation/TimePicker';
import type { CreateAutomationInput, RecurrencePattern, DayOfWeek } from '@/types/automation';

export default function CreateAutomationScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { cameras } = useCameraStore();
    const { automations, createAutomation, updateAutomation } = useAutomationStore();

    const existingAutomation = id ? automations.find((a: any) => a.id === id) : null;

    const [name, setName] = useState(existingAutomation?.name || '');
    const [cameraId, setCameraId] = useState(existingAutomation?.cameraId || cameras[0]?.id || '');
    const [startTime, setStartTime] = useState(existingAutomation?.schedule.startTime || '22:00');
    const [endTime, setEndTime] = useState(existingAutomation?.schedule.endTime || '08:00');
    const [recurring, setRecurring] = useState<RecurrencePattern>(
        existingAutomation?.schedule.recurring || 'daily'
    );
    const [customDays, setCustomDays] = useState<DayOfWeek[]>(
        existingAutomation?.schedule.daysOfWeek || []
    );
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a name for this automation');
            return;
        }

        if (!cameraId) {
            Alert.alert('Error', 'Please select a camera');
            return;
        }

        setIsSaving(true);

        try {
            const input: CreateAutomationInput = {
                name: name.trim(),
                cameraId,
                enabled: true,
                schedule: {
                    startTime,
                    endTime,
                    recurring,
                    daysOfWeek: recurring === 'custom' ? customDays : undefined,
                },
                action: 'red_alert',
            };

            if (existingAutomation) {
                await updateAutomation(existingAutomation.id, input);
            } else {
                await createAutomation(input);
            }

            router.back();
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save automation');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleDay = (day: DayOfWeek) => {
        setCustomDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const DAYS = [
        { value: 0, label: 'S' },
        { value: 1, label: 'M' },
        { value: 2, label: 'T' },
        { value: 3, label: 'W' },
        { value: 4, label: 'T' },
        { value: 5, label: 'F' },
        { value: 6, label: 'S' },
    ];

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={designSystem.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {existingAutomation ? 'Edit Automation' : 'New Automation'}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Name */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Automation Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g., Night Watch"
                            placeholderTextColor={designSystem.colors.text.muted}
                        />
                    </View>

                    {/* Camera Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Camera</Text>
                        <View style={styles.radioGroup}>
                            {cameras.map((camera) => (
                                <TouchableOpacity
                                    key={camera.id}
                                    style={[
                                        styles.radioOption,
                                        cameraId === camera.id && styles.radioOptionSelected,
                                    ]}
                                    onPress={() => setCameraId(camera.id)}
                                >
                                    <View style={styles.radio}>
                                        {cameraId === camera.id && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={styles.radioLabel}>{camera.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Time Range */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Time Range</Text>
                        <TimePicker label="Start Time" value={startTime} onChange={setStartTime} />
                        <TimePicker label="End Time" value={endTime} onChange={setEndTime} />
                    </View>

                    {/* Recurrence */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Repeat</Text>
                        <View style={styles.chipGroup}>
                            {(['daily', 'weekdays', 'weekends', 'custom'] as RecurrencePattern[]).map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.chip, recurring === type && styles.chipSelected]}
                                    onPress={() => setRecurring(type)}
                                >
                                    <Text style={[styles.chipText, recurring === type && styles.chipTextSelected]}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {recurring === 'custom' && (
                            <View style={styles.daySelector}>
                                {DAYS.map((day) => (
                                    <TouchableOpacity
                                        key={day.value}
                                        style={[
                                            styles.dayButton,
                                            customDays.includes(day.value as DayOfWeek) && styles.dayButtonSelected,
                                        ]}
                                        onPress={() => toggleDay(day.value as DayOfWeek)}
                                    >
                                        <Text
                                            style={[
                                                styles.dayButtonText,
                                                customDays.includes(day.value as DayOfWeek) && styles.dayButtonTextSelected,
                                            ]}
                                        >
                                            {day.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Action Info */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            This will automatically enable Red Alert mode during the specified time range
                        </Text>
                    </View>
                </ScrollView>

                {/* Save Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={isSaving}
                        activeOpacity={0.8}
                    >
                        <Save size={20} color="#fff" />
                        <Text style={styles.saveButtonText}>
                            {isSaving ? 'Saving...' : existingAutomation ? 'Update' : 'Create Automation'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: designSystem.colors.background.primary,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: designSystem.spacing.lg,
        paddingVertical: designSystem.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: designSystem.colors.background.tertiary,
    },
    backButton: {
        padding: designSystem.spacing.xs,
    },
    headerTitle: {
        fontSize: designSystem.typography.size.lg,
        fontWeight: '600',
        color: designSystem.colors.text.primary,
    },
    content: {
        flex: 1,
        padding: designSystem.spacing.xl,
    },
    section: {
        marginBottom: designSystem.spacing.xxl,
    },
    sectionLabel: {
        fontSize: designSystem.typography.size.base,
        fontWeight: '600',
        color: designSystem.colors.text.primary,
        marginBottom: designSystem.spacing.md,
    },
    input: {
        backgroundColor: designSystem.colors.background.secondary,
        borderRadius: designSystem.layout.radius.lg,
        paddingVertical: designSystem.spacing.md,
        paddingHorizontal: designSystem.spacing.lg,
        fontSize: designSystem.typography.size.base,
        color: designSystem.colors.text.primary,
        borderWidth: 1,
        borderColor: designSystem.colors.background.tertiary,
    },
    radioGroup: {
        gap: designSystem.spacing.sm,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: designSystem.colors.background.secondary,
        padding: designSystem.spacing.md,
        borderRadius: designSystem.layout.radius.lg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    radioOptionSelected: {
        borderColor: designSystem.colors.primary[500],
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: designSystem.colors.text.muted,
        marginRight: designSystem.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: designSystem.colors.primary[500],
    },
    radioLabel: {
        fontSize: designSystem.typography.size.base,
        color: designSystem.colors.text.primary,
        fontWeight: '500',
    },
    chipGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: designSystem.spacing.sm,
    },
    chip: {
        paddingHorizontal: designSystem.spacing.lg,
        paddingVertical: designSystem.spacing.sm,
        borderRadius: designSystem.layout.radius.full,
        backgroundColor: designSystem.colors.background.secondary,
        borderWidth: 1,
        borderColor: designSystem.colors.background.tertiary,
    },
    chipSelected: {
        backgroundColor: designSystem.colors.primary[500],
        borderColor: designSystem.colors.primary[500],
    },
    chipText: {
        fontSize: designSystem.typography.size.sm,
        color: designSystem.colors.text.secondary,
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#fff',
    },
    daySelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: designSystem.spacing.md,
    },
    dayButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: designSystem.colors.background.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: designSystem.colors.background.tertiary,
    },
    dayButtonSelected: {
        backgroundColor: designSystem.colors.primary[500],
        borderColor: designSystem.colors.primary[500],
    },
    dayButtonText: {
        fontSize: designSystem.typography.size.sm,
        color: designSystem.colors.text.secondary,
        fontWeight: '600',
    },
    dayButtonTextSelected: {
        color: '#fff',
    },
    infoBox: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        padding: designSystem.spacing.md,
        borderRadius: designSystem.layout.radius.lg,
        marginTop: designSystem.spacing.lg,
    },
    infoText: {
        fontSize: designSystem.typography.size.sm,
        color: designSystem.colors.primary[400],
        lineHeight: 20,
    },
    footer: {
        padding: designSystem.spacing.xl,
        borderTopWidth: 1,
        borderTopColor: designSystem.colors.background.tertiary,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: designSystem.colors.primary[500],
        paddingVertical: designSystem.spacing.lg,
        borderRadius: designSystem.layout.radius.xl,
        gap: designSystem.spacing.sm,
        ...designSystem.shadows.md,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: designSystem.typography.size.base,
        fontWeight: '600',
        color: '#fff',
    },
});
