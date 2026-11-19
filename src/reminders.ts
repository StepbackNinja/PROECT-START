let timers: number[] = []
export async function showTestNotification(): Promise<string> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'На iPhone сначала добавь START на экран «Домой» через меню «Поделиться» в Safari и открой по иконке.'
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'Уведомления не разрешены. Проверь Настройки iPhone → Уведомления → START.'
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return 'Приложение ещё готовится к работе. Закрой и снова открой START, затем повтори проверку.'
  await registration.showNotification('START · Проверка уведомлений', { body: 'Всё работает! Пять минут — и день уже твой.', tag: 'start-test' })
  return 'Тестовое уведомление отправлено. Если баннер не появился, проверь разрешение баннеров и режим «Фокусирование» в настройках iPhone. Напоминания при закрытом приложении пока не подключены.'
}
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
        if (!done() && new Date().getHours() === hour) navigator.serviceWorker.getRegistration().then(reg => reg?.showNotification(messages[i][0], { body: messages[i][1], tag: `start-reminder-${at.toDateString()}-${hour}` })).catch(() => {})
      }, delay))
    })
  }
}

export function cancelReminders() { timers.forEach(clearTimeout); timers = [] }
