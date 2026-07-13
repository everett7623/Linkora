import { Hono } from 'hono'; import type { Env } from '../types'; import { requireAuth } from '../auth/index'; import { createUtmTemplate,deleteUtmTemplate,listUtmTemplates } from '../utm/templates'; import { jsonError,jsonOk } from '../utils/response';
const routes=new Hono<{Bindings:Env}>(); routes.use('*',async(c,next)=>{const e=await requireAuth(c);if(e)return e;await next();});
routes.get('/',async c=>jsonOk({items:await listUtmTemplates(c.env)}));
routes.post('/',async c=>{let b:{name?:unknown;values?:unknown};try{b=await c.req.json()}catch{return jsonError('Invalid JSON body',400)}try{return jsonOk(await createUtmTemplate(c.env,typeof b.name==='string'?b.name:'',b.values))}catch(e){return jsonError(e instanceof Error?e.message:'Unable to save template',400)}});
routes.delete('/:id',async c=>(await deleteUtmTemplate(c.env,c.req.param('id')))?jsonOk({deleted:true}):jsonError('UTM template not found',404)); export default routes;
