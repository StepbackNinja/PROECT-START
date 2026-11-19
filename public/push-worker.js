/* Imported by the Workbox worker on the same origin as START. */
self.addEventListener('push', event => {
  let message = {}
  try { message = event.data?.json() || {} } catch {}
  event.waitUntil(self.registration.showNotification(message.title || 'START', {
    body: message.body || 'Найди пять минут для сегодняшней миссии.',
    tag: message.tag || 'start-reminder', icon:'/icon.svg', data:{url:self.registration.scope},
  }))
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows => {
    const client = windows.find(client => client.url.startsWith(self.registration.scope))
    if (client) return client.focus()
    return self.clients.openWindow(self.registration.scope)
  }))
})
self.addEventListener('message', event => {
  if (event.data?.type === 'START_PUSH_READY') event.ports[0]?.postMessage({version:1})
  if (event.data?.type === 'START_COMPLETE') event.waitUntil(self.registration.getNotifications().then(notifications => {
    notifications.filter(n=>n.tag.startsWith('start-')).forEach(n=>n.close())
  }))
})
