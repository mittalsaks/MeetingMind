// Backend server UTC pe chal sakta hai (Railway default), lekin workspace
// timezone Asia/Calcutta (IST, UTC+5:30) hai. "Aaj" hamesha IST ke hisaab
// se calculate hona chahiye, warna raat 12:00–5:30 AM IST ke beech
// "missing today" jaise false positives aate hain.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

export function getISTDayBounds(refDate: Date = new Date()) {
  const istNow = new Date(refDate.getTime() + IST_OFFSET_MS)
  const istYear = istNow.getUTCFullYear()
  const istMonth = istNow.getUTCMonth()
  const istDate = istNow.getUTCDate()

  // IST midnight ko wapas UTC instant me convert karo (Mongo UTC me store karta hai)
  const startOfDay = new Date(Date.UTC(istYear, istMonth, istDate, 0, 0, 0, 0) - IST_OFFSET_MS)
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

  return { startOfDay, endOfDay }
}

// scheduledDate (date-only) + scheduledTime ("HH:mm", IST wall-clock) ko
// ek sahi UTC Date instant me combine karta hai. scheduledTime hamesha
// IST maana jata hai (jaisa Settings > Timezone: Asia/Calcutta batata hai).
export function combineMeetingDateTime(scheduledDate: Date | string, scheduledTime: string): Date {
  const dateOnly = new Date(scheduledDate).toISOString().slice(0, 10) // "YYYY-MM-DD" (UTC date part)
  const [hours, minutes] = scheduledTime.split(":").map(Number)
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
  const [y, m, d] = dateOnly.split("-").map(Number)
  // IST wall-clock time ko UTC instant me convert karo
  const utcMs = Date.UTC(y, m - 1, d, hours, minutes, 0, 0) - IST_OFFSET_MS
  return new Date(utcMs)
}
