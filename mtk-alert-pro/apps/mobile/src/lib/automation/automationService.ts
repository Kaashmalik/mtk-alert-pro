/**
 * Automation Service
 * Core business logic for camera automation scheduling
 */

import type {
    CameraAutomation,
    AutomationSchedule,
    RecurrencePattern,
    DayOfWeek,
} from '@/types/automation';

/**
 * Check if current time is within a schedule
 */
export function isWithinSchedule(
    currentTime: string,
    currentDay: DayOfWeek,
    schedule: AutomationSchedule
): boolean {
    // Check day of week
    if (!isDayMatch(currentDay, schedule)) {
        return false;
    }

    // Parse times
    const current = parseTime(currentTime);
    const start = parseTime(schedule.startTime);
    const end = parseTime(schedule.endTime);

    // Handle overnight schedules (e.g., 22:00 - 08:00)
    if (end < start) {
        // Schedule crosses midnight
        return current >= start || current < end;
    }

    // Normal schedule (e.g., 08:00 - 17:00)
    return current >= start && current < end;
}

/**
 * Check if current day matches the schedule's recurrence pattern
 */
function isDayMatch(day: DayOfWeek, schedule: AutomationSchedule): boolean {
    switch (schedule.recurring) {
        case 'daily':
            return true;

        case 'weekdays':
            return day >= 1 && day <= 5; // Monday-Friday

        case 'weekends':
            return day === 0 || day === 6; // Sunday or Saturday

        case 'custom':
            return schedule.daysOfWeek?.includes(day) ?? false;

        default:
            return false;
    }
}

/**
 * Parse time string to minutes since midnight
 */
function parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Get current time in HH:mm format
 */
export function getCurrentTime(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Get current day of week (0 = Sunday)
 */
export function getCurrentDay(): DayOfWeek {
    return new Date().getDay() as DayOfWeek;
}

/**
 * Format time for display (24h to 12h)
 */
export function formatTimeForDisplay(time24: string): string {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Format time range for display
 */
export function formatTimeRange(schedule: AutomationSchedule): string {
    const start = formatTimeForDisplay(schedule.startTime);
    const end = formatTimeForDisplay(schedule.endTime);
    return `${start} - ${end}`;
}

/**
 * Get human-readable recurrence description
 */
export function getRecurrenceDescription(schedule: AutomationSchedule): string {
    switch (schedule.recurring) {
        case 'daily':
            return 'Every day';

        case 'weekdays':
            return 'Weekdays (Mon-Fri)';

        case 'weekends':
            return 'Weekends (Sat-Sun)';

        case 'custom':
            if (!schedule.daysOfWeek || schedule.daysOfWeek.length === 0) {
                return 'Never';
            }
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const selectedDays = schedule.daysOfWeek
                .sort()
                .map(d => dayNames[d])
                .join(', ');
            return selectedDays;

        default:
            return 'Unknown';
    }
}

/**
 * Calculate next trigger time for an automation
 */
export function getNextTriggerTime(automation: CameraAutomation): Date | null {
    if (!automation.enabled) {
        return null;
    }

    const now = new Date();
    const currentTime = getCurrentTime();
    const currentDay = getCurrentDay();

    // If currently active, next trigger is when it ends
    if (isWithinSchedule(currentTime, currentDay, automation.schedule)) {
        return getNextEndTime(now, automation.schedule);
    }

    // Otherwise, next trigger is when it starts
    return getNextStartTime(now, automation.schedule);
}

/**
 * Get next start time
 */
function getNextStartTime(from: Date, schedule: AutomationSchedule): Date {
    const result = new Date(from);
    const [hours, minutes] = schedule.startTime.split(':').map(Number);

    result.setHours(hours, minutes, 0, 0);

    // If time has passed today, move to next valid day
    if (result <= from) {
        result.setDate(result.getDate() + 1);
    }

    // Find next matching day
    while (!isDayMatch(result.getDay() as DayOfWeek, schedule)) {
        result.setDate(result.getDate() + 1);
    }

    return result;
}

/**
 * Get next end time
 */
function getNextEndTime(from: Date, schedule: AutomationSchedule): Date {
    const result = new Date(from);
    const [hours, minutes] = schedule.endTime.split(':').map(Number);

    result.setHours(hours, minutes, 0, 0);

    // Handle overnight schedules
    const [startHours] = schedule.startTime.split(':').map(Number);
    if (hours < startHours) {
        // End time is tomorrow
        result.setDate(result.getDate() + 1);
    }

    return result;
}

/**
 * Validate automation schedule
 */
export function validateSchedule(schedule: AutomationSchedule): string | null {
    // Validate time format
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

    if (!timeRegex.test(schedule.startTime)) {
        return 'Invalid start time format. Use HH:mm (24-hour)';
    }

    if (!timeRegex.test(schedule.endTime)) {
        return 'Invalid end time format. Use HH:mm (24-hour)';
    }

    // Validate custom days
    if (schedule.recurring === 'custom') {
        if (!schedule.daysOfWeek || schedule.daysOfWeek.length === 0) {
            return 'Select at least one day for custom recurrence';
        }

        const validDays = schedule.daysOfWeek.every(d => d >= 0 && d <= 6);
        if (!validDays) {
            return 'Invalid day selection';
        }
    }

    return null; // Valid
}

/**
 * Check if two time ranges overlap
 */
export function doSchedulesOverlap(
    schedule1: AutomationSchedule,
    schedule2: AutomationSchedule
): boolean {
    // If they don't share any days, they can't overlap
    const days1 = getActiveDays(schedule1);
    const days2 = getActiveDays(schedule2);
    const sharedDays = days1.filter(d => days2.includes(d));

    if (sharedDays.length === 0) {
        return false;
    }

    // Check time overlap
    const start1 = parseTime(schedule1.startTime);
    const end1 = parseTime(schedule1.endTime);
    const start2 = parseTime(schedule2.startTime);
    const end2 = parseTime(schedule2.endTime);

    // Handle overnight schedules
    const isOvernight1 = end1 < start1;
    const isOvernight2 = end2 < start2;

    if (!isOvernight1 && !isOvernight2) {
        // Both regular schedules
        return (start1 < end2 && end1 > start2);
    }

    // At least one is overnight - they likely overlap
    return true;
}

/**
 * Get all active days for a schedule
 */
function getActiveDays(schedule: AutomationSchedule): DayOfWeek[] {
    switch (schedule.recurring) {
        case 'daily':
            return [0, 1, 2, 3, 4, 5, 6];

        case 'weekdays':
            return [1, 2, 3, 4, 5];

        case 'weekends':
            return [0, 6];

        case 'custom':
            return schedule.daysOfWeek || [];

        default:
            return [];
    }
}
