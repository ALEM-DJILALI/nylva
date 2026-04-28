'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Camera, RefreshCw, Zap, Lock, Upload, Sparkles, Volume2, Square } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type ZR = { zone:string; emoji:string; status:'ok'|'warn'|'err'; note:string; conseil:string }
type AR = { score:number; titre:string; resume:string; humeur:string; zones:ZR[]; point_fort:string; corrections:number }

const SC = { ok:'#5A9E7A', warn:'#C4863A', err:'#C45A6A' }
const SB = { ok:'rgba(90,158,122,0.1)', warn:'rgba(196,134,58,0.1)', err:'rgba(196,90,106,0.1)' }
const SL = { ok:'✓', warn:'!', err:'✗' }

function useVoice() {
  const [speaking,setSpeaking]=useState(false)
  const [supported,setSupported]=useState(false)
  useEffect(()=>{setSupported('speechSynthesis' in window);return ()=>window.speechSynthesis?.cancel()},[])
  const speak=useCallback((text:string)=>{
    if(!supported)return
    window.speechSynthesis.cancel()
    const u=new SpeechSynthesisUtterance(text)
    u.lang='fr-FR';u.rate=.93;u.pitch=1.06;u.volume=1
    const go=()=>{const v=window.speechSynthesis.getVoices();const voice=v.find(x=>x.lang==='fr-FR'&&/google|microsoft|amélie/i.test(x.name))??v.find(x=>x.lang==='fr-FR')??null;if(voice)u.voice=voice;setSpeaking(true);u.onend=()=>setSpeaking(false);u.onerror=()=>setSpeaking(false);window.speechSynthesis.speak(u)}
    window.speechSynthesis.getVoices().length===0?(window.speechSynthesis.onvoiceschanged=go):go()
  },[supported])
  const stop=useCallback(()=>{window.speechSynthesis?.cancel();setSpeaking(false)},[])
  return {speak,stop,speaking,supported}
}

function buildText(r:AR){return[`Voici ton analyse NYLVA. Score : ${r.score} sur cent.`,r.titre+'.',r.resume,r.point_fort?`Ton point fort : ${r.point_fort}.`:'','Détail zone par zone.',r.zones.map(z=>`${z.zone} : ${z.note}. Conseil : ${z.conseil}`).join('. '),'Prends soin de toi !'].filter(Boolean).join(' ')}

function SoundWave(){return(<span style={{display:'flex',alignItems:'center',gap:2,marginLeft:6}}>{[1,2,3,4].map(i=><span key={i} style={{display:'block',width:3,borderRadius:2,background:'currentColor',height:`${6+i*3}px`,animation:`zw .7s ease-in-out ${i*.1}s infinite alternate`}}/>)}<style>{`@keyframes zw{from{transform:scaleY(.3)}to{transform:scaleY(1)}}`}</style></span>)}

function VoiceBtn({result}:{result:AR}){
  const {speak,stop,speaking,supported}=useVoice()
  if(!supported)return null
  return(<button onClick={()=>speaking?stop():speak(buildText(result))} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,width:'100%',padding:'13px 20px',background:speaking?'rgba(196,117,138,0.08)':'#FFFFFF',border:`1.5px solid ${speaking?'var(--accent)':'var(--border2)'}`,borderRadius:14,cursor:'pointer',fontSize:14,fontWeight:500,color:speaking?'var(--accent)':'var(--text2)',transition:'all 0.2s'}}>
    {speaking?<><Square size={13} fill="currentColor"/>Arrêter<SoundWave/></>:<><Volume2 size={15}/>Écouter l'analyse</>}
  </button>)
}

