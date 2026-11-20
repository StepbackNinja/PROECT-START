import { memo, useEffect, useState } from 'react'

let visitPortrait: 'bare' | 'suit' | undefined
function choosePortrait() {
  // Module cache makes StrictMode/remounts harmless; change only on a fresh load.
  if (visitPortrait) return visitPortrait
  try {
    const previous = localStorage.getItem('start-last-portrait')
    const saved = JSON.parse(localStorage.getItem('start-save-v1') || '{}')
    const inMission = typeof saved.missionEnd === 'number' && saved.missionEnd > Date.now()
    visitPortrait = inMission && (previous === 'bare' || previous === 'suit')
      ? previous : previous === 'bare' ? 'suit' : 'bare'
    localStorage.setItem('start-last-portrait', visitPortrait)
  } catch { visitPortrait = 'bare' }
  return visitPortrait
}

function CosmicPortrait() {
  const [variant] = useState(choosePortrait)
  const [paused, setPaused] = useState(document.hidden)
  useEffect(() => {
    const update = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return <div className={`cosmic-portrait ${paused ? 'portrait-paused' : ''}`} aria-hidden="true">
    <img src={`/assets/portrait-${variant}-v1.webp`} width="1764" height="1764" alt="" decoding="async" fetchPriority="high" />
    <div className="portrait-light" />
    <div className="portrait-stars" />
  </div>
}
export default memo(CosmicPortrait)
