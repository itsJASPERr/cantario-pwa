import { z } from "zod";
import { EditComponent } from "./edit-component";
import { ViewComponent } from "./view-component";
import { inspectTimeRows } from "../../../lyrics-core.mjs";

const label = "Letras sincronizadas";
const defaultValue = "";
const schema = (field: {required?:boolean}) => z.string().superRefine((value,ctx)=>{
  if(field?.required && !value.trim()) {
    ctx.addIssue({code:"custom",message:"La letra es obligatoria"});
    return;
  }
  for(const issue of inspectTimeRows(value).issues) {
    ctx.addIssue({code:"custom",message:"Línea "+issue.line+": "+issue.message});
  }
});

export {label,defaultValue,schema,EditComponent,ViewComponent};
