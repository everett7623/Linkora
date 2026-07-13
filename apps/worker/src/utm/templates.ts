import type { Env } from '../types'; import { getSettings, setSetting } from '../db/index'; import { generateId, now } from '../utils/id'; import { isUtmTemplate, normalizeUtmValues, type UtmTemplateValues } from './templatePolicy';
const KEY='utm_templates';
export interface UtmTemplate { id:string; name:string; values:UtmTemplateValues; created_at:string; }
export function parseUtmTemplates(value?:string):UtmTemplate[]{try{const items=JSON.parse(value??'[]');return Array.isArray(items)?items.filter(isUtmTemplate).slice(0,20):[]}catch{return[]}}
export async function listUtmTemplates(env:Env){return parseUtmTemplates((await getSettings(env))[KEY]);}
export async function createUtmTemplate(env:Env,name:string,values:unknown){const items=await listUtmTemplates(env);if(items.length>=20)throw new Error('A maximum of 20 UTM templates is allowed');const clean=name.trim();if(!clean||clean.length>50)throw new Error('Template name must be between 1 and 50 characters');const item={id:generateId(),name:clean,values:normalizeUtmValues(values),created_at:now()};await setSetting(env,KEY,JSON.stringify([...items,item]),item.created_at);return item;}
export async function deleteUtmTemplate(env:Env,id:string){const items=await listUtmTemplates(env),next=items.filter(x=>x.id!==id);if(next.length===items.length)return false;await setSetting(env,KEY,JSON.stringify(next),now());return true;}
