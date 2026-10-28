"use client";
import {useRef,useState} from "react";
import {normalizeBpm,pushBpmTap} from "../../../bpm-core.mjs";
type Props={value?:string|number|null;onChange:(value:string|number)=>void;field?:{readonly?:boolean}};
const EditComponent=({value="",onChange,field}:Props)=>{
  const taps=useRef<number[]>([]);
  const [tapped,setTapped]=useState(0);
  const [message,setMessage]=useState("Pulsá 4 veces al ritmo de la canción.");
  const locked=Boolean(field?.readonly);
  const current=value==null?"":String(value);
  const tap=()=>{
    const result=pushBpmTap(taps.current,performance.now());
    taps.current=result.taps;setTapped(result.taps.length);
    if(result.bpm!==null){
      onChange(result.bpm);
      setMessage("~"+result.bpm+" BPM estimados; podés corregir el número.");
    } else setMessage("Pulsaciones: "+result.taps.length+"/4 · seguí marcando.");
  };
  return <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
    <label style={{display:"flex",alignItems:"center",gap:7,fontSize:13}}>
      Tempo
      <input type="number" min={40} max={240} step={1} value={current}
        readOnly={locked} aria-label="Tempo de referencia en BPM"
        onChange={e=>onChange(e.target.value===""?"":Number(e.target.value))}
        style={{width:95,padding:9,border:"1px solid #a5b6a5",borderRadius:7}}/>
      BPM
    </label>
    <button type="button" disabled={locked} onClick={tap}
      style={{minHeight:42,padding:"8px 13px",background:"#294a36",borderRadius:7,color:"white",fontWeight:700}}>
      Marcar pulso
    </button>
    <button type="button" disabled={locked} onClick={()=>{taps.current=[];setTapped(0);setMessage("Marcá de nuevo 4 pulsos.");}}>
      Reiniciar</button>
    <span role="status" aria-live="polite" style={{fontSize:11,color:"#586f61",flexBasis:"100%"}}>{message}</span>
  </div>;
};
export {EditComponent};
