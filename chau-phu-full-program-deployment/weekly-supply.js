(() => {
  'use strict';

  const STORE_KEY = 'mekong-suksuk.weekly-supply.v1';
  const DEMO_STORE_KEY = STORE_KEY + '.demo';
  const STAGE_DEMO_STORE_KEY = STORE_KEY + '.stage-demo';
  const MODE_KEY = STORE_KEY + '.mode';
  const RMUS = Array.from({ length: 18 }, (_, index) => 'RMU-' + String(index + 1).padStart(2, '0'));
  const METHODS = {
    rmu_meter: { label: 'RMU 인입부 유량계 합계', grade: '현장 계량 입력' },
    canal_meter: { label: '수로 유량 계측 후 주간 합산', grade: '현장 계량 입력' },
    canal_velocity: { label: '수로 단면적 × 평균 유속 × 통수시간', grade: '현장 계측 계산' },
    pump_runtime: { label: '검증 유량 × 펌프 가동시간', grade: '계산 추정' },
    gate_curve: { label: '현장 보정 수문 곡선 × 개방시간', grade: '계산 추정' },
    agency_plan: { label: '운영기관 주간 공급 계획', grade: '운영 계획' },
    history_estimate: { label: '과거 기록 기반 추정', grade: '과거자료 추정' }
  };
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const fmt = (value) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value);
  let records = readRecords(STORE_KEY);
  let demoRecords = readRecords(DEMO_STORE_KEY);
  let stageDemoRecords = readRecords(STAGE_DEMO_STORE_KEY);
  let demoMode = false;
  let stageDemoMode = false;
  let stageScenarioInfo = stageDemoRecords.find((record) => record.scenarioInfo)?.scenarioInfo || null;
  try {
    const savedMode = localStorage.getItem(MODE_KEY);
    demoMode = savedMode === 'demo';
    stageDemoMode = savedMode === 'stage-demo';
  } catch (_) {}
  let onChange = () => {};
  let bound = false;

  function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')); }
  function key(weekStart, rmu) { return weekStart + '|' + rmu; }
  function readRecords(storeKey) {
    try {
      const raw = JSON.parse(localStorage.getItem(storeKey) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.filter((record) => record && validDate(record.weekStart) && RMUS.includes(record.rmu) &&
        record.availableM3 !== null && record.availableM3 !== undefined && record.availableM3 !== '' && Number.isFinite(Number(record.availableM3)) && Number(record.availableM3) >= 0 && METHODS[record.method]);
    } catch (_) { return []; }
  }
  function activeRecords() { return stageDemoMode ? stageDemoRecords : (demoMode ? demoRecords : records); }
  function persistActual() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(records)); return true; }
    catch (_) { return false; }
  }
  function persistDemo() {
    try { localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(demoRecords)); return true; }
    catch (_) { return false; }
  }
  function persistStageDemo() {
    try { localStorage.setItem(STAGE_DEMO_STORE_KEY, JSON.stringify(stageDemoRecords)); return true; }
    catch (_) { return false; }
  }
  function get(weekStart, rmu) { return activeRecords().find((record) => record.weekStart === weekStart && record.rmu === rmu) || null; }
  function directMethod(method) { return ['rmu_meter', 'canal_meter', 'agency_plan', 'history_estimate'].includes(method); }
  function calculatedFlow() {
    const method = $('supplyMethod')?.value || 'rmu_meter';
    if (method === 'canal_velocity') {
      const areaRaw = $('supplyAreaM2')?.value?.trim() ?? '';
      const velocityRaw = $('supplyVelocityMs')?.value?.trim() ?? '';
      if (areaRaw === '' || velocityRaw === '') return null;
      const area = Number(areaRaw), velocity = Number(velocityRaw);
      if (!Number.isFinite(area) || area < 0 || !Number.isFinite(velocity) || velocity < 0) return null;
      return area * velocity * 3600;
    }
    const raw = $('supplyFlowM3h')?.value?.trim() ?? '';
    if (raw === '') return null;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  function calculatedValue() {
    const method = $('supplyMethod')?.value || 'rmu_meter';
    if (directMethod(method)) {
      const raw = $('supplyDirectM3')?.value?.trim() ?? '';
      if (raw === '') return null;
      const value = Number(raw);
      return Number.isFinite(value) && value >= 0 ? value : null;
    }
    const flow = calculatedFlow();
    const hoursRaw = $('supplyRuntimeHours')?.value?.trim() ?? '';
    const lossRaw = $('supplyLossPct')?.value?.trim() ?? '';
    if (flow === null || hoursRaw === '' || lossRaw === '') return null;
    const hours = Number(hoursRaw), loss = Number(lossRaw);
    if (!Number.isFinite(hours) || hours < 0 || !Number.isFinite(loss) || loss < 0 || loss > 80) return null;
    return flow * hours * (1 - loss / 100);
  }
  function setStatus(message, warning = false) {
    const status = $('supplyFormStatus');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('warning', warning);
  }
  function updateDemoControls() {
    const syntheticMode = demoMode || stageDemoMode;
    const ids = ['supplyWeek', 'supplyRmu', 'supplyMethod', 'supplyDirectM3', 'supplyFlowM3h', 'supplyRuntimeHours', 'supplyLossPct', 'supplyAreaM2', 'supplyVelocityMs', 'supplyEvidence', 'saveWeeklySupply', 'importWeeklySupply'];
    ids.forEach((id) => { const control = $(id); if (control) control.disabled = syntheticMode; });
    const button = $('useActualSupply');
    if (button) button.hidden = !syntheticMode;
    const backup = $('exportWeeklySupply');
    if (backup) backup.textContent = syntheticMode ? '실제 공급자료 백업' : '공급자료 백업';
    const importLabel = $('importWeeklySupply')?.closest('label');
    if (importLabel) importLabel.classList.toggle('is-disabled', syntheticMode);
    const banner = $('demoSupplyNotice');
    if (banner) banner.hidden = !syntheticMode;
    const title = $('demoSupplyNoticeTitle');
    const description = $('demoSupplyNoticeText');
    const stageMeta = $('stageScenarioMeta');
    const allocationDescription = $('allocationScenarioDescription');
    const allocationTitle = $('allocationScenarioNotice')?.querySelector('b');
    if (stageDemoMode) {
      const stageIndexAvailable = stageScenarioInfo?.stageIndex !== null && stageScenarioInfo?.stageIndex !== undefined;
      const stageUseNote = stageIndexAvailable
        ? '최근 수위 위치를 반영한 가상 시나리오입니다.'
        : '최신 수위 범위가 부족해 중립 배율 1.00으로 만든 가상 시나리오입니다.';
      if (title) title.textContent = (stageIndexAvailable ? '수위 지표 반영' : '수위 중립 배율 적용') + ' 가상 공급량 · 실측 아님';
      if (description) description.textContent = '강 본류 수위로 RMU 유량을 직접 계산할 수 없어, 시연용 기준량에 ' + stageUseNote + ' 실제 공급기록은 따로 보존됩니다.';
      if (stageMeta) {
        stageMeta.hidden = false;
        stageMeta.textContent = describeStageScenario(stageScenarioInfo);
      }
      if (allocationTitle) allocationTitle.textContent = stageIndexAvailable ? '수위 반영 시연 시나리오' : '수위 중립 배율 시연 시나리오';
      if (allocationDescription) allocationDescription.textContent = '배분 대상은 RMU마다 3개씩 만든 시범농가 54개입니다. 요청량은 강우 차감 후 주간 계획 취수량입니다. 공급량은 가정 기준 유량·가동시간·손실률에 수위 지표를 반영해 만든 가상값입니다. ' + stageUseNote + ' ' + describeStageScenario(stageScenarioInfo) + ' 실제 등록 농가와 실제 공급기록은 보존됩니다.';
      setStatus(describeStageScenario(stageScenarioInfo));
    } else {
      if (title) title.textContent = '시연 공급량 · 실측 아님';
      if (description) description.textContent = '아래 수량과 유량은 배분 화면 흐름 확인을 위한 가정입니다. 실제 RMU 공급 기록은 별도 보존됩니다.';
      if (stageMeta) stageMeta.hidden = true;
      if (allocationTitle) allocationTitle.textContent = '시연 시나리오';
      if (allocationDescription) allocationDescription.textContent = '배분 대상은 RMU마다 3개씩 만든 시범농가 54개입니다. 요청량은 강우 차감 후 주간 계획 취수량입니다. 공급 유량 28–54 m³/h, 주간 가동 12–24시간, 손실률 15%는 시연 가정이며 현장 실측값이 아닙니다. 실제 등록 농가와 실제 공급기록은 보존됩니다.';
      if (demoMode) setStatus('시연 공급량을 표시 중입니다. 유량·가동시간·손실률은 화면 흐름 확인을 위한 가정이며 실측값이 아닙니다. 실제 공급기록은 따로 보존되어 있습니다.');
    }
  }
  function updateMethodFields() {
    const method = $('supplyMethod')?.value || 'rmu_meter';
    const isDirect = directMethod(method);
    const isVelocity = method === 'canal_velocity';
    $('supplyDirectFields')?.toggleAttribute('hidden', !isDirect);
    $('supplyCalculationFields')?.toggleAttribute('hidden', isDirect);
    $('supplyFlowField')?.toggleAttribute('hidden', isDirect || isVelocity);
    $('supplyVelocityFields')?.toggleAttribute('hidden', !isVelocity);
    updatePreview();
  }
  function updatePreview() {
    const output = $('supplyCalculationPreview');
    if (!output) return;
    const activeRecord = get($('supplyWeek')?.value, $('supplyRmu')?.value);
    if (activeRecord?.stageScenario) {
      const stageLabel = activeRecord.stageIndex === null || activeRecord.stageIndex === undefined ? '수위 중립 배율 적용' : '수위 지표 반영';
      output.innerHTML = '<span>가상 시나리오 공급량</span><strong>' + fmt(activeRecord.availableM3) + ' m³</strong><small>' + stageLabel + ' · 가정 유량·가동시간·손실률 · 실측 아님</small>';
      return;
    }
    const method = $('supplyMethod')?.value || 'rmu_meter';
    const volume = calculatedValue();
    const flow = calculatedFlow();
    const methodInfo = METHODS[method] || METHODS.rmu_meter;
    if (volume === null) {
      output.innerHTML = '<span>계산 미리보기</span><strong>자료 입력 대기</strong><small>' + esc(methodInfo.label) + '</small>';
      return;
    }
    const flowNote = method === 'canal_velocity' ? ' · Q = 단면적 × 평균유속 × 3,600' : (method === 'pump_runtime' || method === 'gate_curve' ? ' · 유량 × 시간 × (1−손실률)' : '');
    output.innerHTML = '<span>이번 주 배분에 쓸 공급량</span><strong>' + fmt(volume) + ' m³</strong><small>' + esc(methodInfo.grade) + ' · ' + esc(methodInfo.label) + (flow === null ? '' : ' · ' + fmt(flow) + ' m³/h') + flowNote + '</small>';
  }
  function setRecordInForm() {
    const record = get($('supplyWeek')?.value, $('supplyRmu')?.value);
    if (!record) {
      ['supplyEvidence', 'supplyDirectM3', 'supplyFlowM3h', 'supplyRuntimeHours', 'supplyLossPct', 'supplyAreaM2', 'supplyVelocityMs'].forEach((id) => { if ($(id)) $(id).value = ''; });
      $('supplyMethod').value = 'rmu_meter';
      updateMethodFields();
      return;
    }
    $('supplyMethod').value = record.method;
    $('supplyEvidence').value = record.evidence || '';
    $('supplyDirectM3').value = directMethod(record.method) ? String(record.availableM3) : '';
    $('supplyFlowM3h').value = record.method === 'canal_velocity' ? '' : (record.flowM3h === undefined ? '' : String(record.flowM3h));
    $('supplyRuntimeHours').value = record.runtimeHours === undefined ? '' : String(record.runtimeHours);
    $('supplyLossPct').value = record.lossPct === undefined ? '' : String(record.lossPct);
    $('supplyAreaM2').value = record.crossSectionAreaM2 === undefined ? '' : String(record.crossSectionAreaM2);
    $('supplyVelocityMs').value = record.averageVelocityMs === undefined ? '' : String(record.averageVelocityMs);
    updateMethodFields();
  }
  function renderSummary(weekStarts) {
    const table = $('supplySummary');
    if (!table) return;
    const mode = $('supplySummaryMode')?.value || 'week';
    let periods = weekStarts.map((date) => ({ key: date, label: date, weeks: [date] }));
    if (mode === 'month') {
      const byMonth = new Map();
      for (const date of weekStarts) {
        const month = date.slice(0, 7);
        if (!byMonth.has(month)) byMonth.set(month, { key: month, label: month, weeks: [] });
        byMonth.get(month).weeks.push(date);
      }
      periods = [...byMonth.values()];
    }
    const headers = '<tr><th>RMU</th>' + periods.map((period) => '<th class="week">' + esc(mode === 'week' ? period.label : period.label + ' 월합계') + '</th>').join('') + '</tr>';
    const rows = RMUS.map((rmu) => '<tr><td><b>' + rmu + '</b></td>' + periods.map((period) => {
      const entries = period.weeks.map((date) => get(date, rmu)).filter(Boolean);
      if (!entries.length) return '<td class="week-cell missing"><span>자료 없음</span></td>';
      const total = entries.reduce((sum, item) => sum + Number(item.availableM3), 0);
      const grade = [...new Set(entries.map((item) => item.stageScenario ? '수위 지표 가상' : (item.demoScenario ? '시연 가정' : (METHODS[item.method]?.grade || '추정'))))].join(' · ');
      const complete = entries.length === period.weeks.length;
      const evidence = mode === 'month' ? (complete ? '전 주 기록' : '부분 ' + entries.length + '/' + period.weeks.length + '주') : (get(period.weeks[0], rmu)?.evidence || '근거 미기재');
      const syntheticMode = demoMode || stageDemoMode;
      const note = (mode === 'month' ? evidence + ' · ' : '') + grade + (syntheticMode ? ' · 실측 아님' : (mode === 'week' ? ' · ' + esc(evidence) : ''));
      return '<td class="week-cell ' + (total > 0 ? 'has-water' : 'is-dry') + '" title="' + esc(rmu + ' ' + period.label + ' · ' + fmt(total) + ' m³ · ' + note) + '">' + fmt(total) + '<span class="cell-note">' + note + '</span></td>';
    }).join('') + '</tr>').join('');
    table.innerHTML = '<table class="calendar-table"><thead>' + headers + '</thead><tbody>' + rows + '</tbody></table>';
  }
  function render(weekStarts) {
    const select = $('supplyWeek');
    const rmuSelect = $('supplyRmu');
    if (!select || !rmuSelect) return;
    const oldWeek = select.value;
    select.innerHTML = weekStarts.map((date, index) => '<option value="' + date + '">' + (index + 1) + '주차 · ' + date + '</option>').join('');
    if (weekStarts.includes(oldWeek)) select.value = oldWeek;
    const oldRmu = rmuSelect.value;
    rmuSelect.innerHTML = RMUS.map((rmu) => '<option value="' + rmu + '">' + rmu + '</option>').join('');
    if (RMUS.includes(oldRmu)) rmuSelect.value = oldRmu;
    setRecordInForm();
    renderSummary(weekStarts);
    updateDemoControls();
  }
  function save() {
    if (demoMode || stageDemoMode) return setStatus('가상 시나리오 중에는 실제 공급자료를 수정할 수 없습니다. 실제 공급기록으로 전환한 뒤 저장해 주세요.', true);
    const weekStart = $('supplyWeek')?.value;
    const rmu = $('supplyRmu')?.value;
    const method = $('supplyMethod')?.value;
    const volume = calculatedValue();
    if (!validDate(weekStart) || !RMUS.includes(rmu) || !METHODS[method] || volume === null) {
      setStatus('주차, RMU, 공급량을 확인해 주세요. 계산 방식은 유량·가동시간·손실률을 입력해야 합니다.', true);
      return;
    }
    const record = { schema: 'mekong-suksuk-weekly-supply/v1', weekStart, rmu, method, availableM3: volume, evidence: $('supplyEvidence')?.value?.trim() || '', recordedAt: new Date().toISOString() };
    if (!directMethod(method)) {
      record.flowM3h = calculatedFlow();
      record.runtimeHours = Number($('supplyRuntimeHours').value);
      record.lossPct = Number($('supplyLossPct').value);
    }
    if (method === 'canal_velocity') {
      record.crossSectionAreaM2 = Number($('supplyAreaM2').value);
      record.averageVelocityMs = Number($('supplyVelocityMs').value);
    }
    records = records.filter((item) => key(item.weekStart, item.rmu) !== key(weekStart, rmu));
    records.push(record);
    records.sort((a, b) => a.weekStart.localeCompare(b.weekStart) || a.rmu.localeCompare(b.rmu));
    if (!persistActual()) {
      setStatus('이 브라우저에 저장할 수 없습니다. 저장공간을 확인한 뒤 기록 백업 파일을 사용해 주세요.', true);
      return;
    }
    setStatus(rmu + ' · ' + weekStart + ' · ' + fmt(volume) + ' m³ 공급자료를 저장했습니다. ' + METHODS[method].grade + '로 표시합니다. 다른 기기와는 자동 공유되지 않습니다.');
    renderSummary([...document.querySelectorAll('#supplyWeek option')].map((option) => option.value));
    updatePreview();
    onChange();
  }
  function exportRecords() {
    const payload = { schema: 'mekong-suksuk-weekly-supply/v1', exportedAt: new Date().toISOString(), records };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'mekong_suksuk_weekly_supply.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setStatus(records.length + '건의 실제 공급자료를 JSON 백업으로 내보냈습니다.');
  }
  async function importRecords(file) {
    if (!file) return;
    if (demoMode || stageDemoMode) return setStatus('가상 시나리오 중에는 실제 공급자료를 가져오지 않습니다. 실제 공급기록으로 전환해 주세요.', true);
    try {
      const parsed = JSON.parse(await file.text());
      const incoming = Array.isArray(parsed) ? parsed : parsed?.records;
      if (!Array.isArray(incoming)) throw new Error('records 배열이 없습니다.');
      const merged = new Map(records.map((record) => [key(record.weekStart, record.rmu), record]));
      let accepted = 0;
      for (const item of incoming) {
        if (!item || !validDate(item.weekStart) || !RMUS.includes(item.rmu) || !METHODS[item.method] || item.availableM3 === null || item.availableM3 === undefined || item.availableM3 === '' || !Number.isFinite(Number(item.availableM3)) || Number(item.availableM3) < 0) continue;
        merged.set(key(item.weekStart, item.rmu), { ...item, availableM3: Number(item.availableM3) });
        accepted += 1;
      }
      records = [...merged.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart) || a.rmu.localeCompare(b.rmu));
      if (!persistActual()) throw new Error('브라우저 저장 공간에 기록하지 못했습니다.');
      setStatus(accepted + '건의 실제 공급자료를 가져왔습니다. 가져온 자료가 같은 RMU·주차 기록보다 우선합니다.');
      onChange();
    } catch (error) {
      setStatus('가져오기에 실패했습니다: ' + error.message, true);
    } finally {
      $('importWeeklySupply').value = '';
    }
  }
  function loadDemo(weekStarts) {
    const generated = [];
    weekStarts.forEach((weekStart, weekIndex) => RMUS.forEach((rmu, rmuIndex) => {
      const flowM3h = 28 + ((rmuIndex * 11 + weekIndex * 7) % 27);
      const runtimeHours = 12 + ((rmuIndex * 5 + weekIndex * 3) % 13);
      const lossPct = 15;
      const availableM3 = flowM3h * runtimeHours * (1 - lossPct / 100);
      generated.push({
        schema: 'mekong-suksuk-weekly-supply/v1', weekStart, rmu, method: 'pump_runtime', availableM3,
        flowM3h, runtimeHours, lossPct, demoScenario: true,
        evidence: '시연 가정 · 실측 아님 · 검증 유량 ' + flowM3h + ' m³/h × 주간 가동 ' + runtimeHours + ' h × (1−가정 손실률 15%)',
        recordedAt: new Date().toISOString()
      });
    }));
    demoRecords = generated;
    if (!persistDemo()) setStatus('시연 자료를 이 브라우저에 보존하지 못했습니다. 현재 화면에서만 임시로 표시합니다.', true);
    demoMode = true;
    stageDemoMode = false;
    stageScenarioInfo = null;
    try { localStorage.setItem(MODE_KEY, 'demo'); } catch (_) {}
    setStatus('18개 RMU × ' + weekStarts.length + '주 시연 공급량을 불러왔습니다. 유량·가동시간·15% 손실률은 시연 가정이며 실측이 아닙니다. 실제 공급기록은 따로 보존됩니다.');
    renderSummary(weekStarts);
    updateDemoControls();
    onChange();
    return generated.length;
  }

  function parseObservationTime(value) {
    const raw = String(value || '').trim();
    if (!raw) return NaN;
    const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
    return Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized) ? normalized : normalized + '+07:00');
  }
  function numberOrNull(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  function quantile(values, ratio) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const position = (sorted.length - 1) * ratio;
    const lower = Math.floor(position), upper = Math.ceil(position);
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
  }
  async function requestJson(path) {
    const response = await fetch(path, { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(path + ' · HTTP ' + response.status);
    return response.json();
  }
  function bundledStageSnapshot() {
    try { return $('integratedDashboardFrame')?.contentWindow?.__MRC_SNAPSHOT || null; }
    catch (_) { return null; }
  }
  function buildStageContext(payload, readings, sourceKind) {
    const stations = payload?.stations || [];
    const priorities = ['039801', '980601', '019803'];
    const station = priorities.map((id) => stations.find((item) => String(item.stationId || item.code) === id)).find(Boolean);
    if (!station) throw new Error('관측소 수위 자료를 찾지 못했습니다.');
    const level = numberOrNull(station.waterLevel_m ?? station.level);
    if (level === null) throw new Error('관측소 수위가 비어 있습니다.');
    const observedAt = station.lastMeasurement_local || station.observed || '';
    const observedTime = parseObservationTime(observedAt);
    const ageHours = Number.isFinite(observedTime) ? (Date.now() - observedTime) / 3600000 : Infinity;
    const fresh = sourceKind === 'live' && ageHours >= -3 && ageHours <= 36;
    const stationId = String(station.stationId || station.code || '');
    const validReadings = (Array.isArray(readings) ? readings : [])
      .filter((item) => String(item.stationId || item.code || '') === stationId)
      .map((item) => ({
        value: numberOrNull(item.waterLevel_m ?? item.level),
        time: parseObservationTime(item.lastMeasurement_local || item.observed || '')
      }))
      .filter((item) => item.value !== null && Number.isFinite(item.time));
    const cutoff = (Number.isFinite(observedTime) ? observedTime : Date.now()) - 7 * 86400000;
    const recent = validReadings.filter((item) => item.time >= cutoff && (!Number.isFinite(observedTime) || item.time <= observedTime + 3 * 3600000));
    const sample = recent;
    let low = sample.length >= 8 ? quantile(sample.map((item) => item.value), 0.1) : null;
    let high = sample.length >= 8 ? quantile(sample.map((item) => item.value), 0.9) : null;
    const usableRange = fresh && low !== null && high !== null && high - low >= 0.03;
    const stageIndex = usableRange ? Math.max(0, Math.min(1, (level - low) / (high - low))) : null;
    const factor = stageIndex === null ? 1 : 0.75 + stageIndex * 0.5;
    return {
      status: sourceKind,
      fresh,
      stationId,
      stationName: station.name || station.nameKo || stationId,
      levelM: level,
      observedAt,
      receivedAt: station.sourceRetrievedAt_local || station.received || payload?.fetchedAt || '',
      source: station.source || payload?.source || '',
      rangeLowM: low,
      rangeHighM: high,
      sampleCount: sample.length,
      stageIndex,
      factor,
      reason: fresh ? (usableRange ? '' : '최근 7일 수위 범위가 부족하여 중립 배율을 적용했습니다.') : '관측 시각이 36시간을 넘어 최신 수위 지표 배율에는 반영하지 않았습니다.'
    };
  }
  async function readStageContext() {
    try {
      const latest = await requestJson('/api/mrc');
      let history = { readings: [] };
      try { history = await requestJson('/api/history'); } catch (_) {}
      const live = buildStageContext(latest, history.readings, 'live');
      if (live.fresh) return live;
      const snapshot = bundledStageSnapshot();
      if (snapshot?.stations?.length) return buildStageContext(snapshot, snapshot.readings, 'snapshot');
      return live;
    } catch (_) {
      const snapshot = bundledStageSnapshot();
      if (snapshot?.stations?.length) {
        try { return buildStageContext(snapshot, snapshot.readings, 'snapshot'); } catch (_) {}
      }
      return {
        status: 'unavailable', fresh: false, stationName: '수위 자료 미연결', levelM: null,
        observedAt: '', receivedAt: '', rangeLowM: null, rangeHighM: null,
        sampleCount: 0, stageIndex: null, factor: 1,
        reason: '연동 관측을 불러오지 못해 중립 배율을 적용했습니다.'
      };
    }
  }
  function describeStageScenario(info) {
    if (!info) return '수위 기준을 확인하지 못해 중립 배율 1.00을 사용했습니다. 가상값은 실측이 아닙니다.';
    const level = Number.isFinite(info.levelM) ? fmt(info.levelM) + ' m' : '값 없음';
    const time = info.observedAt ? ' · 관측 ' + info.observedAt : '';
    const station = info.stationName || 'MRC 관측소';
    const received = info.receivedAt ? ' · 자료 확인 ' + info.receivedAt : '';
    const sourceNote = info.status === 'live' ? 'MRC 연동 관측' : (info.status === 'snapshot' ? '내장 관측 스냅샷' : '관측 자료 없음');
    let indexNote = info.stageIndex === null || info.stageIndex === undefined
      ? '수위 지표 미산출 · 중립 배율 1.00'
      : '최근 7일 수위 범위 ' + fmt(info.rangeLowM) + '–' + fmt(info.rangeHighM) + ' m (' + info.sampleCount + '건) 중 ' + Math.round(info.stageIndex * 100) + ' 지점 · 가상 배율 ' + info.factor.toFixed(2) + ' (낮음 0.75–높음 1.25)';
    if (info.status === 'snapshot') indexNote += ' · 내장 스냅샷';
    if (info.status === 'unavailable') indexNote += ' · 관측 조회 실패';
    if (info.reason) indexNote += ' · ' + info.reason;
    return sourceNote + ' · ' + station + ' ' + level + time + received + ' · ' + indexNote + ' · 수위 지표는 현재 16주 시나리오에 고정 적용되며 미래 수위 예측이 아닙니다.';
  }
  async function loadStageScenario(weekStarts) {
    if (!Array.isArray(weekStarts) || !weekStarts.length) {
      setStatus('먼저 캘린더에서 표시할 기간을 확인해 주세요.', true);
      return 0;
    }
    setStatus('연동된 MRC 수위·최근 관측 범위를 불러오고 있습니다.');
    const info = await readStageContext();
    const generated = [];
    weekStarts.forEach((weekStart, weekIndex) => RMUS.forEach((rmu, rmuIndex) => {
      const baseFlowM3h = 28 + ((rmuIndex * 11 + weekIndex * 7) % 27);
      const runtimeHours = 12 + ((rmuIndex * 5 + weekIndex * 3) % 13);
      const lossPct = 15;
      const flowM3h = baseFlowM3h * info.factor;
      const availableM3 = flowM3h * runtimeHours * (1 - lossPct / 100);
      generated.push({
        schema: 'mekong-suksuk-weekly-supply/v1', weekStart, rmu, method: 'pump_runtime', availableM3,
        flowM3h, runtimeHours, lossPct, demoScenario: true, stageScenario: true,
        stageIndex: info.stageIndex, stageFactor: info.factor,
        evidence: '수위 지표 가상 · ' + (info.status === 'live' ? 'MRC 연동' : (info.status === 'snapshot' ? '내장 스냅샷' : '중립값')) + ' · ' + (info.stationName || '관측 자료 없음') + ' ' + (Number.isFinite(info.levelM) ? fmt(info.levelM) + ' m' : '') + ' · 가상 배율 ' + info.factor.toFixed(2) + ' · 기준 유량·가동시간·손실률 가정 · RMU 실측 아님',
        recordedAt: new Date().toISOString()
      });
    }));
    stageScenarioInfo = { ...info, startDate: weekStarts[0] };
    if (generated[0]) generated[0].scenarioInfo = stageScenarioInfo;
    stageDemoRecords = generated;
    if (!persistStageDemo()) setStatus('가상 자료를 이 브라우저에 보존하지 못했습니다. 현재 화면에서만 표시합니다.', true);
    demoMode = false;
    stageDemoMode = true;
    try { localStorage.setItem(MODE_KEY, 'stage-demo'); } catch (_) {}
    setStatus('18개 RMU × ' + weekStarts.length + '주 가상 공급량을 만들었습니다. ' + describeStageScenario(stageScenarioInfo));
    renderSummary(weekStarts);
    updateDemoControls();
    onChange();
    return generated.length;
  }
  function useActualSupply() {
    demoMode = false;
    stageDemoMode = false;
    try { localStorage.setItem(MODE_KEY, 'actual'); } catch (_) {}
    setStatus('실제 공급기록으로 전환했습니다. 시연 자료는 별도로 보존되어 다시 불러올 수 있습니다.');
    updateDemoControls();
    onChange();
  }
  function bind(refresh) {
    onChange = refresh || (() => {});
    if (bound) return;
    bound = true;
    $('supplyMethod')?.addEventListener('change', updateMethodFields);
    ['supplyDirectM3', 'supplyFlowM3h', 'supplyRuntimeHours', 'supplyLossPct', 'supplyAreaM2', 'supplyVelocityMs'].forEach((id) => $(id)?.addEventListener('input', updatePreview));
    ['supplyWeek', 'supplyRmu'].forEach((id) => $(id)?.addEventListener('change', setRecordInForm));
    $('saveWeeklySupply')?.addEventListener('click', save);
    $('exportWeeklySupply')?.addEventListener('click', exportRecords);
    $('importWeeklySupply')?.addEventListener('change', (event) => importRecords(event.target.files?.[0]));
    $('useActualSupply')?.addEventListener('click', useActualSupply);
    $('supplySummaryMode')?.addEventListener('change', () => renderSummary([...document.querySelectorAll('#supplyWeek option')].map((option) => option.value)));
    updateDemoControls();
  }
  window.MekongWeeklySupply = { sharedMode:()=>stageDemoMode?'stage-demo':demoMode?'demo':'actual',replaceShared(items,mode){records=[];demoRecords=[];stageDemoRecords=[];demoMode=mode==='demo';stageDemoMode=mode==='stage-demo';if(stageDemoMode)stageDemoRecords=items;else if(demoMode)demoRecords=items;else records=items;}, records: () => activeRecords().map((record) => ({ ...record })), get, render, bind, loadDemo, loadStageScenario, useActualSupply, stageStartDate: () => stageScenarioInfo?.startDate || stageDemoRecords[0]?.weekStart || null, isDemoMode: () => demoMode || stageDemoMode, isStageDemoMode: () => stageDemoMode };
})();
