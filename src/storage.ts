export type Save = { xp: number; days: string[]; freezeWeek: string; missionEnd: number | null; reminders: boolean }
const KEY = 'start-save-v1'
export const initial: Save = { xp: 0, days: [], freezeWeek: '', missionEnd: null, reminders: false }
export function load(): Save { try { return { ...initial, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return initial } }
export function persist(s: Save) { localStorage.setItem(KEY, JSON.stringify(s)) }
export const dayKey = (date = new Date()) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
export const weekKey = (date = new Date()) => { const d = new Date(date); d.setHours(0,0,0,0); d.setDate(d.getDate() - ((d.getDay()+6)%7)); return dayKey(d) }
