(() => {
  'use strict';

  const STORE_KEY = 'mekong-suksuk.weekly-supply.v1';
  const DEMO_STORE_KEY = STORE_KEY + '.demo';
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
  let demoMode = false;
  try { demoMode = localStorage.getItem(MODE_KEY) === 'demo'; } catch (_) {}
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
  function activeRecords() { return demoMode ? demoRecords : records; }
  function persistActual() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(records)); return true; }
    catch (_) { return false; }
  }
  function persistDemo() {
    try { localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(demoRecords)); return true; }
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
    const ids = ['supplyWeek', 'supplyRmu', 'supplyMethod', 'supplyDirectM3', 'supplyFlowM3h', 'supplyRuntimeHours', 'supplyLossPct', 'supplyAreaM2', 'supplyVelocityMs', 'supplyEvidence', 'saveWeeklySupply', 'importWeeklySupply'];
    ids.forEach((id) => { const control = $(id); if (control) control.disabled = demoMode; });
    const button = $('useActualSupply');
    if (button) button.hidden = !demoMode;
    const backup = $('exportWeeklySupply');
    if (backup) backup.textContent = demoMode ? '실제 공급자료 백업' : '공급자료 백업';
    const importLabel = $('importWeeklySupply')?.closest('label');
    if (importLabel) importLabel.classList.toggle('is-disabled', demoMode);
    const banner = $('demoSupplyNotice');
    if (banner) banner.hidden = !demoMode;
    if (demoMode) setStatus('시연 공급량을 표시 중입니다. 모든 값은 화면 흐름 확인을 위한 가정이며 실측값이 아닙니다. 실제 공급기록은 따로 보존되어 있습니다.');
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
      const grade = [...new Set(entries.map((item) => item.demoScenario ? '시연 가정' : (METHODS[item.method]?.grade || '추정')))].join(' · ');
      const complete = entries.length === period.weeks.length;
      const evidence = mode === 'month' ? (complete ? '전 주 기록' : '부분 ' + entries.length + '/' + period.weeks.length + '주') : (get(period.weeks[0], rmu)?.evidence || '근거 미기재');
      const note = (mode === 'month' ? evidence + ' · ' : '') + grade + (demoMode ? ' · 실측 아님' : (mode === 'week' ? ' · ' + esc(evidence) : ''));
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
    if (demoMode) return setStatus('시연 중에는 실제 공급자료를 수정할 수 없습니다. 실제 공급기록으로 전환한 뒤 저장해 주세요.', true);
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
    if (demoMode) return setStatus('시연 중에는 실제 공급자료를 가져오지 않습니다. 실제 공급기록으로 전환해 주세요.', true);
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
    try { localStorage.setItem(MODE_KEY, 'demo'); } catch (_) {}
    setStatus('18개 RMU × ' + weekStarts.length + '주 시연 공급량을 불러왔습니다. 유량·가동시간·15% 손실률은 시연 가정이며 실측이 아닙니다. 실제 공급기록은 따로 보존됩니다.');
    renderSummary(weekStarts);
    updateDemoControls();
    onChange();
    return generated.length;
  }
  function useActualSupply() {
    demoMode = false;
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
  window.MekongWeeklySupply = { records: () => activeRecords().map((record) => ({ ...record })), get, render, bind, loadDemo, useActualSupply, isDemoMode: () => demoMode };
})();
