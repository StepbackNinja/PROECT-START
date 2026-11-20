import { useEffect, useMemo, useState } from 'react'
import { disablePush, enableAndTestPush, pushEnabled, syncPush } from './reminders'
import { dayKey, load, persist, weekKey, type Save } from './storage'
import CosmosScene from './CosmosScene'

export default function App({cosmos=false}: {cosmos?:boolean}) {
  const [save, setSave] = useState<Save>(load)
  const [now, setNow] = useState(Date.now())
  const [won, setWon] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [pushOn, setPushOn] = useState(pushEnabled)
  const [pushBusy, setPushBusy] = useState(false)
  const [syncPending, setSyncPending] = useState(false)
  const [starDemo,setStarDemo] = useState(false)
  useEffect(()=>{
    if (!starDemo) return
    const timeout=window.setTimeout(()=>setStarDemo(false),2500)
    return ()=>window.clearTimeout(timeout)
  },[starDemo])
  useEffect(() => {
    if (!won) return
    const timeout = window.setTimeout(() => setWon(false), 2500)
    return () => window.clearTimeout(timeout)
  }, [won])
  const today = dayKey(new Date(now)), done = save.days.includes(today)
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t) }, [])
  useEffect(() => { persist(save) }, [save])
  useEffect(() => {
    if (save.missionEnd && now >= save.missionEnd && !done) {
      setSave(s => ({ ...s, missionEnd: null, xp: s.xp + 50, days: [...s.days, dayKey()] })); setWon(true)
    }
  }, [now, save.missionEnd, done])
  useEffect(() => {
    let disposed = false
    const sync = async () => {
      if (!pushOn) return
      try { await syncPush(done); if (!disposed) setSyncPending(false) }
      catch { if (!disposed) setSyncPending(true) }
    }
    void sync()
    const visible = () => { if (document.visibilityState === 'visible') void sync() }
    window.addEventListener('online', sync)
    document.addEventListener('visibilitychange', visible)
    const retry = window.setInterval(sync, 60000)
    return () => {disposed=true;window.clearInterval(retry);window.removeEventListener('online',sync);document.removeEventListener('visibilitychange',visible)}
  }, [pushOn, done, today])
  const testPush = async () => {
    setPushBusy(true)
    try {setNotificationMessage(await enableAndTestPush(done))}
    catch (error) {setNotificationMessage(error instanceof Error ? error.message : 'Не удалось подключить push. Проверь интернет и попробуй снова.')}
    finally {setPushOn(pushEnabled());setPushBusy(false)}
  }
  const turnOffPush = async () => {
    setPushBusy(true)
    try {await disablePush();setPushOn(false);setSyncPending(false);setNotificationMessage('Фоновые напоминания выключены.')}
    catch {setNotificationMessage('Сервер не ответил. Напоминания ещё включены — повтори отключение с интернетом.')}
    finally {setPushBusy(false)}
  }
  const remaining = save.missionEnd ? Math.max(0, Math.ceil((save.missionEnd-now)/1000)) : 300
  const time = `${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`
  const streak = useMemo(() => { let n=0, d=new Date(now); if (!save.days.includes(dayKey(d))) d.setDate(d.getDate()-1); while(save.days.includes(dayKey(d))){n++;d.setDate(d.getDate()-1)} return n }, [save.days, now])
  const midnight = new Date(now); midnight.setHours(24,0,0,0); const until = Math.max(0, midnight.getTime()-now)
  const start = () => { if(done || save.missionEnd) return; setSave(s=>({...s,missionEnd:Date.now()+300000})); setWon(false) }
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate()-1)
  const beforeYesterday = new Date(now); beforeYesterday.setDate(beforeYesterday.getDate()-2)
  const freezeAvailable = save.freezeWeek!==weekKey() && !save.days.includes(dayKey(yesterday)) && save.days.includes(dayKey(beforeYesterday))
  const useFreeze = () => { if (!freezeAvailable) return; setSave(s=>({...s,freezeWeek:weekKey(),days:[...s.days,dayKey(yesterday)]})) }
  const week = Array.from({length:7},(_,i)=>{ const d=new Date(now); d.setDate(d.getDate()-((d.getDay()+6)%7)+i); return d })
  return <main className={`app ${cosmos?'cosmos':''}`}>
    {cosmos&&<><CosmosScene active={!!save.missionEnd&&!done} victory={won||starDemo}/><div className="design-preview">Облик START · космос</div></>}
    <header><div className="brand"><span className="brand-mark">▶</span> START</div><div className="xp">✦ {save.xp} XP</div></header>
    <section className={`deadline ${done?'secured':until<3600000?'urgent':''}`} aria-label="Время до окончания дня">
      <div className="eyebrow">{done?'СЕГОДНЯШНИЙ ДЕНЬ ЗАСЧИТАН':'СЕГОДНЯШНЯЯ МИССИЯ ЕЩЁ НЕ ВЫПОЛНЕНА'}</div>
      {done?<strong>День твой ✓</strong>:<strong>{String(Math.floor(until/3600000)).padStart(2,'0')}<span>:</span>{String(Math.floor(until/60000)%60).padStart(2,'0')}<span>:</span>{String(Math.floor(until/1000)%60).padStart(2,'0')}</strong>}
      <p>{done?'Серия сохранена. Возвращайся завтра.':until<300000?'До полуночи меньше пяти минут. Начни сейчас.':'До полуночи. Удели делу пять минут, чтобы засчитать этот день.'}</p>
    </section>
    <section className="hero"><div className="eyebrow">ТВОЙ МОМЕНТ — СЕГОДНЯ</div><h1>{done ? 'Ты это сделал.' : 'Начни с малого.'}</h1><p>{done ? 'Пять минут — и день уже твой.' : 'Не нужно быть готовым. Просто начни.'}</p>
    <div className={`orb ${save.missionEnd&&!done?'running':''} ${won?'celebrate':''}`}><div className="orbit"/><div className="orb-inner"><span>{save.missionEnd&&!done?'МИССИЯ':'5 МИНУТ'}</span><strong>{save.missionEnd&&!done?time:'5:00'}</strong><small>{save.missionEnd&&!done?'ТЫ СПРАВИШЬСЯ':'ТОЛЬКО ДЛЯ ТЕБЯ'}</small></div></div>
    <button className={`start-button ${done?'complete':''} ${save.missionEnd?'active':''}`} onClick={start} disabled={done||!!save.missionEnd}>{done?'✓  ГОТОВО НА СЕГОДНЯ':save.missionEnd?`МИССИЯ ИДЁТ · ${time}`:'НАЧАТЬ'}{!done&&!save.missionEnd&&<span>5 минут делай то, что откладывал</span>}</button>
    {won&&<div className="win" role="status">✦ Отличная работа! +50 XP · серия продлена</div>}
    </section>
    <section className="stats"><article className="card streak-card"><div className="card-title">🔥 СЕРИЯ</div><div className="streak-number">{streak}<small> дней</small></div><div className="week">{week.map((d,i)=><div className="day" key={i}><span>{['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'][i]}</span><b className={`${save.days.includes(dayKey(d))?'marked':''} ${dayKey(d)===today?'today':''}`}>{save.days.includes(dayKey(d))?'✓':d.getDate()}</b></div>)}</div><div className="midnight">⏳ До полуночи <strong>{String(Math.floor(until/3600000)).padStart(2,'0')}:{String(Math.floor(until/60000)%60).padStart(2,'0')}:{String(Math.floor(until/1000)%60).padStart(2,'0')}</strong></div></article>
    <article className="card freeze-card"><div className="freeze-icon">❄</div><div className="freeze-copy"><div className="card-title">ЗАМОРОЗКА СЕРИИ</div><p>{save.freezeWeek===weekKey()?'Использована на этой неделе':freezeAvailable?'Вчера пропустил? Нажми, чтобы сохранить серию':'Одна страховка в неделю · доступна после пропуска'}</p></div><button onClick={useFreeze} disabled={!freezeAvailable} aria-label="Использовать заморозку серии">{save.freezeWeek===weekKey()?'✓':'→'}</button></article></section>
    <footer><button onClick={testPush} disabled={pushBusy} className="reminders">{pushBusy?'Подключаемся…':pushOn?'🔔 Проверить серверный push':'🔔 Включить фоновые напоминания'}</button>{pushOn&&<button onClick={turnOffPush} disabled={pushBusy} className="reminders">Выключить</button>}</footer>
    {pushOn&&<p className="push-status">{syncPending?'Нет связи с сервером. Отмена напоминаний после миссии ещё не подтверждена.':'Напоминания: 10:00 · 18:00 · 23:00'}</p>}
    {notificationMessage&&<div className="notification-result" role="status">{notificationMessage}<button onClick={()=>setNotificationMessage('')} aria-label="Закрыть сообщение">Понятно</button></div>}
    {cosmos&&<button className="star-demo" onClick={()=>setStarDemo(true)} disabled={starDemo}>Посмотреть падающую звезду</button>}
    {won&&!cosmos&&<div className="confetti" aria-hidden="true">✦　·　✦　　·　✦</div>}
  </main>
}
