// MeetingMind Content Script — Google Meet tab mein chalta hai
// v2: Caption-based speaker detection + Speech Recognition fallback

const API = 'http://localhost:5000/api'

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
  '[jsname="tgaKEf"]',
  '[class*="a4cQT"]',
  '.CNusmb',
  '[jsname="YSxPC"]',
]

const SPEAKER_SELECTORS = [
  '[jsname="r4nke"]',
  '[class*="KcIKyf"]',
  '[data-self-name]',
  '.zs7s8d',
]

let lastSpeaker = ''
let lastText = ''

function extractCaptionData(captionContainer) {
  let speaker = ''
  for (const sel of SPEAKER_SELECTORS) {
    const el = captionContainer.querySelector(sel) || document.querySelector(sel)
    if (el && el.textContent.trim()) {
      speaker = el.textContent.trim()
      break
    }
  }

  let text = ''
  for (const sel of CAPTION_TEXT_SELECTORS) {
    const el = captionContainer.querySelector(sel)
    if (el && el.textContent.trim()) {
      text = el.textContent.trim()
      break
    }
  }
  if (!text) text = captionContainer.textContent.trim()

  return { speaker, text }
}

function formatTranscriptLine(speaker, text) {
  if (!text) return null
  const name = speaker || 'Unknown'
  return `${name}: ${text}`
}

// ─────────────────────────────────────────────
// ── MutationObserver: Caption DOM watch ──
// ─────────────────────────────────────────────
const CAPTION_WRAPPER_SELECTORS = [
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

  captionObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue
        processCaptionNode(node)
      }
      if (mutation.type === 'characterData' || mutation.type === 'childList') {
        const target = mutation.target
        if (target.nodeType === 1) processCaptionNode(target)
        else if (target.parentElement) processCaptionNode(target.parentElement)
      }
    }
  })

  captionObserver.observe(target, {
    childList: true,
    subtree: true,
    characterData: true,
  })

  console.log('MeetingMind: Caption MutationObserver active ✓')
}

function processCaptionNode(node) {
  const textContent = node.textContent?.trim()
  if (!textContent || textContent.length < 3) return

  let { speaker, text } = extractCaptionData(node)

  if (!speaker && lastSpeaker) speaker = lastSpeaker
  if (speaker) lastSpeaker = speaker

  if (!text || text === lastText) return
  lastText = text

  const line = formatTranscriptLine(speaker, text)
  if (!line) return

  console.log('MeetingMind [Caption]:', line)
  chunkBuffer += '\n' + line
  fullTranscript += '\n' + line
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

function stopListening() {
  isRecognizing = false
  clearInterval(chunkTimer)
  chunkTimer = null

  stopCaptionObserver()

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
    sendTranscriptChunk(finalText)
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
    stopListening()
    sendResponse({ ok: true })
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