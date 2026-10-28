export function parseTime(value: unknown): number|null;
export function formatTime(milliseconds: number): string|null;
export type LyricRow={
 lineIndex:number;text:string;timestamp:string;milliseconds:number|null;invalid:boolean;
};
export function editableRows(markdown: unknown): LyricRow[];
export function setLineTime(markdown: unknown,lineIndex: number,value: string|null): string;
export function inspectTimeRows(markdown:unknown): {
 valid:boolean;issues:{line:number;message:string}[];timed:number;total:number;rows:LyricRow[];
};
