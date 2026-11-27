(() => {
'use strict';
const $=id=>document.getElementById(id),e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t=k=>window.MekongI18n.t(k),flow=()=>window.MekongWaterFlow,cloud=()=>window.MekongCloud;
const role=()=>window.MekongPortal?.role||'entry',snapshot=()=>cloud()?.snapshot||{},farms=()=>window.MekongPortal?.scopeFarms(window.__MEKONG_TEST__?.farms||[])||[];
const fmt=(n,d=1)=>new Intl.NumberFormat(window.MekongI18n.language==='vi'?'vi-VN':window.MekongI18n.language==='en'?'en-GB':'ko-KR',{maximumFractionDigits:d}).format(n);
const rmus=Array.from({length:18},(_,i)=>'RMU-'+String(i+1).padStart(2,'0'));
let lastStatus='',lastError=false;
let modelRmu='RMU-01',observation=null,observations=[],draftModels=[],selectedPath='',noticeWeek='',sourceResults=[],loading=false;
const canEditModel=()=>['platform','cooperative'].includes(role()),canIssue=()=>['platform','cooperative'].includes(role());
const models=()=>draftModels.length?draftModels:(snapshot().waterModels||[]);
const model=()=>models().find(x=>x.rmu===modelRmu);
function normalizeRole(r,actor){
 const aliases={case:'cooperative',settlement:'cooperative',pump:'operator',review:'platform',formula:'platform',audit:'manager',thirdparty:'manager'};
 return aliases[actor]||aliases[r]||(['farmer','cooperative','operator','platform','manager'].includes(r)?r:null);
}
function errorMessage(err){const key=err?.code||err?.message;return t(key)!==key?t(key):cloud()?.message(err)||String(err.message);}
function status(text,bad=false){lastStatus=text;lastError=bad;const n=$('workspaceStatus');if(n){n.textContent=text;n.dataset.error=String(bad);}}
async function run(button,fn){if(loading)return;loading=true;button&&(button.disabled=true);status(t('working'));try{await fn();}catch(err){status(errorMessage(err),true);}finally{loading=false;button&&(button.disabled=false);}}
function card(title,content){return `<div class="card"><h2>${t(title)}</h2>${content}</div>`;}
function feedback(){return `<p id="workspaceStatus" class="workspace-status" data-error="${lastError}" role="status" aria-live="polite">${e(lastStatus)}</p>`;}
function field(label,name,value='',opts=''){return `<label class="field"><span>${t(label)}</span><input name="${name}" value="${e(value)}" ${opts}></label>`;}
function select(name,options,value){return `<select name="${name}" id="${name}">${options.map(([v,text])=>`<option value="${e(v)}"${v===value?' selected':''}>${e(text)}</option>`).join('')}</select>`;}
function renderHome(){
 const n=$('portalHomeContent');if(!n)return;
 const paths=[['intake','newIntake','intakeHelp','↗'],['stored','storedWater','storedHelp','▱'],['request','changeRequest','requestHelp','≋']];
 n.innerHTML=`<div class="workspace-paths">${paths.map(([id,title,help,icon])=>`<button class="card workspace-path" data-workspace-path="${id}"><span class="workspace-icon">${icon}</span><h2>${t(title)}</h2><p>${t(help)}</p><strong>${t('enter')} →</strong></button>`).join('')}</div>${feedback()}${selectedPath&&selectedPath!=='request'?card('fieldCheck',`<p>${t('fieldCheckHelp')}</p><form id="workspaceCheckForm"><input name="path" type="hidden" value="${selectedPath}"><label class="field"><span>${t(selectedPath==='intake'?'intakeHelp':'storedHelp')}</span><textarea name="note" maxlength="600" required rows="3"></textarea></label><button class="btn btn-primary" type="submit">${t('saveCheck')}</button> <button class="btn btn-secondary" type="button" data-workspace-nav="schedule">${t('openSchedule')}</button></form>`):''}${card('recentChecks',`<div class="workspace-checks">${(snapshot().items||[]).filter(i=>i.kind==='checks').slice(0,8).map(({data:x})=>`<article><b>${t(x.path==='intake'?'newIntake':'storedWater')}</b> <time>${e(x.createdAt?.slice(0,16).replace('T',' '))}</time><p data-user-content>${e(x.note)}</p></article>`).join('')||t('empty')}</div>`)}`;
}
function preferences(){return snapshot().deliveryPreferences||[];}
function noticeItems(){return (snapshot().items||[]).filter(i=>i.kind==='notices').map(i=>i.data);}
function noticeState(s){return t(({issued:'noticeIssued',delivered:'noticeDelivered',acknowledged:'noticeAcknowledged'})[s]||'noticeIssued');}
function renderNotices(){
 const root=$('portalNoticesContent');if(!root)return;
 const fs=farms(),plan=snapshot().planning?.plan,weeks=plan?.weeks||[];
 if(!weeks.some(w=>w.startDate===noticeWeek))noticeWeek=weeks[0]?.startDate||'';
 const week=weeks.find(w=>w.startDate===noticeWeek),items=noticeItems();
 root.innerHTML=`${card('noticeChannel',`<p>${t('noticeHelp')}</p><div class="workspace-notice-flow"><span>1 · ${t('noticeChannel')}</span><span>→</span><span>2 · ${t('issueNotice')}</span><span>→</span><span>3 · ${t('acknowledge')}</span></div>${weeks.length?`<label class="field">${t('week')}${select('workspaceNoticeWeek',weeks.map(w=>[w.startDate,w.startDate]),noticeWeek)}</label>`:`<p>${t('noPublishedPlan')}</p>`}`)}${feedback()}<div class="workspace-notice-farms">${fs.map(f=>{
 const pref=preferences().find(x=>x.farmId===f.id),channel=pref?.channel||'app',edit=role()==='farmer'||canIssue();
 const records=items.filter(x=>x.farmId===f.id),allocation=week?.rows?.find(x=>x.farmId===f.id);
 return `<article class="card" data-notice-farm="${e(f.id)}"><div class="workspace-card-top"><h2>${e(window.MekongI18n.displayName(f.name))}</h2><span class="portal-status">${e(f.rmu)}</span></div><div class="workspace-pref"><label class="field">${t('noticeChannel')}<select data-notice-channel${edit?'':' disabled'}><option value="app"${channel==='app'?' selected':''}>${t('appChannel')}</option><option value="paper"${channel==='paper'?' selected':''}>${t('paperChannel')}</option></select></label>${edit?`<button class="btn btn-secondary" data-notice-save="${e(f.id)}">${t('savePreference')}</button>`:''}${canIssue()&&allocation&&Number.isFinite(allocation.plannedM3)?`<button class="btn btn-primary" data-notice-issue="${e(f.id)}">${t('issueNotice')}</button>`:''}</div><div class="workspace-issued">${records.length?records.slice(0,8).map(x=>`<section class="workspace-notice" data-notice-id="${e(x.id)}"><div class="workspace-card-top"><b>${e(x.weekStart)} · ${t(x.channel==='paper'?'paperChannel':'appChannel')}</b><span class="portal-status">${noticeState(x.status)}</span></div><p>${t('allocated')}: <strong>${fmt(Number(x.plannedM3))} m³</strong> · ${t('plannedIntake')}: ${fmt(Number(x.requestM3))} m³</p><small>${t('noticeSnapshot')}</small>${x.deliveredAt?`<p>${e(x.deliveredAt)} · <span data-user-content>${e(x.deliveryNote)}</span></p>`:''}<div class="workspace-actions">${x.channel==='paper'&&canIssue()?`<button class="btn btn-secondary" data-notice-print="${e(x.id)}">${t('printNotice')}</button>${!x.deliveredAt?`<label class="field">${t('handoverNote')}<input data-handover-note maxlength="600" required></label><button class="btn btn-primary" data-notice-deliver="${e(x.id)}">${t('handover')}</button>`:''}`:''}${role()==='farmer'&&!x.acknowledgedAt?`<button class="btn btn-primary" data-notice-ack="${e(x.id)}">${t('acknowledge')}</button>`:''}</div></section>`).join(''):`<p class="muted">${t('noNotices')}</p>`}</div></article>`;
 }).join('')}</div>`;
}
function currentObservation(m){return observation?.simulated?{...observation,stationId:m?.stationId||'039801'}:observations.find(x=>x.stationId===m?.stationId)||observation;}
function chart(m){
 let c;try{c=flow().fit(m);}catch{return '';}
 const W=650,H=230,pad=48,maxQ=Math.max(...c.pairs.map(p=>p.q))*1.15,dh=c.maxStageM-c.minStageM;
 const x=h=>pad+(h-c.minStageM)/dh*(W-pad*1.4),y=q=>H-pad-q/maxQ*(H-pad*1.3);
 const points=Array.from({length:50},(_,i)=>{const h=c.minStageM+dh*i/49;return `${x(h)},${y(c.a*(h-c.h0)**c.b)}`;}).join(' ');
 return `<figure class="workspace-curve"><figcaption>${t('curve')}</figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('curve')}"><path d="M${pad},15 V${H-pad} H${W-10}" fill="none" stroke="#a3baae"/><polyline points="${points}" fill="none" stroke="#237f64" stroke-width="3"/>${c.pairs.map(p=>`<circle cx="${x(p.h)}" cy="${y(p.q)}" r="5" fill="#267fb3"/>`).join('')}<text x="8" y="18">Q m³/s</text><text x="${W-65}" y="${H-10}">H m</text><text x="${pad}" y="${H-20}">${fmt(c.minStageM,2)}</text><text x="${W-80}" y="${H-20}">${fmt(c.maxStageM,2)}</text><text x="4" y="45">${fmt(maxQ,3)}</text></svg><p>Q = ${fmt(c.a,5)} × max(H − (${fmt(c.h0,3)}), 0)<sup>${fmt(c.b,3)}</sup> · R² ${fmt(c.r2,3)} · RMSE ${fmt(c.rmseM3s,5)} m³/s · n=${c.count}</p></figure>`;
}
function estimate(m){return flow().estimate({...m,demo:!!m?.demo||!!cloud()?.profile?.demo},currentObservation(m),{allowScenario:!!m?.demo||!!cloud()?.profile?.demo});}
function preview(m){
 if(!m)return `<p>${t('modelDemoHelp')}</p>`;
 let result;try{result=estimate(m);}catch(err){return chart(m)+`<p class="workspace-status" data-error="true">${errorMessage(err)}</p>`;}
 return chart(m)+`<div class="workspace-metrics"><div><span>${t('flow')}</span><strong>${fmt(result.flowM3s,4)} m³/s</strong></div><div><span>${t('usableFlow')}</span><strong>${fmt(result.flowM3h)} m³/h</strong></div><div><span>${t('netSupply')}</span><strong>${fmt(result.availableM3)} m³</strong></div></div><p>${t('conservativeHelp')}</p>`;
}
function renderModel(){
 const root=$('portalWatermodelContent');if(!root)return;
 const all=['manager','platform'].includes(role()),options=all?rmus:[window.MekongPortal.rmu||'RMU-01'];
 if(!options.includes(modelRmu))modelRmu=options[0];
 const m=model(),obs=currentObservation(m),editable=canEditModel(),synth=!!m?.demo;
 root.innerHTML=`${card('watermodel',`<div class="workspace-actions"><label class="field">${t('modelScope')}${select('workspaceModelRmu',options.map(r=>[r,r]),modelRmu)}</label><button class="btn btn-secondary" data-model-fetch>${t('fetchStage')}</button>${role()==='platform'?`<button class="btn btn-primary" data-model-demo>${t('modelDemo')}</button>`:''}<button class="btn btn-secondary" data-model-simulate>${t('simulatedStage')}</button></div><p>${t('modelDemoHelp')}</p><div class="workspace-observation"><span class="portal-status">${obs?.simulated?t('synthetic'):t('linkedReadings')}</span>${obs?.simulated?`<label class="field">${t('stageLevel')}<input id="workspaceSimulatedStage" type="number" step="0.01" value="${e(obs.stageM)}"></label>`:''}<strong>${obs&&Number.isFinite(Number(obs.stageM))?fmt(Number(obs.stageM),2)+' m':t('noReading')}</strong><span>${e(obs?.stationId||'')} · ${e(obs?.observedAt||'—')}</span></div>`)}${feedback()}${m?card('curve',`<div class="workspace-card-top"><span class="portal-status">${t(synth?'synthetic':m.verified?'modelVerified':'modelPending')}</span><span>${e(m.siteName)}</span></div>${preview(m)}`):''}
 ${editable||m?`<details class="card workspace-model-editor"${m?'':' open'}><summary>${t('curveDetails')}</summary><p>${t('calibrationHelp')}</p><form id="workspaceModelForm"><div class="workspace-form-grid"><label class="field">${t('station')}${select('stationId',[['039801','039801 · Châu Đốc'],['019803','019803 · Tân Châu'],['980601','980601 · Vàm Nao']],m?.stationId||'039801')}</label>${field('sourceId','sourceId',m?.sourceId||'','required maxlength="120"')}${field('siteName','siteName',m?.siteName||'','required maxlength="200"')}${field('datum','datum',m?.datum||'','required maxlength="400"')}${field('zeroStage','zeroStageM',m?.zeroStageM??'','type="number" min="-100" max="100" step="any" required')}${field('sourceCap','sourceCapacityM3h',m?.sourceCapacityM3h??'','type="number" min="0" step="any" required')}${field('sourceShare','sourceSharePct',m?.sourceSharePct??'','type="number" min="0" max="100" step="any" required')}${field('pumpCap','pumpCapacityM3h',m?.pumpCapacityM3h??'','type="number" min="0" step="any" required')}${field('runtime','runtimeHours',m?.runtimeHours??'','type="number" min="0" max="168" step="any" required')}${field('loss','lossPct',m?.lossPct??'','type="number" min="0" max="80" step="any" required')}${field('uncertainty','uncertaintyPct',m?.uncertaintyPct??20,'type="number" min="0" max="80" step="any" required')}</div><label class="field">${t('calibrationPairs')}<textarea name="pairs" rows="6" required>${e(m?.samples?.map(p=>p.stageM+','+p.flowM3s).join('\n')||'')}</textarea></label><label class="field">${t('evidence')}<textarea name="evidence" required maxlength="1000" rows="2">${e(m?.evidence||'')}</textarea></label>${editable?`<label class="workspace-checkbox"><input name="demo" type="checkbox"${synth||cloud()?.profile?.demo?' checked':''}${cloud()?.profile?.demo?' disabled':''}>${t('synthetic')}</label><button class="btn btn-primary" type="submit">${t('saveModel')}</button>`:''}</form></details>`:''}
 ${role()==='manager'&&m&&!synth&&!m.verified?card('reviewModel',`<form id="workspaceReviewForm"><label class="field">${t('reviewEvidence')}<textarea name="evidence" required minlength="5" maxlength="1000"></textarea></label><button class="btn btn-primary">${t('reviewModel')}</button></form>`):''}
 ${role()==='platform'?card('netSupply',`<p>${t('publishFlowHelp')}</p><div class="workspace-actions"><button class="btn btn-primary" data-model-apply${m?'':' disabled'}>${t('applyFlow')}</button>${models().filter(x=>x.demo).length===18?`<button class="btn btn-secondary" data-model-apply-all>${t('applyAllFlow')}</button>`:''}<button class="btn btn-secondary" data-workspace-nav="accounts">${cloud()?.t('accounts')}</button></div>`):''}
 <div class="card workspace-method-links"><a href="https://www.usgs.gov/mission-areas/water-resources/science/streamgaging-basics" target="_blank" rel="noopener">USGS · Stage / discharge measurements ↗</a><a href="https://pubs.usgs.gov/publication/sir20245129/full" target="_blank" rel="noopener">USGS · Backwater / dynamic ratings ↗</a></div>`;
 if(!editable)root.querySelectorAll('#workspaceModelForm input,#workspaceModelForm select,#workspaceModelForm textarea').forEach(n=>n.disabled=true);
}
async function fetchStage(){
 const payload=await request('/api/mrc');
 observations=(payload.stations||[]).filter(s=>s.waterLevel_m!==null&&s.waterLevel_m!==undefined&&String(s.waterLevel_m).trim()!==''&&Number.isFinite(Number(s.waterLevel_m))).map(s=>({stationId:String(s.stationId),stageM:Number(s.waterLevel_m),observedAt:s.lastMeasurement_local,source:s.source||'MRC / Google Sheets mirror'}));
 observation=observations.find(s=>s.stationId===(model()?.stationId||'039801'))||null;renderModel();
 status(t(observation?'connectionOk':'noReading'),!observation);
}
async function prepareModels(){
 if(!observation||observation.simulated){try{await fetchStage();}catch{}}
 const base=observation&&Number.isFinite(observation.stageM)?observation.stageM:1.5;
 if((snapshot().waterModels||[]).some(m=>!m.demo))throw new Error('VERIFY_BLOCKED');
 draftModels=flow().scenarioModels(base);renderModel();
 for(const m of draftModels){const prior=(snapshot().waterModels||[]).find(x=>x.rmu===m.rmu);await cloud().command('water.model.upsert',m,prior?._version||0);}
 draftModels=[];renderModel();status(t('modelSaved'));
}
async function saveModel(form){
 const data=Object.fromEntries(new FormData(form));
 const samples=data.pairs.trim().split(/\r?\n/).filter(Boolean).map(line=>{const [stageM,flowM3s,...extra]=line.split(',');if(extra.length||stageM===undefined||flowM3s===undefined)throw new Error('FLOW_INPUT');return {stageM:stageM.trim(),flowM3s:flowM3s.trim()};});
 const m={...data,id:modelRmu,rmu:modelRmu,samples,flowCondition:'free_flow',maxAgeHours:6,demo:cloud()?.profile?.demo||data.demo==='on',verified:false};delete m.pairs;
 for(const k of ['zeroStageM','sourceCapacityM3h','sourceSharePct','pumpCapacityM3h','runtimeHours','lossPct','uncertaintyPct']){if(String(m[k]).trim()==='')throw new Error('FLOW_INPUT');m[k]=Number(m[k]);}
 flow().fit(m);flow().validateSharedSources([...(snapshot().waterModels||[]).filter(x=>x.rmu!==m.rmu),m]);
 const prior=(snapshot().waterModels||[]).find(x=>x.rmu===modelRmu);await cloud().command('water.model.upsert',m,prior?._version||0);draftModels=[];renderModel();status(t('modelSaved'));
}
function applyModels(all){
 const chosen=all?models().filter(m=>m.demo):[model()];flow().validateSharedSources(models());
 const weeks=[...document.querySelectorAll('#supplyWeek option')].map(o=>o.value);if(!weeks.length)throw new Error('PLAN_CHANGED');
 const results=chosen.map(m=>({m,result:estimate(m)}));
 if(results.some(x=>currentObservation(x.m)?.simulated&&!x.result.scenario))throw new Error('FLOW_NOT_VERIFIED');
 const records=results.flatMap(({m,result})=>weeks.map(weekStart=>({schema:'mekong-suksuk-weekly-supply/v1',weekStart,rmu:m.rmu,method:'calibrated_stage',availableM3:result.availableM3,flowM3h:result.flowM3h,runtimeHours:result.runtimeHours,lossPct:result.lossPct,demoScenario:result.scenario,stageScenario:result.scenario,projection:true,calibration:result,modelId:m.id,modelVersion:m._version||0,evidence:[t(result.scenario?'synthetic':'modelVerified'),m.siteName,result.observedAt,t('publishFlowHelp')].join(' · '),recordedAt:new Date().toISOString()})));
 window.MekongWeeklySupply.applyFlowRecords(records,results.some(x=>x.result.scenario));status(t('flowApplied'));
}
async function request(path){const response=await fetch(path,{cache:'no-store',signal:AbortSignal.timeout(18000)});if(!response.ok)throw new Error('HTTP '+response.status);return response.json();}
function renderSources(){
 const n=$('portalSourcesContent');if(!n)return;
 n.innerHTML=`${card('sources',`<p>${t('sourceHelp')}</p><button class="btn btn-primary" data-sources-refresh>${t('refreshData')}</button>`)}${feedback()}<div class="workspace-source-grid">${sourceResults.map(s=>card(s.kind,`<span class="portal-status">${t(s.ok?'connectionOk':'connectionError')}</span><p>${e(s.path)}</p><p>${t('requestTime')}: ${e(s.at)}</p>${s.detail||''}`)).join('')}</div>${card('data',`<div class="workspace-formula">${t('demandFormula')}</div><p>${t('rainFormula')}</p><p>${t('climateHelp')}</p><div class="workspace-formula">${t('allocationFormula')}</div><p>${t('conservativeHelp')}</p><p><a href="https://github.com/MinaHa832/chau-phu-farmer-dashboard" target="_blank" rel="noopener">GitHub · source / pull requests / deployment ↗</a></p>`)}`;
}
async function refreshSources(){
 const paths=[['water','/api/mrc'],['data','/api/history'],['weather','/api/weather']];
 const responses=await Promise.allSettled(paths.map(async([kind,path])=>{
 const data=await request(path);let detail='';
 if(data.stations)detail=data.stations.map(s=>`<p><b>${e(s.stationId)} · ${e(s.name)}</b><br>${t('stageLevel')}: ${s.waterLevel_m!==''&&s.waterLevel_m!=null?e(s.waterLevel_m):'—'} · ${t('rainfall')} 24h: ${s.rainFall24H_mm!==''&&s.rainFall24H_mm!=null?e(s.rainFall24H_mm):'—'} mm<br>${t('observedAt')}: ${e(s.lastMeasurement_local||'—')}</p>`).join('');
 if(data.readings)detail=`<p>${data.readings.length} · ${t('observedAt')}: ${e(data.readings.at(-1)?.lastMeasurement_local||'—')}</p>`;
 if(data.weather?.current||data.current)detail=`<p>${t('observedAt')}: ${e((data.weather?.current||data.current).time||'—')}</p>`;
 return {kind,path,ok:true,at:new Date().toISOString(),detail};
 }));
 sourceResults=responses.map((x,i)=>x.status==='fulfilled'?x.value:{kind:paths[i][0],path:paths[i][1],ok:false,at:new Date().toISOString()});renderSources();status(t(sourceResults.every(x=>x.ok)?'connectionOk':'connectionError'),sourceResults.some(x=>!x.ok));
}
function renderRequestFilters(){
 let n=$('workspaceRequestFilter');if(!n){n=document.createElement('div');n.id='workspaceRequestFilter';n.className='card';$('portalRequestsContent').prepend(n);}
 n.hidden=!['manager','cooperative'].includes(role());if(n.hidden)return;
 const weeks=snapshot().planning?.plan?.weeks||[],value=$('benefitOpsWeek')?.value||'1';
 n.innerHTML=`<p>${t(role()==='cooperative'?'triageOnly':'viewOnly')}</p><label class="field">${t('week')}${select('workspaceRequestWeek',weeks.map((w,i)=>[String(w.index||i+1),(i+1)+' · '+w.startDate]),value)}</label>`;
}
function applyPermissions(r){
 const delivery=['operator','platform'].includes(r),triage=['cooperative','platform','operator'].includes(r),review=r==='manager';
 const set=(node,show)=>{if(node)node.hidden=!show;};
 for(const selector of ['#benefitRequestForm','#benefitIncidentForm'])set(document.querySelector(selector)?.closest('.portal-farmer-only'),r==='farmer');
 set($('benefitOpsWorklist')?.closest('.card'),delivery);
 const compare=$('benefitForm')?.closest('details');set(compare,delivery);
 for(const id of ['benefitReviewQueue','benefitIncidentQueue'])if($(id)){
  if(id==='benefitReviewQueue')set($(id).closest('.card'),review);
 }
 document.querySelectorAll('[data-request-save]').forEach(b=>{
  set(b,triage);const c=b.closest('article');if(!c)return;
  c.querySelectorAll('input,select,textarea').forEach(x=>x.disabled=!triage);
  if(r==='cooperative'){
   c.querySelectorAll('select option').forEach(o=>o.disabled=!['pending','processing','declined'].includes(o.value));
   c.querySelectorAll('[data-request-delivered]').forEach(x=>x.disabled=true);
   const s=c.querySelector('[data-request-status]')?.value;if(['completed','partial'].includes(s))b.disabled=true;
  }
 });
 document.querySelectorAll('[data-operation-save],[data-review-action],[data-incident-action]').forEach(b=>set(b,b.hasAttribute('data-operation-save')?delivery:review));
 const supply=$('weeklySupplyPanel');if(supply)supply.querySelectorAll('.supply-entry-grid,.supply-entry-actions,.supply-record-tools,.supply-form-status').forEach(n=>set(n,r==='platform'));
 // The algorithm is visible to independent review; only the platform edits its inputs.
 if(r!=='platform')$('balanceAllocationPanel')?.querySelectorAll('input,select,button').forEach(x=>x.disabled=true);
 else $('balanceAllocationPanel')?.querySelectorAll('input,select,button').forEach(x=>x.disabled=false);
 document.querySelectorAll('#benefitForm input,#benefitForm select,#benefitForm textarea,#benefitForm button').forEach(x=>x.disabled=!delivery);
 if(!['farmer','platform','cooperative'].includes(r))document.querySelectorAll('[data-map-farm-action="edit"],#editSelectedFarm').forEach(x=>x.hidden=true);
}
function render(page){if(page!==document.body.dataset.workspaceLastPage){lastStatus='';lastError=false;document.body.dataset.workspaceLastPage=page;}if(page==='home')renderHome();if(page==='notices')renderNotices();if(page==='watermodel')renderModel();if(page==='sources')renderSources();if(page==='requests')renderRequestFilters();applyPermissions(role());}
function refresh(){render(document.body.dataset.portalPage);}
function printNotice(id){
 const x=noticeItems().find(x=>x.id===id);if(!x)return;
 $('workspacePrint')?.remove();const el=document.createElement('section');el.id='workspacePrint';
 el.innerHTML=`<h1>MEKONG WATER LAB · ${t('issueNotice')}</h1><h2>${e(window.MekongI18n.displayName(x.farmName))} · ${e(x.rmu)}</h2><p>${t('week')}: ${e(x.weekStart)}</p><p>${t('allocated')}: <b>${fmt(Number(x.plannedM3))} m³</b></p><p>${t('plannedIntake')}: ${fmt(Number(x.requestM3))} m³</p><p>${t('noticeSnapshot')}</p><p>${e(x.id)}</p>`;
 document.body.append(el);window.print();
}
document.addEventListener('click',ev=>{
 const b=ev.target.closest('button');if(!b)return;
 if(b.dataset.workspaceNav){window.MekongPortal.navigate(b.dataset.workspaceNav);return;}
 if(b.dataset.workspacePath){selectedPath=b.dataset.workspacePath;if(selectedPath==='request')window.MekongPortal.navigate('requests');else renderHome();return;}
 if(b.hasAttribute('data-model-simulate')){observation={stationId:model()?.stationId||'039801',stageM:model()?flow().fit(model()).pairs[Math.floor(model().samples.length/2)].h:1.5,observedAt:new Date().toISOString(),source:'SIMULATED',simulated:true};renderModel();return;}
 if(b.hasAttribute('data-model-fetch'))return run(b,fetchStage);
 if(b.hasAttribute('data-model-demo'))return run(b,prepareModels);
 if(b.hasAttribute('data-model-apply')||b.hasAttribute('data-model-apply-all'))return run(b,()=>applyModels(b.hasAttribute('data-model-apply-all')));
 if(b.hasAttribute('data-sources-refresh'))return run(b,refreshSources);
 const farmId=b.dataset.noticeSave||b.dataset.noticeIssue;
 if(farmId)return run(b,async()=>{
 const row=b.closest('[data-notice-farm]'),channel=row.querySelector('[data-notice-channel]').value,pref=preferences().find(x=>x.farmId===farmId);
 if(b.dataset.noticeSave){await cloud().command('notice.preference',{farmId,channel},pref?._version||0);status(t('savedOk'));}
 else{await cloud().command('notice.issue',{id:'NOTICE-'+crypto.randomUUID(),farmId,weekStart:noticeWeek,channel},0);status(t('savedOk'));}
 });
 if(b.dataset.noticePrint)return printNotice(b.dataset.noticePrint);
 const id=b.dataset.noticeAck||b.dataset.noticeDeliver;if(id)return run(b,async()=>{
 const item=noticeItems().find(x=>x.id===id),note=b.closest('[data-notice-id]').querySelector('[data-handover-note]')?.value||'';
 if(b.dataset.noticeDeliver&&!note.trim())throw new Error('FLOW_INPUT');
 await cloud().command(b.dataset.noticeAck?'notice.ack':'notice.deliver',{id,note},item._version);status(t('savedOk'));
 });
});
document.addEventListener('submit',ev=>{
 if(!['workspaceCheckForm','workspaceModelForm','workspaceReviewForm'].includes(ev.target.id))return;
 ev.preventDefault();const form=ev.target,b=form.querySelector('button[type="submit"],button');
 run(b,async()=>{
 if(form.id==='workspaceCheckForm'){const data=Object.fromEntries(new FormData(form));await cloud().command('check.create',{...data,id:'CHECK-'+crypto.randomUUID(),farmId:window.MekongPortal.farmId},0);renderHome();status(t('savedOk'));}
 if(form.id==='workspaceModelForm')await saveModel(form);
 if(form.id==='workspaceReviewForm'){const m=model();await cloud().command('water.model.review',{rmu:m.rmu,evidence:new FormData(form).get('evidence')},m._version);renderModel();status(t('savedOk'));}
 });
});
document.addEventListener('change',ev=>{if(ev.target.id==='workspaceSimulatedStage'){if(ev.target.value.trim()!=='')observation={...observation,stageM:Number(ev.target.value),observedAt:new Date().toISOString(),simulated:true};renderModel();}if(ev.target.id==='workspaceRequestWeek'){$('benefitOpsWeek').value=ev.target.value;$('benefitOpsWeek').dispatchEvent(new Event('change',{bubbles:true}));}if(ev.target.id==='workspaceModelRmu'){modelRmu=ev.target.value;renderModel();}if(ev.target.id==='workspaceNoticeWeek'){noticeWeek=ev.target.value;renderNotices();}});
window.MekongWorkspace={normalizeRole,render,refresh,applyPermissions};
})();
