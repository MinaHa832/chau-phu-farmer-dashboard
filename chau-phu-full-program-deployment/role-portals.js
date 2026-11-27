(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const RMUS = Array.from({length:18}, (_,i) => `RMU-${String(i+1).padStart(2,'0')}`);
  const CORE_PAGES = new Set(['setup','map','calendar','water','weather','data']);
  const MENUS = {
    farmer: ['home','setup','map','schedule','water','weather','requests','reports','benefits','notices'],
    manager: ['map','schedule','algorithm','watermodel','weather','water','requests','reports','benefits','notices','sources'],
    cooperative: ['map','schedule','requests','watermodel','water','weather','notices','benefits'],
    platform: ['map','schedule','algorithm','watermodel','weather','water','requests','reports','benefits','notices','sources','accounts'],
    operator: ['map','schedule','requests','water','weather','reports','benefits','notices']
  };
  const ICONS = {home:'⌂',notices:'✉',watermodel:'∿',sources:'◉',setup:'◫',map:'◇',schedule:'▦',algorithm:'≋',water:'≈',weather:'☀',requests:'▤',reports:'⚑',benefits:'₫',calendar:'▦',data:'◉',accounts:'♙'};
  let role = 'entry', page = '', farmId = read('mekong-suksuk.farmer-demo-farm.v1'), rmu = read('mekong-suksuk.pump-rmu.v1') || 'RMU-01';
  let weekIndex = 0, coreRouting = false, initialized = false, rendering = false;
  const t = key => window.MekongI18n.t(key);
  const lang = () => window.MekongI18n.language;
  const fmt = value => new Intl.NumberFormat(lang()==='vi'?'vi-VN':lang()==='en'?'en-GB':'ko-KR',{maximumFractionDigits:1}).format(Number(value)||0);
  function read(key) { try { return localStorage.getItem(key)||''; } catch { return ''; } }
  function save(key,value) { try { localStorage.setItem(key,value); } catch {} }
  function farms() { return window.__MEKONG_TEST__?.farms || []; }
  function selectedFarm() { return farms().find(f=>String(f.id)===farmId); }
  const globalRole=()=>['manager','platform'].includes(role);
  const editAll=()=>role==='platform';
  function scopeRmu() { return role==='farmer' ? selectedFarm()?.rmu || '' : ['operator','cooperative'].includes(role) ? rmu : ''; }
  function filterForRole(items, currentRole, selectedId, assignedRmu) {
    if(currentRole==='farmer') return items.filter(f=>String(f.id)===String(selectedId));
    if(['operator','cooperative'].includes(currentRole)) return items.filter(f=>f.rmu===assignedRmu);
    return items;
  }
  function recordAllowed(item, currentRole, selectedId, assignedRmu, farmRmu) {
    if(currentRole==='entry')return false;
    if(['manager','platform'].includes(currentRole))return true;
    if(['operator','cooperative'].includes(currentRole))return item.rmu===assignedRmu;
    const id=item.farmId??item.reporterFarmId;
    return id?String(id)===String(selectedId):!!farmRmu&&item.rmu===farmRmu;
  }
  function scopeFarms(items) {return filterForRole(items,role,farmId,rmu);}
  function allows(item) {return recordAllowed(item,role,farmId,rmu,selectedFarm()?.rmu);}
  function labelFor(id) {
    if(id==='accounts')return window.MekongCloud.t('accounts');
    if(id==='map') return t(globalRole()?'allMap':'myMap');
    if(id==='schedule') return t(globalRole()?'allSchedule':'mySchedule');
    if(id==='reports') return t(role==='farmer'?'reportPage':role==='operator'?'reportUpdates':'reviewReports');
    if(id==='benefits') return t(globalRole()?'allBenefits':'myBenefits');
    if(id==='requests') return t(role==='farmer'?'requestPage':'processRequests');
    return t(id);
  }
  function languageSelect(id) {
    return `<label class="portal-language-label" for="${id}"><span>${t('language')}</span><select id="${id}" data-portal-language aria-label="${t('language')}"><option value="ko"${lang()==='ko'?' selected':''}>한국어</option><option value="vi"${lang()==='vi'?' selected':''}>Tiếng Việt</option><option value="en"${lang()==='en'?' selected':''}>English</option></select></label>`;
  }
  function renderEntry() {
    const entry = $('portalEntry');
    if(!entry) return;
    entry.innerHTML = `<header class="portal-entry-header"><a class="portal-wordmark" href="./">MEKONG <span>WATER LAB</span></a>${languageSelect('portalEntryLanguage')}</header>
      <div class="portal-entry-intro"><span class="portal-kicker">CHÂU PHÚ · AN GIANG</span><h1>${t('entryTitle')}</h1><p>${t('entryDescription')}</p></div>
      <div class="portal-role-grid">${['farmer','cooperative','operator','platform','manager'].map((key,i)=>`<a class="portal-role-card role-${key}" data-enter-role="${key}" href="?role=${key}"><span class="portal-role-icon" aria-hidden="true">${['♧','◫','≈','♙','◇'][i]}</span><h2>${t(key)}</h2><p>${t(key+'Description')}</p><span class="portal-role-features">${t(key+'Features')}</span><span class="portal-enter-label">${t('enter')}</span></a>`).join('')}</div>
      <div class="portal-entry-footer"><div><b>18</b><span>RMU</span><i></i><b>54</b><span>${t('pilotFarms')}</span><i></i><b>3</b><span>${t('farmsPerRmu')}</span></div><p>${t('demoAccess')}</p></div>`;
  }
  function heading(id, title, description) {
    return `<div class="page-heading"><div><div class="eyebrow">MEKONG WATER LAB / ${id.toUpperCase()}</div><h1 data-portal-page-title>${title}</h1><p data-portal-page-description>${description}</p></div><span class="mode-pill" data-portal-scope-label></span></div>`;
  }
  function ensureDom() {
    const entry=document.createElement('section'); entry.id='portalEntry'; entry.className='portal-entry'; entry.setAttribute('aria-label','Choose your workspace'); document.body.prepend(entry);
    const toolbar=document.createElement('div'); toolbar.id='portalToolbar'; toolbar.className='portal-toolbar'; document.querySelector('.top-actions').prepend(toolbar);
    const context=document.createElement('div'); context.id='portalContext'; context.className='portal-context'; $('content').prepend(context);
    for(const id of ['home','schedule','requests','reports','benefits','accounts','notices','watermodel','sources']) {
      const el=document.createElement('section'); el.className='page'; el.id='page-portal-'+id;
      el.innerHTML=heading(id,'','')+`<div id="portal${id[0].toUpperCase()+id.slice(1)}Content"></div>`;
      $('content').append(el);
    }
    $('portalScheduleContent').innerHTML='<div class="card"><div class="portal-schedule-controls" id="portalScheduleControls"></div><div class="metrics metrics-4" id="portalScheduleMetrics"></div><div id="portalScheduleChart" class="portal-schedule-chart"></div><div class="table-wrap" id="portalScheduleTable"></div><p class="table-caption" id="portalScheduleNote"></p></div>';
    // Move the existing interactive nodes, keeping their input values and event listeners.
    const farmerSelect=$('benefitFarmerFarm');
    const farmerCard=farmerSelect.closest('.card');
    const quickRequest=farmerCard.querySelector('.benefit-quick-request');
    const reportCard=$('benefitIncidentForm').closest('.card');
    const operationsCard=$('benefitOpsWorklist').closest('.card');
    const requestsCard=$('benefitRequestQueue').closest('.card');
    const compare=$('benefitForm').closest('details');
    const reviewCard=$('benefitReviewQueue').closest('.card');
    const incidentCard=$('benefitIncidentQueue').closest('.card');
    const policy=$('benefitViewReviewer').lastElementChild;
    quickRequest.classList.add('card','portal-farmer-only');
    $('portalRequestsContent').append(quickRequest,operationsCard,requestsCard);
    operationsCard.classList.add('portal-staff-only');requestsCard.classList.add('portal-staff-only');
    reportCard.classList.add('portal-farmer-only');reportCard.querySelector('details').open=true;
    $('portalReportsContent').append(reportCard,incidentCard);incidentCard.classList.add('portal-staff-only');
    const own=document.createElement('div');own.id='portalOwnReports';own.className='card portal-farmer-only';$('portalReportsContent').append(own);
    farmerCard.classList.add('portal-farmer-only');
    compare.classList.add('portal-staff-only');compare.open=true;
    reviewCard.classList.add('portal-manager-only');policy.classList.add('portal-manager-only');
    const benefitSummary=document.createElement('div');benefitSummary.id='portalBenefitSummary';
    $('portalBenefitsContent').append(benefitSummary,farmerCard,compare,reviewCard,policy);
    farmerSelect.closest('label').classList.add('portal-linked-identity');
    const load=document.createElement('div');load.className='portal-demo-tools';load.id='portalDemoTools';document.querySelector('.sidebar-bottom').before(load);
    const notice=$('benefitNotice'); notice.classList.add('portal-feedback'); $('content').prepend(notice);
    const shell=document.getElementById('app');shell.setAttribute('aria-label','Mekong Water Lab');
    document.querySelector('.platform-mode-switch')?.remove();
    document.querySelectorAll('#nav [data-platform-audience]').forEach(n=>n.removeAttribute('data-platform-audience'));
  }
  function renderNavigation() {
    $('nav').innerHTML=MENUS[role].map(id=>`<a href="?role=${role}&amp;page=${id}" class="nav-link${page===id?' active':''}" data-portal-page="${id}"${page===id?' aria-current="page"':''}><span class="nav-icon" aria-hidden="true">${ICONS[id]}</span><span>${esc(labelFor(id))}</span></a>`).join('')+(editAll()?`<details class="portal-original-tools"><summary>${t('existingTools')}</summary>${['setup','calendar','data'].map(id=>`<a href="?role=${role}&amp;page=${id}" class="nav-link${page===id?' active':''}" data-portal-page="${id}"><span class="nav-icon">${ICONS[id]}</span><span>${labelFor(id)}</span></a>`).join('')}</details>`:'');
    $('portalDemoTools').innerHTML=editAll()?`<a class="portal-demo-button" href="?role=platform&amp;page=algorithm&amp;scenario=demo" data-demo-scenario>${t('startDemo')}</a><small>${t('demoScenarioNote')}</small>`:'';
  }
  function ensureSelection() {
    if(!farms().some(f=>String(f.id)===farmId)) farmId=String(farms()[0]?.id || '');
    if(!RMUS.includes(rmu)) rmu='RMU-01';
  }
  function renderContext() {
    ensureSelection();
    const scope=globalRole()?t('allScope'):scopeRmu()||t('unassigned');
    let control='';
    if(role==='farmer') control=`<label for="portalFarmSelect">${t('selectedFarm')}<select id="portalFarmSelect">${farms().map(f=>`<option value="${esc(f.id)}"${String(f.id)===farmId?' selected':''}>${esc(window.MekongI18n.displayName(f.name))} · ${esc(f.rmu||t('unassigned'))}</option>`).join('')}</select></label>`;
    if(['operator','cooperative'].includes(role)) control=`<label for="portalRmuSelect">${t('assignedRmu')}<select id="portalRmuSelect">${RMUS.map(id=>`<option${id===rmu?' selected':''}>${id}</option>`).join('')}</select></label>`;
    $('portalContext').innerHTML=`<div class="portal-context-title"><span class="portal-role-badge">${t(role)}</span><strong>${esc(scope)}</strong><small>${scopeFarms(farms()).length} ${t('farmsUnit')}</small></div>${control}<span class="portal-demo-badge">${window.MekongCloud?.enabled?window.MekongCloud.t('lockedRole'):t('demoWorkspace')}</span>`;
    $('portalToolbar').innerHTML=`${languageSelect('portalAppLanguage')}<button type="button" class="btn btn-secondary btn-small" data-switch-role>${window.MekongCloud?.enabled?window.MekongCloud.t('signOut'):t('changeRole')}</button>`;
    if(window.MekongCloud?.enabled){for(const id of ['portalFarmSelect','portalRmuSelect'])if($(id))$(id).disabled=true;}
    document.querySelector('.workspace-title').textContent=t(role);
    document.querySelectorAll('[data-portal-scope-label]').forEach(n=>n.textContent=scope);
  }
  function applyScope() {
    const staff=role!=='farmer', manager=globalRole();
    document.body.dataset.portalRole=role;
    document.body.dataset.platformMode=role==='farmer'?'farmer':'operator';
    const scoped=scopeRmu();
    for(const id of ['benefitOpsRmu','benefitRmu','benefitIssueRmu']) {
      const select=$(id); if(!select)continue;
      if(!manager&&scoped) select.value=scoped;
      select.disabled=!manager;
      [...select.options].forEach(o=>o.hidden=!manager&&o.value!==scoped);
    }
    $('benefitFarmerFarm').value=farmId;
    $('benefitFarmerFarm').disabled=role==='farmer';
    for(const id of ['mapFarmFilter','calendarZone']) {
      const select=$(id);if(select){select.disabled=!manager;if(!manager&&scoped&&select.value!==scoped){select.value=scoped;select.dispatchEvent(new Event('change',{bubbles:true}));}}
    }
    if(window.MekongCloud?.enabled){$('rmu').disabled=role==='farmer';}
    const allowedButtons=['exportBackup','restoreBackup','seedDemos','clearFarms','seedDemosCalendar','mapAddFarm','newFarmInZone'];
    allowedButtons.forEach(id=>{const node=$(id);if(node){const target=node.type==='file'?node.closest('label'):node;target.dataset.portalBulk='true';target.hidden=!editAll();}});
    $('farmSearch').hidden=!editAll();
    document.querySelectorAll('[data-map-farm-action="edit"]').forEach(n=>n.hidden=!['farmer','platform','cooperative'].includes(role));
    document.querySelectorAll('#rmuBoundaryOverlay [data-zone-id]').forEach(n=>{
      const outside=!manager&&scoped&&n.dataset.zoneId!==scoped;
      n.classList.toggle('portal-outside-rmu',!!outside);n.setAttribute('tabindex',outside?'-1':'0');
    });
    if(!staff) $('benefitRequestSubmit').disabled=!farmId;
    document.querySelectorAll('#farmDirectory [data-action="delete"]').forEach(n=>n.hidden=!editAll());
    $('exportBackup').hidden=!editAll();
    if(window.MekongCloud?.enabled)for(const id of ['clearFarms','restoreBackup','importWeeklySupply','benefitLoadDemo']){const n=$(id);if(n)n.disabled=true;}
    if(!globalRole()) $('balanceAllocationPanel').hidden=true;
    window.MekongWorkspace?.applyPermissions(role);
  }
  function afterBenefitRender() {
    if(!initialized || role==='entry') return;
    applyScope();
    renderOwnReports();renderBenefitSummary();
  }
  function coreNavigate(id) {coreRouting=true;try{window.__MEKONG_TEST__.navigate(id);}finally{coreRouting=false;}}
  function route(next) {
    if(coreRouting||!initialized||role==='entry')return false;
    const mapped=next==='farmer'?'schedule':next==='benefit'?'benefits':next==='calendar'&&!globalRole()?'schedule':next;
    navigate(mapped);return true;
  }
  function navigate(next,{focus=true}={}) {
    if(role==='entry')return;
    const allowed=[...MENUS[role],...(editAll()?['setup','calendar','data']:[])];
    if(!allowed.includes(next))next=MENUS[role][0];
    page=next; document.body.dataset.portalPage=page;
    if(page==='algorithm'||CORE_PAGES.has(page)) {
      coreNavigate(page==='algorithm'?'calendar':page);
      const panel=$('balanceAllocationPanel');panel.hidden=false;
      if(page==='algorithm') panel.scrollIntoView({block:'start',behavior:'instant'});
      if(page==='map') {
        window.__MEKONG_INTEGRATED__?.syncFarms(farms());
        if(scopeRmu())window.__MEKONG_INTEGRATED__?.selectZone?.(scopeRmu());
      }
    } else {
      document.querySelectorAll('.page').forEach(n=>n.classList.toggle('active',n.id==='page-portal-'+page));
      const title=$('page-portal-'+page).querySelector('[data-portal-page-title]');title.textContent=labelFor(page);
      $('page-portal-'+page).querySelector('[data-portal-page-description]').textContent=page==='accounts'?window.MekongCloud.t('accountsDescription'):t(page+'Description');
      if(page==='schedule')renderSchedule();
      window.MekongWorkspace?.render(page);
      window.MekongBenefit.setRole(role==='farmer'?'farmer':role==='manager'?'reviewer':'operator');
      window.MekongBenefit.render();
      if(page==='requests'&&role==='farmer')prefillRequest();
    }
    $('breadcrumb').textContent=labelFor(page);renderNavigation();renderContext();applyScope();
    if(focus&&page!=='algorithm')window.scrollTo({top:0,behavior:'instant'});
    window.MekongI18n.translate();
  }
  function enter(nextRole) {
    if(window.MekongCloud?.enabled){if(!window.MekongCloud.approved){window.MekongCloud.showGate();return;}nextRole=window.MekongCloud.profile.role;}
    if(!MENUS[nextRole])return;
    role=nextRole;if(window.MekongCloud?.enabled){farmId=String(window.MekongCloud.profile.farmId||'');rmu=window.MekongCloud.profile.rmu||rmu;}ensureSelection();
    if(globalRole()) for(const id of ['mapFarmFilter','calendarZone','benefitOpsRmu']) {const select=$(id);select.disabled=false;select.value='all';select.dispatchEvent(new Event('change',{bubbles:true}));}
    save('mekong-suksuk.portal-role.v2',role);
    document.body.dataset.portalRole=role;
    $('portalEntry').hidden=true;
    // Re-render display aggregates with the selected scope, leaving global calculations intact.
    coreRouting=true;try{window.__MEKONG_TEST__.refresh();}finally{coreRouting=false;}
    window.MekongBenefit.setLanguage(lang());
    navigate(MENUS[role][0]);
    $('portalContext').setAttribute('tabindex','-1');$('portalContext').focus({preventScroll:true});
  }
  function showEntry() {
    if(window.MekongCloud?.enabled){window.MekongCloud.showGate();return;}
    role='entry';page='';history.replaceState(null,'',location.pathname);document.body.dataset.portalRole='entry';$('portalEntry').hidden=false;renderEntry();
    requestAnimationFrame(()=>$('portalEntry').querySelector('[data-enter-role]')?.focus());
  }
  function datePlus(date,days){if(!date)return '';const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
  function scheduleRows() {
    const summary=window.__MEKONG_TEST__?.summary;
    const plan=window.__MEKONG_ALLOCATION_PLAN__;
    const week=plan?.weeks?.[weekIndex];
    const state=window.MekongBenefit.getState();
    return scopeFarms(farms()).map(farm=>{
      const demand=summary?.sums?.weeks?.find(x=>String(x.farm.id)===String(farm.id))?.values?.[weekIndex];
      const allocated=week?.rows?.find(x=>String(x.farmId)===String(farm.id));
      const operation=state.operations.find(x=>x.weekStart===week?.startDate&&String(x.farmId)===String(farm.id));
      const request=state.requests.filter(x=>String(x.farmId)===String(farm.id)&&x.weekStart===week?.startDate).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
      const known=demand&&['valid','dry'].includes(demand.status)&&Number.isFinite(demand.volume);
      return {farm,requestM3:known?demand.volume:null,plannedM3:allocated?allocated.plannedM3:known&&demand.volume===0?0:null,actualM3:window.MekongBenefit.deliveryFor(week?.startDate,String(farm.id)).actualM3,status:window.MekongBenefit.deliveryFor(week?.startDate,String(farm.id)).status,request,week,demand};
    });
  }
  function renderSchedule() {
    if(!initialized||role==='entry')return;
    const weeks=window.__MEKONG_ALLOCATION_PLAN__?.weeks||[];
    weekIndex=Math.max(0,Math.min(weekIndex,Math.max(0,weeks.length-1)));
    $('portalScheduleControls').innerHTML=`<label for="portalScheduleWeek">${t('week')}<select id="portalScheduleWeek">${weeks.map((w,i)=>`<option value="${i}"${i===weekIndex?' selected':''}>${t('week')} ${i+1} · ${esc(w.startDate)}</option>`).join('')}</select></label><span>${t('weeklySchedule')}</span>`;
    const rows=scheduleRows();
    const total=key=>rows.reduce((n,row)=>n+(Number(row[key])||0),0);
    const metrics=[['farmsCount',rows.length],['plannedIntake',fmt(total('requestM3'))+' m³'],['allocated',rows.some(x=>x.plannedM3!==null)?fmt(total('plannedM3'))+' m³':t('pending')],['delivered',rows.some(x=>x.actualM3!==null)?fmt(total('actualM3'))+' m³':t('notRecorded')]];
    $('portalScheduleMetrics').innerHTML=metrics.map(([key,value])=>`<div class="metric"><span class="label">${t(key)}</span><strong>${value}</strong></div>`).join('');
    const max=Math.max(1,total('requestM3'),total('plannedM3'),total('actualM3'));
    $('portalScheduleChart').innerHTML=[['plannedIntake','requestM3'],['allocated','plannedM3'],['delivered','actualM3']].map(([key,field])=>`<div><span>${t(key)}</span><div class="portal-volume-track"><i class="${field}" style="width:${total(field)/max*100}%"></i></div><b>${rows.some(x=>x[field]!==null)?fmt(total(field))+' m³':'—'}</b></div>`).join('');
    const date=weeks[weekIndex]?.startDate;
    $('portalScheduleTable').innerHTML=`<table class="portal-schedule-table"><thead><tr>${['farm','rmu','schedulePeriod','plannedIntake','allocated','delivered','processing','action'].map(key=>`<th>${t(key)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr data-portal-schedule-farm="${esc(row.farm.id)}"><td><strong>${esc(window.MekongI18n.displayName(row.farm.name))}</strong><small>${t(row.farm.crop)} · ${fmt(row.farm.area)} ha</small></td><td>${esc(row.farm.rmu||t('unassigned'))}</td><td>${esc(date||'—')}<small>${esc(datePlus(date,6))}</small></td><td>${row.requestM3===null?t('pending'):fmt(row.requestM3)}</td><td>${row.plannedM3===null?t('pending'):fmt(row.plannedM3)}</td><td>${row.actualM3===null?t('notRecorded'):fmt(row.actualM3)}</td><td><span class="portal-status status-${row.status}">${t('status_'+row.status)}</span></td><td><button type="button" class="btn btn-secondary btn-small" data-schedule-request="${esc(row.farm.id)}">${t(role==='farmer'?'request':['operator','platform'].includes(role)?'recordDelivery':'processing')}</button></td></tr>`).join(''):`<tr><td colspan="8">${t('noFarms')}</td></tr>`}</tbody></table>`;
    $('portalScheduleNote').textContent=t('scheduleNote')+(window.MekongWeeklySupply?.isDemoMode()?' '+t('syntheticSupply'):'');
  }
  function prefillRequest(force=false) {
    const week=$('benefitRequestWeek');week.value=String(weekIndex+1);
    const demand=scheduleRows().find(x=>String(x.farm.id)===farmId)?.requestM3;
    const volume=$('benefitRequestVolume');
    if(force||!volume.value)volume.value=demand>0?String(Math.round(demand*10)/10):'';
    let hint=$('portalRequestHint');
    if(!hint){hint=document.createElement('p');hint.id='portalRequestHint';hint.className='portal-hint';$('benefitRequestForm').prepend(hint);}
    hint.textContent=demand>0?t('requestPrefill'):t('zeroDemand');
  }
  function renderOwnReports() {
    const list=$('portalOwnReports');if(!list)return;
    const reports=window.MekongBenefit.getState().incidents.filter(x=>x.reporterFarmId&&String(x.reporterFarmId)===farmId);
    list.innerHTML=`<h2>${t('myReports')}</h2>${reports.length?reports.map(x=>`<article class="portal-report-item"><div><strong>${esc(x.id)}</strong><span class="portal-status">${t('report_'+x.status)}</span></div><small>${esc(x.rmu)} · ${esc(x.createdAt.slice(0,10))}</small><p data-user-content>${esc(x.details)}</p></article>`).join(''):`<p>${t('noReports')}</p>`}`;
  }
  function renderBenefitSummary() {
    if(!$('portalBenefitSummary')||!window.MekongBenefit)return;
    const state=window.MekongBenefit.getState();const records=state.records.filter(allows);
    const verified=records.filter(x=>x.status==='verified'&&!x.demo);
    const water=verified.reduce((n,x)=>n+Math.max(0,Number(x.baselineWaterM3)-Number(x.actualWaterM3)),0);
    $('portalBenefitSummary').innerHTML=`<div class="metrics metrics-3"><div class="metric"><span class="label">${t('comparisonRecords')}</span><strong>${records.length}</strong></div><div class="metric"><span class="label">${t('verifiedRecords')}</span><strong>${verified.length}</strong></div><div class="metric"><span class="label">${t('verifiedWater')}</span><strong>${verified.length?fmt(water)+' m³':'—'}</strong></div></div><p class="portal-hint">${t(role==='farmer'?'sharedBenefitNote':role==='operator'?'pumpBenefitNote':'benefitNote')}</p>`;
  }
  function refreshDisplays() {
    if(!initialized)return;
    renderEntry();
    if(role==='entry')return;
    ensureSelection();renderContext();renderNavigation();
    if(page==='schedule')renderSchedule();
      window.MekongWorkspace?.render(page);
    if(page==='requests'&&role==='farmer')prefillRequest();
    afterBenefitRender();
    if(page&&!CORE_PAGES.has(page)&&page!=='algorithm'){
      $('page-portal-'+page).querySelector('[data-portal-page-title]').textContent=labelFor(page);
      $('page-portal-'+page).querySelector('[data-portal-page-description]').textContent=page==='accounts'?window.MekongCloud.t('accountsDescription'):t(page+'Description');
    }
    $('breadcrumb').textContent=labelFor(page);
  }
  function changeScope() {
    if(window.MekongCloud?.enabled){farmId=String(window.MekongCloud.profile?.farmId||'');rmu=window.MekongCloud.profile?.rmu||'';refreshDisplays();return;}
    save('mekong-suksuk.farmer-demo-farm.v1',farmId);save('mekong-suksuk.pump-rmu.v1',rmu);
    const oldPage=page;
    coreRouting=true;try{window.__MEKONG_TEST__.refresh();}finally{coreRouting=false;}
    window.MekongBenefit.render();navigate(oldPage,{focus:false});
  }
  async function init() {
    if(initialized)return;
    ensureDom();initialized=true;
    ensureSelection();renderEntry();
    document.addEventListener('click',event=>{
      const target=event.target.closest('button,[data-enter-role],[data-portal-page],[data-demo-scenario],[data-zone-id]');if(!target)return;
      if(target.id==='cancelEdit'&&window.MekongCloud?.enabled&&role==='farmer'){event.preventDefault();event.stopImmediatePropagation();window.__MEKONG_TEST__.editFarm(farmId);return;}
      if(target.dataset.enterRole){event.preventDefault();enter(target.dataset.enterRole);return;}
      if(target.hasAttribute('data-switch-role')){if(window.MekongCloud?.enabled)window.MekongCloud.logout();else showEntry();return;}
      if(target.dataset.portalPage){event.preventDefault();event.stopImmediatePropagation();navigate(target.dataset.portalPage);return;}
      if(target.hasAttribute('data-demo-scenario')){event.preventDefault();window.__MEKONG_TEST__.loadAllocationDemo(true);navigate('algorithm');return;}
      if(target.dataset.scheduleRequest){
        if(role==='farmer')farmId=target.dataset.scheduleRequest;
        $('benefitOpsWeek').value=String(weekIndex+1);
        navigate('requests');if(role==='farmer')prefillRequest(true);
        else document.querySelector(`[data-operation-card$="|${CSS.escape(target.dataset.scheduleRequest)}"]`)?.scrollIntoView({block:'center'});
        return;
      }
      if(!globalRole()&&target.dataset.zoneId&&target.dataset.zoneId!==scopeRmu()){event.preventDefault();event.stopImmediatePropagation();}
    },true);
    document.addEventListener('change',event=>{
      const id=event.target.id;
      if(event.target.hasAttribute('data-portal-language'))window.MekongI18n.setLanguage(event.target.value);
      if(id==='portalFarmSelect'){farmId=event.target.value;changeScope();}
      if(id==='portalRmuSelect'){rmu=event.target.value;changeScope();}
      if(id==='portalScheduleWeek'){weekIndex=Number(event.target.value);renderSchedule();}
      if(id==='benefitRequestWeek'){weekIndex=Math.max(0,Number(event.target.value)-1);prefillRequest(true);}
    });
    window.addEventListener('mekong:allocation-updated',()=>{if(rendering)return;rendering=true;try{refreshDisplays();}finally{rendering=false;}});
    window.addEventListener('mekong:records-updated',refreshDisplays);
    window.addEventListener('mekong:language-changed',()=>{window.MekongBenefit.setLanguage(lang());refreshDisplays();});
    window.addEventListener('storage',event=>{if(event.key?.startsWith('mekong-suksuk.'))refreshDisplays();});
    $('integratedDashboardFrame')?.addEventListener('load',()=>window.MekongI18n.syncFrame());
    window.MekongI18n.start();
    if(await window.MekongCloud?.init())return;
    if(!farms().length) {
      // An empty browser gets the existing 54-farm demo. Existing farms/supply are never replaced.
      if(!window.MekongWeeklySupply?.records().length) window.__MEKONG_TEST__.loadAllocationDemo();
      else window.__MEKONG_TEST__.seedDemoFarms(false);
    }
    const params=new URLSearchParams(location.search),requested=window.MekongWorkspace?.normalizeRole(params.get('role'),params.get('actor'))||params.get('role');if(MENUS[requested]){enter(requested);if(requested==='platform'&&params.get('scenario')==='demo')window.__MEKONG_TEST__.loadAllocationDemo(true);if(params.get('page'))navigate(params.get('page'));}else showEntry();
  }
  window.MekongPortal={menus:MENUS,filterForRole,recordAllowed,init,route,navigate,scopeFarms,allows,afterBenefitRender,refresh:refreshDisplays,get role(){return role;},acceptSession(p){farmId=String(p.farmId||'');rmu=p.rmu||rmu;if(role!==p.role){enter(p.role);const requested=new URLSearchParams(location.search).get('page');if(requested)navigate(requested);if(p.role==='farmer'&&farms()[0]){window.__MEKONG_TEST__.editFarm(farms()[0].id);navigate(requested||'home');}}else refreshDisplays();},lockSession(){role='entry';page='';document.body.dataset.portalRole='entry';},selectFarm(id){if(window.MekongCloud?.enabled&&String(id)!==String(window.MekongCloud.profile?.farmId))return;farmId=String(id);save('mekong-suksuk.farmer-demo-farm.v1',farmId);},get farmId(){return farmId;},get rmu(){return scopeRmu();}};
})();
