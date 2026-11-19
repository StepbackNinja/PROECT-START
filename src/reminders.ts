const SERVER = 'https://zxuchvdfsijwwnacslcr.supabase.co/functions/v1/start-push'
const ENABLED = 'start-server-push-enabled'
const TOKEN = 'start-push-device-token'
export function pushEnabled() { return localStorage.getItem(ENABLED) === 'yes' }
function deviceToken() {
  let token = localStorage.getItem(TOKEN)
  if (!token) { token = [...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join(''); localStorage.setItem(TOKEN,token) }
  return token
}
async function api(action: string, body: unknown = {}) {
  const response = await fetch(`${SERVER}/${action}`, {method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${deviceToken()}`},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)})
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Не удалось подключиться к серверу напоминаний.')
  return data
}
function fromBase64(value: string) {
  const raw = atob(value.replace(/-/g,'+').replace(/_/g,'/') + '='.repeat((4-value.length%4)%4))
  return Uint8Array.from(raw,c=>c.charCodeAt(0))
}
function supported() {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('На iPhone добавь START на экран «Домой» через меню «Поделиться» в Safari и открой по иконке.')
}
async function registerDevice(registration: ServiceWorkerRegistration, done: boolean, create: boolean) {
  await new Promise<void>((resolve,reject) => {
    const channel = new MessageChannel()
    const timeout = window.setTimeout(()=>{channel.port1.close();reject(new Error('Нужно обновление START. Закрой приложение, открой снова и повтори подключение.'))},3000)
    channel.port1.onmessage = event => {window.clearTimeout(timeout);channel.port1.close();event.data?.version===1?resolve():reject(new Error('Обнови START и повтори подключение.'))}
    registration.active?.postMessage({type:'START_PUSH_READY'},[channel.port2])
  })
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription && create) {
    const response = await fetch(`${SERVER}/config`,{signal:AbortSignal.timeout(10000)})
    if (!response.ok) throw new Error('Сервер напоминаний недоступен. Попробуй позже.')
    const {publicKey} = await response.json()
    subscription = await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:fromBase64(publicKey)})
  }
  if (!subscription) throw new Error('Подписка отсутствует. Включи фоновые напоминания ещё раз.')
  await api('subscribe',{subscription:subscription.toJSON(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,done})
}
export async function enableAndTestPush(done: boolean) {
  supported()
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Уведомления не разрешены. Проверь Настройки iPhone → Уведомления → START.')
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration?.active) throw new Error('START ещё обновляется. Закрой и открой приложение, затем попробуй снова.')
  await registerDevice(registration,done,true)
  localStorage.setItem(ENABLED,'yes')
  await api('test')
  return 'Серверный push подключён: 10:00, 18:00 и 23:00 по времени телефона, даже при закрытом START. Тест отправлен с сервера. После миссии оставшиеся напоминания отменяются. Если миссия выполнена без интернета, отмена сработает после подключения к сети.'
}
export async function syncPush(done: boolean) {
  if (!pushEnabled()) return
  supported()
  if (Notification.permission !== 'granted') throw new Error('Разрешение уведомлений выключено в настройках iPhone.')
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return
  if (done) {
    registration.active?.postMessage({type:'START_COMPLETE'})
  }
  await registerDevice(registration,done,true)
}
export async function disablePush() {
  await api('unsubscribe')
  const registration = await navigator.serviceWorker.getRegistration()
  await (await registration?.pushManager.getSubscription())?.unsubscribe()
  localStorage.removeItem(ENABLED)
}
