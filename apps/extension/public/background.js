// Clicking the toolbar icon focuses the open player tab instead of opening a second one
// (two tabs would mean two independent players). runtime.getContexts needs Chrome 116+ and no extra permission.
const PLAYER_PAGE = 'index.html';

chrome.action.onClicked.addListener(async () => {
    const playerUrl = chrome.runtime.getURL(PLAYER_PAGE);

    if (chrome.runtime.getContexts) {
        const contexts = await chrome.runtime.getContexts({ contextTypes: ['TAB'] });
        const existing = contexts.find(context => context.documentUrl?.startsWith(playerUrl));
        if (existing && existing.tabId >= 0) {
            await chrome.tabs.update(existing.tabId, { active: true });
            if (existing.windowId >= 0) await chrome.windows.update(existing.windowId, { focused: true });
            return;
        }
    }

    await chrome.tabs.create({ url: PLAYER_PAGE });
});
