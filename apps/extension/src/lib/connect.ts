import { AxiosError } from 'axios';
import { cleanServerUrl, describeError, generateCredentials, testConnection, type Credentials } from '../api/navidrome';
import { requestHostPermission } from './hostPermission';

export type ConnectResult =
    | { ok: true; creds: Credentials }
    | { ok: false; message: string };

/** Either a password, or an existing salt/token pair to re-test (e.g. the server URL changed, password did not). */
export type Secret = { password: string } | { salt: string; token: string };

/**
 * Validate a server login without touching stored settings.
 * Must be called directly from a click/submit handler: the host-permission prompt needs the user gesture,
 * so it is requested before anything is awaited.
 */
export const tryConnect = async (serverUrl: string, username: string, secret: Secret): Promise<ConnectResult> => {
    const url = cleanServerUrl(serverUrl);
    const permission = requestHostPermission(url).catch(() => false);

    if (!/^https?:\/\//i.test(url)) {
        return { ok: false, message: 'The server URL must start with http:// or https://' };
    }

    const { salt, token } = 'password' in secret ? generateCredentials(secret.password) : secret;
    const creds: Credentials = { serverUrl: url, username: username.trim(), salt, token };
    const granted = await permission;

    try {
        await testConnection(creds);
        return { ok: true, creds };
    } catch (error) {
        let message = describeError(error);
        if (!granted && error instanceof AxiosError && !error.response) {
            message += ' Chrome was not allowed to access this server — allow access when asked, then try again.';
        }
        return { ok: false, message };
    }
};
