const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname,'..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');
const context={window:{},localStorage:{getItem:()=>null}};
vm.runInNewContext(read('role-portals.js'),context);
const portal=context.window.MekongPortal;
const farms=Array.from({length:18},(_,i)=>Array.from({length:3},(_,j)=>({id:`farm-${i}-${j}`,rmu:`RMU-${String(i+1).padStart(2,'0')}`}))).flat();
test('54 farms stay in 18 groups, with role-specific views',()=>{
 assert.equal(new Set(farms.map(f=>f.rmu)).size,18);
 assert.equal(portal.filterForRole(farms,'manager','farm-0-0','RMU-02').length,54);
 assert.equal(portal.filterForRole(farms,'operator','farm-0-0','RMU-02').length,3);
 assert.deepEqual(Array.from(portal.filterForRole(farms,'farmer','farm-0-0','RMU-02'),f=>f.id),['farm-0-0']);
 assert.equal(portal.filterForRole(farms,'farmer','missing','RMU-02').length,0);
});
test('farm requests and reports stay with their farm; shared benefit records use RMU',()=>{
 const own={farmId:'farm-0-0',rmu:'RMU-01'},other={farmId:'farm-0-1',rmu:'RMU-01'};
 assert.equal(portal.recordAllowed(own,'farmer','farm-0-0','','RMU-01'),true);
 assert.equal(portal.recordAllowed(other,'farmer','farm-0-0','','RMU-01'),false);
 assert.equal(portal.recordAllowed({reporterFarmId:'farm-0-1',rmu:'RMU-01'},'farmer','farm-0-0','','RMU-01'),false);
 assert.equal(portal.recordAllowed({rmu:'RMU-01'},'farmer','farm-0-0','','RMU-01'),true);
 assert.equal(portal.recordAllowed(own,'operator','','RMU-02',''),false);
 assert.equal(portal.recordAllowed(own,'manager','','',''),true);
});
test('GPS validation restores farms without coordinates and rejects incomplete pairs',()=>{
 const source=read('index.html');const match=source.match(/const gpsValid=([\s\S]*?);\n  const farmValid=/);
 const gps=vm.runInNewContext('('+match[1]+')');
 assert.equal(gps({}),true);assert.equal(gps({lat:null,lon:null}),true);
 assert.equal(gps({lat:10.51,lon:105.19}),true);assert.equal(gps({lat:10.51,lon:null}),false);
 assert.equal(gps({lat:0,lon:0}),false);
});
test('request delivery totals do not double count a manually recorded weekly total',()=>{
 const source=read('benefit-workflow.js');const start=source.indexOf('  function deliveryFor('),end=source.indexOf('  function renderOperations()',start);
 const state={operations:[],requests:[{weekStart:'2026-05-01',farmId:'a',status:'completed',deliveredM3:120},{weekStart:'2026-05-01',farmId:'a',status:'partial',deliveredM3:30},{weekStart:'2026-05-01',farmId:'b',status:'completed',deliveredM3:999}]};
 const delivery=vm.runInNewContext(source.slice(start,end)+';deliveryFor',{state});
 assert.equal(delivery('2026-05-01','a').actualM3,150);
 assert.equal(delivery('2026-05-01','a').status,'partial');
 assert.equal(delivery('2026-05-08','a').actualM3,null);
 state.operations.push({weekStart:'2026-05-01',farmId:'a',actualM3:160,status:'complete'});
 assert.equal(delivery('2026-05-01','a').actualM3,160);
 assert.equal(delivery('2026-05-01','a').status,'complete');
});
test('English covers every existing benefit and monitoring translation key',()=>{
 const c={window:{MekongI18n:{add(){}}}};vm.runInNewContext(read('portal-translations.js'),c);
 const benefit=read('benefit-workflow.js');const dict=vm.runInNewContext('('+benefit.slice(benefit.indexOf('  const dict = ')+15,benefit.indexOf('\n  dict.en =')).trim().replace(/;$/,'')+')');
 assert.deepEqual(Object.keys(dict.ko).filter(k=>!(k in c.window.MekongI18n.benefitEnglish)),[]);
 const frame=Buffer.from(read('index.html').match(/const embedded='([^']+)'/)[1],'base64').toString();
 const monitor=vm.runInNewContext('('+frame.slice(frame.indexOf('    const I18N = ')+17,frame.indexOf('    I18N.en =')).trim().replace(/;$/,'')+')');
 assert.deepEqual(Object.keys(monitor.ko).filter(k=>!(k in c.window.MekongI18n.monitorEnglish)),[]);
});
