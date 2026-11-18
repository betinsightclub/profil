// Offline reference implementation. Not a database transaction or real authenticated checkout.
// Production must enforce atomic UNIQUE allocation/event keys and verified sessions; no client-controlled quote or context.
export function reserveTestOrder(state,request,context){
 // This is an offline policy prototype. Context is trusted backend data, never browser assertions.
 const fail=reason=>({ok:false,reason});
 if(!context?.verifiedUser?.id||context.verifiedUser.email!==request.email)return fail("MEMBER_BINDING_REQUIRED");
 if(!context.package?.active||context.package.code!==request.packageCode||!Number.isSafeInteger(context.package.units)||context.package.units<=0||!/^[1-9]\d*$/.test(context.package.eurCents))return fail("PACKAGE_INVALID");
 const {quote,allocation}=context;
 if(!quote||quote.network!==request.network||quote.asset!==request.asset||quote.eurCents!==context.package.eurCents||!/^[1-9]\d*$/.test(quote.amountRaw)||!Number.isSafeInteger(quote.expiresMs)||!Number.isSafeInteger(context.now)||quote.expiresMs<=context.now)return fail("QUOTE_INVALID");
 if(!allocation||allocation.network!==request.network||!allocation.address||!Number.isSafeInteger(allocation.walletVersion)||allocation.walletVersion<1||allocation.ownerVerified!==true||allocation.enabled!==true)return fail("ALLOCATION_INVALID");
 // Unique address per order (shared within its network only when a unique XRPL tag is used).
 if(allocation.kind!=="unique-address"&&!(allocation.kind==="xrpl-tag"&&request.network==="XRPL"&&Number.isSafeInteger(allocation.tag)&&allocation.tag>=1&&allocation.tag<=4294967295))return fail("AMBIGUOUS_ALLOCATION");
 const allocationKey=JSON.stringify([allocation.network,allocation.address,allocation.kind==="xrpl-tag"?allocation.tag:null]);
 const existing=state.orders.find(o=>o.userId===context.verifiedUser.id&&o.idempotencyKey===request.idempotencyKey);
 if(existing)return existing.packageCode===request.packageCode&&existing.network===request.network&&existing.asset===request.asset?{ok:true,idempotent:true,order:existing,state}:fail("IDEMPOTENCY_CONFLICT");
 if(!request.idempotencyKey||!context.orderId||state.orders.some(o=>o.id===context.orderId||o.allocationKey===allocationKey))return fail("ALLOCATION_ALREADY_USED");
 const order={id:context.orderId,idempotencyKey:request.idempotencyKey,userId:context.verifiedUser.id,email:context.verifiedUser.email,packageCode:context.package.code,units:context.package.units,eurCents:context.package.eurCents,network:quote.network,asset:quote.asset,amountRaw:quote.amountRaw,createdMs:context.now,expiresMs:quote.expiresMs,address:allocation.address,walletVersion:allocation.walletVersion,tag:allocation.kind==="xrpl-tag"?allocation.tag:null,allocationKey,status:"TEST_PENDING"};
 return {ok:true,order,state:{orders:[...state.orders,order]}};
}

export function testReserve(){
 const s={orders:[]},req={email:"demo@example.invalid",packageCode:"starter",network:"BSC",asset:"USDT",idempotencyKey:"key1"},ctx={verifiedUser:{id:"demo",email:req.email},package:{active:true,code:"starter",units:50,eurCents:"4900"},quote:{network:"BSC",asset:"USDT",eurCents:"4900",amountRaw:"54000000",expiresMs:2000},allocation:{network:"BSC",address:"synthetic-only",walletVersion:1,ownerVerified:true,enabled:true,kind:"unique-address"},now:1000,orderId:"test1"};
 const r=reserveTestOrder(s,req,ctx),p=r.state;
 const cases=[
 ["valid",r.ok===true],["email mismatch",!reserveTestOrder(s,{...req,email:"other@example.invalid"},ctx).ok],["missing verified account",!reserveTestOrder(s,req,{...ctx,verifiedUser:null}).ok],["unknown package",!reserveTestOrder(s,{...req,packageCode:"bad"},ctx).ok],["disabled package",!reserveTestOrder(s,req,{...ctx,package:{...ctx.package,active:false}}).ok],["price mismatch",!reserveTestOrder(s,req,{...ctx,quote:{...ctx.quote,eurCents:"1"}}).ok],["expired quote",!reserveTestOrder(s,req,{...ctx,now:2000}).ok],["wrong asset",!reserveTestOrder(s,{...req,asset:"BNB"},ctx).ok],["wrong network",!reserveTestOrder(s,{...req,network:"TRON"},ctx).ok],["shared address rejected",!reserveTestOrder(s,req,{...ctx,allocation:{...ctx.allocation,kind:"shared-address"}}).ok],["unverified wallet",!reserveTestOrder(s,req,{...ctx,allocation:{...ctx.allocation,ownerVerified:false}}).ok],["disabled wallet",!reserveTestOrder(s,req,{...ctx,allocation:{...ctx.allocation,enabled:false}}).ok],["same request idempotent",reserveTestOrder(p,req,ctx).idempotent===true],["address reused",!reserveTestOrder(p,{...req,idempotencyKey:"key2"},{...ctx,orderId:"test2"}).ok],["old order version retained",r.order.walletVersion===1],["no real payment status",r.order.status==="TEST_PENDING"]
 ];const xr={...req,network:"XRPL",asset:"XRP"},xc={...ctx,quote:{...ctx.quote,network:"XRPL",asset:"XRP"},allocation:{...ctx.allocation,network:"XRPL",kind:"xrpl-tag",tag:123}};const x=reserveTestOrder(s,xr,xc);cases.push(["valid XRP tag",x.ok===true],["duplicate tag",!reserveTestOrder(x.state,{...xr,idempotencyKey:"key2"},{...xc,orderId:"test2"}).ok],["different XRP tag",reserveTestOrder(x.state,{...xr,idempotencyKey:"key2"},{...xc,orderId:"test2",allocation:{...xc.allocation,tag:124}}).ok===true],["missing XRP tag",!reserveTestOrder(s,xr,{...xc,allocation:{...xc.allocation,tag:null}}).ok]);return cases.map(([name,pass])=>({name,pass}));
}
