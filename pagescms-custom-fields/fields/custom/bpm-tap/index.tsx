import { z } from "zod";
import { EditComponent } from "./edit-component";
import { ViewComponent } from "./view-component";

const label="Tempo (BPM)";
const defaultValue="";
const bpmSchema=z.coerce.number().int().min(40,"Mínimo 40 BPM").max(240,"Máximo 240 BPM");
const schema=(field:{required?:boolean})=>field?.required?bpmSchema:z.union([z.literal(""),bpmSchema]);
export {label,defaultValue,schema,EditComponent,ViewComponent};
