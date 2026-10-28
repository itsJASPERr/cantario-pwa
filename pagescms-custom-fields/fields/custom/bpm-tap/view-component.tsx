const ViewComponent=({value}:{value?:unknown})=>{
 const n=Number(value);
 return <span>{Number.isFinite(n)&&n>0?n+" BPM":"Sin BPM"}</span>;
};
export {ViewComponent};
