const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const section=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b,src.indexOf(a)+a.length));
function engine({rain=0,et0=5,kc=1.2,missing=false}={}){
 const context={dataset:{meta:{version:'test'}},climateMode:'csv',apiVersion:1,calendarStart:'2026-05-01',WEEK_CACHE:new Map(),
 monthLast:()=> '2026-05-31',weatherFor:d=>missing&&d==='2026-05-30'?null:{rain,et0},goodClimate:c=>!!c,
 stageFor:()=>({status:'active',label:'test stage',kc}),daysBetween:(d,s)=>Math.round((Date.parse(d)-Date.parse(s))/86400000),
 addDays:(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10),weekStart:()=> '2026-05-01',
 efficiency:()=>.6,conveyance:()=>.8,weatherStatus:()=> 'TEST_CLIMATE',todayVietnam:()=> '2026-05-01'};
 return vm.runInNewContext(section('  function dailyProfile(', '  const WEEK_CACHE=')+section('  function computeWeek(', '  // A full period')+';({computeWeek,effectiveRainByMonth});',context);
}
const farm={id:'f',start:'2026-04-01',area:2,crop:'rice',awd:false};
test('existing demand calculation converts millimetres × hectares once and deducts effective rain once',()=>{
 const dry=engine().computeWeek(farm,0);assert.ok(Math.abs(dry.volume-7*5*1.2*10*2/(.6*.8))<1e-8);
 const wetEngine=engine({rain:5}),wet=wetEngine.computeWeek(farm,0),pe=wetEngine.effectiveRainByMonth(farm,'2026-05',{});
 const expected=7*Math.max(0,6-pe/31)*10*2/(.6*.8);
 assert.ok(Math.abs(wet.volume-expected)<1e-8);assert.ok(wet.volume<dry.volume);assert.ok(pe>=0&&pe<=155);
 assert.ok(Math.abs(wet.grossPlannedM3-wet.effectiveRainCreditM3-wet.volume)<1e-8);
});
test('incomplete monthly rain holds the weekly calculation; missing inputs are not zero supply',()=>{
 const result=engine({rain:5,missing:true}).computeWeek(farm,0);assert.equal(result.volume,null);assert.equal(result.status,'partial');
});
test('AWD demonstration dry days preserve the existing zero-intake convention only within its age window',()=>{
 const result=engine().computeWeek({...farm,start:'2026-04-03',awd:true},0);assert.equal(result.dryDays,7);assert.equal(result.status,'dry');assert.equal(result.volume,0);
});
