(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const MODE_KEY = 'mekong-suksuk.platform-mode.v1';
  const FARM_KEY = 'mekong-suksuk.farmer-demo-farm.v1';
  const WEEK_KEY = 'mekong-suksuk.farmer-demo-week.v1';
  const fmt = (value) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(Number(value) || 0);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const cropNames = { rice: '벼', durian: '두리안', jackfruit: '잭프루트', mango: '망고' };
  let activeMode = 'operator';

  function ensureDom() {
    const nav = $('nav');
    const content = $('content');
    if (!nav || !content || $('page-farmer')) return;

    ['setup', 'map', 'calendar', 'data'].forEach((page) => {
      const button = nav.querySelector(`[data-page="${page}"]`);
      if (button) button.dataset.platformAudience = 'operator';
    });
    const waterNav = nav.querySelector('[data-page="water"]');
    const weatherNav = nav.querySelector('[data-page="weather"]');
    if (waterNav?.querySelector('.nav-icon')?.nextElementSibling) waterNav.querySelector('.nav-icon').nextElementSibling.textContent = '수자원';
    if (weatherNav?.querySelector('.nav-icon')?.nextElementSibling) weatherNav.querySelector('.nav-icon').nextElementSibling.textContent = '기상';
    const exportButton = $('exportBackup');
    if (exportButton) exportButton.dataset.platformAudience = 'operator';
    ensureReferenceMapLink();

    const calendarNav = nav.querySelector('[data-page="calendar"]');
    const farmerNav = document.createElement('button');
    farmerNav.className = 'nav-link'; farmerNav.type = 'button'; farmerNav.dataset.page = 'farmer'; farmerNav.dataset.platformAudience = 'farmer';
    farmerNav.innerHTML = '<span class="nav-icon">♧</span><span>내 주간 물 계획</span><span class="nav-number">01</span>';
    calendarNav?.after(farmerNav);

    const topActions = document.querySelector('.top-actions');
    if (topActions && !topActions.querySelector('.platform-mode-switch')) {
      const switcher = document.createElement('div');
      switcher.className = 'platform-mode-switch'; switcher.setAttribute('role', 'group'); switcher.setAttribute('aria-label', '플랫폼 화면 전환');
      switcher.innerHTML = '<span>화면</span><button type="button" data-platform-mode="operator" aria-pressed="true">운영자</button><button type="button" data-platform-mode="farmer" aria-pressed="false">농민</button>';
      topActions.querySelector('.top-scope')?.before(switcher) || topActions.prepend(switcher);
    }

    const farmerPage = document.createElement('section');
    farmerPage.className = 'page'; farmerPage.id = 'page-farmer'; farmerPage.setAttribute('aria-labelledby', 'farmerPageTitle');
    farmerPage.innerHTML = '<div class="page-heading"><div><div class="eyebrow">FARMER VIEW <span>/ WEEKLY PLAN</span></div><h1 id="farmerPageTitle">내 주간 물 계획<span class="title-period">.</span></h1><p>선택한 농가의 주간 물 필요량과 배분 계획, 강우 반영 내역을 확인합니다.</p></div><span class="mode-pill">농민 화면 · 시연용 농가 선택</span></div><div class="farmer-view-note"><strong>농가를 선택해 확인하세요.</strong><span>현재는 시연용 화면 전환이며 로그인과 농가별 접근 권한은 연결되지 않았습니다. 요청은 같은 브라우저의 운영자 화면에 저장됩니다.</span></div><div class="farmer-dashboard-controls"><label for="farmerFarmSelect">농가 선택<select id="farmerFarmSelect"></select></label><label for="farmerWeekSelect">확인 주차<select id="farmerWeekSelect"></select></label><button class="btn btn-secondary btn-small" id="farmerOpenRequests" type="button">급수 요청·기록 보기 ↗</button></div><div class="metrics metrics-4 farmer-summary-metrics" id="farmerSummaryMetrics" aria-live="polite"></div><div class="card farmer-plan-card"><div class="card-top"><div><span class="section-kicker">WEEKLY WATER PLAN</span><h2 id="farmerPlanTitle">주간 물 계획</h2><p class="muted" id="farmerPlanStatus">등록된 농가 자료를 불러오는 중입니다.</p></div><span class="small-label" id="farmerPlanRmu">RMU —</span></div><div class="farmer-weeks-chart" id="farmerWeeksChart" aria-label="8주 계획 취수량과 배분량"></div><p class="table-caption">계획 취수량은 생육·기후·유효강우 계산값입니다. 배분량은 현재 공급자료를 반영한 시범 계획으로, 실제 급수량과 다를 수 있습니다.</p></div><div class="farmer-view-actions"><button class="btn btn-primary" id="farmerRequestWater" type="button">급수 요청 등록 ↗</button><button class="btn btn-secondary" id="farmerViewWeather" type="button">기상 확인 ↗</button><button class="btn btn-secondary" id="farmerViewWater" type="button">수자원 확인 ↗</button></div>';
    content.prepend(farmerPage);

    const monitorPage = $('page-monitor');
    const frameShell = monitorPage?.querySelector('.monitor-frame-shell');
    if (monitorPage && frameShell && !$('waterResourcesOverview')) {
      const overview = document.createElement('div'); overview.className = 'water-resources-overview'; overview.id = 'waterResourcesOverview';
      overview.innerHTML = '<div class="card water-region-card"><div class="card-top"><div><span class="section-kicker">PILOT AREA / ADMINISTRATIVE REFERENCE</span><h2>시범지역 행정 경계</h2><p class="muted">Châu Phú · An Giang 시범지역 참고 지도와 사진 기준 18개 RMU</p></div><span class="small-label">2025 지도 참고</span></div><img class="water-region-map" src="./data/chau-phu-rmu18-basemap.svg" alt="Châu Phú 시범지역 행정 경계 및 사진 기준 18개 RMU 지도"><p class="table-caption">행정 경계 참고도이며 공식 측량·급수 관할 경계가 아닙니다. RMU 경계는 사용자 사진을 옮긴 추정선입니다.</p></div><div class="card water-history-card"><div class="card-top"><div><span class="section-kicker">YEARLY OBSERVATIONS</span><h2>관측소별 연도 수위·강우</h2><p class="muted">연결된 MRC 관측 이력을 월별 평균으로 요약합니다.</p></div><span class="small-label" id="waterHistorySource">관측 자료 조회 전</span></div><div class="water-history-controls"><label for="waterHistoryStation">관측소<select id="waterHistoryStation"><option value="039801">Châu Đốc</option><option value="019803">Tân Châu</option><option value="980601">Vàm Nao</option></select></label><label for="waterHistoryYear">연도<select id="waterHistoryYear"><option value="">자료 불러오는 중</option></select></label><label for="waterHistoryMetric">항목<select id="waterHistoryMetric"><option value="waterLevel_m">월 평균 수위 (m)</option><option value="rainFall24H_mm">월 평균 24시간 강우 (mm)</option></select></label><button class="btn btn-secondary btn-small" id="waterHistoryRefresh" type="button">관측자료 새로고침 ↻</button></div><div class="water-history-status" id="waterHistoryStatus" role="status" aria-live="polite">연도별 관측자료를 불러옵니다.</div><div class="water-history-chart" id="waterHistoryChart" aria-label="월별 평균 관측값"></div></div>';
      frameShell.before(overview);
    }

    const oldSetMode = window.mekongSetDashboardMode;
    window.mekongSetDashboardMode = (mode) => {
      document.body.dataset.monitorMode = mode === 'weather' ? 'weather' : 'water';
      oldSetMode?.(mode);
      updateMonitorHeading(mode);
      window.MekongWaterHistory?.load();
    };
    $('integratedDashboardFrame')?.addEventListener('load', () => updateMonitorHeading(document.body.dataset.monitorMode || 'water'));
    const waterScript = document.createElement('script'); waterScript.src = './water-history.js'; document.body.append(waterScript);

    nav.addEventListener('click', (event) => {
      const button = event.target.closest('[data-page]');
      if (!button) return;
      if (button.dataset.page === 'farmer') {
        event.preventDefault(); event.stopImmediatePropagation(); openFarmerPage(); return;
      }
      if (activeMode === 'farmer' && button.dataset.platformAudience === 'operator') {
        event.preventDefault(); event.stopImmediatePropagation(); return;
      }
      if (button.dataset.page === 'benefit' && activeMode === 'farmer') window.MekongBenefit?.setRole?.('farmer');
    }, true);
  }

  function ensureReferenceMapLink() {
    const sourceLine = $('atlasSourceLink')?.parentElement;
    if (!sourceLine || sourceLine.querySelector('[data-original-reference-map]')) return;
    const link = document.createElement('a');
    link.href = './data/chau-phu-admin-reference.jpg';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.dataset.originalReferenceMap = 'true';
    link.textContent = '원본 Châu Phú 참고지도 확대 ↗';
    link.setAttribute('aria-label', 'Châu Phú 행정 경계·도로·수로 원본 참고지도 확대');
    sourceLine.append(link);
  }

  function updateMonitorHeading(mode) {
    const weather = mode === 'weather';
    const heading = $('monitorHeading'), description = $('monitorDescription'), pill = $('monitorModePill');
    if (heading) heading.textContent = weather ? '기상' : '수자원';
    if (description) description.textContent = weather
      ? '강우량과 7일 기상예보, 과거 날씨 추정, 30년 월평균 기후자료를 확인합니다.'
      : '시범지역 행정 경계와 관측소 위치, MRC 수위·강우 및 연도별 추이를 확인합니다.';
    if (pill) pill.textContent = weather ? '● 예보 · 과거 기상 추정' : '● 관측 · 자료 지연 구분';
  }

  function model() {
    const api = window.__MEKONG_TEST__;
    if (!api) return { farms: [], weeks: [], plan: null };
    const summary = api.summary || {};
    return { farms: api.farms || [], weeks: summary.sums?.weeks || [], plan: window.__MEKONG_ALLOCATION_PLAN__ || null };
  }

  function makeDateLabel(date, index) {
    if (!date) return `${index + 1}주차`;
    const parsed = new Date(`${date}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? `${index + 1}주차 · ${date}` : `${index + 1}주차 · ${parsed.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`;
  }

  function currentSelection(farms, weeks) {
    const farmSelect = $('farmerFarmSelect');
    const weekSelect = $('farmerWeekSelect');
    if (!farmSelect || !weekSelect) return null;
    const previousFarm = farmSelect.value || safeGet(FARM_KEY);
    const options = farms.map((farm) => ({
      id: String(farm.id),
      name: `${farm.name || farm.id} · ${farm.rmu || 'RMU 재배정 대기'} · ${cropNames[farm.crop] || farm.crop || '작물 미입력'}`,
      farm
    }));
    farmSelect.replaceChildren(...options.map(({ id, name }) => {
      const option = document.createElement('option'); option.value = id; option.textContent = name; return option;
    }));
    const chosenFarm = options.find((option) => option.id === previousFarm) || options.find((option) => option.farm.origin === 'DEMO_ASSUMPTION') || options[0];
    if (chosenFarm) farmSelect.value = chosenFarm.id;

    const planWeeks = Array.isArray(weeks) ? weeks : [];
    const previousWeek = Number(weekSelect.value || safeGet(WEEK_KEY) || 0);
    const start = planWeeks[0]?.startDate;
    const weekOptions = planWeeks.map((week, index) => ({ index, date: week.startDate || addDays(start, index) }));
    weekSelect.replaceChildren(...weekOptions.map(({ index, date }) => {
      const option = document.createElement('option'); option.value = String(index); option.textContent = makeDateLabel(date, index); return option;
    }));
    const safeWeek = Math.min(Math.max(previousWeek, 0), Math.max(0, weekOptions.length - 1));
    if (weekOptions.length) weekSelect.value = String(safeWeek);
    return { farm: chosenFarm?.farm || null, weekIndex: safeWeek, date: weekOptions[safeWeek]?.date || null };
  }

  function addDays(date, offset) {
    if (!date) return null;
    const value = new Date(`${date}T00:00:00`); value.setDate(value.getDate() + Number(offset || 0));
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }

  function safeGet(key) {
    try { return localStorage.getItem(key) || ''; } catch (_) { return ''; }
  }

  function setText(id, value) { const node = $(id); if (node) node.textContent = value; }

  function renderFarmer() {
    const root = $('page-farmer');
    if (!root) return;
    const { farms, weeks, plan } = model();
    const selected = currentSelection(farms, plan?.weeks);
    if (!farms.length || !selected?.farm) {
      $('farmerSummaryMetrics').innerHTML = '<div class="empty-state">등록된 농가가 없습니다. 운영자 화면에서 농가를 등록하거나 시범 농가를 불러오세요.</div>';
      $('farmerWeeksChart').innerHTML = '<div class="empty-state">농가 자료가 준비되면 주간 계획이 여기에 표시됩니다.</div>';
      setText('farmerPlanTitle', '농가 자료 없음'); setText('farmerPlanStatus', '농가 정보를 등록하거나 시범 농가를 불러오면 계획을 확인할 수 있습니다.');
      setText('farmerPlanRmu', 'RMU —');
      return;
    }
    const farm = selected.farm;
    const farmWeeks = weeks.find((item) => String(item.farm.id) === String(farm.id));
    const value = farmWeeks?.values?.[selected.weekIndex] || null;
    const allocationWeek = plan?.weeks?.[selected.weekIndex] || null;
    const allocation = allocationWeek?.rows?.find((row) => String(row.farmId) === String(farm.id)) || null;
    const demandKnown = value && (value.status === 'valid' || value.status === 'dry') && Number.isFinite(Number(value.volume));
    const demandText = demandKnown ? `${fmt(value.volume)} m³` : '산정 대기';
    const allocationText = allocation ? `${fmt(allocation.plannedM3)} m³` : '배분 대기';
    const rainCredit = Number(value?.effectiveRainCreditM3);
    const rainLabel = Number.isFinite(rainCredit) ? `${fmt(rainCredit)} m³` : '자료 없음';
    const stage = value?.stage || '생육 자료 확인 대기';
    const available = Number.isFinite(Number(value?.rainfall)) ? `${fmt(value.rainfall)} mm` : '자료 없음';
    let status = allocation ? '현재 주간 배분안에 포함되어 있습니다.' : '배분 결과를 확인하고 있습니다.';
    if (!farm.rmu) status = 'RMU 재배정이 필요해 배분 계산을 보류 중입니다.';
    else if (!demandKnown) status = '생육·기후 입력이 부족해 이번 주 수요 계산을 보류 중입니다.';
    else if (!allocation && allocationWeek?.unknownRmus?.includes(farm.rmu)) status = '이 RMU의 공급자료가 없어 배분량을 미확정으로 표시합니다.';
    else if (!allocation && allocationWeek?.incompleteRmus?.includes(farm.rmu)) status = '같은 RMU의 일부 농가 수요자료가 부족해 배분량을 보류 중입니다.';

    setText('farmerPlanTitle', `${farm.name || '선택 농가'} · ${selected.date || '주차 미정'}`);
    setText('farmerPlanStatus', status);
    setText('farmerPlanRmu', farm.rmu || 'RMU 재배정 대기');
    $('farmerSummaryMetrics').innerHTML = [
      ['이번 주 계획 요청', demandText, '유효강우를 반영한 계획 취수량'],
      ['배분 계획량', allocationText, allocation ? '현재 공급자료 기준 시범 배분안' : '공급 또는 수요자료 확인 중'],
      ['강우 반영 차감', rainLabel, `계산에 반영된 강우 ${available}`],
      ['현재 생육 단계', esc(stage), `${cropNames[farm.crop] || farm.crop || '작물 미입력'} · ${farm.area ? `${fmt(farm.area)} ha` : '면적 미입력'}`]
    ].map(([label, valueText, detail]) => `<div class="metric"><span class="label">${label}</span><strong>${valueText}</strong><small>${esc(detail)}</small></div>`).join('');

    const startIndex = selected.weekIndex;
    const horizon = Array.from({ length: Math.min(8, Math.max(0, (farmWeeks?.values?.length || 0) - startIndex)) }, (_, offset) => startIndex + offset);
    const graphRows = horizon.map((index) => {
      const weekValue = farmWeeks.values[index];
      const weekPlan = plan?.weeks?.[index];
      const allocationRow = weekPlan?.rows?.find((row) => String(row.farmId) === String(farm.id));
      const known = weekValue && ['valid', 'dry'].includes(weekValue.status) && Number.isFinite(Number(weekValue.volume));
      return { index, date: weekPlan?.startDate || addDays(plan?.startDate, index), request: known ? Math.max(0, Number(weekValue.volume)) : null, allocated: allocationRow ? Math.max(0, Number(allocationRow.plannedM3) || 0) : null };
    });
    const maxValue = Math.max(1, ...graphRows.flatMap((row) => [row.request || 0, row.allocated || 0]));
    $('farmerWeeksChart').innerHTML = `<div class="farmer-chart-legend"><span><i></i>주간 계획 취수량</span><span><i class="allocation"></i>배분 계획량</span></div>` + (graphRows.length ? graphRows.map((row) => {
      const requestWidth = row.request === null ? 0 : Math.max(row.request > 0 ? 2 : 0, row.request / maxValue * 100);
      const allocationWidth = row.allocated === null ? 0 : Math.max(row.allocated > 0 ? 2 : 0, row.allocated / maxValue * 100);
      return `<div class="farmer-week-row"><span class="farmer-week-label">${esc(makeDateLabel(row.date, row.index))}</span><div class="farmer-week-bars"><div class="farmer-week-track" title="주간 계획 취수량"><i style="width:${requestWidth}%"></i></div><div class="farmer-week-track allocation" title="배분 계획량"><i style="width:${allocationWidth}%"></i></div></div><span class="farmer-week-values"><span>${row.request === null ? '수요 대기' : `${fmt(row.request)} m³`}</span><b>${row.allocated === null ? '배분 대기' : `${fmt(row.allocated)} m³`}</b></span></div>`;
    }).join('') : '<div class="empty-state">선택한 주차 이후의 주간 계획이 없습니다.</div>');
  }

  function setMode(mode, options = {}) {
    activeMode = mode === 'farmer' ? 'farmer' : 'operator';
    document.body.dataset.platformMode = activeMode;
    document.querySelectorAll('[data-platform-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.platformMode === activeMode)));
    try { localStorage.setItem(MODE_KEY, activeMode); } catch (_) {}
    if (activeMode === 'farmer') {
      window.MekongBenefit?.setRole?.('farmer');
      openFarmerPage();
    } else {
      window.MekongBenefit?.setRole?.('operator');
      if (options.navigate !== false) window.__MEKONG_TEST__?.navigate('setup');
    }
  }

  function openFarmerPage() {
    const page = $('page-farmer');
    if (!page) return;
    document.querySelectorAll('.page').forEach((item) => item.classList.toggle('active', item === page));
    document.querySelectorAll('.nav-link').forEach((button) => {
      const selected = button.dataset.page === 'farmer';
      button.classList.toggle('active', selected);
      if (selected) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
    const breadcrumb = $('breadcrumb'); if (breadcrumb) breadcrumb.textContent = '내 주간 물 계획';
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderFarmer();
  }

  function openFarmerRequests(focusRequest = false) {
    window.MekongBenefit?.setRole?.('farmer');
    window.__MEKONG_TEST__?.navigate('benefit');
    const selectedFarm = $('farmerFarmSelect')?.value;
    const farmSelect = $('benefitFarmerFarm');
    if (farmSelect && selectedFarm && [...farmSelect.options].some((option) => option.value === selectedFarm)) {
      farmSelect.value = selectedFarm;
      farmSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (focusRequest) {
      const { weeks, plan } = model();
      const weekIndex = Number($('farmerWeekSelect')?.value || 0);
      const selectedWeek = plan?.weeks?.[weekIndex];
      const request = weeks.find((item) => String(item.farm.id) === String(selectedFarm))?.values?.[weekIndex];
      const requestWeek = $('benefitRequestWeek');
      if (requestWeek && selectedWeek?.startDate && [...requestWeek.options].some((option) => option.value === selectedWeek.startDate)) requestWeek.value = selectedWeek.startDate;
      const volume = $('benefitRequestVolume');
      if (volume && request && ['valid', 'dry'].includes(request.status) && Number.isFinite(Number(request.volume)) && Number(request.volume) > 0) volume.value = String(Math.round(Number(request.volume) * 10) / 10);
      setTimeout(() => volume?.focus(), 80);
    }
  }

  function init() {
    ensureDom();
    document.querySelectorAll('[data-platform-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.platformMode)));
    $('farmerFarmSelect')?.addEventListener('change', () => { try { localStorage.setItem(FARM_KEY, $('farmerFarmSelect').value); } catch (_) {} renderFarmer(); });
    $('farmerWeekSelect')?.addEventListener('change', () => { try { localStorage.setItem(WEEK_KEY, $('farmerWeekSelect').value); } catch (_) {} renderFarmer(); });
    $('farmerOpenRequests')?.addEventListener('click', () => openFarmerRequests(false));
    $('farmerRequestWater')?.addEventListener('click', () => openFarmerRequests(true));
    $('farmerViewWeather')?.addEventListener('click', () => window.__MEKONG_TEST__?.navigate('weather'));
    $('farmerViewWater')?.addEventListener('click', () => window.__MEKONG_TEST__?.navigate('water'));
    window.addEventListener('mekong:allocation-updated', renderFarmer);
    renderFarmer();
    let savedMode = 'operator';
    try { savedMode = localStorage.getItem(MODE_KEY) || 'operator'; } catch (_) {}
    if(window.MekongPortal) window.MekongPortal.init();
    else setMode(savedMode, { navigate: savedMode === 'farmer' });
  }

  window.MekongPlatformView = { setMode, renderFarmer, openFarmerRequests };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
