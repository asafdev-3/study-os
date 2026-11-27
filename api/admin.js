const stripeBase = 'https://api.stripe.com/v1/'
async function stripeList(resource, key, params, maxPages=10) {
  const rows=[]; let cursor
  for(let page=0;page<maxPages;page++){
    const query=new URLSearchParams({limit:'100',...params})
    if(cursor) query.set('starting_after',cursor)
    const response=await fetch(stripeBase+resource+'?'+query,{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(6500)})
    if(!response.ok) throw new Error('stripe_unavailable')
    const body=await response.json()
    if(!Array.isArray(body.data)) throw new Error('stripe_invalid')
    rows.push(...body.data)
    if(!body.has_more) return {rows,partial:false}
    cursor=body.data.at(-1)?.id
    if(!cursor) throw new Error('stripe_invalid')
  }
  return {rows,partial:true}
}
const strId=x=>typeof x==='string'?x:x?.id
const cents=x=>Number.isFinite(x)?x:0
async function financials(){
  const {STRIPE_SECRET_KEY:key,STRIPE_PRICE_MENSAL:monthly,STRIPE_PRICE_ANUAL:annual}=process.env
  const mode=/^(sk|rk)_live_/.test(key||'')?'live':/^(sk|rk)_test_/.test(key||'')?'test':'unconfigured'
  if(mode==='unconfigured'||![monthly,annual].every(p=>/^price_[a-zA-Z0-9]+$/.test(p||'')))return {available:false,mode,reason:'not_configured'}
  try{
    const groups=await Promise.all([...new Set([monthly,annual])].map(price=>stripeList('subscriptions',key,{price,status:'all','expand[0]':'data.customer'})))
    const unique=new Map()
    for(const g of groups) for(const s of g.rows){
      if(!/^[0-9a-f-]{36}$/i.test(s.metadata?.studyos_user_id||'') || Boolean(s.livemode)!==(mode==='live'))continue
      const items=s.items?.data||[]
      const plan=items.some(i=>i.price?.id===monthly)?'Mensal':items.some(i=>i.price?.id===annual)?'Anual':null
      if(!plan)continue
      const active=['active','trialing'].includes(s.status)
      const mrr=active?items.reduce((sum,i)=>{
        if(![monthly,annual].includes(i.price?.id)||i.price?.currency!=='brl')return sum
        return sum+cents(i.price.unit_amount)*(i.quantity||1)/(i.price.recurring?.interval==='year'?12:1)/(i.price.recurring?.interval_count||1)
      },0):0
      unique.set(s.id,{id:s.id,userId:s.metadata.studyos_user_id,email:typeof s.customer==='object'&&!s.customer.deleted?s.customer.email:null,plan,status:s.status,created:s.created,cancelAtPeriodEnd:!!s.cancel_at_period_end,mrr})
    }
    const subscriptions=[...unique.values()]
    const invoicesResult=subscriptions.length?await stripeList('invoices',key,{},10):{rows:[],partial:false}
    const invoices=invoicesResult.rows.flatMap(i=>{
      const subscriptionId=strId(i.parent?.subscription_details?.subscription)||strId(i.subscription)
      const s=unique.get(subscriptionId)
      if(!s||i.currency!=='brl'||Boolean(i.livemode)!==(mode==='live'))return []
      return [{id:i.id,userId:s.userId,email:s.email,plan:s.plan,status:i.status,amountPaid:cents(i.amount_paid),amountDue:cents(i.amount_due),created:i.created,paidAt:i.status_transitions?.paid_at||null}]
    })
    const paid=invoices.filter(i=>i.status==='paid'&&i.amountPaid>0)
    return {available:true,mode,partial:groups.some(g=>g.partial)||invoicesResult.partial,subscriptions,invoices,
      active:subscriptions.filter(s=>s.status==='active').length,
      trialing:subscriptions.filter(s=>s.status==='trialing').length,
      canceled:subscriptions.filter(s=>s.status==='canceled').length,
      overdue:subscriptions.filter(s=>['past_due','unpaid'].includes(s.status)).length,
      mrr:Math.round(subscriptions.filter(s=>s.status==='active').reduce((a,s)=>a+s.mrr,0)),
      paidCount:paid.length,paidUsers:new Set(paid.map(i=>i.userId)).size,gross:paid.reduce((a,i)=>a+i.amountPaid,0)}
  }catch{return {available:false,mode,reason:'stripe_unavailable'}}
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store, max-age=0')
  res.setHeader('X-Content-Type-Options','nosniff')
  if(req.method!=='GET')return res.status(405).json({error:'method'})
  const authorization=req.headers.authorization
  if(!authorization?.startsWith('Bearer '))return res.status(401).json({error:'unauthorized'})
  const url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_ANON_KEY
  if(!url||!key)return res.status(503).json({error:'unavailable'})
  const offset=Number(req.query?.offset||0)
  if(!Number.isInteger(offset)||offset<0||offset>100000)return res.status(400).json({error:'offset'})
  try{
    const headers={Authorization:authorization,apikey:key,'Content-Type':'application/json'}
    const auth=await fetch(new URL('/auth/v1/user',url),{headers,signal:AbortSignal.timeout(5000)})
    if(!auth.ok)return res.status(auth.status<500?401:502).json({error:'unauthorized'})
    const user=await auth.json()
    if(!user.id||user.is_anonymous||user.app_metadata?.studyos_demo)return res.status(403).json({error:'forbidden'})
    const response=await fetch(new URL('/rest/v1/rpc/studyos_admin_snapshot',url),{method:'POST',headers,body:JSON.stringify({p_offset:offset}),signal:AbortSignal.timeout(6500)})
    if(!response.ok)return res.status([401,403].includes(response.status)?403:502).json({error:'snapshot_unavailable'})
    const snapshot=await response.json()
    if(!snapshot||!Array.isArray(snapshot.users))return res.status(502).json({error:'snapshot_unavailable'})
    const finance=offset===0?await financials():null
    return res.status(200).json({snapshot,finance,generatedAt:new Date().toISOString()})
  }catch{return res.status(502).json({error:'unavailable'})}
}
