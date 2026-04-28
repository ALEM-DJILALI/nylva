'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, Sparkles } from 'lucide-react'

type Msg = { role: 'user'|'assistant'; content: string }
type VS  = 'idle'|'listening'|'thinking'|'speaking'

function getFrVoice() {
  const v = window.speechSynthesis.getVoices()
  return v.find(x=>x.lang==='fr-FR'&&/google|microsoft|amélie/i.test(x.name))??v.find(x=>x.lang==='fr-FR')??v.find(x=>x.lang.startsWith('fr'))??null
}
function speakTTS(text: string, onEnd: ()=>void) {
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang='fr-FR'; u.rate=.93; u.pitch=1.08; u.volume=1
  const go=()=>{const v=getFrVoice(); if(v)u.voice=v; u.onend=onEnd; u.onerror=onEnd; window.speechSynthesis.speak(u)}
  window.speechSynthesis.getVoices().length===0?(window.speechSynthesis.onvoiceschanged=go):go()
}

function Waves({active,color='var(--accent)'}:{active:boolean;color?:string}) {
  return (<div style={{display:'flex',alignItems:'center',gap:3,height:22}}>{[1,2,3,4,5].map(i=>(<div key={i} style={{width:3,borderRadius:3,background:color,height:active?`${7+i*3}px`:'3px',transition:'height .12s',animation:active?`cw .6s ease-in-out ${i*.08}s infinite alternate`:'none',opacity:active?.8:.25}}/>))}<style>{`@keyframes cw{from{transform:scaleY(.3)}to{transform:scaleY(1)}}`}</style></div>)
}

