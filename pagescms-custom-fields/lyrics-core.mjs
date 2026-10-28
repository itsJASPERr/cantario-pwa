/**
 * Lossless line-by-line timestamp helpers for Cantario's Pages CMS field.
 * Never reformat Markdown, chords, stanza breaks or source newlines.
 * The Pages CMS field receives/stores the same raw Markdown body string.
 */
const VALID_TIME=/^(\d{1,2}):([0-5]\d)(?:\.(\d{1,2}))?$/;
const SOURCE_PREFIX=/^([ \t]*)\[(\d{1,2}:[0-9]{2}(?:\.[0-9]{1,2})?)\]/;
const LOOKS_TIMED=/^[ \t]*\[\d{1,2}:[^\]\r\n]{1,12}\]/;

export function parseTime(value) {
  const input=String(value ?? '').trim().replace(/^\[/,'').replace(/\]$/,'');
  const match=input.match(VALID_TIME);
  if(!match) return null;
  const minutes=Number(match[1]);
  if(minutes>59) return null;
  const seconds=Number(match[2]);
  const centiseconds=Number((match[3]||'').padEnd(2,'0')||'0');
  return (minutes*60+seconds)*1000+centiseconds*10;
}
export function formatTime(milliseconds) {
  const rounded=Math.round(Number(milliseconds)/10)*10;
  if(!Number.isFinite(rounded)||rounded<0||rounded>=3600*1000) return null;
  const mins=Math.floor(rounded/60000);
  const secs=Math.floor((rounded%60000)/1000);
  const cs=Math.round(rounded%1000/10);
  return String(mins).padStart(2,'0')+':'+String(secs).padStart(2,'0')+'.'+String(cs).padStart(2,'0');
}
export function editableRows(markdown) {
  const lines=String(markdown??'').split(/\r?\n/);
  const rows=[];
  let inFence=false;
  for(let lineIndex=0;lineIndex<lines.length;lineIndex++){
    const raw=lines[lineIndex];
    if(/^[ \t]*(`{3,}|~{3,})/.test(raw)) {inFence=!inFence;continue;}
    if(inFence || !raw.trim() || /^[ \t]*#{1,6}[ \t]/.test(raw)) continue;
    const marker=raw.match(SOURCE_PREFIX);
    const invalid=!marker&&LOOKS_TIMED.test(raw);
    const start=marker ? parseTime(marker[2]) : null;
    rows.push({
      lineIndex,
      text:marker?raw.slice(marker[0].length):raw,
      timestamp:marker?marker[2]:invalid?(raw.match(LOOKS_TIMED)||[])[0]?.trim().slice(1,-1)||'':'',
      milliseconds:start,
      invalid
    });
  }
  return rows;
}
export function setLineTime(markdown,lineIndex,value) {
  const source=String(markdown??'');
  const parsed=value === '' || value == null ? null : parseTime(value);
  if(value !== '' && value != null && parsed===null)
    throw new Error('Marca inválida: usá mm:ss.xx');
  const formatted=parsed===null ? '' : formatTime(parsed);
  if(parsed!==null && formatted===null) throw new Error('Fuera de rango');
  const newline=source.includes('\r\n')?'\r\n':'\n';
  const lines=source.split(/\r?\n/);
  if(!Number.isInteger(lineIndex)||lineIndex<0||lineIndex>=lines.length)
    throw new Error('Línea inexistente');
  const line=lines[lineIndex];
  const prefix=line.match(SOURCE_PREFIX);
  if(prefix) {
    lines[lineIndex]=prefix[1]+(formatted?'['+formatted+']':'')+line.slice(prefix[0].length);
  } else {
    const invalidPrefix=line.match(LOOKS_TIMED);
    if(invalidPrefix) {
      lines[lineIndex]=(formatted?'['+formatted+']':'')+line.slice(invalidPrefix[0].length);
    } else {
      const leading=line.match(/^[ \t]*/)?.[0]||'';
      lines[lineIndex]=leading+(formatted?'['+formatted+']':'')+line.slice(leading.length);
    }
  }
  return lines.join(newline);
}
export function inspectTimeRows(markdown) {
  const rows=editableRows(markdown);
  const issues=[];
  let last=-1;
  let timed=0;
  for(const row of rows) {
    if(row.invalid || (row.timestamp && row.milliseconds===null)) {
      issues.push({line:row.lineIndex+1,message:'Marca inválida: usá mm:ss.xx'});
      continue;
    }
    if(row.milliseconds!==null) {
      timed++;
      if(row.milliseconds<=last) issues.push({
        line:row.lineIndex+1,message:'Los tiempos deben aumentar sin repetirse'
      });
      last=row.milliseconds;
    }
  }
  return {valid:issues.length===0,issues,timed,total:rows.length,rows};
}
