import { useEffect, useState, type CSSProperties } from 'react'
import './cosmos.css'

const stars = Array.from({length:18}, (_,i) => ({
  left:`${(i*37+11)%97}%`,top:`${(i*23+7)%78}%`,
  '--delay':`${-(i%7)}s`,'--size':`${i%4===0?2:1}px`,
} as CSSProperties))

export default function CosmosScene({active, victory}: {active:boolean;victory:boolean}) {
  const [visible,setVisible] = useState(!document.hidden)
  useEffect(()=>{
    const update=()=>setVisible(!document.hidden)
    document.addEventListener('visibilitychange',update)
    return ()=>document.removeEventListener('visibilitychange',update)
  },[])
  return <div className={`cosmos-scene ${active?'scene-active':''} ${visible?'':'scene-paused'}`} aria-hidden="true">
    <div className="cosmos-nebula" />
    <div className="cosmos-stars">{stars.map((style,i)=><i key={i} style={style}/>)}</div>
    <div className="cosmos-horizon" />
    {victory&&<div className="shooting-star"><i/></div>}
    <div className="cosmos-vignette" />
  </div>
}
