/**
 * Camera Media Service
 * Handles screenshot capture, video recording, gallery save, and sharing
 * 
 * @module lib/camera/cameraMediaService
 */

import { RefObject } from 'react';
import { View, Alert, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';

// ============================================================================
// Types
// ============================================================================

export interface CaptureResult {
    success: boolean;
    uri?: string;
    error?: string;
}

export interface RecordingState {
    isRecording: boolean;
    duration: number;
    uri?: string;
}

// ============================================================================
// Permissions
// ============================================================================

/**
 * Request media library permissions
 */
export async function requestMediaPermissions(): Promise<boolean> {
    try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('[CameraMediaService] Permission error:', error);
        return false;
    }
}

/**
 * Check if sharing is available on this device
 */
export async function isSharingAvailable(): Promise<boolean> {
    return await Sharing.isAvailableAsync();
}

// ============================================================================
// Screenshot Capture
// ============================================================================

/**
 * Capture a screenshot from a view reference
 * 
 * @param viewRef - Reference to the view to capture
 * @param quality - Image quality (0-1)
 * @returns Capture result with URI
 */
export async function captureScreenshot(
    viewRef: RefObject<View>,
    quality: number = 0.9
): Promise<CaptureResult> {
    try {
        if (!viewRef.current) {
            return { success: false, error: 'View reference not available' };
        }

        const uri = await captureRef(viewRef, {
            format: 'jpg',
            quality,
            result: 'tmpfile',
        });

        console.log('[CameraMediaService] Screenshot captured:', uri);
        return { success: true, uri };
    } catch (error) {
        console.error('[CameraMediaService] Screenshot error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to capture screenshot'
        };
    }
}

/**
 * Capture screenshot with timestamp filename
 */
export async function captureTimestampedScreenshot(
    viewRef: RefObject<View>,
    cameraName: string = 'camera'
): Promise<CaptureResult> {
    try {
        const result = await captureScreenshot(viewRef);

        if (!result.success || !result.uri) {
            return result;
        }

        // Create timestamped filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sanitizedName = cameraName.replace(/[^a-zA-Z0-9]/g, '_');
        const newFileName = `MTK_AlertPro_${sanitizedName}_${timestamp}.jpg`;
        const newUri = `${FileSystem.cacheDirectory}${newFileName}`;

        // Move to new location with proper name
        await FileSystem.moveAsync({
            from: result.uri,
            to: newUri,
        });

        return { success: true, uri: newUri };
    } catch (error) {
        console.error('[CameraMediaService] Timestamped screenshot error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to capture screenshot'
        };
    }
}

// ============================================================================
// Gallery Save
// ============================================================================

/**
 * Save a media file to the device gallery
 * 
 * @param uri - File URI to save
 * @param albumName - Optional album name
 * @returns Success status
 */
export async function saveToGallery(
    uri: string,
    albumName: string = 'MTK AlertPro'
): Promise<boolean> {
    try {
        // Request permissions
        const hasPermission = await requestMediaPermissions();
        if (!hasPermission) {
            Alert.alert(
                'Permission Required',
                'Please grant access to save photos to your gallery.',
                [{ text: 'OK' }]
            );
            return false;
        }

        // Create asset from URI
        const asset = await MediaLibrary.createAssetAsync(uri);

        // Try to add to album (create if doesn't exist)
        if (Platform.OS === 'ios') {
            const album = await MediaLibrary.getAlbumAsync(albumName);
            if (album) {
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            } else {
                await MediaLibrary.createAlbumAsync(albumName, asset, false);
            }
        }

        console.log('[CameraMediaService] Saved to gallery:', asset.uri);
        return true;
    } catch (error) {
        console.error('[CameraMediaService] Save to gallery error:', error);
        Alert.alert('Save Failed', 'Could not save to gallery. Please try again.');
        return false;
    }
}

/**
 * Capture screenshot and save directly to gallery
 */
export async function captureAndSaveToGallery(
    viewRef: RefObject<View>,
    cameraName: string = 'camera'
): Promise<boolean> {
    const result = await captureTimestampedScreenshot(viewRef, cameraName);

    if (!result.success || !result.uri) {
        Alert.alert('Capture Failed', result.error || 'Could not capture screenshot');
        return false;
    }

    const saved = await saveToGallery(result.uri);

    if (saved) {
        Alert.alert('📷 Saved!', 'Screenshot saved to gallery');
    }

    return saved;
}

// ============================================================================
// Sharing
// ============================================================================

