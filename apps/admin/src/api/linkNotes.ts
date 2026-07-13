import { apiGet,apiPut } from './client';
export function getLinkNote(id:string):Promise<{note:string}>{return apiGet(`/api/link-notes/${id}`)}
export function saveLinkNote(id:string,note:string):Promise<{note:string}>{return apiPut(`/api/link-notes/${id}`,{note})}
