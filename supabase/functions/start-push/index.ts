import { generateRequestDetails } from 'npm:web-push@4.0.0'

const allowedOrigins = new Set(['https://start-pwa.vercel.app', 'https://start-pwa-serkanbolatino-8450.vercel.app'])
const messages: Record<number, [string, string]> = {
  10: ['Пять минут для себя?', 'Начни то, что откладывал. Сегодня достаточно маленького шага.'],
  18: ['Вечер. Твоя миссия ещё ждёт.', 'Удели делу пять минут и сохрани сегодняшний день.'],
  23: ['До полуночи остался час.', 'Начни пятиминутную миссию сейчас, чтобы сохранить серию.'],
}
const base = Deno.env.get('SUPABASE_URL')! + '/rest/v1/'
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
async function db(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(base + path, { method, headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation,resolution=merge-duplicates' }, body: body === undefined ? undefined : JSON.stringify(body) })
  if (!response.ok) throw new Error('Storage unavailable')
  return response.status === 204 ? [] : response.json()
}
const hash = async (s: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(n=>n.toString(16).padStart(2,'0')).join('')
function localDay(timezone: string) { return new Intl.DateTimeFormat('en-CA', {timeZone: timezone, year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()) }
function validSubscription(sub: any) {
  try {
    const u = new URL(sub.endpoint)
    return u.protocol === 'https:' && !u.port && !u.username && !u.password &&
      (u.hostname === 'web.push.apple.com' || u.hostname.endsWith('.push.apple.com') || u.hostname === 'fcm.googleapis.com' || u.hostname === 'updates.push.services.mozilla.com') &&
      /^[A-Za-z0-9_-]{80,100}$/.test(sub.keys.p256dh) && /^[A-Za-z0-9_-]{20,30}$/.test(sub.keys.auth) && sub.endpoint.length < 2048
  } catch { return false }
}
async function send(subscription: any, title: string, body: string, tag: string, config: any, ttl=600) {
  const request = generateRequestDetails(subscription, JSON.stringify({title,body,tag}), {
    vapidDetails: { subject: 'https://start-pwa.vercel.app', publicKey: config.publicKey, privateKey: config.privateKey }, TTL: ttl, urgency: 'high',
  })
  const response = await fetch(request.endpoint, { method: request.method, headers: request.headers, body: request.body, redirect:'error', signal:AbortSignal.timeout(10000) })
  return response.status
}

Deno.serve(async req => {
  const origin = req.headers.get('origin') || ''
  const headers = { 'Content-Type':'application/json', 'Cache-Control':'no-store', Vary:'Origin', ...(allowedOrigins.has(origin) ? {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, content-type','Access-Control-Allow-Methods':'GET, POST, OPTIONS'} : {}) }
  const reply = (body: unknown, status=200) => new Response(JSON.stringify(body), {status,headers})
  if (req.method === 'OPTIONS') return new Response(null,{status:204,headers})
  try {
    const action = new URL(req.url).pathname.split('/').pop()
    const [settings] = await db('start_push_config?select=value&id=eq.true')
    const config = settings.value
    if (action === 'config' && req.method === 'GET') return reply({publicKey:config.publicKey})
    if (req.method !== 'POST') return reply({error:'Method not allowed'},405)
    const token = (req.headers.get('authorization') || '').replace(/^Bearer /,'')
    if (action === 'dispatch') {
      if (token !== config.cronSecret) return reply({error:'Unauthorized'},401)
      const due = await db('rpc/start_claim_push','POST',{})
      let sent=0, expired=0, failed=0, skipped=0
      for (const job of due) {
        const [device] = await db(`start_push_devices?id=eq.${job.device_id}&select=completed_day`)
        if (!device || device.completed_day === job.day) { skipped++; continue }
        try {
          const [title,body] = messages[job.slot]
          const status = await send(job.subscription,title,body,`start-${job.day}-${job.slot}`,config)
          if (status === 404 || status === 410) { await db(`start_push_devices?id=eq.${job.device_id}`,'DELETE'); expired++ }
          else if (status >= 200 && status < 300) sent++
          else throw new Error('Push rejected')
        } catch {
          await db(`start_push_sent?device_id=eq.${job.device_id}&day=eq.${job.day}&slot=eq.${job.slot}`,'DELETE'); failed++
        }
      }
      await db(`start_push_sent?day=lt.${new Date(Date.now()-8*86400000).toISOString().slice(0,10)}`,'DELETE')
      await db(`start_push_devices?updated_at=lt.${new Date(Date.now()-120*86400000).toISOString()}`,'DELETE')
      return reply({sent,expired,failed,skipped})
    }
    if (!allowedOrigins.has(origin)) return reply({error:'Origin not allowed'},403)
    if (!/^[a-f0-9]{64}$/.test(token)) return reply({error:'Unauthorized'},401)
    if (Number(req.headers.get('content-length') || 0)>8192) return reply({error:'Request too large'},413)
    const raw = await req.text()
    if (raw.length > 8192) return reply({error:'Request too large'},413)
    const input = JSON.parse(raw || '{}')
    const id = await hash(token)
    if (action === 'subscribe') {
      if (!validSubscription(input.subscription) || typeof input.timezone !== 'string') return reply({error:'Invalid subscription'},400)
      try {new Intl.DateTimeFormat('en',{timeZone:input.timezone}).format()} catch {return reply({error:'Invalid timezone'},400)}
      // Completion is accepted only for today, never an arbitrary future day.
      const today = localDay(input.timezone)
      const row: any = {id,subscription:input.subscription,timezone:input.timezone,updated_at:new Date().toISOString()}
      if (input.done === true) row.completed_day = today
      await db('start_push_devices?on_conflict=id','POST',row)
      return reply({ok:true})
    }
    if (action === 'unsubscribe') {await db(`start_push_devices?id=eq.${id}`,'DELETE');return reply({ok:true})}
    const [device] = await db(`start_push_devices?id=eq.${id}`)
    if (!device) return reply({error:'Subscription not found'},404)
    if (action === 'complete') {
      await db(`start_push_devices?id=eq.${id}`,'PATCH',{completed_day:localDay(device.timezone),updated_at:new Date().toISOString()})
      return reply({ok:true})
    }
    if (action === 'test') {
      if (!await db('rpc/start_claim_test','POST',{p_id:id})) return reply({error:'Подожди 30 секунд перед новой проверкой.'},429)
      const status = await send(device.subscription,'START · Серверный push работает','Это уведомление отправлено сервером. Ежедневные напоминания подключены: 10:00, 18:00 и 23:00.', 'start-server-test',config,60)
      if (status === 404 || status === 410) {await db(`start_push_devices?id=eq.${id}`,'DELETE');return reply({error:'Подписка устарела. Выключи и снова включи напоминания.'},410)}
      if (status < 200 || status >= 300) return reply({error:'Push-сервис не принял уведомление. Попробуй позже.'},502)
      return reply({ok:true})
    }
    return reply({error:'Not found'},404)
  } catch { return reply({error:'Сервис напоминаний временно недоступен. Попробуй ещё раз.'},503) }
})
