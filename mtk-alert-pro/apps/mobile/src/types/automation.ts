/**
 * Camera Automation Types
 * Defines types for scheduled automation of camera states
 */

/**
 * Days of the week (0 = Sunday, 6 = Saturday)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Recurrence pattern for automation
 */
export type RecurrencePattern = 'daily' | 'weekdays' | 'weekends' | 'custom';

/**
 * Action to perform when automation triggers
 */
export type AutomationAction = 'red_alert' | 'normal';

/**
 * Automation schedule configuration
 */
export interface AutomationSchedule {
    /** Start time in 24-hour format "HH:mm" (e.g., "22:00" for 10 PM) */
    startTime: string;

    /** End time in 24-hour format "HH:mm" (e.g., "08:00" for 8 AM) */
    endTime: string;

    /** How often to repeat */
    recurring: RecurrencePattern;

    /** Specific days if recurring is 'custom' (0=Sunday, 6=Saturday) */
    daysOfWeek?: DayOfWeek[];
}

/**
 * Camera automation rule
 */
export interface CameraAutomation {
    /** Unique identifier */
    id: string;

    /** Camera this automation applies to */
    cameraId: string;

    /** User who created this automation */
    userId: string;

    /** User-friendly name for the automation */
    name: string;

    /** Whether this automation is currently enabled */
    enabled: boolean;

    /** Schedule configuration */
    schedule: AutomationSchedule;

    /** Action to perform when schedule is active */
    action: AutomationAction;

    /** Whether automation is currently active (runtime state) */
    isCurrentlyActive?: boolean;

    /** Last time this automation was triggered */
    lastTriggeredAt?: Date;

    /** Created timestamp */
    createdAt: Date;

    /** Last updated timestamp */
    updatedAt: Date;
}

/**
 * Database representation (snake_case)
 */
export interface CameraAutomationDB {
    id: string;
    camera_id: string;
    user_id: string;
    name: string;
    enabled: boolean;
    start_time: string;
    end_time: string;
    recurring: RecurrencePattern;
    days_of_week: number[] | null;
    action: AutomationAction;
    created_at: string;
    updated_at: string;
}

/**
 * Create automation input (omits generated fields)
 */
export type CreateAutomationInput = Omit<
    CameraAutomation,
    'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isCurrentlyActive' | 'lastTriggeredAt'
>;

/**
 * Update automation input
 */
export type UpdateAutomationInput = Partial<
    Omit<CameraAutomation, 'id' | 'userId' | 'cameraId' | 'createdAt' | 'updatedAt'>
>;
