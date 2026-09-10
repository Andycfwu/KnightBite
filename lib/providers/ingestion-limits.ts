import { IngestionFailure } from './menu-ingestion-log';

export const MENU_RESPONSE_BYTES = 2 * 1024 * 1024;
// Nutrislice returns a whole week with repeated food metadata, not a single meal.
export const WEEK_RESPONSE_BYTES = 8 * 1024 * 1024;
export const WEEK_JSON_NODES = 500_000;
export const LABEL_RESPONSE_BYTES = 256 * 1024;
export const MAX_MEAL_ITEMS = 1500;
export const MAX_MENU_ENTRIES = 1800; // Includes station headings.
const MAX_NODES = 60_000;

export async function readBoundedText(response: Response, limit: number, signal?: AbortSignal): Promise<string> {
  const declared = response.headers.get('content-length');
  if(declared && /^\d+$/.test(declared) && Number(declared) > limit) {
    void response.body?.cancel().catch(() => {});
    throw new IngestionFailure('response_too_large');
  }
  if(!response.body) return '';
  const reader = response.body.getReader();
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal?.addEventListener('abort',abort,{once:true});
  const decoder = new TextDecoder(); let size=0, text='';
  try {
    while(true) {
      const {done,value}=await reader.read();
      if(signal?.aborted) throw new IngestionFailure('timeout');
      if(done) break;
      size+=value.byteLength;
      if(size>limit) { void reader.cancel().catch(() => {}); throw new IngestionFailure('response_too_large'); }
      text+=decoder.decode(value,{stream:true});
    }
    return text+decoder.decode();
  } catch(error) { throw error instanceof IngestionFailure ? error : new IngestionFailure('request_error'); }
  finally { signal?.removeEventListener('abort',abort); reader.releaseLock(); }
}

/** Bound structure before downstream casts/normalization; no truncation of accepted menus. */
export function validateJsonBudget(value: unknown, maxNodes = MAX_NODES): void {
  const pending=[{value,depth:0}];let nodes=0;
  while(pending.length) {
    const next=pending.pop()!;
    if(++nodes>maxNodes || next.depth>12) throw new IngestionFailure('resource_limit');
    if(typeof next.value === 'string' && next.value.length>16_384) throw new IngestionFailure('resource_limit');
    if(Array.isArray(next.value)) {
      if(next.value.length>MAX_MENU_ENTRIES) throw new IngestionFailure('resource_limit');
      for(const item of next.value) pending.push({value:item,depth:next.depth+1});
    } else if(next.value && typeof next.value==='object') {
      const entries=Object.entries(next.value);
      if(entries.length>200) throw new IngestionFailure('resource_limit');
      for(const [key,item] of entries) {
        if(key.length>256) throw new IngestionFailure('resource_limit');
        pending.push({value:item,depth:next.depth+1});
      }
    }
  }
}

type Entry<T>={promise:Promise<T>;pending:boolean;expiresAt:number;bytes:number};
export class BoundedPromiseCache<T> {
  private entries=new Map<string,Entry<T>>();
  constructor(private readonly capacity:number,private readonly byteLimit:number) {}
  get size() { this.prune(); return this.entries.size; }
  get retainedBytes() { return [...this.entries.values()].reduce((sum,entry)=>sum+entry.bytes,0); }
  private prune() {
    for(const [key,entry] of this.entries) if(!entry.pending && entry.expiresAt<=Date.now()) this.entries.delete(key);
  }
  private evict() {
    for(const [key,entry] of this.entries) if(!entry.pending) { this.entries.delete(key); return true; }
    return false;
  }
  load(key:string,loader:()=>Promise<T>,ttl:(result:T)=>number):Promise<T> {
    this.prune();
    const found=this.entries.get(key);
    if(found) { this.entries.delete(key);this.entries.set(key,found);return found.promise; }
    while(this.entries.size>=this.capacity) if(!this.evict()) return Promise.reject(new IngestionFailure('resource_limit'));
    const entry:Entry<T>={promise:Promise.resolve(undefined as T),pending:true,expiresAt:Infinity,bytes:0};
    // Defer loader so this entry is registered before synchronous failure or reentrancy.
    entry.promise=Promise.resolve().then(loader).then(result=>{
      entry.pending=false;entry.expiresAt=Date.now()+ttl(result);
      entry.bytes=(typeof result==='string' ? result.length : JSON.stringify(result).length)*2;
      while(this.retainedBytes>this.byteLimit) if(!this.evict()) break;
      return result;
    }).catch(error=>{ if(this.entries.get(key)===entry) this.entries.delete(key);throw error; });
    this.entries.set(key,entry);return entry.promise;
  }
}
