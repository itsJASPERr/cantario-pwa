"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {editableRows,formatTime,inspectTimeRows,parseTime,setLineTime} from "../../../lyrics-core.mjs";

type Props={
  value?:string;
  onChange:(next:string)=>void;
  field?:{readonly?:boolean};
};

function TimeRow({text,time,invalid,lineIndex,locked,onCommit,onSelect,selected}:{
  text:string;time:string;invalid:boolean;lineIndex:number;locked:boolean;
  selected:boolean;onCommit:(lineIndex:number,value:string)=>void;
  onSelect:(lineIndex:number)=>void;
}){
  const [draft,setDraft]=useState(time);
  const [error,setError]=useState("");
  useEffect(()=>{setDraft(time);setError("");},[time,lineIndex]);
  const commit=()=>{
    const trimmed=draft.trim().replace(/^\[/,"").replace(/\]$/,"");
    if(trimmed && parseTime(trimmed)===null){
      setError("Usá mm:ss.xx");
      return;
    }
    setError("");
    onCommit(lineIndex,trimmed);
  };
  return <div style={{padding:"10px",borderRadius:9,border:selected?"2px solid #588865":"1px solid #d5ddd3",background:selected?"#eef6ef":"#fff",display:"grid",gridTemplateColumns:"112px minmax(0,1fr)",gap:9,alignItems:"center"}}>
    <div>
      <label htmlFor={"cantario-time-"+lineIndex} style={{display:"block",fontSize:10,color:"#647568"}}>Línea {lineIndex+1}</label>
      <input id={"cantario-time-"+lineIndex} type="text" inputMode="decimal"
        placeholder="mm:ss.xx" value={draft} readOnly={locked}
        aria-invalid={Boolean(error||invalid)}
        onChange={e=>{setDraft(e.target.value);setError("");}}
        onFocus={()=>onSelect(lineIndex)}
        onBlur={commit}
        onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();e.currentTarget.blur();}}}
        style={{width:"100%",padding:"8px 6px",fontVariantNumeric:"tabular-nums",borderRadius:5,border:"1px solid #b9c9bb"}}/>
      {(error||invalid)&&<small style={{color:"#a33b2b",fontSize:10}}>{error||"Marca inválida"}</small>}
    </div>
    <div style={{minWidth:0,whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontSize:13}}>
      {text||<em>(sin letra)</em>}
    </div>
  </div>;
}

const EditComponent=({value="",onChange,field}:Props)=>{
  const source=String(value??"");
  const rows=useMemo(()=>editableRows(source),[source]);
  const inspection=useMemo(()=>inspectTimeRows(source),[source]);
  const locked=Boolean(field?.readonly);
  const [clockRunning,setClockRunning]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [target,setTarget]=useState(0);
  const startAt=useRef<number|null>(null);
  const carry=useRef(0);
  useEffect(()=>{
    if(!clockRunning)return;
    const interval=setInterval(()=>{
      if(startAt.current!==null)setElapsed(carry.current+performance.now()-startAt.current);
    },75);
    return ()=>clearInterval(interval);
  },[clockRunning]);
  const apply=(lineIndex:number,input:string)=>{
    try{onChange(setLineTime(source,lineIndex,input));}
    catch(error){console.warn("Cantario: invalid timestamp",error);}
  };
  const current=rows[Math.min(target,Math.max(0,rows.length-1))];
  const start=()=>{carry.current=0;startAt.current=performance.now();setElapsed(0);setTarget(0);setClockRunning(true);};
  const pause=()=>{
    if(startAt.current!==null) carry.current+=performance.now()-startAt.current;
    startAt.current=null;setClockRunning(false);setElapsed(carry.current);
  };
  const resume=()=>{startAt.current=performance.now();setClockRunning(true);};
  const mark=()=>{
    if(!current||locked||!clockRunning) return;
    const time=formatTime(elapsed);
    if(!time)return;
    apply(current.lineIndex,time);
    setTarget(t=>Math.min(rows.length-1,t+1));
  };
  return <div style={{display:"grid",gap:14}}>
    <p style={{fontSize:12,color:"#5d7164"}}>
      Letras en Markdown: los acordes [Am] y las líneas en blanco se conservan.
      Escribí marcas en la tabla o pulsá al comienzo de cada línea durante un ensayo.
      Guardá la canción desde Pages CMS al terminar.
    </p>
    <div style={{border:"1px solid #cedcd0",borderRadius:10,padding:12,display:"grid",gap:8,background:"#f6faf6"}}>
      <strong style={{fontSize:14}}>Ensayo: sincronizar líneas</strong>
      <strong style={{fontVariantNumeric:"tabular-nums",fontSize:26}}>{formatTime(elapsed)||"59:59.99"}</strong>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button type="button" disabled={locked} onClick={start}>↻ Iniciar desde 00:00</button>
        <button type="button" disabled={locked||(!clockRunning&&startAt.current===null&&carry.current===0)}
          onClick={clockRunning?pause:resume}>{clockRunning?"Pausar":"Continuar"}</button>
        <button type="button" disabled={locked||!clockRunning||!current} onClick={mark}
          style={{fontWeight:700,background:"#254b35",color:"#fff",borderRadius:7,padding:"10px 15px"}}>
          Marcar línea {current?current.lineIndex+1:"—"}
        </button>
      </div>
      <small>La marca se toma del reloj de ensayo. Seleccioná otra línea si necesitás retomar desde un punto distinto.</small>
    </div>
    <div role="status" aria-live="polite" style={{fontSize:12,color:inspection.valid?"#386846":"#a13728"}}>
      {inspection.timed} de {inspection.total} líneas marcadas
      {inspection.issues.length>0&&" · "+inspection.issues.map(e=>"L"+e.line+": "+e.message).join("; ")}
    </div>
    <div style={{display:"grid",gap:7,maxHeight:380,overflowY:"auto"}}>
      {rows.map((row,i)=><div key={row.lineIndex} onClick={()=>setTarget(i)}>
        <TimeRow lineIndex={row.lineIndex} text={row.text}
          time={row.timestamp} invalid={row.invalid} locked={locked}
          selected={i===target} onSelect={()=>setTarget(i)} onCommit={apply}/>
      </div>)}
    </div>
    <details>
      <summary style={{cursor:"pointer",fontWeight:600}}>Fuente Markdown (letra y acordes)</summary>
      <textarea value={source} readOnly={locked} onChange={e=>onChange(e.target.value)}
        aria-label="Letra Markdown completa" spellCheck={false}
        rows={12} style={{width:"100%",fontFamily:"monospace",fontSize:13,marginTop:8,padding:10,borderRadius:6}} />
      <p style={{fontSize:11}}>No conviertas a editor visual para evitar alterar los marcadores [Am] y [mm:ss.xx].</p>
    </details>
  </div>;
};
export {EditComponent};
