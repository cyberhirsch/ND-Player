import { cleanServerUrl } from '../api/navidrome';

/**
 * Host access is declared as optional in the manifest and requested only for the user's own server.
 * Outside the extension (Vite dev server) there is no permissions API, and nothing needs granting.
 */
const permissionsApi = () =>
    typeof chrome !== 'undefined' && chrome.permissions ? chrome.permissions : null;

/** Match pattern for the server's host. Ports are left out: a pattern without a port matches every port. */
export const originPattern = (serverUrl: string): string | null => {
    try {
        const url = new URL(cleanServerUrl(serverUrl));
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        return `${url.protocol}//${url.hostname}/*`;
    } catch {
        return null;
    }
};

export const hasHostPermission = async (serverUrl: string): Promise<boolean> => {
    const api = permissionsApi();
    const pattern = originPattern(serverUrl);
    if (!api || !pattern) return true;
    return api.contains({ origins: [pattern] });
};

/**
 * Must be called synchronously from a user gesture (click / submit), before any `await`,
 * or Chrome rejects the request.
 */
export const requestHostPermission = (serverUrl: string): Promise<boolean> => {
    const api = permissionsApi();
    const pattern = originPattern(serverUrl);
    if (!api || !pattern) return Promise.resolve(true);
    return api.request({ origins: [pattern] });
};
