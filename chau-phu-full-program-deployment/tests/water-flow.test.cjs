const {test}=require('node:test');const assert=require('node:assert/strict');
const flow=require('../water-flow');
const now=Date.parse('2026-11-27T00:00:00Z');
const model=()=>({...flow.scenarioModels(1.5)[0],verified:true,demo:false});
const observation={stationId:'039801',stageM:1.5,observedAt:'2026-11-27T06:30:00+07:00',source:'test gauge'};
test('known calibration is recovered; all unit conversions and conservative caps apply',()=>{
 const m=model(),result=flow.estimate(m,observation,{now});
 assert.ok(Math.abs(result.curve.a-0.12)<1e-10);assert.ok(Math.abs(result.curve.b-1.5)<1e-10);
 const expected=Math.min(0.12*1.5**1.5*3600*.05,m.pumpCapacityM3h,1200*.05)*14*.85;
 assert.ok(Math.abs(result.pointM3-expected)<1e-7);assert.ok(result.availableM3<result.pointM3);assert.equal(result.scenario,false);
});
test('stale, wrong-station, extrapolated and backwater observations cannot become capacity',()=>{
 assert.throws(()=>flow.estimate(model(),{...observation,observedAt:'2026-11-25T00:00:00Z'},{now}),/FLOW_STALE/);
 assert.throws(()=>flow.estimate(model(),{...observation,stationId:'other'},{now}),/FLOW_STATION/);
 assert.throws(()=>flow.estimate(model(),{...observation,stageM:8},{now}),/FLOW_OUTSIDE_RANGE/);
 assert.throws(()=>flow.estimate({...model(),flowCondition:'backwater'},observation,{now}),/FLOW_BACKWATER/);
 assert.throws(()=>flow.estimate({...model(),demo:true},observation,{now}),/FLOW_NOT_VERIFIED/);
});
test('one common source cannot be counted in full by each RMU',()=>{
 const models=flow.scenarioModels();assert.equal(flow.validateSharedSources(models),true);
 assert.throws(()=>flow.validateSharedSources(models.map(m=>({...m,sourceSharePct:10}))),/FLOW_SHARES/);
 models[0].sourceCapacityM3h=1;assert.throws(()=>flow.validateSharedSources(models),/FLOW_SOURCE_MISMATCH/);
});
test('blank parameters, unidentifiable curves and reversed stage/flow pairs are rejected',()=>{
 assert.throws(()=>flow.estimate({...model(),pumpCapacityM3h:''},observation,{now}),/FLOW_INPUT/);
 assert.throws(()=>flow.fit({...model(),samples:[{stageM:1,flowM3s:1},{stageM:1,flowM3s:1},{stageM:1,flowM3s:1}]}),/FLOW_RANGE/);
 assert.throws(()=>flow.fit({...model(),samples:[{stageM:1,flowM3s:3},{stageM:2,flowM3s:2},{stageM:3,flowM3s:1}]}),/FLOW_BACKWATER/);
 assert.equal(flow.observationTime('2026-11-27 07:00:00'),now);
});
