import type { Env } from '../types'; import { getSettings,setSetting } from '../db/index'; import { now } from '../utils/id';
const KEY='link_notes';
export async function getLinkNote(env:Env,id:string){const settings=await getSettings(env);try{const notes=JSON.parse(settings[KEY]??'{}');return typeof notes[id]==='string'?notes[id]:''}catch{return ''}}
export async function setLinkNote(env:Env,id:string,value:string){const settings=await getSettings(env);let notes:Record<string,string>={};try{const parsed=JSON.parse(settings[KEY]??'{}');if(parsed&&typeof parsed==='object')notes=parsed}catch{};const text=value.trim();if(text)notes[id]=text;else delete notes[id];await setSetting(env,KEY,JSON.stringify(notes),now());return text}
