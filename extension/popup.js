// ── API base ──
// Production backend by default. If a custom URL was ever saved via
// 'mm_api_base' in chrome.storage.local (e.g. for local dev), that takes
// priority — but for real installs this always resolves to production now
// instead of failing on localhost:5000.
const DEFAULT_API_BASE = 'https://meetingmind-production-f733.up.railway.app/api'
let API = DEFAULT_API_BASE
let apiReady = new Promise((resolve) => {
  chrome.storage.local.get(['mm_api_base'], (data) => {
    if (data.mm_api_base) API = data.mm_api_base
    resolve()
  })
})

const loginView = document.getElementById('login-view')
const loggedinView = document.getElementById('loggedin-view')
const errorMsg = document.getElementById('error-msg')
const userName = document.getElementById('user-name')
const meetingInfo = document.getElementById('meeting-info')
const recordBtn = document.getElementById('record-btn')
const statusDot = document.getElementById('status-dot')
const headerSub = document.getElementById('header-sub')

// ── Init ──
chrome.storage.local.get(['mm_token', 'mm_user', 'mm_meeting', 'mm_recording'], (data) => {
  if (data.mm_token && data.mm_user) {
    fetchActiveMeeting(data.mm_token, data.mm_user)
    if (data.mm_recording) setRecordingUI()
  } else {
    showLogin()
  }
})

// ── Login ──
document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value.trim()
  errorMsg.style.display = 'none'

  try {
    await apiReady
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',  
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Login failed')
    if (data.user.role !== 'admin') throw new Error('Only admins can use this extension')

    chrome.storage.local.set({ mm_token: data.accessToken, mm_user: data.user }, () => {
      fetchActiveMeeting(data.accessToken, data.user)
    })
  } catch (err) {
    errorMsg.textContent = err.message
    errorMsg.style.display = 'block'
  }
})

async function fetchActiveMeeting(token, user) {
  try {
    await apiReady
    const res = await fetch(`${API}/meetings/today-active`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    const meeting = data.meeting || null
    chrome.storage.local.set({ mm_meeting: meeting }, () => {
      showLoggedIn(user, meeting)
    })
  } catch {
    showLoggedIn(user, null)
  }
}

function showLoggedIn(user, meeting) {
  loginView.style.display = 'none'
  loggedinView.style.display = 'block'
  userName.textContent = user.name || user.email

  if (meeting) {
    meetingInfo.textContent = `📅 ${meeting.title || 'Meeting'} — ${new Date(meeting.scheduledDate).toLocaleDateString()}`
    recordBtn.disabled = false
  } else {
    meetingInfo.textContent = 'No active meeting today'
    recordBtn.disabled = true
  }
  setStoppedUI()
}

function showLogin() {
  loginView.style.display = 'block'
  loggedinView.style.display = 'none'
}

function setRecordingUI() {
  recordBtn.textContent = 'Stop Listening'
  recordBtn.classList.add('stop')
  statusDot.classList.add('recording')
  headerSub.textContent = 'Listening...'
}

function setStoppedUI() {
  recordBtn.textContent = 'Start Listening'
  recordBtn.classList.remove('stop')
  statusDot.classList.remove('recording')
  headerSub.textContent = 'Ready to capture'
}

// ── NEW: Fresh token fetch karo background.js se ──
// Agar token expire ho gaya hai toh background.js refresh karega
// Warna storage wala return karega
async function getValidToken() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'MM_GET_TOKEN' }, (res) => {
      if (chrome.runtime.lastError) {
        // Background se error aaya, storage wala use karo
        chrome.storage.local.get(['mm_token'], (d) => resolve(d.mm_token))
        return
      }
      if (res && res.accessToken) {
        // Fresh token mila, storage update karo
        chrome.storage.local.set({ mm_token: res.accessToken })
        resolve(res.accessToken)
      } else {
        // Refresh fail, storage wala use karo
        chrome.storage.local.get(['mm_token'], (d) => resolve(d.mm_token))
      }
    })
  })
}

// ── Content script ko ensure karo (via background.js), phir message bhejo ──
function sendToContentScript(tabId, message, onSuccess) {
  chrome.runtime.sendMessage({ type: 'MM_ENSURE_INJECTED', tabId }, (ensureResponse) => {
    if (chrome.runtime.lastError) {
      showError('Could not reach background script. Try reloading the extension.')
      return
    }
    if (!ensureResponse || !ensureResponse.ok) {
      showError(ensureResponse?.error || 'Could not inject into Meet tab. Check extension permissions.')
      return
    }

    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        showError('Could not connect to Meet tab. Reload the Meet tab and try again.')
        return
      }
      onSuccess(response)
    })
  })
}

function showError(msg) {
  errorMsg.textContent = msg
  errorMsg.style.display = 'block'
}

// ── Record Button ──
recordBtn.addEventListener('click', () => {
  chrome.storage.local.get(['mm_meeting', 'mm_token', 'mm_recording'], (data) => {
    if (!data.mm_meeting || !data.mm_token) return

    const isRecording = data.mm_recording || false
    errorMsg.style.display = 'none'

    // Active Meet tab dhundo
    chrome.tabs.query({ url: 'https://meet.google.com/*' }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        showError('No active Google Meet tab found! Open meet.google.com first.')
        return
      }

      const meetTab = tabs[0]

      if (!isRecording) {
        // Turant save + UI update karo — popup band hone se pehle hi
        // ye flag persist ho jayega, chahe async chain baad me complete ho
        chrome.storage.local.set({ mm_recording: true })
        setRecordingUI()

        getValidToken().then((freshToken) => {
          if (!freshToken) {
            showError('Token refresh failed. Please logout and login again.')
            chrome.storage.local.set({ mm_recording: false })
            setStoppedUI()
            return
          }
          sendToContentScript(
            meetTab.id,
            {
              type: 'MM_START',
              meetingId: data.mm_meeting._id,
              token: freshToken  // ✅ Fresh token — 401 fix
            },
            (response) => {
              // Already set optimistically upar
            }
          )
        })
      } else {
        // STOP — direct send
        chrome.tabs.sendMessage(meetTab.id, { type: 'MM_STOP' }, () => {
          chrome.storage.local.set({ mm_recording: false })
          setStoppedUI()
        })
      }
    })
  })
})

// ── Logout ──
document.getElementById('logout-btn').addEventListener('click', () => {
  chrome.tabs.query({ url: 'https://meet.google.com/*' }, (tabs) => {
    if (tabs && tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'MM_STOP' })
    }
  })
  chrome.storage.local.clear(() => showLogin())
  setStoppedUI()
})