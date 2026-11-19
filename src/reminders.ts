let timers: number[] = []
const moments = [10, 18, 23]
const messages = [
  ['Доброе утро! Найди пять минут для себя.', 'Открой START и начни маленькую миссию.'],
  ['Вечер — хороший момент начать.', 'Пять минут сегодня помогут сохранить серию.'],
  ['До полуночи осталось немного.', 'Последний шанс выполнить миссию сегодня.'],
]

/** Foreground-only reminders. iOS background delivery requires Web Push from a server. */
export function scheduleReminders(on: boolean, done: () => boolean) {
  timers.forEach(clearTimeout); timers = []
  if (!on || !('Notification' in window) || Notification.permission !== 'granted') return
  const now = new Date()
  for (let offset = 0; offset <= 1; offset++) {
    moments.forEach((hour, i) => {
      const at = new Date(now); at.setDate(now.getDate()+offset); at.setHours(hour, 0, 0, 0)
      const delay = at.getTime()-Date.now()
      if (delay <= 0) return
      timers.push(window.setTimeout(() => {
        if (!done() && new Date().getHours() === hour) new Notification(messages[i][0], { body: messages[i][1], tag: `start-reminder-${at.toDateString()}-${hour}` })
      }, delay))
    })
  }
}

export function cancelReminders() { timers.forEach(clearTimeout); timers = [] }
