// MeetingMind Content Script — Google Meet tab mein chalta hai
// v2: Caption-based speaker detection + Speech Recognition fallback

// ── API base ──
// Localhost default (dev). Deployment ke time login flow se production URL
// chrome.storage mein 'mm_api_base' key mein save hoga aur yahan use hoga.
const DEFAULT_API_BASE = 'https://meetingmind-production-f733.up.railway.app/api'
let API = DEFAULT_API_BASE
let apiReady = new Promise((resolve) => {
  chrome.storage.local.get(['mm_api_base'], (data) => {
    if (data.mm_api_base) API = data.mm_api_base
    resolve()
  })
})

let recognition = null
let isRecognizing = false
let fullTranscript = ''
let chunkBuffer = ''
let chunkTimer = null
let currentMeetingId = null
let currentToken = null
let overlay = null

// Caption system state
let captionObserver = null
let captionsEnabled = false
let ccEnableAttempts = 0
const CC_MAX_ATTEMPTS = 15

// Students list — dynamically fetched from backend (no hardcoding)
let KNOWN_SPEAKERS = []

async function fetchWorkspaceStudents(token) {
  try {
    await apiReady
    const res = await fetch(`${API}/workspace/students`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include'  // ← ye add karo
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()

    const students = data.students || (Array.isArray(data) ? data : [])

    KNOWN_SPEAKERS = students
      .map(s => (s.name || s.fullName || '').trim())
      .filter(Boolean)

    console.log('MeetingMind: Students loaded →', KNOWN_SPEAKERS)
  } catch (err) {
    console.warn('MeetingMind: Could not fetch students list:', err.message)
    KNOWN_SPEAKERS = []
  }
}

// ─────────────────────────────────────────────
// ── Overlay UI ──
// ─────────────────────────────────────────────
function createOverlay(text, isRecording) {
  if (overlay) overlay.remove()

  overlay = document.createElement('div')
  overlay.id = 'meetingmind-overlay'
  overlay.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: ${isRecording ? 'rgba(220,38,38,0.92)' : 'rgba(99,102,241,0.92)'};
    color: white;
    padding: 8px 18px;
    border-radius: 20px;
    font-size: 13px;
    font-family: -apple-system, sans-serif;
    font-weight: 600;
    z-index: 999999;
    pointer-events: none;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    gap: 8px;
  `

  if (!document.getElementById('mm-styles')) {
    const style = document.createElement('style')
    style.id = 'mm-styles'
    style.textContent = `@keyframes mm-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`
    document.head.appendChild(style)
  }

  const dot = document.createElement('span')
  dot.style.cssText = `
    width: 8px; height: 8px; border-radius: 50%; background: white;
    ${isRecording ? 'animation: mm-pulse 1s infinite;' : ''}
  `
  overlay.appendChild(dot)
  overlay.appendChild(document.createTextNode(text))
  document.body.appendChild(overlay)

  if (!isRecording) {
    setTimeout(() => overlay && overlay.remove(), 3000)
  }
}

// ─────────────────────────────────────────────
// ── CSS: Captions visually hide karo ──
// Screen pe nahi dikhein, DOM mein rehein
// ─────────────────────────────────────────────
function hideCaptionsVisually() {
  if (document.getElementById('mm-caption-hide')) return

  const style = document.createElement('style')
  style.id = 'mm-caption-hide'
  style.textContent = `
    /* Google Meet caption container — visually hidden, DOM intact */
    [jsname="tgaKEf"],
    [class*="caption-window"],
    [class*="a4cQT"],
    div[jscontroller][data-self-name] ~ div[jsname="tgaKEf"],
    .CNusmb,
    .iOzk7,
    .TBMuR {
      opacity: 0 !important;
      pointer-events: none !important;
      user-select: none !important;
    }
  `
  document.head.appendChild(style)
  console.log('MeetingMind: Captions hidden visually ✓')
}

// ─────────────────────────────────────────────
// ── CC Button: Programmatically enable karo ──
// ─────────────────────────────────────────────
const CC_BUTTON_SELECTORS = [
  'button[aria-label*="caption" i]',
  'button[aria-label*="Caption" i]',
  'button[data-tooltip*="caption" i]',
  '[jsname="r8qRAd"]',
  'button[aria-label*="Turn on captions"]',
  'button[aria-label*="subtitles" i]',
]

function findCCButton() {
  for (const sel of CC_BUTTON_SELECTORS) {
    const btn = document.querySelector(sel)
    if (btn) return btn
  }
  // Fallback: sab buttons scan karo text se
  const allButtons = document.querySelectorAll('button')
  for (const btn of allButtons) {
    const label = (btn.getAttribute('aria-label') || btn.textContent || '').toLowerCase()
    if (label.includes('caption') || label.includes('subtitle')) {
      return btn
    }
  }
  return null
}

function isCaptionsAlreadyOn() {
  const btn = findCCButton()
  if (!btn) return false
  const label = (btn.getAttribute('aria-label') || '').toLowerCase()
  return label.includes('turn off') || label.includes('hide caption')
}

function enableCaptions() {
  return new Promise((resolve) => {
    function attempt() {
      ccEnableAttempts++

      if (isCaptionsAlreadyOn()) {
        console.log('MeetingMind: Captions already ON ✓')
        hideCaptionsVisually()
        resolve(true)
        return
      }

      const btn = findCCButton()
      if (btn) {
        console.log('MeetingMind: CC button found, clicking...', btn.getAttribute('aria-label'))
        btn.click()
        setTimeout(() => {
          if (isCaptionsAlreadyOn() || document.querySelector(CAPTION_TEXT_SELECTORS[0])) {
            console.log('MeetingMind: Captions enabled ✓')
            hideCaptionsVisually()
            resolve(true)
          } else {
            console.log('MeetingMind: CC click done, waiting for DOM...')
            hideCaptionsVisually()
            resolve(true)
          }
        }, 1500)
      } else {
        if (ccEnableAttempts < CC_MAX_ATTEMPTS) {
          console.log(`MeetingMind: CC button not found, retry ${ccEnableAttempts}/${CC_MAX_ATTEMPTS}...`)
          setTimeout(attempt, 2000)
        } else {
          console.warn('MeetingMind: Could not find CC button after max attempts. Using Speech Recognition only.')
          resolve(false)
        }
      }
    }
    attempt()
  })
}

// ─────────────────────────────────────────────
// ── Caption DOM Selectors ──
// ─────────────────────────────────────────────
const CAPTION_TEXT_SELECTORS = [
  '.ygicle.VbkSUe',
  '.VbkSUe',
  '[jsname="tgaKEf"]',
  '[class*="a4cQT"]',
]

const SPEAKER_SELECTORS = [
  '.NwPY1d',
  '[data-self-name]',
]

let lastSpeaker = ''
let lastText = ''
let liveLine = { speaker: '', text: '' }
let liveLineTimer = null
const LIVE_LINE_FLUSH_MS = 2500

function flushLiveLine() {
  if (liveLine.text && liveLine.text.trim().length > 2) {
    const matchedSpeaker = matchToKnownSpeaker(liveLine.speaker)
    const line = formatTranscriptLine(liveLine.speaker, liveLine.text)
    if (line) {
      console.log('MeetingMind [Caption]:', line)
      chunkBuffer += '\n' + line
      fullTranscript += '\n' + line
    }
  }
  liveLine = { speaker: '', text: '' }
}
function matchToKnownSpeaker(rawName) {
  if (!rawName) return rawName
  const clean = rawName.trim().toLowerCase()
  if (!clean) return rawName

  // 1. Exact match
  let match = KNOWN_SPEAKERS.find(s => s.toLowerCase() === clean)
  if (match) return match

  // 2. Ek dusre ke andar contain ho (caption naam chhota ho sakta hai)
  match = KNOWN_SPEAKERS.find(s => {
    const known = s.toLowerCase()
    return known.includes(clean) || clean.includes(known)
  })
  if (match) return match

  // 3. Word-level overlap (kam se kam pehla naam match ho)
  const cleanWords = clean.split(/\s+/)
  match = KNOWN_SPEAKERS.find(s => {
    const knownWords = s.toLowerCase().split(/\s+/)
    return cleanWords[0] === knownWords[0]
  })
  if (match) return match

  return rawName // kuch na mile to raw naam hi bhej do
}
function extractCaptionData(node) {
  const row = node.closest?.('.nMcdL') || node.querySelector?.('.nMcdL') || node

  let speaker = ''
  const speakerEl = row.querySelector?.('.NwPY1d')
  if (speakerEl && speakerEl.textContent.trim()) {
    speaker = speakerEl.textContent.trim()
  }

  let text = ''
  const textEl = row.querySelector?.('.ygicle.VbkSUe') || row.querySelector?.('.VbkSUe')
  if (textEl && textEl.textContent.trim()) {
    text = textEl.textContent.trim()
  }

  return { speaker, text }
}

function formatTranscriptLine(speaker, text) {
  if (!text) return null
  const name = speaker || 'Unknown'   
  return `${name}: ${text}`
}

// ─────────────────────────────────────────────
// ── ACTIVE SPEAKER FALLBACK (NEW) ──
// ─────────────────────────────────────────────
// Detects who is actively speaking by finding the video tile
// with a "speaking" indicator (border, glow, or animated class)
function getActiveSpeakerName() {
  try {
    // Google Meet video tiles typically have these patterns for active speaker
    const ACTIVE_SPEAKER_PATTERNS = [
      // Pattern 1: Class containing "speaking" (common in many Meet versions)
      '[class*="speaking"]',
      // Pattern 2: Data attributes indicating speaking state
      '[data-speaking-state="true"]',
      '[data-is-speaking="true"]',
      // Pattern 3: Animated ring/border container (common Google Meet patterns)
      '.DPQfe',  // Often used for speaking indicator border
      '.Oaajhc', // Hashed class for active state
      '.krchSc', // Hashed class for speaking highlight
      '.v6F97e', // Alternative active tile class
      // Pattern 4: Aria-live regions on participant tiles
      '[aria-live="polite"][class*="tile"]',
      '[aria-live="assertive"][class*="tile"]',
      // Pattern 5: Video container with ring/border animation
      '[class*="speaking-ring"]',
      '[class*="speaking-border"]',
      '[class*="active-speaker"]',
      // Pattern 6: Direct Google Meet grid item with active state
      '[data-participant-id][class*="active"]',
    ]

    let activeTile = null
    let matchedPattern = null

    // Try each pattern
    for (const pattern of ACTIVE_SPEAKER_PATTERNS) {
      const tile = document.querySelector(pattern)
      if (tile) {
        activeTile = tile
        matchedPattern = pattern
        console.log('MeetingMind [ActiveSpeaker]: Found speaking tile with pattern:', pattern)
        break
      }
    }

    // Fallback: scan ALL video tiles for animated elements or CSS indicators
    if (!activeTile) {
      const allTiles = document.querySelectorAll('[data-participant-id], [jsname="CchuRe"], [class*="participant"], [class*="video-tile"]')
      for (const tile of allTiles) {
        // Check for computed style indicating animation or border
        const styles = window.getComputedStyle(tile)
        if (
          styles.animation?.includes('speak') ||
          styles.border?.includes('rgb') ||
          styles.boxShadow?.includes('rgb(')
        ) {
          activeTile = tile
          matchedPattern = 'computed-style-animation'
          console.log('MeetingMind [ActiveSpeaker]: Detected via computed styles')
          break
        }
      }
    }

    if (!activeTile) {
      console.log('MeetingMind [ActiveSpeaker]: No active speaker tile found')
      return null
    }

    // Extract participant name from the tile
    // Google Meet typically shows name in these elements:
    let participantName = null

    // Strategy 1: Look for name label at bottom of tile
    const nameSelectors = [
      '.t5a07e',      // Common Meet name label
      '[class*="participant-name"]',
      '[class*="name-label"]',
      'div[aria-label*="("]', // Tiles often have aria-label like "John Doe (in call)"
    ]

    for (const sel of nameSelectors) {
      const nameEl = activeTile.querySelector(sel)
      if (nameEl?.textContent?.trim()) {
        participantName = nameEl.textContent.trim()
        break
      }
    }

    // Strategy 2: Check aria-label on tile itself
    if (!participantName) {
      const ariaLabel = activeTile.getAttribute('aria-label') || ''
      // Extract name from labels like "John Doe (in call)" or "Video tile for Jane Smith"
      const nameMatch = ariaLabel.match(/^(.+?)\s*[\(\[]/)
      if (nameMatch) {
        participantName = nameMatch[1].trim()
      }
    }

    // Strategy 3: Look for text in immediate children
    if (!participantName) {
      for (const child of activeTile.children) {
        const text = child.textContent?.trim()
        if (text && text.length > 0 && text.length < 50) {
          participantName = text
          break
        }
      }
    }

    if (participantName) {
      console.log('MeetingMind [ActiveSpeaker]: Extracted name:', participantName, 'from pattern:', matchedPattern)
      return participantName
    } else {
      console.log('MeetingMind [ActiveSpeaker]: Tile found but no name extracted')
      return null
    }

  } catch (err) {
    console.error('MeetingMind [ActiveSpeaker]: Error detecting active speaker:', err.message)
    return null
  }
}

// ─────────────────────────────────────────────
// ── MutationObserver: Caption DOM watch ──
// ─────────────────────────────────────────────
const CAPTION_WRAPPER_SELECTORS = [
  '[jsname="dsyhDe"]',
  '[aria-label="Captions"]',
  '[jsname="tgaKEf"]',
  '[class*="caption"]',
  '[aria-live="polite"]',
  '[aria-live="assertive"]',
]

function findCaptionWrapper() {
  for (const sel of CAPTION_WRAPPER_SELECTORS) {
    const el = document.querySelector(sel)
    if (el) return el
  }
  return null
}

function startCaptionObserver() {
  if (captionObserver) return

  const target = findCaptionWrapper() || document.body
  console.log('MeetingMind: Starting MutationObserver on', target.tagName, target.className?.slice(0, 40))

  captionObserver = new MutationObserver(() => {
  processLatestCaptionRow()
  })

  captionObserver.observe(target, {
    childList: true,
    subtree: true,
    characterData: true,
  })

  console.log('MeetingMind: Caption MutationObserver active ✓')
}
function processLatestCaptionRow() {
  const wrapper = findCaptionWrapper()
  if (!wrapper) return
  const rows = wrapper.querySelectorAll('.nMcdL')
  if (!rows.length) return

  const lastRow = rows[rows.length - 1]
  const { text } = extractCaptionData(lastRow)
  if (!text) return

  // Last row mein naam dhoondo, na mile to peechhe ki rows mein dhoondo
  let speaker = ''
  for (let i = rows.length - 1; i >= 0; i--) {
    const el = rows[i].querySelector('.NwPY1d')
    if (el && el.textContent.trim()) {
      speaker = el.textContent.trim()
      break
    }
  }

  processCaptionNode(lastRow, { speaker, text })
}
function processCaptionNode(node, override) {
  let speaker, text

  if (override) {
    speaker = override.speaker
    text = override.text
  } else {
    const row = node.closest?.('.nMcdL') || node.querySelector?.('.nMcdL') || null
    if (!row) return
    const data = extractCaptionData(row)
    speaker = data.speaker
    text = data.text
  }

  if (!text) return

  // ┌─────────────────────────────────────────┐
  // │ ACTIVE SPEAKER FALLBACK (NEW)           │
  // │ If caption speaker is empty/Unknown,    │
  // │ try to detect from video tile highlight │
  // └─────────────────────────────────────────┘
  if (!speaker || speaker.trim() === '' || speaker.trim().toLowerCase() === 'unknown') {
    const activeSpeakerName = getActiveSpeakerName()
    if (activeSpeakerName) {
      console.log('MeetingMind [ActiveSpeaker]:', activeSpeakerName)
      speaker = activeSpeakerName
      // Now match it to known speakers (same logic as normal caption flow)
      speaker = matchToKnownSpeaker(speaker)
    }
  }

  if (speaker) {
    if (liveLine.speaker && liveLine.speaker !== 'Unknown' && speaker !== liveLine.speaker) {
      flushLiveLine()
    }
    liveLine.speaker = speaker
  } else if (!liveLine.speaker) {
    liveLine.speaker = 'Unknown'
  }

  liveLine.text = text

  clearTimeout(liveLineTimer)
  liveLineTimer = setTimeout(flushLiveLine, LIVE_LINE_FLUSH_MS)
}

function stopCaptionObserver() {
  if (captionObserver) {
    captionObserver.disconnect()
    captionObserver = null
    console.log('MeetingMind: Caption observer stopped')
  }
}

// ─────────────────────────────────────────────
// ── Speech Recognition (Fallback) ──
// ─────────────────────────────────────────────
function startSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    console.error('MeetingMind: SpeechRecognition not supported')
    return
  }

  recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = false
  recognition.lang = 'en-IN'

  recognition.onstart = () => {
    console.log('MeetingMind: SpeechRecognition fallback active ✓')
  }

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        const text = event.results[i][0].transcript.trim()
        const line = lastSpeaker ? `${lastSpeaker}: ${text}` : text
        chunkBuffer += ' ' + line
        fullTranscript += ' ' + line
        console.log('MeetingMind [SR]:', line)
      }
    }
  }

  recognition.onerror = (event) => {
    console.error('MeetingMind SR error:', event.error)
    if (event.error === 'not-allowed') {
      createOverlay('❌ Mic permission denied', false)
    }
  }

  recognition.onend = () => {
  if (isRecognizing) {
    setTimeout(() => {
      if (isRecognizing && recognition) {
        try { recognition.start() } catch(e) { console.log('SR restart skipped:', e.message) }
      }
    }, 500)
  }
}

  recognition.start()
}

// ─────────────────────────────────────────────
// ── Start / Stop ──
// ─────────────────────────────────────────────
async function startListening(meetingId, token) {
  if (isRecognizing) return

  currentMeetingId = meetingId
  currentToken = token
  fullTranscript = ''
  chunkBuffer = ''
  lastSpeaker = ''
  lastText = ''
  ccEnableAttempts = 0
  isRecognizing = true

  createOverlay('🧠 MeetingMind Recording...', true)

  await fetchWorkspaceStudents(token)

  console.log('MeetingMind: Enabling captions...')
  const ccOk = await enableCaptions()

  startCaptionObserver()
  startSpeechRecognition()

  chunkTimer = setInterval(() => {
    if (chunkBuffer.trim().length > 20) {
      sendTranscriptChunk(chunkBuffer.trim())
      chunkBuffer = ''
    }
  }, 60000)

  console.log(`MeetingMind: All systems active ✓ | Captions: ${ccOk ? 'ON' : 'FALLBACK'} | Students: ${KNOWN_SPEAKERS.length}`)
}

async function stopListening() {
  isRecognizing = false
  clearInterval(chunkTimer)
  chunkTimer = null

  stopCaptionObserver()
  clearTimeout(liveLineTimer)
  flushLiveLine()

  if (recognition) {
    recognition.stop()
    recognition = null
  }

  const hideStyle = document.getElementById('mm-caption-hide')
  if (hideStyle) hideStyle.remove()

  createOverlay('✓ MeetingMind stopped', false)

  const finalText = fullTranscript.trim()
  if (finalText.length > 20) {
    console.log('MeetingMind: Sending final transcript, length:', finalText.length)
    await sendTranscriptChunk(finalText)
  } else {
    console.log('MeetingMind: Transcript too short, skipping:', finalText)
  }

  fullTranscript = ''
  chunkBuffer = ''
  currentMeetingId = null
  currentToken = null
}

// ─────────────────────────────────────────────
// ── Backend ──
// ─────────────────────────────────────────────
async function sendTranscriptChunk(transcript) {
  if (!currentMeetingId || !currentToken) return
  try {
    await apiReady
    console.log('MeetingMind: Sending transcript chunk...\n', transcript.slice(0, 200))
    const res = await fetch(`${API}/meetings/${currentMeetingId}/process-transcript-chunk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`
      },
      body: JSON.stringify({ transcript })
    })
    const data = await res.json()
    console.log('MeetingMind: Backend response:', data)
  } catch (err) {
    console.error('MeetingMind: Failed to send transcript:', err)
  }
}

// ─────────────────────────────────────────────
// ── Chrome Message Listener ──
// ─────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // ✅ FIX: Ping handler — popup.js ko confirm karo ki script loaded hai
  if (msg.type === 'MM_PING') {
    sendResponse({ ok: true })
    return true
  }

  if (msg.type === 'MM_START') {
    startListening(msg.meetingId, msg.token)
    sendResponse({ ok: true })
  } else if (msg.type === 'MM_STOP') {
    stopListening().then(() => sendResponse({ ok: true }))
    return true
  } else if (msg.type === 'MM_DEBUG_CAPTIONS') {
    const wrapper = findCaptionWrapper()
    const btn = findCCButton()
    sendResponse({
      captionWrapper: wrapper ? wrapper.className : null,
      ccButton: btn ? btn.getAttribute('aria-label') : null,
      lastSpeaker,
      transcriptLength: fullTranscript.length,
    })
  }
  return true
})

// ─────────────────────────────────────────────
// ── Page Load ──
// ─────────────────────────────────────────────
chrome.storage.local.get(['mm_recording', 'mm_meeting', 'mm_token'], (data) => {
  if (data.mm_recording && data.mm_meeting && data.mm_token) {
    createOverlay('🧠 MeetingMind Recording...', true)
  }
})

console.log('MeetingMind content script v2 loaded ✓ | Caption + SR mode')