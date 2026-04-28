'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Crown, ChevronDown, ChevronUp, Calendar } from 'lucide-react'

type Zone = { zone:string; emoji:string; status:'ok'|'warn'|'err'; note:string; conseil:string }
type Analyse = { id:string; score:number; titre:string; resume:string; zones:Zone[]; created_at:string }

const SC = { ok:'#5A9E7A', warn:'#C4863A', err:'#C45A6A' }
const SB = { ok:'rgba(90,158,122,0.1)', warn:'rgba(196,134,58,0.1)', err:'rgba(196,90,106,0.1)' }

function Ring({ score }: { score:number }) {
  const r=28, c=2*Math.PI*r, fill=(score/100)*c
  const col=score>=75?'#5A9E7A':score>=50?'#C4863A':'#C45A6A'
  return (<svg width={68} height={68} viewBox="0 0 72 72"><circle cx={36} cy={36} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={5}/><circle cx={36} cy={36} r={r} fill="none" stroke={col} strokeWidth={5} strokeDasharray={`${fill} ${c}`} strokeLinecap="round" transform="rotate(-90 36 36)"/><text x={36} y={40} textAnchor="middle" fill={col} style={{fontSize:15,fontFamily:"'Cormorant Garamond',serif",fontWeight:500}}>{score}</text></svg>)
}

function Card({ a }: { a:Analyse }) {
  const [open,setOpen]=useState(false)
  const date=new Date(a.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})
  return (<div className="nylva-card" style={{marginBottom:12}}>
    <div style={{display:'flex',gap:12,alignItems:'center'}}>
      <Ring score={a.score}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,marginBottom:4,lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.titre}</div>
        <div style={{display:'flex',alignItems:'center',gap:5,color:'var(--muted)',fontSize:12,marginBottom:6}}><Calendar size={11}/>{date}</div>
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{a.zones?.slice(0,3).map(z=><span key={z.zone} style={{fontSize:11,background:SB[z.status],color:SC[z.status],borderRadius:6,padding:'2px 7px'}}>{z.emoji} {z.zone}</span>)}</div>
      </div>
      <button onClick={()=>setOpen(!open)} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',padding:4}}>{open?<ChevronUp size={18}/>:<ChevronDown size={18}/>}</button>
    </div>
    {open&&(<div style={{marginTop:14,borderTop:'1px solid var(--border)',paddingTop:14}}><p style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,marginBottom:12}}>{a.resume}</p><div style={{display:'flex',flexDirection:'column',gap:8}}>{a.zones?.map(z=>(<div key={z.zone} style={{background:SB[z.status],border:`1px solid ${SC[z.status]}33`,borderRadius:10,padding:'10px 12px'}}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><span style={{fontSize:16}}>{z.emoji}</span><span style={{fontWeight:600,fontSize:13}}>{z.zone}</span><span style={{marginLeft:'auto',fontSize:11,color:SC[z.status]}}>{z.status==='ok'?'✓ OK':z.status==='warn'?'! Attention':'✗ À corriger'}</span></div><p style={{fontSize:12,color:'var(--text2)',margin:'0 0 4px'}}>{z.note}</p><p style={{fontSize:12,color:SC[z.status],margin:0,fontStyle:'italic'}}>→ {z.conseil}</p></div>))}</div></div>)}
  </div>)
}

export default function PageHistorique() {
  const router=useRouter()
  const [analyses,setAnalyses]=useState<Analyse[]>([])
  const [isPremium,setIsPremium]=useState(false)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    const supabase=createClient()
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(!session){router.push('/auth');return}
      const{data:p}=await supabase.from('profiles').select('is_premium,is_admin').eq('id',session.user.id).single()
      const premium=p?.is_premium||p?.is_admin; setIsPremium(premium)
      if(premium){const{data}=await supabase.from('analyses').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(50);setAnalyses(data??[])}
      setLoading(false)
    })
  },[router])

  const checkout=async()=>{const{url}=await(await fetch('/api/stripe/checkout',{method:'POST'})).json();if(url)window.location.href=url}

  if(loading)return(<div style={{textAlign:'center',padding:60}}><div className="pulse" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:48,color:'var(--accent)'}}>◈</div></div>)

  return(
    <div style={{padding:'20px',maxWidth:480,margin:'0 auto'}}>
      <div style={{marginBottom:24}}><h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:30,marginBottom:4}}>Historique</h1><p style={{color:'var(--muted)',fontSize:13}}>{isPremium?`${analyses.length} analyse${analyses.length!==1?'s':''}`:'Fonctionnalité Premium'}</p></div>
      {!isPremium?(<div className="nylva-card" style={{textAlign:'center',padding:36}}><Crown size={32} style={{color:'var(--gold)',marginBottom:12}}/><h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,marginBottom:8}}>Historique Premium</h2><p style={{color:'var(--text2)',fontSize:13,lineHeight:1.6,marginBottom:20}}>Retrouve toutes tes analyses et suis ta progression dans le temps.</p><button className="nylva-btn-primary" onClick={checkout} style={{background:'linear-gradient(135deg,var(--accent),var(--gold))'}}>✦ Passer Premium — 9€/mois</button></div>
      ):analyses.length===0?(<div style={{textAlign:'center',padding:'48px 20px',color:'var(--muted)'}}><div style={{fontSize:40,marginBottom:12}}>◇</div><p style={{fontSize:14}}>Aucune analyse pour l'instant.</p></div>
      ):(<div>{analyses.map(a=><Card key={a.id} a={a}/>)}</div>)}
    </div>
  )
}
