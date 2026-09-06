import {env} from 'cloudflare:workers';
export function worldStore(){return (env as unknown as {WORLD_STORE:R2Bucket}).WORLD_STORE}
export function imageKey(){return (env as unknown as {OPENAI_API_KEY?:string}).OPENAI_API_KEY}
