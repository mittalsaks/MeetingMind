// MeetingMind Content Script — Google Meet tab mein chalta hai
// v2: Caption-based speaker detection + Speech Recognition fallback
// PATCHED: normalized speaker matching (space/case-insensitive)

// ── API base ──
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

let captionObserver = null
let captionsEnabled = false
let ccEnableAttempts = 0
const CC_MAX_ATTEMPTS = 15

let KNOWN_SPEAKERS = []

async function fetchWorkspaceStudents(token) {
  try {
    await apiReady
    const res = await fetch(`${API}/workspace/students`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include'
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
// ─────────────────────────────────────────────
function hideCaptionsVisually() {
  if (document.getElementById('mm-caption-hide')) return

  const style = document.createElement('style')
  style.id = 'mm-caption-hide'
  style.textContent = `
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
    const line = formatTranscriptLine(matchedSpeaker, liveLine.text)
    if (line) {
      console.log('MeetingMind [Caption]:', line)
      chunkBuffer += '\n' + line
      fullTranscript += '\n' + line
    }
  }
  liveLine = { speaker: '', text: '' }
}

// ── PATCH B: normalized matching (case + space + punctuation insensitive) ──
function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function matchToKnownSpeaker(rawName) {
  if (!rawName) return rawName
  const cleanNorm = normalize(rawName)
  if (!cleanNorm) return rawName

  // Sirf EXACT normalized match — substring match hata diya kyunki wo
  // galat tarike se ek naam ko dusre naam ke andar match kar deta tha
  // (e.g. "Sakshi Mittal" admin ka naam "sakshimittal753" student se match ho jata tha)
  let match = KNOWN_SPEAKERS.find(s => normalize(s) === cleanNorm)
  if (match) return match

  return rawName // no confident match — leave as-is, backend/Gemini will reject if unmatched
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
// ── ACTIVE SPEAKER FALLBACK ──
// ─────────────────────────────────────────────
function getActiveSpeakerName() {
  try {
    const ACTIVE_SPEAKER_PATTERNS = [
      '.oZRSLe', // Confirmed current Meet active-speaker tile class (contains name in innerText)
      
      '[class*="speaking"]',
      '[data-speaking-state="true"]',
      '[data-is-speaking="true"]',
      '.DPQfe',
      '.Oaajhc',
      '.krchSc',
      '.v6F97e',
      '[aria-live="polite"][class*="tile"]',
      '[aria-live="assertive"][class*="tile"]',
      '[class*="speaking-ring"]',
      '[class*="speaking-border"]',
      '[class*="active-speaker"]',
      '[data-participant-id][class*="active"]',
    ]

    let activeTile = null
    let matchedPattern = null

    for (const pattern of ACTIVE_SPEAKER_PATTERNS) {
      const tile = document.querySelector(pattern)
      if (tile && !tile.closest('[data-self-name]') && !tile.hasAttribute('data-self-name')) {
        activeTile = tile
        matchedPattern = pattern
        console.log('MeetingMind [ActiveSpeaker]: Found speaking tile with pattern:', pattern)
        break
      }
    }

    if (!activeTile) {
      const allTiles = document.querySelectorAll('[data-participant-id], [jsname="CchuRe"], [class*="participant"], [class*="video-tile"]')
      for (const tile of allTiles) {
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

    let participantName = null

    // Strategy 1: name label inside tile
    const nameSelectors = [
      '.t5a07e',
      '.zWGUib',   // common current Meet name-label class
      '.dwSVXe',   // alt current Meet name-label class
      '[class*="participant-name"]',
      '[class*="name-label"]',
      'div[aria-label*="("]',
    ]
    for (const sel of nameSelectors) {
      const nameEl = activeTile.querySelector(sel)
      if (nameEl?.textContent?.trim()) {
        participantName = nameEl.textContent.trim()
        break
      }
    }

    // Strategy 2: aria-label on tile itself
    if (!participantName) {
      const ariaLabel = activeTile.getAttribute('aria-label') || ''
      const nameMatch = ariaLabel.match(/^(.+?)\s*[\(\[]/)
      if (nameMatch) {
        participantName = nameMatch[1].trim()
      }
    }

    // Strategy 3: walk UP to closest participant container and look for aria-label / title there
    if (!participantName) {
      const container = activeTile.closest('[data-participant-id]') || activeTile.closest('[jsname="CchuRe"]')
      if (container) {
        const ariaLabel = container.getAttribute('aria-label') || container.getAttribute('data-self-name') || ''
        if (ariaLabel) {
          const nameMatch = ariaLabel.match(/^(.+?)\s*[\(\[]/)
          participantName = nameMatch ? nameMatch[1].trim() : ariaLabel.trim()
        }
      }
    }

    // Strategy 3.5: direct innerText of tile itself (handles Meet's current UI
    // where name appears as plain repeated text, e.g. "Sakshi Mittal\nSakshi Mittal")
    if (!participantName) {
      const raw = activeTile.innerText?.trim()
      if (raw) {
        const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length > 0) {
          const first = lines[0]
          if (first.length > 0 && first.length < 50) {
            participantName = first
          }
        }
      }
    }

    // Strategy 4: text in immediate children (last resort)
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

  if (!speaker || speaker.trim() === '' || speaker.trim().toLowerCase() === 'unknown') {
    const activeSpeakerName = getActiveSpeakerName()
    if (activeSpeakerName) {
      console.log('MeetingMind [ActiveSpeaker]:', activeSpeakerName)
      speaker = matchToKnownSpeaker(activeSpeakerName)
    }
  } else {
    speaker = matchToKnownSpeaker(speaker)
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
          try { recognition.start() } catch (e) { console.log('SR restart skipped:', e.message) }
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

  // Quota bachane ke liye: ab har 60 sec me chunk nahi bhejenge.
  // Sirf meeting end pe (stopListening me) ek hi baar poora transcript jayega.
  // chunkTimer = setInterval(() => {
  //   if (chunkBuffer.trim().length > 20) {
  //     sendTranscriptChunk(chunkBuffer.trim())
  //     chunkBuffer = ''
  //   }
  // }, 60000)

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

console.log('MeetingMind content script v2 loaded ✓ | Caption + SR mode (patched)')