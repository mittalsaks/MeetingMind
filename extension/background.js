// background.js — MeetingMind service worker (Manifest V3)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') return;

  if (message.type === 'MM_ENSURE_INJECTED') {
    ensureInjected(message.tabId, sendResponse);
    return true;
  }

  // ✅ NEW: Fresh token fetch karo refresh-token cookie se
  if (message.type === 'MM_GET_TOKEN') {
    refreshToken(sendResponse);
    return true;
  }

  return false;
});

// ── API base ──
// Localhost default (dev). Login flow se production URL 'mm_api_base' key
// mein chrome.storage.local mein save hota hai — yahan wahi use hota hai.
const DEFAULT_API_BASE = 'https://meetingmind-production-f733.up.railway.app/api';

async function getApiBase() {
  const data = await chrome.storage.local.get(['mm_api_base']);
  return data.mm_api_base || DEFAULT_API_BASE;
}

/**
 * Refreshes the access token using the httpOnly refresh cookie.
 * Service worker context se credentials:include kaam karta hai.
 */
async function refreshToken(sendResponse) {
  try {
    const apiBase = await getApiBase();
    const res = await fetch(`${apiBase}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include'
    });
    const data = await res.json();
    if (data.accessToken) {
      sendResponse({ accessToken: data.accessToken });
    } else {
      sendResponse({ accessToken: null });
    }
  } catch (err) {
    console.error('[MeetingMind] Token refresh failed:', err);
    sendResponse({ accessToken: null });
  }
}

/**
 * Makes sure content.js is running in the given tab.
 */
async function ensureInjected(tabId, sendResponse) {
  if (!tabId) {
    sendResponse({ ok: false, error: 'No tabId provided' });
    return;
  }

  try {
    const alreadyThere = await pingTab(tabId);
    if (alreadyThere) {
      sendResponse({ ok: true, alreadyInjected: true });
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    });

    const confirmed = await pingTab(tabId);
    if (!confirmed) {
      sendResponse({
        ok: false,
        error: 'Injected but content script did not respond to ping',
      });
      return;
    }

    sendResponse({ ok: true, alreadyInjected: false });
  } catch (err) {
    console.error('[MeetingMind] ensureInjected failed:', err);
    sendResponse({ ok: false, error: err.message || String(err) });
  }
}

function pingTab(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'MM_PING' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(false);
        return;
      }
      resolve(Boolean(response && response.ok));
    });
  });
}