(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const STATIONS = { '039801': 'Châu Đốc', '019803': 'Tân Châu', '980601': 'Vàm Nao' };
  const MONTHS = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);
  let readings = [];
  let loaded = false;
  let pending = null;
  let fetchedAt = '';

  function dateParts(value) {
    const text = String(value || '').trim();
    let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (match) return { year: Number(match[1]), month: Number(match[2]) };
    match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (match) return { year: Number(match[3]), month: Number(match[2]) };
    return null;
  }

  function numberOrNull(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const number = Number(String(value).replace(',', '.'));
    return Number.isFinite(number) ? number : null;
  }

  function observationDate(item) {
    return item.lastMeasurement_local || item.observed || item.sourceRetrievedAt_local || item.received || '';
  }

  function updateYears() {
    const select = $('waterHistoryYear');
    if (!select) return;
    const years = [...new Set(readings.map((item) => dateParts(observationDate(item))?.year).filter(Number.isFinite))].sort((a, b) => b - a);
    select.replaceChildren(...(years.length ? years.map((year) => {
      const option = document.createElement('option'); option.value = String(year); option.textContent = `${year}년`; return option;
    }) : [Object.assign(document.createElement('option'), { value: '', textContent: '연도 자료 없음' })]));
    if (years.length) select.value = String(years[0]);
  }

  function render() {
    const stationId = $('waterHistoryStation')?.value || '039801';
    const year = Number($('waterHistoryYear')?.value);
    const field = $('waterHistoryMetric')?.value || 'waterLevel_m';
    const isRain = field === 'rainFall24H_mm';
    const selected = readings.filter((item) => String(item.stationId || item.code || '') === stationId && dateParts(observationDate(item))?.year === year);
    const monthly = Array.from({ length: 12 }, () => []);
    selected.forEach((item) => {
      const parts = dateParts(observationDate(item));
      const value = numberOrNull(item[field]);
      if (parts && value !== null && parts.month >= 1 && parts.month <= 12) monthly[parts.month - 1].push(value);
    });
    const means = monthly.map((values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);
    const max = Math.max(0, ...means.filter((value) => value !== null));
    const station = STATIONS[stationId] || stationId;
    const indicator = isRain ? '월 평균 24시간 강우량' : '월 평균 수위';
    const valuesCount = monthly.reduce((sum, items) => sum + items.length, 0);
    const status = $('waterHistoryStatus');
    if (status) {
      if (!year) status.textContent = '연도별 수위·강우 이력 자료를 제공하는 관측소가 없습니다.';
      else if (!valuesCount) status.textContent = `${year}년 ${station} 관측자료가 없습니다. 최근 수위·강우는 아래 관측 대시보드에서 확인하세요.`;
      else status.textContent = `${year}년 ${station} · ${valuesCount.toLocaleString('ko-KR')}건 · ${indicator} · ${fetchedAt ? `자료 조회 ${fetchedAt}` : 'MRC 연동 이력'}`;
    }
    const source = $('waterHistorySource');
    if (source) source.textContent = readings.length ? 'MRC 연동 이력' : '연도 이력 없음';
    const chart = $('waterHistoryChart');
    if (!chart) return;
    if (!valuesCount) {
      chart.innerHTML = '<div class="water-month-empty">선택한 관측소와 연도에 표시할 이력이 없습니다. 빈 구간은 0으로 대체하지 않습니다.</div>';
      return;
    }
    chart.innerHTML = means.map((value, index) => {
      const width = value === null || max <= 0 ? 0 : Math.max(2, value / max * 100);
      const display = value === null ? '자료 없음' : `${value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })} ${isRain ? 'mm' : 'm'}`;
      const count = monthly[index].length ? `${monthly[index].length}건` : '—';
      return `<div class="water-month-cell"><div class="water-month-head"><span>${MONTHS[index]}</span><span>${count}</span></div><div class="water-month-value">${display}</div><div class="water-month-track" aria-hidden="true"><i class="water-month-fill${isRain ? ' rain' : ''}" style="width:${width}%"></i></div></div>`;
    }).join('');
  }

  async function load(force = false) {
    if (force) loaded = false;
    if (loaded) { render(); return; }
    if (pending) return pending;
    const status = $('waterHistoryStatus');
    if (status) status.textContent = '연도별 관측자료를 불러옵니다.';
    pending = fetch('/api/history', { headers: { accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error('history unavailable');
        const payload = await response.json();
        readings = Array.isArray(payload.readings) ? payload.readings : [];
        fetchedAt = payload.fetchedAt ? new Date(payload.fetchedAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : '';
        loaded = true;
        updateYears();
        render();
      })
      .catch(() => {
        readings = []; loaded = true;
        const source = $('waterHistorySource'); if (source) source.textContent = '이력 연결 대기';
        const statusNode = $('waterHistoryStatus'); if (statusNode) statusNode.textContent = '연도별 이력을 불러오지 못했습니다. MRC API 연결 후 표시됩니다.';
        render();
      })
      .finally(() => { pending = null; });
    return pending;
  }

  function init() {
    ['waterHistoryStation', 'waterHistoryYear', 'waterHistoryMetric'].forEach((id) => $(id)?.addEventListener('change', render));
    $('waterHistoryRefresh')?.addEventListener('click', () => load(true));
    load();
  }

  window.MekongWaterHistory = { load, render };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
