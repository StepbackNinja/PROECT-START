import { memo, useEffect, useRef, useState } from 'react'
import '@fontsource-variable/manrope/wght.css'
import './cosmos.css'

function CosmosScene({active, victory}: {active:boolean;victory:boolean}) {
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const activeRef=useRef(active)
  const [visible,setVisible]=useState(!document.hidden)
  useEffect(()=>{activeRef.current=active},[active])
  useEffect(()=>{
    const canvas=canvasRef.current
    const context=canvas?.getContext('2d',{alpha:true})
    if(!canvas||!context)return
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)')
    let width=1,height=1,frame=0,last=0,time=0,speed=1
    // Deterministic star field: three depths, no React updates per frame.
    const stars=Array.from({length:62},(_,i)=>({x:((i*73+19)%997)/997,y:((i*137+31)%991)/991,z:1+(i%3),phase:i*1.7}))
    const resize=()=>{
      const box=canvas.getBoundingClientRect();width=box.width;height=box.height
      const ratio=Math.min(window.devicePixelRatio||1,1.5)
      canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio)
      context.setTransform(ratio,0,0,ratio,0,0)
    }
    const draw=(timestamp:number)=>{
      if(document.hidden)return
      if(timestamp-last>=1000/24||motion.matches){
        const delta=Math.min((timestamp-last)/1000,.1);last=timestamp
        speed+=( (activeRef.current?1.65:1)-speed)*.025
        if(!motion.matches)time+=delta*speed
        context.clearRect(0,0,width,height)
        for(const star of stars){
          const x=((star.x*width-time*star.z*1.25)%(width+12)+width+12)%(width+12)-6
          const y=(star.y*height+time*star.z*.4)%(height+12)-6
          const opacity=.14+(Math.sin(time*.55+star.phase)+1)*.15
          context.beginPath();context.fillStyle=`rgba(229,232,248,${opacity})`
          context.arc(x,y,star.z===3?1.15:.6,0,Math.PI*2);context.fill()
        }
      }
      if(!motion.matches)frame=requestAnimationFrame(draw)
    }
    const update=()=>{
      cancelAnimationFrame(frame);setVisible(!document.hidden);last=performance.now()
      if(!document.hidden)frame=requestAnimationFrame(draw)
    }
    resize();update()
    const observer=new ResizeObserver(resize);observer.observe(canvas)
    document.addEventListener('visibilitychange',update);motion.addEventListener('change',update)
    return()=>{cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',update);motion.removeEventListener('change',update)}
  },[])
  return <div className={`cosmos-scene ${active?'scene-active':''} ${visible?'':'scene-paused'}`} aria-hidden="true">
    <div className="cosmos-nebula" />
    <div className="cosmos-dust" />
    <div className="cosmos-breath" />
    <canvas className="cosmos-particles" ref={canvasRef}/>
    <div className="cosmos-horizon" />
    {victory&&<div className="shooting-star"><i/></div>}
    <div className="cosmos-vignette" />
  </div>
}
export default memo(CosmosScene)
