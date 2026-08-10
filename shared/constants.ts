/** Shared configuration constants used across the main and renderer processes. */

/** Max number of downloads processed concurrently (keeps YouTube rate-limits at bay). */
export const MAX_CONCURRENCY = 3;

/** Target MP3 bitrate in kbps for converted audio. */
export const MP3_BITRATE_KBPS = 320;

/** Default output subfolder created inside the user's Music directory. */
export const DEFAULT_OUTPUT_FOLDER = 'Sonora';
