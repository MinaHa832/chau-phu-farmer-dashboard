(() => {
  'use strict';

  const STORE_KEY = 'mekong-suksuk.weekly-supply.v1';
  const RMUS = Array.from({ length: 18 }, (_, index) => `RMU-${String(index + 1).padStart(2, '0')}`);
  const METHODS = {
    rmu_meter: { label: 'RMU 인입부 유량계 합계', grade: '현장 계량 입력' },
    canal_meter: { label: '수로 유량 계측 후 주간 합산', grade: '현장 계량 입력' },
    pump_runtime: { label: '검증 유량 × 펌프 가동시간', grade: '계산 추정' },
    gate_curve: { label: '현장 보정 수문 곡선 × 개방시간', grade: '계산 추정' },
    agency_plan: { label: '운영기관 주간 공급 계획', grade: '운영 계획' },
    history_estimate: { label: '과거 기록 기반 추정', grade: '과거자료 추정' }
  };
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const fmt = (value) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value);
  let records = readRecords();
  let onChange = () => {};
  let bound = false;

  function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')); }
  function key(weekStart, rmu) { return `${weekStart}|${rmu}`; }
  function readRecords() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.filter((record) => record && validDate(record.weekStart) && RMUS.includes(record.rmu) &&
        record.availableM3 !== null && record.availableM3 !== undefined && record.availableM3 !== '' && Number.isFinite(Number(record.availableM3)) && Number(record.availableM3) >= 0 && METHODS[record.method]);
    } catch (_) { return []; }
  }
  function get(weekStart, rmu) { return records.find((record) => record.weekStart === weekStart && record.rmu === rmu) || null; }
  function directMethod(method) { return ['rmu_meter', 'canal_meter', 'agency_plan', 'history_estimate'].includes(method); }
  function calculatedValue() {
    const method = $('supplyMethod')?.value || 'rmu_meter';
    if (directMethod(method)) {
      const raw = $('supplyDirectM3')?.value?.trim() ?? '';
      if (raw === '') return null;
      const value = Number(raw);
      return Number.isFinite(value) && value >= 0 ? value : null;
    }
    const flowRaw = $('supplyFlowM3h')?.value?.trim() ?? '';
    const hoursRaw = $('supplyRuntimeHours')?.value?.trim() ?? '';
    const lossRaw = $('supplyLossPct')?.value?.trim() ?? '';
    if (flowRaw === '' || hoursRaw === '' || lossRaw === '') return null;
    const flow = Number(flowRaw);
    const hours = Number(hoursRaw);
    const loss = Number(lossRaw);
    if (!Number.isFinite(flow) || flow < 0 || !Number.isFinite(hours) || hours < 0 || !Number.isFinite(loss) || loss < 0 || loss > 80) return null;
    return flow * hours * (1 - loss / 100);
  }
  function setStatus(message, warning = false) {
    const status = $('supplyFormStatus');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('warning', warning);
  }
  function updateMethodFields() {
    const isDirect = directMethod($('supplyMethod')?.value || 'rmu_meter');
    $('supplyDirectFields')?.toggleAttribute('hidden', !isDirect);
    $('supplyCalculationFields')?.toggleAttribute('hidden', isDirect);
    updatePreview();
  }
  function updatePreview() {
    const output = $('supplyCalculationPreview');
    if (!output) return;
    const method = $('supplyMethod')?.value || 'rmu_meter';
    const volume = calculatedValue();
    const methodInfo = METHODS[method] || METHODS.rmu_meter;
    output.innerHTML = volume === null
      ? `<span>계산 미리보기</span><strong>자료 입력 대기</strong><small>${esc(methodInfo.label)}</small>`
      : `<span>이번 주 배분에 쓸 공급량</span><strong>${fmt(volume)} m³</strong><small>${esc(methodInfo.grade)} · ${esc(methodInfo.label)}${method === 'pump_runtime' || method === 'gate_curve' ? ` · 유량 × 시간 × (1−손실률)` : ''}</small>`;
  }
  function setRecordInForm() {
    const record = get($('supplyWeek')?.value, $('supplyRmu')?.value);
    if (!record) {
      $('supplyEvidence').value = '';
      $('supplyDirectM3').value = '';
      $('supplyFlowM3h').value = '';
      $('supplyRuntimeHours').value = '';
      $('supplyLossPct').value = '';
      $('supplyMethod').value = 'rmu_meter';
      updateMethodFields();
      return;
    }
    $('supplyMethod').value = record.method;
    $('supplyEvidence').value = record.evidence || '';
    $('supplyDirectM3').value = directMethod(record.method) ? String(record.availableM3) : '';
    $('supplyFlowM3h').value = record.flowM3h === undefined ? '' : String(record.flowM3h);
    $('supplyRuntimeHours').value = record.runtimeHours === undefined ? '' : String(record.runtimeHours);
    $('supplyLossPct').value = record.lossPct === undefined ? '' : String(record.lossPct);
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
    const headers = `<tr><th>RMU</th>${periods.map((period) => `<th class="week">${esc(mode === 'week' ? `${period.label}` : `${period.label} 월합계`)}</th>`).join('')}</tr>`;
    const rows = RMUS.map((rmu) => `<tr><td><b>${rmu}</b></td>${periods.map((period) => {
      const entries = period.weeks.map((date) => get(date, rmu)).filter(Boolean);
      if (!entries.length) return '<td class="week-cell missing"><span>자료 없음</span></td>';
      const total = entries.reduce((sum, item) => sum + Number(item.availableM3), 0);
      const grade = [...new Set(entries.map((item) => METHODS[item.method]?.grade || '추정'))].join(' · ');
      const complete = entries.length === period.weeks.length;
      const note = mode === 'month' ? `${complete ? '전 주 기록' : `부분 ${entries.length}/${period.weeks.length}주`} · ${grade}` : `${grade} · ${esc(get(period.weeks[0], rmu)?.evidence || '근거 미기재')}`;
      return `<td class="week-cell ${total > 0 ? 'has-water' : 'is-dry'}" title="${esc(rmu)} ${esc(period.label)} · ${fmt(total)} m³ · ${esc(note)}">${fmt(total)}<span class="cell-note">${note}</span></td>`;
    }).join('')}</tr>`).join('');
    table.innerHTML = `<table class="calendar-table"><thead>${headers}</thead><tbody>${rows}</tbody></table>`;
  }
  function render(weekStarts) {
    const select = $('supplyWeek');
    const rmuSelect = $('supplyRmu');
    if (!select || !rmuSelect) return;
    const oldWeek = select.value;
    select.innerHTML = weekStarts.map((date, index) => `<option value="${date}">${index + 1}주차 · ${date}</option>`).join('');
    if (weekStarts.includes(oldWeek)) select.value = oldWeek;
    const oldRmu = rmuSelect.value;
    rmuSelect.innerHTML = RMUS.map((rmu) => `<option value="${rmu}">${rmu}</option>`).join('');
    if (RMUS.includes(oldRmu)) rmuSelect.value = oldRmu;
    setRecordInForm();
    renderSummary(weekStarts);
  }
  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(records)); return true; }
    catch (_) { return false; }
  }
  function save() {
    const weekStart = $('supplyWeek')?.value;
    const rmu = $('supplyRmu')?.value;
    const method = $('supplyMethod')?.value;
    const volume = calculatedValue();
    if (!validDate(weekStart) || !RMUS.includes(rmu) || !METHODS[method] || volume === null) {
      setStatus('주차, RMU, 공급량을 확인해 주세요. 계산 방식은 유량·가동시간·손실률을 모두 입력해야 합니다.', true);
      return;
    }
    const record = {
      schema: 'mekong-suksuk-weekly-supply/v1',
      weekStart,
      rmu,
      method,
      availableM3: volume,
      evidence: $('supplyEvidence')?.value?.trim() || '',
      recordedAt: new Date().toISOString()
    };
    if (!directMethod(method)) {
      record.flowM3h = Number($('supplyFlowM3h').value);
      record.runtimeHours = Number($('supplyRuntimeHours').value);
      record.lossPct = Number($('supplyLossPct').value);
    }
    records = records.filter((item) => key(item.weekStart, item.rmu) !== key(weekStart, rmu));
    records.push(record);
    records.sort((a, b) => a.weekStart.localeCompare(b.weekStart) || a.rmu.localeCompare(b.rmu));
    if (!persist()) {
      setStatus('이 브라우저에 저장할 수 없습니다. 저장공간을 확인한 뒤 기록 백업 파일을 사용해 주세요.', true);
      return;
    }
    setStatus(`${rmu} · ${weekStart} · ${fmt(volume)} m³ 공급자료를 저장했습니다. ${METHODS[method].grade}로 표시합니다. 다른 기기와는 자동 공유되지 않습니다.`);
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
    setStatus(`${records.length}건의 공급자료를 JSON 백업으로 내보냈습니다.`);
  }
  async function importRecords(file) {
    if (!file) return;
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
      if (!persist()) throw new Error('브라우저 저장 공간에 기록하지 못했습니다.');
      setStatus(`${accepted}건의 공급자료를 가져왔습니다. 가져온 자료가 같은 RMU·주차 기록보다 우선합니다.`);
      onChange();
    } catch (error) {
      setStatus(`가져오기에 실패했습니다: ${error.message}`, true);
    } finally {
      $('importWeeklySupply').value = '';
    }
  }
  function bind(refresh) {
    onChange = refresh || (() => {});
    if (bound) return;
    bound = true;
    $('supplyMethod')?.addEventListener('change', updateMethodFields);
    ['supplyDirectM3', 'supplyFlowM3h', 'supplyRuntimeHours', 'supplyLossPct'].forEach((id) => $(id)?.addEventListener('input', updatePreview));
    ['supplyWeek', 'supplyRmu'].forEach((id) => $(id)?.addEventListener('change', setRecordInForm));
    $('saveWeeklySupply')?.addEventListener('click', save);
    $('exportWeeklySupply')?.addEventListener('click', exportRecords);
    $('importWeeklySupply')?.addEventListener('change', (event) => importRecords(event.target.files?.[0]));
    $('supplySummaryMode')?.addEventListener('change', () => renderSummary([...document.querySelectorAll('#supplyWeek option')].map((option) => option.value)));
  }
  window.MekongWeeklySupply = { records: () => records.map((record) => ({ ...record })), get, render, bind };
})();
