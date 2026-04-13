/**
 * Platform utilities for Manga Box PWA
 * Simplified for pure web app (no Capacitor/Electron)
 */

/**
 * Get the current platform
 * @returns {'web'}
 */
export const getPlatform = () => 'web';

/**
 * Check if running on mobile (based on screen width)
 * @returns {boolean}
 */
export const isMobile = () => window.innerWidth < 768;

/**
 * Check if running on desktop
 * @returns {boolean}
 */
export const isDesktop = () => !isMobile();

/**
 * Check if the device supports touch
 * @returns {boolean}
 */
export const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Get platform-specific UI configuration
 * @returns {object}
 */
export const getPlatformConfig = () => {
    const mobile = isMobile();
    return {
        gridColumns: mobile ? 3 : 5,
        padding: mobile ? '8px' : '32px',
        showSidebar: !mobile,
        showBottomNav: mobile,
        touchOptimized: mobile || isTouchDevice(),
    };
};

/**
 * No-op: Title bar color update (legacy Electron stub)
 */
export const updateTitleBarColor = () => {};
