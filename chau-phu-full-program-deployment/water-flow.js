(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MekongWaterFlow=api;
})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  class FlowError extends Error {constructor(code){super(code);this.code=code;}}
  const finite=x=>x!==null&&x!==undefined&&String(x).trim()!==''&&Number.isFinite(Number(x));
  const number=(x,min,max)=>{if(!finite(x)||Number(x)<min||Number(x)>max)throw new FlowError('FLOW_INPUT');return Number(x);};
  function fit(model){
    const h0=number(model.zeroStageM,-100,100);
    const samples=model.samples;
    if(!Array.isArray(samples)||samples.length<3||samples.length>200)throw new FlowError('FLOW_SAMPLES');
    const pairs=samples.map(s=>({h:number(s.stageM,-100,100),q:number(s.flowM3s,0.000001,100000),date:s.observedAt||''})).sort((a,b)=>a.h-b.h);
    if(pairs.some(p=>p.h<=h0)||new Set(pairs.map(p=>p.h)).size<3||pairs.at(-1).h-pairs[0].h<0.05)throw new FlowError('FLOW_RANGE');
    // A single-valued rating is unsuitable when discharge reverses with stage.
    for(let i=1;i<pairs.length;i++)if(pairs[i].h>pairs[i-1].h&&pairs[i].q<pairs[i-1].q*0.9)throw new FlowError('FLOW_BACKWATER');
    const xs=pairs.map(p=>Math.log(p.h-h0)),ys=pairs.map(p=>Math.log(p.q));
    const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
    const mx=mean(xs),my=mean(ys),den=xs.reduce((s,x)=>s+(x-mx)**2,0);
    const b=xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0)/den,a=Math.exp(my-b*mx);
    if(!Number.isFinite(a)||!Number.isFinite(b)||a<=0||b<=0||b>6)throw new FlowError('FLOW_FIT');
    const meanQ=mean(pairs.map(p=>p.q));
    const errors=pairs.map(p=>p.q-a*(p.h-h0)**b);
    const sse=errors.reduce((s,e)=>s+e*e,0),sst=pairs.reduce((s,p)=>s+(p.q-meanQ)**2,0);
    return {a,b,h0,minStageM:pairs[0].h,maxStageM:pairs.at(-1).h,count:pairs.length,
      rmseM3s:Math.sqrt(sse/pairs.length),relativeRmse:Math.sqrt(sse/pairs.length)/meanQ,r2:sst>0?1-sse/sst:1,pairs};
  }
  function observationTime(value){
    if(typeof value!=='string')return NaN;
    // Unzoned measurements in this project are Vietnam local time (UTC+07).
    const normalized=value.trim().replace(' ','T');
    return Date.parse(/(?:Z|[+-]\d\d:?\d\d)$/.test(normalized)?normalized:normalized+'+07:00');
  }
  function estimate(model,observation,{now=Date.now(),allowScenario=false}={}){
    if(!model||!observation)throw new FlowError('FLOW_INPUT');
    if(model.flowCondition!=='free_flow')throw new FlowError('FLOW_BACKWATER');
    if(String(model.stationId)!==String(observation.stationId))throw new FlowError('FLOW_STATION');
    if(!String(model.siteName||'').trim()||!String(model.datum||'').trim())throw new FlowError('FLOW_DATUM');
    const scenario=model.demo===true||model.verified!==true;
    if(scenario&&!allowScenario)throw new FlowError('FLOW_NOT_VERIFIED');
    const measuredAt=observationTime(observation.observedAt);
    const ageHours=(now-measuredAt)/3600000;
    const maxAgeHours=number(model.maxAgeHours??6,0.25,24);
    if(!Number.isFinite(ageHours)||ageHours < -0.25||ageHours>maxAgeHours)throw new FlowError('FLOW_STALE');
    const curve=fit(model),stage=number(observation.stageM,-100,100);
    // No extrapolation: no invented capacity when the level is outside calibration.
    if(stage<curve.minStageM||stage>curve.maxStageM)throw new FlowError('FLOW_OUTSIDE_RANGE');
    const flowM3s=curve.a*Math.max(0,stage-curve.h0)**curve.b;
    const uncertainty=Math.max(number(model.uncertaintyPct??20,0,80)/100,Math.min(0.8,curve.relativeRmse));
    const pumpCapacityM3h=number(model.pumpCapacityM3h,0,10000000);
    const sharedSourceCapacityM3h=number(model.sourceCapacityM3h,0,10000000);
    const hours=number(model.runtimeHours,0,168),loss=number(model.lossPct,0,80)/100;
    const share=number(model.sourceSharePct,0,100)/100;
    // The shared-source quota is applied before the RMU/pump cap, preventing
    // several RMUs from each consuming an entire common source in the plan.
    const constrained=q=>Math.min(q*3600*share,pumpCapacityM3h,sharedSourceCapacityM3h*share);
    const volume=q=>constrained(q)*hours*(1-loss);
    const pointM3=volume(flowM3s),lowerM3=volume(flowM3s*(1-uncertainty)),upperM3=volume(flowM3s*(1+uncertainty));
    return {method:'calibrated_stage',scenario,stationId:String(model.stationId),siteName:model.siteName,
      stageM:stage,observedAt:observation.observedAt,source:observation.source||'',curve,
      flowM3s,flowM3h:constrained(flowM3s),runtimeHours:hours,lossPct:loss*100,sourceSharePct:share*100,
      pointM3,lowerM3,upperM3,availableM3:lowerM3,uncertaintyPct:uncertainty*100,
      modelId:model.id||model.rmu,modelVersion:model._version||1,
      basis:'LOWER_PLANNING_BOUND_NOT_STATISTICAL_CONFIDENCE',recordedAt:new Date(now).toISOString()};
  }
  function validateSharedSources(models){
    const groups=new Map();
    for(const m of models){
      if(!String(m.sourceId||'').trim())throw new FlowError('FLOW_SOURCE');
      const group=groups.get(m.sourceId)||[];group.push(m);groups.set(m.sourceId,group);
    }
    for(const list of groups.values()){
      const sum=list.reduce((s,m)=>s+number(m.sourceSharePct,0,100),0);
      if(sum>100+1e-8)throw new FlowError('FLOW_SHARES');
      if(new Set(list.map(m=>String(m.stationId))).size>1||new Set(list.map(m=>Number(m.sourceCapacityM3h))).size>1)throw new FlowError('FLOW_SOURCE_MISMATCH');
    }
    return true;
  }
  function scenarioModels(stageM=1.5){
    const h=Math.round(Number(stageM)*100)/100;
    return Array.from({length:18},(_,i)=>{
      const zeroStageM=h-1.5,a=0.12,b=1.5;
      return {id:'RMU-'+String(i+1).padStart(2,'0'),rmu:'RMU-'+String(i+1).padStart(2,'0'),
        stationId:'039801',siteName:'DEMO common intake / RMU '+(i+1),datum:'DEMO: Châu Đốc gauge datum; not surveyed',
        flowCondition:'free_flow',zeroStageM,sourceId:'DEMO-COMMON-INTAKE',sourceCapacityM3h:1200,sourceSharePct:5,
        pumpCapacityM3h:35+i%5*3,runtimeHours:14+i%4*2,lossPct:15,uncertaintyPct:25,maxAgeHours:6,demo:true,verified:false,
        evidence:'SYNTHETIC CALIBRATION: not field measurements',
        samples:[0.5,1,1.5,2,2.5].map(depth=>({stageM:zeroStageM+depth,flowM3s:a*depth**b}))};
    });
  }
  return {fit,estimate,validateSharedSources,scenarioModels,observationTime,FlowError};
});