export default function PageVisage() {
  const videoRef=useRef<HTMLVideoElement>(null),canvasRef=useRef<HTMLCanvasElement>(null),streamRef=useRef<MediaStream|null>(null),fileRef=useRef<HTMLInputElement>(null)
  const [phase,setPhase]=useState<'idle'|'camera'|'preview'|'loading'|'result'>('idle')
  const [imageB64,setImageB64]=useState<string|null>(null)
  const [result,setResult]=useState<AR|null>(null)
  const [error,setError]=useState<string|null>(null)
  const [canAnalyse,setCanAnalyse]=useState(true)
  const [analysesLeft,setAnalysesLeft]=useState(3)
  const [isPremium,setIsPremium]=useState(false)
  const [expandedZone,setExpandedZone]=useState<number|null>(null)

  useEffect(()=>{createClient().auth.getUser().then(async({data})=>{if(!data.user)return;const{data:p}=await createClient().from('profiles').select('analyses_count_month,is_premium,is_admin').eq('id',data.user.id).single();if(p){const u=p.is_premium||p.is_admin;const l=u?999:Math.max(0,3-p.analyses_count_month);setAnalysesLeft(l);setCanAnalyse(l>0||u);setIsPremium(u)}})},[])
  useEffect(()=>{if(phase==='camera'&&streamRef.current&&videoRef.current){const v=videoRef.current;v.srcObject=streamRef.current;v.onloadedmetadata=()=>v.play().catch(()=>{})}},[phase])
  useEffect(()=>{if(phase!=='result')window.speechSynthesis?.cancel()},[phase])

  const startCamera=useCallback(async()=>{try{streamRef.current=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});setPhase('camera')}catch{setError('Caméra indisponible.')}}, [])
  const importPhoto=useCallback((e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{setImageB64((r.result as string).split(',')[1]);setError(null);setPhase('preview')};r.readAsDataURL(f)},[])
  const stopCamera=useCallback(()=>{streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null},[])
  const capture=useCallback(()=>{if(!videoRef.current||!canvasRef.current)return;const v=videoRef.current,c=canvasRef.current;c.width=v.videoWidth;c.height=v.videoHeight;const ctx=c.getContext('2d')!;ctx.translate(c.width,0);ctx.scale(-1,1);ctx.drawImage(v,0,0);setImageB64(c.toDataURL('image/jpeg',.85).split(',')[1]);stopCamera();setPhase('preview')},[stopCamera])
  const analyser=useCallback(async()=>{if(!imageB64)return;setPhase('loading');setError(null);const supabase=createClient();const{data:{session}}=await supabase.auth.getSession();try{const res=await fetch('/api/analyse',{method:'POST',headers:{'Content-Type':'application/json',...(session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{})},body:JSON.stringify({image:imageB64,type:'visage'})});const json=await res.json();if(!res.ok){setError(res.status===429?'Tu as utilisé tes 3 analyses gratuites ce mois-ci. Passe Premium ✨':json.error??'Erreur serveur');if(res.status===429)setCanAnalyse(false);setPhase('preview');return};setResult(json);setAnalysesLeft(p=>Math.max(0,p-1));setPhase('result')}catch{setError('Erreur réseau.');setPhase('preview')}},[imageB64])
  const reset=()=>{window.speechSynthesis?.cancel();stopCamera();setPhase('idle');setImageB64(null);setResult(null);setError(null);setExpandedZone(null);if(fileRef.current)fileRef.current.value=''}
  const scoreColor=(s:number)=>s>=75?'#5A9E7A':s>=50?'#C4863A':'#C45A6A'
  const scoreLabel=(s:number)=>s>=80?'Excellent ✨':s>=65?'Bien posé 👍':s>=45?'À peaufiner 💡':s>0?'À retravailler 🔄':'Sans maquillage'
  const checkout=async()=>{const{url}=await(await fetch('/api/stripe/checkout',{method:'POST'})).json();if(url)window.location.href=url}

  return(
    <div style={{padding:'20px',maxWidth:480,margin:'0 auto'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:30,marginBottom:4}}>Analyse visage</h1>
        <p style={{color:'var(--muted)',fontSize:13}}>{isPremium?'✦ Analyses illimitées · Premium':`${analysesLeft} analyse${analysesLeft!==1?'s':''} gratuite${analysesLeft!==1?'s':''} restante${analysesLeft!==1?'s':''} ce mois`}</p>
      </div>

      {phase==='idle'&&(<div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div className="nylva-card fade-up" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:36,cursor:canAnalyse?'pointer':'default',opacity:canAnalyse?1:.55,background:canAnalyse?'linear-gradient(145deg,#FFFFFF,#FDF0F3)':'#FFFFFF',transition:'transform .15s'}} onClick={canAnalyse?startCamera:undefined} onMouseEnter={e=>{if(canAnalyse)(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)'}}>
          <div style={{width:72,height:72,borderRadius:'50%',background:canAnalyse?'rgba(196,117,138,0.1)':'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center'}}>{canAnalyse?<Camera size={32} strokeWidth={1.5} color="var(--accent)"/>:<Lock size={32} strokeWidth={1.5} color="var(--muted)"/>}</div>
          <div style={{textAlign:'center'}}><p style={{fontWeight:600,marginBottom:4,fontSize:15}}>{canAnalyse?'Prendre une photo':'Limite atteinte'}</p><p style={{color:'var(--muted)',fontSize:12,lineHeight:1.5}}>{canAnalyse?'Face caméra · lumière naturelle · sans filtre':'3 analyses gratuites/mois'}</p></div>
        </div>
        {canAnalyse&&(<><input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={importPhoto}/><button className="nylva-btn-ghost" onClick={()=>fileRef.current?.click()} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><Upload size={15}/>Importer depuis la galerie</button></>)}
        {!canAnalyse&&(<div style={{background:'linear-gradient(135deg,rgba(196,117,138,0.08),rgba(184,147,74,0.08))',border:'1px solid rgba(196,117,138,0.25)',borderRadius:16,padding:20,textAlign:'center'}}><Sparkles size={20} style={{color:'var(--accent)',marginBottom:8}}/><p style={{fontSize:13,color:'var(--text2)',marginBottom:14,lineHeight:1.6}}>Analyses illimitées · Miroir IA · Coach vocal · Saison chromatique</p><button className="nylva-btn-primary" style={{background:'linear-gradient(135deg,var(--accent),var(--gold))'}} onClick={checkout}>✦ Passer Premium — 9€/mois</button></div>)}
        {error&&<div style={{background:'rgba(196,90,106,0.08)',border:'1px solid rgba(196,90,106,0.25)',borderRadius:12,padding:12,color:'var(--red)',fontSize:13}}>{error}</div>}
      </div>)}

      {phase==='camera'&&(<div><div style={{position:'relative',borderRadius:20,overflow:'hidden',marginBottom:16,background:'#1C1410',minHeight:300,boxShadow:'var(--shadow-md)'}}><video ref={videoRef} playsInline muted autoPlay style={{width:'100%',display:'block',transform:'scaleX(-1)'}}/><div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}><div style={{width:'55%',paddingBottom:'75%',borderRadius:'50%',border:'2px solid rgba(196,117,138,0.6)',boxShadow:'0 0 0 9999px rgba(28,20,16,.45)'}}/></div></div><canvas ref={canvasRef} style={{display:'none'}}/><div style={{display:'flex',gap:12}}><button className="nylva-btn-ghost" onClick={reset}>Annuler</button><button className="nylva-btn-primary" onClick={capture}><Camera size={15} style={{display:'inline',marginRight:8}}/>Capturer</button></div></div>)}

      {phase==='preview'&&imageB64&&(<div><img src={`data:image/jpeg;base64,${imageB64}`} alt="Photo" style={{width:'100%',borderRadius:20,marginBottom:16,boxShadow:'var(--shadow-md)'}}/>{error&&<div style={{background:'rgba(196,90,106,0.08)',border:'1px solid rgba(196,90,106,0.25)',borderRadius:12,padding:12,marginBottom:16,color:'var(--red)',fontSize:13}}>{error}</div>}<div style={{display:'flex',gap:12}}><button className="nylva-btn-ghost" onClick={reset}><RefreshCw size={13} style={{display:'inline',marginRight:6}}/>Reprendre</button><button className="nylva-btn-primary" onClick={analyser} disabled={!canAnalyse}><Zap size={13} style={{display:'inline',marginRight:6}}/>Analyser</button></div></div>)}

      {phase==='loading'&&(<div style={{textAlign:'center',padding:'60px 20px'}}><div style={{width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,rgba(196,117,138,.15),rgba(184,147,74,.15))',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}><div className="pulse" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,color:'var(--accent)'}}>◈</div></div><p style={{color:'var(--text2)',fontSize:15,fontFamily:"'Cormorant Garamond',serif",marginBottom:6}}>NYLVA analyse ton maquillage…</p><p style={{color:'var(--muted)',fontSize:12}}>Quelques secondes</p></div>)}

      {phase==='result'&&result&&(<div className="fade-up">
        <div className="nylva-card" style={{marginBottom:16,padding:24,background:'linear-gradient(145deg,#FFFFFF,#FDF5F7)'}}>
          <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:16}}>
            <div style={{width:76,height:76,borderRadius:'50%',flexShrink:0,background:`conic-gradient(${scoreColor(result.score)} ${result.score*3.6}deg,rgba(0,0,0,0.06) 0deg)`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 0 0 3px white,0 4px 16px ${scoreColor(result.score)}33`}}><div style={{width:56,height:56,borderRadius:'50%',background:'#FFF',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:500,color:scoreColor(result.score)}}>{result.score}</span></div></div>
            <div style={{flex:1}}><p style={{fontSize:11,color:scoreColor(result.score),textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4,fontWeight:600}}>{scoreLabel(result.score)}</p><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,marginBottom:6,lineHeight:1.3}}>{result.titre}</p><p style={{color:'var(--muted)',fontSize:13,lineHeight:1.55}}>{result.resume}</p></div>
          </div>
          {result.point_fort&&<div style={{background:'rgba(90,158,122,0.08)',border:'1px solid rgba(90,158,122,0.2)',borderRadius:10,padding:'10px 14px'}}><p style={{fontSize:13,color:'var(--green)'}}>⭐ {result.point_fort}</p></div>}
        </div>
        <div style={{marginBottom:16}}><VoiceBtn result={result}/></div>
        <div className="nylva-card" style={{marginBottom:16}}>
          <p style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14,fontWeight:500}}>Zones analysées</p>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {result.zones.map((z,i)=>(<div key={i} style={{borderRadius:12,overflow:'hidden',border:`1px solid ${SC[z.status]}22`,cursor:'pointer'}} onClick={()=>setExpandedZone(expandedZone===i?null:i)}>
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',background:SB[z.status]}}><span style={{fontSize:18}}>{z.emoji}</span><span style={{flex:1,fontSize:13,fontWeight:500}}>{z.zone}</span><span style={{fontSize:11,color:SC[z.status],fontWeight:700}}>{SL[z.status]}</span><span style={{fontSize:10,color:'var(--muted)',marginLeft:4}}>{expandedZone===i?'▲':'▼'}</span></div>
              {expandedZone===i&&<div style={{padding:'12px 14px',borderTop:`1px solid ${SC[z.status]}22`,background:'#FFF'}}><p style={{fontSize:13,color:'var(--text2)',marginBottom:8,lineHeight:1.5}}>{z.note}</p>{z.conseil&&<div style={{display:'flex',gap:8}}><span style={{fontSize:12}}>💡</span><p style={{fontSize:12,color:'var(--accent)',fontStyle:'italic',lineHeight:1.4}}>{z.conseil}</p></div>}</div>}
            </div>))}
          </div>
        </div>
        {!isPremium&&<div style={{background:'linear-gradient(135deg,rgba(196,117,138,0.07),rgba(184,147,74,0.07))',border:'1px solid rgba(196,117,138,0.2)',borderRadius:16,padding:18,marginBottom:16,textAlign:'center'}}><p style={{fontSize:13,color:'var(--text2)',marginBottom:12,lineHeight:1.55}}>{analysesLeft===0?'Tu as utilisé toutes tes analyses gratuites ce mois-ci.':`Il te reste ${analysesLeft} analyse${analysesLeft>1?'s':''} gratuite${analysesLeft>1?'s':''}.`}</p><button className="nylva-btn-primary" style={{background:'linear-gradient(135deg,var(--accent),var(--gold))',fontSize:13}} onClick={checkout}>✦ Analyses illimitées — 9€/mois</button></div>}
        <button className="nylva-btn-ghost" onClick={reset}><RefreshCw size={13} style={{display:'inline',marginRight:8}}/>Nouvelle analyse</button>
      </div>)}
    </div>
  )
}