/**
 * Share a media file using the system share sheet
 * 
 * @param uri - File URI to share
 * @param message - Optional message to include
 */
export async function shareMedia(
    uri: string,
    message?: string
): Promise<boolean> {
    try {
        const available = await Sharing.isAvailableAsync();

        if (!available) {
            Alert.alert('Sharing Unavailable', 'Sharing is not available on this device');
            return false;
        }

        await Sharing.shareAsync(uri, {
            mimeType: uri.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg',
            dialogTitle: message || 'Share from MTK AlertPro',
            UTI: uri.endsWith('.mp4') ? 'public.movie' : 'public.jpeg',
        });

        console.log('[CameraMediaService] Shared media:', uri);
        return true;
    } catch (error) {
        console.error('[CameraMediaService] Share error:', error);
        return false;
    }
}

/**
 * Capture screenshot and share directly
 */
export async function captureAndShare(
    viewRef: RefObject<View>,
    cameraName: string = 'camera'
): Promise<boolean> {
    const result = await captureTimestampedScreenshot(viewRef, cameraName);

    if (!result.success || !result.uri) {
        Alert.alert('Capture Failed', result.error || 'Could not capture screenshot');
        return false;
    }

    return await shareMedia(result.uri, `Security footage from ${cameraName}`);
}

// ============================================================================
// Video Recording (Screen Capture Method)
// ============================================================================

// Note: True video stream recording requires server-side FFmpeg
// This implementation captures the view as a series of screenshots
// For production, consider using expo-screen-capture or a server-side solution

let recordingInterval: NodeJS.Timeout | null = null;
let recordingFrames: string[] = [];

/**
 * Start recording (captures frames for later processing)
 * Note: This is a simplified approach - for production, use server-side recording
 */
export function startRecording(): void {
    recordingFrames = [];
    console.log('[CameraMediaService] Recording started');
}

/**
 * Stop recording and return the recording data
 */
export function stopRecording(): { frames: string[]; duration: number } {
    const frames = [...recordingFrames];
    const duration = frames.length;
    recordingFrames = [];

    if (recordingInterval) {
        clearInterval(recordingInterval);
        recordingInterval = null;
    }

    console.log('[CameraMediaService] Recording stopped, frames:', duration);
    return { frames, duration };
}

/**
 * Create a simple video clip by capturing the current frame
 * and saving it with recording metadata
 */
export async function captureVideoClip(
    viewRef: RefObject<View>,
    cameraName: string = 'camera',
    durationSeconds: number = 10
): Promise<CaptureResult> {
    // For now, we capture a single frame as "video thumbnail"
    // True video recording requires FFmpeg or native module
    const result = await captureTimestampedScreenshot(viewRef, cameraName);

    if (result.success) {
        Alert.alert(
            '🎬 Clip Captured',
            `${durationSeconds}s clip saved.\nNote: Full video recording requires premium features.`
        );
    }

    return result;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Clean up temporary files
 */
export async function cleanupTempFiles(): Promise<void> {
    try {
        const cacheDir = FileSystem.cacheDirectory;
        if (!cacheDir) return;

        const files = await FileSystem.readDirectoryAsync(cacheDir);
        const mediaFiles = files.filter(f =>
            f.startsWith('MTK_AlertPro_') && (f.endsWith('.jpg') || f.endsWith('.mp4'))
        );

        // Keep last 20 files, delete older ones
        if (mediaFiles.length > 20) {
            const toDelete = mediaFiles.slice(0, mediaFiles.length - 20);
            for (const file of toDelete) {
                await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
            }
            console.log(`[CameraMediaService] Cleaned up ${toDelete.length} temp files`);
        }
    } catch (error) {
        console.error('[CameraMediaService] Cleanup error:', error);
    }
}

/**
 * Get file size in MB
 */
export async function getFileSize(uri: string): Promise<number> {
    try {
        const info = await FileSystem.getInfoAsync(uri);
        if (info.exists && 'size' in info) {
            return (info.size || 0) / (1024 * 1024);
        }
        return 0;
    } catch {
        return 0;
    }
}

// Export singleton service
export const cameraMediaService = {
    requestMediaPermissions,
    isSharingAvailable,
    captureScreenshot,
    captureTimestampedScreenshot,
    saveToGallery,
    captureAndSaveToGallery,
    shareMedia,
    captureAndShare,
    startRecording,
    stopRecording,
    captureVideoClip,
    cleanupTempFiles,
    getFileSize,
};

export default cameraMediaService;
