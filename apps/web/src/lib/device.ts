function isStandaloneDisplay() {
  if (typeof window === "undefined") return false
  const media = window.matchMedia("(display-mode: standalone)").matches
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return media || iosStandalone
}

/**
 * Phone-like inbox (lock screen) vs desktop desk.
 * Narrow / coarse-pointer / phone PWA → lock screen.
 * Laptop/desktop browsers → Mac-style notification desk.
 */
export function prefersPhoneInbox() {
  if (typeof window === "undefined") return true
  const narrow = window.matchMedia("(max-width: 768px)").matches
  const coarse = window.matchMedia("(pointer: coarse)").matches
  if (narrow) return true
  if (isStandaloneDisplay() && coarse) return true
  return false
}

export { isStandaloneDisplay }
