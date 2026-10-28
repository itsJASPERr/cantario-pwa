const ViewComponent=({value}:{value?:unknown})=>{
  const text=typeof value==="string"?value:"";
  if(!text)return null;
  const lines=text.split(/\r?\n/).filter(line=>line.trim()).length;
  return <span>{lines} líneas · letras sincronizadas</span>;
};
export {ViewComponent};
