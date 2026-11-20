type Props={remaining:number;time:string;running:boolean;done:boolean;victory:boolean;onStart:()=>void}
const circumference=2*Math.PI*98
export default function MissionControl({remaining,time,running,done,victory,onStart}:Props){
  return <button type="button" className={`orb mission-control ${running?'running':''} ${done?'orb-complete':''} ${victory?'celebrate':''}`} onClick={onStart} disabled={running||done} aria-label={done?'Миссия выполнена':running?`Миссия идёт, осталось ${time}`:'Начать пятиминутную миссию'}>
    <svg className="mission-ring" viewBox="0 0 220 220" aria-hidden="true">
      <circle className="mission-track" cx="110" cy="110" r="98"/>
      <circle className="mission-progress" cx="110" cy="110" r="98" strokeDasharray={circumference} strokeDashoffset={running?-circumference*(1-remaining/300):0}/>
    </svg>
    <span className="orb-inner"><span>{done?'Сегодняшний шаг':running?'Останься с делом':'Пять минут для себя'}</span><strong>{done?'Готово':time}</strong><small>{done?'Продолжим завтра':running?'Ты уже начал':'Коснись, чтобы начать'}</small></span>
  </button>
}
