export const buildStreamUrl = (id: string, serverUrl: string, params: Record<string, string>): string =>
    `${serverUrl}/rest/stream.view?id=${id}&${new URLSearchParams(params).toString()}`;

export const buildCoverArtUrlSync = (id: string, serverUrl: string, params: Record<string, string>): string =>
    `${serverUrl}/rest/getCoverArt.view?id=${id}&${new URLSearchParams(params).toString()}`;