function Bubble({msg,isLast}:{msg:Msg;isLast:boolean}) {
  const u=msg.role==='user'
  return (<div style={{display:'flex',justifyContent:u?'flex-end':'flex-start',marginBottom:10,animation:isLast?'fu .3s ease':'none'}}>{!u&&<div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,rgba(196,117,138,.12),rgba(184,147,74,.12))',display:'flex',alignItems:'center',justifyContent:'center',marginRight:8,flexShrink:0,marginTop:2}}><Sparkles size={13} color="var(--accent)"/></div>}<div style={{maxWidth:'78%',padding:'11px 15px',borderRadius:u?'18px 18px 4px 18px':'18px 18px 18px 4px',background:u?'linear-gradient(135deg,var(--accent),var(--gold))':'#FFFFFF',color:u?'#FFF':'var(--text)',fontSize:u?14:15,lineHeight:1.55,boxShadow:u?'0 4px 16px rgba(196,117,138,.25)':'var(--shadow-sm)',border:u?'none':'1px solid var(--border)',fontFamily:u?'DM Sans,sans-serif':"'Cormorant Garamond',serif",fontWeight:u?400:300}}>{msg.content}</div><style>{`@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style></div>)
}

export default function PageCoach() {
  const [vs,setVs]=useState<VS>('idle')
  const [msgs,setMsgs]=useState<Msg[]>([])
  const [tr,setTr]=useState('')
  const [sup,setSup]=useState({stt:false,tts:false})
  const [session,setSession]=useState<any>(null)
  const [muted,setMuted]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const recRef=useRef<any>(null), scrollRef=useRef<HTMLDivElement>(null), mutedRef=useRef(false)

  useEffect(()=>{mutedRef.current=muted},[muted])
  useEffect(()=>{
    createClient().auth.getSession().then(({data})=>setSession(data.session))
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    setSup({stt:!!SR,tts:'speechSynthesis' in window})
    setMsgs([{role:'assistant',content:'Bonjour ! Je suis NYLVA, ta coach beauté. Maintiens le micro et parle-moi librement — maquillage, soins, couleurs, routine… Je t\'écoute !'}])
    return ()=>{window.speechSynthesis?.cancel();recRef.current?.abort()}
  },[])
  useEffect(()=>{scrollRef.current?.scrollTo({top:scrollRef.current.scrollHeight,behavior:'smooth'})},[msgs,tr])

  const sendToCoach=useCallback(async(text:string,history:Msg[])=>{
    setVs('thinking');setError(null)
    const next:Msg[]=[...history,{role:'user',content:text}]
    setMsgs(next)
    try {
      const res=await fetch('/api/coach',{method:'POST',headers:{'Content-Type':'application/json',...(session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{})},body:JSON.stringify({messages:next.map(m=>({role:m.role,content:m.content}))})})
      const {text:reply,error:err}=await res.json()
      if(!res.ok||!reply)throw new Error(err)
      const am:Msg={role:'assistant',content:reply}
      setMsgs(p=>[...p,am])
      if(!mutedRef.current&&sup.tts){setVs('speaking');speakTTS(reply,()=>setVs('idle'))}else setVs('idle')
    } catch{setError('Erreur de connexion.');setVs('idle')}
  },[session,sup.tts])

  const startListening=useCallback(()=>{
    if(vs!=='idle')return
    window.speechSynthesis?.cancel()
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if(!SR)return
    const rec=new SR(); rec.lang='fr-FR'; rec.continuous=false; rec.interimResults=true; rec.maxAlternatives=1
    recRef.current=rec; setVs('listening'); setTr(''); setError(null)
    rec.onresult=(e:any)=>{let f='',x='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;e.results[i].isFinal?f+=t:x+=t};setTr(f||x)}
    rec.onend=()=>{setTr(prev=>{if(prev.trim()){const t=prev.trim();setTr('');setMsgs(c=>{sendToCoach(t,c);return c})}else setVs('idle');return ''})}
    rec.onerror=(e:any)=>{if(e.error!=='aborted')setError('Micro inaccessible.');setVs('idle');setTr('')}
    rec.start()
  },[vs,sendToCoach])

  const stopListening=useCallback(()=>{recRef.current?.stop()},[])
  const reset=()=>{window.speechSynthesis?.cancel();recRef.current?.abort();setVs('idle');setTr('');setError(null);setMsgs([{role:'assistant',content:'Nouvelle conversation ! Dis-moi tout 🌸'}])}

  const SL={idle:'Appuie pour parler',listening:'Je t\'écoute…',thinking:'Je réfléchis…',speaking:'Je te réponds…'}
  const SC={idle:'var(--muted)',listening:'var(--accent)',thinking:'var(--gold)',speaking:'var(--green)'}

  if(!sup.stt)return(<div style={{padding:24,maxWidth:480,margin:'0 auto',textAlign:'center',paddingTop:60}}><div style={{fontSize:48,marginBottom:16}}>🎤</div><h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:24,marginBottom:12}}>Navigateur non compatible</h2><p style={{color:'var(--muted)',fontSize:14,lineHeight:1.6}}>La reconnaissance vocale nécessite Chrome ou Safari mobile.</p></div>)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100dvh',paddingTop:60,paddingBottom:68}}>
      <div style={{padding:'12px 20px 10px',borderBottom:'1px solid var(--border)',background:'rgba(251,247,244,.96)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,rgba(196,117,138,.12),rgba(184,147,74,.12))',display:'flex',alignItems:'center',justifyContent:'center'}}><Sparkles size={16} color="var(--accent)"/></div>
          <div>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:400,lineHeight:1,color:'var(--text)'}}>NYLVA Coach</p>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:3}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:vs!=='idle'?'var(--green)':'var(--muted)',transition:'background .3s'}}/>
              <p style={{fontSize:11,color:SC[vs],transition:'color .3s'}}>{SL[vs]}</p>
              {(vs==='listening'||vs==='speaking')&&<Waves active color={SC[vs]}/>}
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>{setMuted(!muted);if(vs==='speaking')window.speechSynthesis?.cancel()}} style={{background:'none',border:'1px solid var(--border)',borderRadius:10,padding:'6px 10px',cursor:'pointer',color:muted?'var(--red)':'var(--muted)',display:'flex',alignItems:'center'}}>{muted?<VolumeX size={15}/>:<Volume2 size={15}/>}</button>
          <button onClick={reset} style={{background:'none',border:'1px solid var(--border)',borderRadius:10,padding:'6px 10px',cursor:'pointer',color:'var(--muted)',display:'flex',alignItems:'center'}}><RotateCcw size={15}/></button>
        </div>
      </div>
      <div ref={scrollRef} style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column'}}>
        {msgs.map((m,i)=><Bubble key={i} msg={m} isLast={i===msgs.length-1}/>)}
        {tr&&<div style={{display:'flex',justifyContent:'flex-end',marginBottom:10}}><div style={{maxWidth:'78%',padding:'11px 15px',borderRadius:'18px 18px 4px 18px',background:'rgba(196,117,138,0.1)',border:'1px dashed rgba(196,117,138,.4)',color:'var(--text2)',fontSize:14,fontStyle:'italic'}}>{tr}…</div></div>}
        {vs==='thinking'&&<div style={{display:'flex',justifyContent:'flex-start',marginBottom:10,alignItems:'center',gap:8}}><div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,rgba(196,117,138,.12),rgba(184,147,74,.12))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Sparkles size={13} color="var(--accent)"/></div><div style={{padding:'12px 16px',borderRadius:'18px 18px 18px 4px',background:'#FFF',border:'1px solid var(--border)',boxShadow:'var(--shadow-sm)',display:'flex',gap:5,alignItems:'center'}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:'var(--accent)',opacity:.5,animation:`dt 1s ease-in-out ${i*.18}s infinite alternate`}}/>)}<style>{`@keyframes dt{from{transform:translateY(0)}to{transform:translateY(-5px)}}`}</style></div></div>}
        {error&&<div style={{background:'rgba(196,90,106,0.08)',border:'1px solid rgba(196,90,106,.25)',borderRadius:12,padding:'10px 14px',color:'var(--red)',fontSize:13,marginBottom:10}}>{error}</div>}
      </div>
      <div style={{padding:'16px 20px 20px',borderTop:'1px solid var(--border)',background:'rgba(251,247,244,.96)',backdropFilter:'blur(20px)',display:'flex',flexDirection:'column',alignItems:'center',gap:10,flexShrink:0}}>
        <button onPointerDown={vs==='idle'?startListening:undefined} onPointerUp={vs==='listening'?stopListening:undefined} onPointerLeave={vs==='listening'?stopListening:undefined} disabled={vs==='thinking'}
          style={{width:72,height:72,borderRadius:'50%',border:'none',cursor:vs==='thinking'?'not-allowed':'pointer',background:vs==='listening'?'linear-gradient(135deg,var(--accent),var(--accent2))':vs==='speaking'?'linear-gradient(135deg,var(--green),#3d7a5a)':vs==='thinking'?'linear-gradient(135deg,var(--gold),#8a6a2a)':'#FFFFFF',boxShadow:vs==='listening'?'0 0 0 10px rgba(196,117,138,.12),0 8px 32px rgba(196,117,138,.35)':vs==='speaking'?'0 0 0 10px rgba(90,158,122,.12),0 8px 32px rgba(90,158,122,.3)':'0 4px 20px rgba(100,60,40,.12),0 0 0 1px var(--border)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s',transform:vs==='listening'?'scale(1.06)':'scale(1)'}}>
          {vs==='listening'?<MicOff size={26} color="#FFF"/>:(vs==='speaking'||vs==='thinking')?<Volume2 size={24} color="#FFF"/>:<Mic size={26} color="var(--accent)"/>}
        </button>
        <p style={{fontSize:12,color:SC[vs],letterSpacing:'.05em',transition:'color .3s',height:18,textAlign:'center'}}>{vs==='listening'?'Relâche pour envoyer':SL[vs]}</p>
        <p style={{fontSize:11,color:'rgba(155,128,112,.4)',textAlign:'center',lineHeight:1.5,marginTop:-4}}>Maintiens appuyé · Relâche pour envoyer</p>
      </div>
    </div>
  )
}