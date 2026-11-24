(() => {
  'use strict';

  const STORE_KEY = 'mekong-suksuk.benefits.v1';
  const FARM_KEYS = ['mekong-suksuk.farms.v4', 'mekong-suksuk.farms.v3'];
  const RMUS = Array.from({ length: 18 }, (_, i) => `RMU-${String(i + 1).padStart(2, '0')}`);
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const dict = {
    ko: {
      title: '절수 편익 · 운영 검증', subtitle: '작기 후 동기간 비교를 기록하고, 농가 확인과 독립 검증을 거치는 시범 화면입니다.',
      sim: '시범 화면 · 실제 정산 아님', noticeTitle: '계산과 권한의 경계', notice: '45·30·15·10은 주간 물 배분의 평가 가중치입니다. 절수 편익 배분 비율로 쓰지 않습니다. 물량은 기준기간 대비 차이, 전기·연료는 각각의 운영비 차이로 계산합니다. 확인되지 않은 금액은 지급액으로 표시하지 않습니다.',
      local: '이 브라우저에만 저장됩니다. 역할 전환은 화면 시연이며 로그인·공유 데이터베이스·실제 권한 분리는 아직 없습니다.',
      farmer: '농가 안내', operator: '운영자 기록', reviewer: '독립 감시자', farmViewTitle: '농가별 공동 급수 확인', chooseFarm: '농가 선택', noFarm: '농가 정보 없음 · 먼저 농가 등록 화면에서 불러오세요.',
      farmerHelp: '선택한 농가의 RMU에 연결된 공동 급수 기록을 확인합니다. 기록 확인은 물량·일정에 대한 확인이며, 편익 금액이나 지급 동의가 아닙니다.', noRecord: '이 RMU에 비교 기록이 없습니다.', individualBenefit: '공동 펌프의 RMU 합계만 기록됩니다. 농가별 계량이나 합의 규칙이 없으므로 개인 절수량·현금 편익은 계산하지 않습니다.', confirmFacts: '기록 확인', dispute: '이의 제기', farmerNote: '확인할 점 또는 이의 사유 (선택)', reportTitle: '급수 문제·순서 변경 제보', issueType: '제보 유형', issueBypass: '무단 우회 취수 의심', issueOrder: '급수 순서·일정 변경', issueMismatch: '계량·기록 불일치', issueShortage: '공급 부족·중단', issueOther: '기타 확인 요청', issueDetails: '관찰한 사실을 적어주세요. 제보만으로 위반이나 책임이 확정되지는 않습니다.', submitReport: '검토 요청 등록',
      operatorTitle: '작기 비교 기록 입력', operatorHelp: '작기 종료 후 같은 급수 범위와 비교 가능한 기간을 입력합니다. RMU는 사진 기준 집계 구역이며 실제 펌프 공급권역은 확인되지 않았습니다.', sampleButton: '예시 시나리오 불러오기', exportButton: '기록 CSV 내보내기', cycleLabel: '현재 작기 / 비교 이름', rmuLabel: '시범 집계 RMU', serviceArea: '펌프·수로 구간명 (확인 전에는 추정)', baselinePeriod: '기준기간', currentPeriod: '현재기간', startDate: '시작일', endDate: '종료일', baselineWater: '기준기간 취수량 (m³)', actualWater: '현재기간 취수량 (m³)', baselineKwh: '기준 전력 (kWh)', actualKwh: '현재 전력 (kWh)', electricityRate: '전력 단가 (VND/kWh)', baselineFuel: '기준 연료 (L)', actualFuel: '현재 연료 (L)', fuelRate: '연료 단가 (VND/L)', extraCost: '추가 운영·계측 비용 (VND)', sourceTitle: '자료 근거', measureBasis: '계측 방식', basisMeter: '유량계·전력계 계측', basisLedger: '운영 대장·영수증', basisEstimate: '추정·자료 미확인', baselineEvidence: '기준 자료 출처/기록 번호', actualEvidence: '현재 자료 출처/기록 번호', checksTitle: '비교 가능성 확인', checkScope: '동일 펌프·수로와 급수 범위', checkCrop: '작물·면적·생육단계를 맞춤', checkWeather: '강우·날씨·공급일수 차이를 확인/조정', noteLabel: '운영 메모 (개인정보 제외)', saveRecord: '농가 확인 요청으로 저장', previewTitle: '계산 미리보기', previewHelp: '비교 입력값 기준의 추정입니다. 전기·연료 비용은 각각 표시하며, 절수량과 비용을 섞지 않습니다.', recordsTitle: '작기 기록', noRecords: '아직 기록이 없습니다.',
      volumeSaved: '기준 대비 물량 차이', waterRate: '물량 변화율', electricityDelta: '전기료 변화 추정', fuelDelta: '연료비 변화 추정', netCost: '추가비용 반영 운영비 차이', saved: '감소 추정', increased: '증가 추정', equal: '변화 없음', notCalculated: '입력 필요', compareReady: '비교 조건 확인', compareHold: '비교 조건 미확인', statusWaitingFarmer: '농가 확인 대기', statusFarmerConfirmed: '독립 검증 대기', statusDisputed: '농가 이의 제기', statusVerified: '독립 검증 완료 · 지급 아님', statusRevision: '수정·보류 요청', demoBadge: '예시 입력 · 실측 자료 아님',
      reviewerTitle: '삼자 확인·검증 대기열', reviewerHelp: '운영자 입력 → 농가 사실 확인 → 독립 감시자 검증 순서입니다. 검증 완료는 편익 지급이나 급수 우선순위 변경을 뜻하지 않습니다.', queueTitle: '비교 기록 검토', reviewNote: '검토 근거 또는 수정 요청', approve: '근거 확인 완료', hold: '수정·보류 요청', approveBlocked: '비교조건·자료 근거·농가 확인을 갖춘 실제 기록만 검증할 수 있습니다.', incidentTitle: '급수 제보 검토', noIncidents: '검토할 제보가 없습니다.', investigate: '확인 진행', closeIncident: '검토 종료', open: '접수', investigating: '확인 중', closed: '검토 종료',
      policyTitle: '성과 확인과 보류 기준', monitorRoles: '운영자: 계량·펌프·전기/연료 장부 기록 · 농가: 실제 공급량·일정 확인 및 이의 제기 · 독립 감시자: 비교 조건·근거·처리 이력 검토', success: '성과지표: 비교 조건이 맞는 검증 물량, 농가 확인률, 독립 검증 완료 기록', stop: '보류 조건: 유량계/대장 부재, 기준기간 불일치, 공급 부족·이의 제기 미해결, 비용 근거 누락. 보류는 자동 급수 제한이나 벌점으로 연결하지 않습니다.', payout: '농가별 분배 규칙과 실제 자금원은 확정되지 않아 자동 이체·환급·편익 배분은 구현하지 않았습니다.', savedMessage: '기록을 저장했습니다. 농가 확인 대기 상태입니다.', reportSaved: '제보를 접수했습니다. 사실 판단은 별도 검토가 필요합니다.', reviewSaved: '검토 상태를 저장했습니다.', selectRmu: 'RMU 선택', selectFarm: '농가를 선택하세요', requiredError: '기간과 기준/현재 물량을 입력해 주세요.', storageError: '이 브라우저에 저장하지 못했습니다. 저장 공간을 확인해 주세요.', confirmedMessage: '공급 기록을 확인했습니다. 금액 지급 동의는 아닙니다.', disputedMessage: '이의 상태를 기록했습니다. 급수 제한으로 이어지지 않습니다.',
      periodLength: '기간 일수', lengthMatched: '동일 기간 일수', lengthMismatch: '기간 일수 다름', noMeterWarning: '추정 자료는 비교 참고용이며 검증 완료될 수 없습니다.'
    },
    vi: {
      title: 'Lợi ích tiết kiệm nước · Vận hành và xác minh', subtitle: 'Màn hình thử nghiệm để ghi nhận so sánh sau vụ, xác nhận của nông hộ và kiểm tra độc lập.',
      sim: 'Bản thử nghiệm · không quyết toán', noticeTitle: 'Ranh giới tính toán và quyền hạn', notice: '45·30·15·10 là trọng số đánh giá cho phương án phân bổ nước hàng tuần, không phải tỷ lệ chia lợi ích tiết kiệm. Khối lượng nước được so sánh với kỳ cơ sở; điện và nhiên liệu được tính riêng. Số tiền chưa xác minh không được coi là khoản chi trả.',
      local: 'Dữ liệu chỉ lưu trong trình duyệt này. Chuyển vai trò chỉ để trình diễn; chưa có đăng nhập, cơ sở dữ liệu dùng chung hay phân quyền thực tế.',
      farmer: 'Thông tin nông hộ', operator: 'Nhật ký vận hành', reviewer: 'Giám sát độc lập', farmViewTitle: 'Xác nhận cấp nước chung của nông hộ', chooseFarm: 'Chọn nông hộ', noFarm: 'Chưa có dữ liệu nông hộ · hãy tải dữ liệu ở màn hình đăng ký.',
      farmerHelp: 'Hiển thị hồ sơ cấp nước chung gắn với RMU của nông hộ. Xác nhận là xác nhận lượng nước/lịch cấp, không phải đồng ý số tiền lợi ích hay thanh toán.', noRecord: 'Chưa có hồ sơ so sánh cho RMU này.', individualBenefit: 'Chỉ ghi tổng lượng của RMU dùng chung. Không tính lượng tiết kiệm hay lợi ích tiền mặt cho từng hộ khi chưa có đồng hồ riêng hoặc quy tắc thỏa thuận.', confirmFacts: 'Xác nhận hồ sơ', dispute: 'Gửi ý kiến', farmerNote: 'Điểm cần kiểm tra hoặc lý do phản hồi (không bắt buộc)', reportTitle: 'Báo cáo vấn đề cấp nước/thay đổi thứ tự', issueType: 'Loại báo cáo', issueBypass: 'Nghi ngờ lấy nước qua đường vòng', issueOrder: 'Thay đổi thứ tự/lịch cấp', issueMismatch: 'Sai lệch giữa đồng hồ và sổ ghi', issueShortage: 'Thiếu nước/ngừng cấp', issueOther: 'Yêu cầu kiểm tra khác', issueDetails: 'Mô tả điều đã quan sát. Chỉ báo cáo không xác định vi phạm hay trách nhiệm.', submitReport: 'Gửi yêu cầu xem xét',
      operatorTitle: 'Nhập so sánh theo vụ', operatorHelp: 'Sau khi kết thúc vụ, nhập cùng phạm vi cấp nước và kỳ có thể so sánh. RMU là khu tổng hợp theo ảnh; ranh giới phục vụ của bơm thực tế chưa được xác nhận.', sampleButton: 'Tải tình huống ví dụ', exportButton: 'Xuất CSV hồ sơ', cycleLabel: 'Vụ hiện tại / tên so sánh', rmuLabel: 'RMU tổng hợp thử nghiệm', serviceArea: 'Tên đoạn bơm/kênh (chưa xác minh)', baselinePeriod: 'Kỳ cơ sở', currentPeriod: 'Kỳ hiện tại', startDate: 'Ngày bắt đầu', endDate: 'Ngày kết thúc', baselineWater: 'Lượng nước kỳ cơ sở (m³)', actualWater: 'Lượng nước kỳ hiện tại (m³)', baselineKwh: 'Điện kỳ cơ sở (kWh)', actualKwh: 'Điện kỳ hiện tại (kWh)', electricityRate: 'Giá điện (VND/kWh)', baselineFuel: 'Nhiên liệu kỳ cơ sở (L)', actualFuel: 'Nhiên liệu kỳ hiện tại (L)', fuelRate: 'Giá nhiên liệu (VND/L)', extraCost: 'Chi phí vận hành/đo đạc bổ sung (VND)', sourceTitle: 'Bằng chứng dữ liệu', measureBasis: 'Phương thức đo', basisMeter: 'Đồng hồ lưu lượng/điện', basisLedger: 'Sổ vận hành/hóa đơn', basisEstimate: 'Ước tính/chưa xác minh', baselineEvidence: 'Nguồn/số hồ sơ kỳ cơ sở', actualEvidence: 'Nguồn/số hồ sơ kỳ hiện tại', checksTitle: 'Kiểm tra khả năng so sánh', checkScope: 'Cùng bơm/kênh và phạm vi cấp nước', checkCrop: 'Đã khớp cây trồng, diện tích, giai đoạn sinh trưởng', checkWeather: 'Đã xem xét/điều chỉnh mưa, thời tiết, số ngày cấp', noteLabel: 'Ghi chú vận hành (không nhập dữ liệu cá nhân)', saveRecord: 'Lưu và yêu cầu nông hộ xác nhận', previewTitle: 'Tính toán sơ bộ', previewHelp: 'Ước tính theo dữ liệu nhập. Điện và nhiên liệu hiển thị riêng; không cộng lẫn với lượng nước tiết kiệm.', recordsTitle: 'Hồ sơ theo vụ', noRecords: 'Chưa có hồ sơ.',
      volumeSaved: 'Chênh lệch nước so với kỳ cơ sở', waterRate: 'Tỷ lệ thay đổi lượng nước', electricityDelta: 'Ước tính thay đổi tiền điện', fuelDelta: 'Ước tính thay đổi tiền nhiên liệu', netCost: 'Chênh lệch chi phí vận hành sau chi phí bổ sung', saved: 'Ước tính giảm', increased: 'Ước tính tăng', equal: 'Không đổi', notCalculated: 'Cần nhập dữ liệu', compareReady: 'Điều kiện so sánh đã kiểm tra', compareHold: 'Chưa kiểm tra điều kiện so sánh', statusWaitingFarmer: 'Chờ nông hộ xác nhận', statusFarmerConfirmed: 'Chờ xác minh độc lập', statusDisputed: 'Nông hộ có ý kiến', statusVerified: 'Đã xác minh độc lập · không phải thanh toán', statusRevision: 'Yêu cầu sửa/tạm dừng', demoBadge: 'Dữ liệu ví dụ · không phải số đo thực',
      reviewerTitle: 'Quy trình xác nhận ba bên', reviewerHelp: 'Người vận hành nhập → nông hộ xác nhận sự việc → giám sát độc lập kiểm tra. Xác minh không đồng nghĩa với chi trả lợi ích hoặc thay đổi thứ tự cấp nước.', queueTitle: 'Hàng đợi hồ sơ so sánh', reviewNote: 'Căn cứ xem xét hoặc nội dung yêu cầu sửa', approve: 'Xác minh đủ căn cứ', hold: 'Yêu cầu sửa/tạm dừng', approveBlocked: 'Chỉ xác minh hồ sơ thực có điều kiện so sánh, bằng chứng và xác nhận của nông hộ.', incidentTitle: 'Xem xét báo cáo cấp nước', noIncidents: 'Không có báo cáo chờ xử lý.', investigate: 'Đang xác minh', closeIncident: 'Kết thúc xem xét', open: 'Đã tiếp nhận', investigating: 'Đang xác minh', closed: 'Đã kết thúc',
      policyTitle: 'Chỉ số kết quả và tiêu chí tạm dừng', monitorRoles: 'Người vận hành: ghi đồng hồ/bơm/điện và nhiên liệu · Nông hộ: xác nhận lượng/lịch cấp và phản hồi · Giám sát độc lập: kiểm tra điều kiện so sánh, bằng chứng và lịch sử xử lý', success: 'Chỉ số: lượng nước được xác minh trong điều kiện so sánh được, tỷ lệ nông hộ xác nhận, số hồ sơ được kiểm tra độc lập', stop: 'Tạm dừng khi thiếu đồng hồ/sổ ghi, kỳ cơ sở không phù hợp, thiếu nước/tranh chấp chưa giải quyết hoặc thiếu chứng từ chi phí. Không tự động hạn chế cấp nước hoặc phạt.', payout: 'Chưa thống nhất quy tắc chia cho từng hộ và nguồn tiền thực tế; chưa triển khai chuyển khoản, hoàn tiền hoặc tự chia lợi ích.', savedMessage: 'Đã lưu hồ sơ. Đang chờ nông hộ xác nhận.', reportSaved: 'Đã tiếp nhận báo cáo. Cần xem xét riêng trước khi kết luận.', reviewSaved: 'Đã lưu trạng thái xem xét.', selectRmu: 'Chọn RMU', selectFarm: 'Chọn nông hộ', requiredError: 'Vui lòng nhập kỳ và lượng nước cơ sở/hiện tại.', storageError: 'Không lưu được trong trình duyệt này. Hãy kiểm tra dung lượng lưu trữ.', confirmedMessage: 'Đã xác nhận hồ sơ cấp nước. Đây không phải đồng ý thanh toán.', disputedMessage: 'Đã ghi nhận ý kiến. Không dẫn đến hạn chế cấp nước.',
      periodLength: 'Số ngày', lengthMatched: 'Số ngày bằng nhau', lengthMismatch: 'Số ngày khác nhau', noMeterWarning: 'Dữ liệu ước tính chỉ để tham khảo và không thể được xác minh.'
    }
  };

  let language = localStorage.getItem('mekong-suksuk.benefit-language') || 'ko';
  let activeRole = 'farmer';
  let state = loadState();
  const t = (key) => (dict[language] || dict.ko)[key] || dict.ko[key] || key;

  function emptyState() { return { schema: 'mekong-suksuk-benefits/v1', records: [], incidents: [] }; }
  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (parsed && Array.isArray(parsed.records) && Array.isArray(parsed.incidents)) return parsed;
    } catch (_) {}
    return emptyState();
  }
  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); return true; }
    catch (_) { announce(t('storageError')); return false; }
  }
  function announce(message) { const el = $('benefitNotice'); if (el) el.textContent = message; }
  function newId(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }
  function numberFrom(id) {
    const raw = $(id)?.value?.trim() ?? '';
    if (raw === '') return null;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  function numberText(value, digits = 1) {
    if (!Number.isFinite(value)) return '—';
    return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'ko-KR', { maximumFractionDigits: digits }).format(value);
  }
  function moneyText(value) {
    if (!Number.isFinite(value)) return t('notCalculated');
    const sign = value < 0 ? '−' : '';
    return `${sign}${new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'ko-KR', { maximumFractionDigits: 0 }).format(Math.abs(value))} VND`;
  }
  function formatDate(value) {
    if (!value) return '—';
    try { return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'ko-KR', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`)); }
    catch (_) { return value; }
  }
  function readFarms() {
    for (const key of FARM_KEYS) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || 'null');
        if (Array.isArray(parsed)) return parsed.filter((farm) => farm && farm.id);
      } catch (_) {}
    }
    return [];
  }
  function duration(start, end) {
    if (!start || !end) return null;
    const a = Date.parse(`${start}T00:00:00Z`), b = Date.parse(`${end}T00:00:00Z`);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
    return Math.round((b - a) / 86400000) + 1;
  }
  function calculate(record) {
    const baseWater = Number(record.baselineWaterM3), actualWater = Number(record.actualWaterM3);
    const waterDelta = Number.isFinite(baseWater) && Number.isFinite(actualWater) ? baseWater - actualWater : null;
    const waterPct = baseWater > 0 && waterDelta !== null ? waterDelta / baseWater * 100 : null;
    const electricity = record.baselineKwh !== null && record.actualKwh !== null && record.electricityRate !== null
      ? (Number(record.baselineKwh) - Number(record.actualKwh)) * Number(record.electricityRate) : null;
    const fuel = record.baselineFuelL !== null && record.actualFuelL !== null && record.fuelRate !== null
      ? (Number(record.baselineFuelL) - Number(record.actualFuelL)) * Number(record.fuelRate) : null;
    const knownSources = [electricity, fuel].filter((value) => Number.isFinite(value));
    const netCost = knownSources.length ? knownSources.reduce((sum, value) => sum + value, 0) - Number(record.extraCost || 0) : null;
    return { waterDelta, waterPct, electricity, fuel, netCost };
  }
  function dateLengthText(record) {
    const before = duration(record.baselineStart, record.baselineEnd);
    const after = duration(record.currentStart, record.currentEnd);
    if (before === null || after === null) return t('lengthMismatch');
    return before === after ? `${t('lengthMatched')} · ${before}${language === 'vi' ? ' ngày' : '일'}` : `${t('lengthMismatch')} · ${before}/${after}`;
  }
  function isComparable(record) {
    const before = duration(record.baselineStart, record.baselineEnd);
    const after = duration(record.currentStart, record.currentEnd);
    return before !== null && before === after && record.checkScope && record.checkCrop && record.checkWeather;
  }
  function canVerify(record) {
    return !record.demo && record.status === 'farmer_confirmed' && isComparable(record) &&
      record.measureBasis !== 'estimate' && record.baselineEvidence?.trim() && record.actualEvidence?.trim();
  }
  function statusText(record) {
    if (record.status === 'farmer_confirmed') return t('statusFarmerConfirmed');
    if (record.status === 'disputed') return t('statusDisputed');
    if (record.status === 'verified') return t('statusVerified');
    if (record.status === 'revision') return t('statusRevision');
    return t('statusWaitingFarmer');
  }
  function fillSelect(select, options, placeholder, selectedValue) {
    if (!select) return;
    const previous = selectedValue ?? select.value;
    select.innerHTML = `<option value="">${esc(placeholder)}</option>` + options.map((option) =>
      `<option value="${esc(option.value)}">${esc(option.label)}</option>`).join('');
    if (options.some((option) => option.value === previous)) select.value = previous;
  }
  function applyStaticText() {
    document.querySelectorAll('#page-benefit [data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll('#page-benefit [data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
    document.querySelectorAll('#page-benefit [data-benefit-language]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.benefitLanguage === language));
    });
  }
  function renderRoles() {
    document.querySelectorAll('[data-benefit-role]').forEach((button) => {
      const selected = button.dataset.benefitRole === activeRole;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll('[data-benefit-view]').forEach((panel) => {
      panel.hidden = panel.dataset.benefitView !== activeRole;
    });
  }
  function recordCard(record, context) {
    const calc = calculate(record);
    const comparable = isComparable(record);
    const label = RMUS.includes(record.rmu) ? record.rmu : (record.rmu || t('selectRmu'));
    return `<article class="benefit-record-card">
      <div class="benefit-record-top"><div><strong>${esc(record.cycleLabel || t('cycleLabel'))}</strong><small>${esc(label)} · ${esc(record.serviceArea || '')}</small></div><span class="benefit-state ${esc(record.status)}">${esc(statusText(record))}</span></div>
      ${record.demo ? `<span class="benefit-demo-tag">${esc(t('demoBadge'))}</span>` : ''}
      <div class="benefit-results compact">
        <div><span>${esc(t('volumeSaved'))}</span><strong>${calc.waterDelta === null ? '—' : `${numberText(calc.waterDelta, 1)} m³`}</strong><small>${calc.waterPct === null ? esc(t('notCalculated')) : `${numberText(calc.waterPct, 1)}%`}</small></div>
        <div><span>${esc(t('electricityDelta'))}</span><strong>${esc(moneyText(calc.electricity))}</strong></div>
        <div><span>${esc(t('fuelDelta'))}</span><strong>${esc(moneyText(calc.fuel))}</strong></div>
      </div>
      <p class="benefit-record-meta">${esc(formatDate(record.baselineStart))}–${esc(formatDate(record.baselineEnd))} → ${esc(formatDate(record.currentStart))}–${esc(formatDate(record.currentEnd))} · ${esc(dateLengthText(record))}</p>
      <p class="benefit-record-meta">${esc(comparable ? t('compareReady') : t('compareHold'))} · ${esc(record.measureBasis === 'estimate' ? t('noMeterWarning') : '')}</p>
      ${context === 'farmer' && record.status !== 'verified' ? `<label class="benefit-field benefit-note-field"><span>${esc(t('farmerNote'))}</span><textarea data-farmer-note="${esc(record.id)}" rows="2"></textarea></label><div class="benefit-actions"><button class="btn btn-secondary btn-small" data-farmer-action="confirm" data-id="${esc(record.id)}">${esc(t('confirmFacts'))}</button><button class="btn btn-secondary btn-small" data-farmer-action="dispute" data-id="${esc(record.id)}">${esc(t('dispute'))}</button></div>` : ''}
      ${context === 'reviewer' ? `<div class="benefit-review-tools"><label class="benefit-field"><span>${esc(t('reviewNote'))}</span><textarea data-review-note="${esc(record.id)}" rows="2"></textarea></label><div class="benefit-actions">${canVerify(record) ? `<button class="btn btn-primary btn-small" data-review-action="verify" data-id="${esc(record.id)}">${esc(t('approve'))}</button>` : `<span class="benefit-blocked">${esc(t('approveBlocked'))}</span>`}${record.status !== 'verified' ? `<button class="btn btn-secondary btn-small" data-review-action="revision" data-id="${esc(record.id)}">${esc(t('hold'))}</button>` : ''}</div></div>` : ''}
    </article>`;
  }
  function renderFarmer() {
    const farms = readFarms();
    const select = $('benefitFarmerFarm');
    const old = select.value;
    fillSelect(select, farms.map((farm) => ({ value: String(farm.id), label: `${farm.name || farm.id}${farm.rmu ? ` · ${farm.rmu}` : ' · 미배정'}` })), farms.length ? t('selectFarm') : t('noFarm'), old);
    const selected = farms.find((farm) => String(farm.id) === select.value);
    const output = $('benefitFarmerRecords');
    if (!selected) {
      output.innerHTML = `<div class="benefit-empty">${esc(t('noFarm'))}</div>`;
      $('benefitFarmerRMU').textContent = '—';
      return;
    }
    $('benefitFarmerRMU').textContent = selected.rmu || '미배정';
    const records = selected.rmu ? state.records.filter((record) => record.rmu === selected.rmu) : [];
    output.innerHTML = records.length ? records.map((record) => recordCard(record, 'farmer')).join('') : `<div class="benefit-empty">${esc(t('noRecord'))}</div>`;
  }
  function previewValues() {
    const record = {
      baselineWaterM3: numberFrom('benefitBaselineWater'), actualWaterM3: numberFrom('benefitActualWater'),
      baselineKwh: numberFrom('benefitBaselineKwh'), actualKwh: numberFrom('benefitActualKwh'), electricityRate: numberFrom('benefitElectricityRate'),
      baselineFuelL: numberFrom('benefitBaselineFuel'), actualFuelL: numberFrom('benefitActualFuel'), fuelRate: numberFrom('benefitFuelRate'), extraCost: numberFrom('benefitExtraCost') || 0
    };
    const result = calculate(record);
    const water = $('benefitPreviewWater');
    const rate = $('benefitPreviewRate');
    const electricity = $('benefitPreviewElectricity');
    const fuel = $('benefitPreviewFuel');
    const cost = $('benefitPreviewNet');
    if (!water) return;
    water.textContent = result.waterDelta === null ? '—' : `${numberText(result.waterDelta, 1)} m³`;
    rate.textContent = result.waterPct === null ? '—' : `${numberText(result.waterPct, 1)}%`;
    electricity.textContent = moneyText(result.electricity);
    fuel.textContent = moneyText(result.fuel);
    cost.textContent = moneyText(result.netCost);
    water.classList.toggle('is-negative', result.waterDelta !== null && result.waterDelta < 0);
    cost.classList.toggle('is-negative', result.netCost !== null && result.netCost < 0);
  }
  function renderOperator() {
    const select = $('benefitRmu');
    const old = select.value;
    fillSelect(select, RMUS.map((rmu) => ({ value: rmu, label: rmu })), t('selectRmu'), old);
    const list = $('benefitOperatorRecords');
    list.innerHTML = state.records.length ? [...state.records].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((record) => recordCard(record, 'operator')).join('') : `<div class="benefit-empty">${esc(t('noRecords'))}</div>`;
    previewValues();
  }
  function renderIncidents() {
    const list = $('benefitIncidentQueue');
    if (!state.incidents.length) { list.innerHTML = `<div class="benefit-empty">${esc(t('noIncidents'))}</div>`; return; }
    list.innerHTML = [...state.incidents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((incident) => {
      const status = incident.status === 'closed' ? t('closed') : incident.status === 'investigating' ? t('investigating') : t('open');
      const label = t(incident.typeKey || 'issueOther');
      return `<article class="benefit-record-card"><div class="benefit-record-top"><div><strong>${esc(label)}</strong><small>${esc(incident.rmu)} · ${esc(formatDate(incident.createdAt.slice(0, 10)))}</small></div><span class="benefit-state">${esc(status)}</span></div><p>${esc(incident.details)}</p><p class="benefit-record-meta">${esc(t('reviewNote'))}: ${esc(incident.reviewNote || '—')}</p><div class="benefit-actions">${incident.status === 'open' ? `<button class="btn btn-secondary btn-small" data-incident-action="investigating" data-id="${esc(incident.id)}">${esc(t('investigate'))}</button>` : ''}${incident.status !== 'closed' ? `<button class="btn btn-secondary btn-small" data-incident-action="closed" data-id="${esc(incident.id)}">${esc(t('closeIncident'))}</button>` : ''}</div></article>`;
    }).join('');
  }
  function renderReviewer() {
    const waiting = state.records.filter((record) => record.status === 'farmer_confirmed' && !record.demo).length;
    const verified = state.records.filter((record) => record.status === 'verified' && !record.demo).length;
    const pendingIssues = state.incidents.filter((incident) => incident.status !== 'closed').length;
    $('benefitReviewMetrics').innerHTML = `<div class="benefit-mini-metric"><span>${esc(t('queueTitle'))}</span><strong>${state.records.filter((record) => !record.demo).length}</strong></div><div class="benefit-mini-metric"><span>${esc(t('statusFarmerConfirmed'))}</span><strong>${waiting}</strong></div><div class="benefit-mini-metric"><span>${esc(t('statusVerified'))}</span><strong>${verified}</strong></div><div class="benefit-mini-metric"><span>${esc(t('incidentTitle'))}</span><strong>${pendingIssues}</strong></div>`;
    const queue = $('benefitReviewQueue');
    const records = [...state.records].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    queue.innerHTML = records.length ? records.map((record) => recordCard(record, 'reviewer')).join('') : `<div class="benefit-empty">${esc(t('noRecords'))}</div>`;
    renderIncidents();
  }
  function render() {
    applyStaticText();
    renderRoles();
    renderFarmer();
    renderOperator();
    renderReviewer();
  }
  function addHistory(record, role, action, note) {
    record.history = Array.isArray(record.history) ? record.history : [];
    record.history.push({ at: new Date().toISOString(), role, action, note: String(note || '').slice(0, 600) });
  }
  function handleRecordSubmit(event) {
    event.preventDefault();
    const baselineWater = numberFrom('benefitBaselineWater');
    const actualWater = numberFrom('benefitActualWater');
    const baselineStart = $('benefitBaselineStart').value, baselineEnd = $('benefitBaselineEnd').value;
    const currentStart = $('benefitCurrentStart').value, currentEnd = $('benefitCurrentEnd').value;
    if (baselineWater === null || actualWater === null || !duration(baselineStart, baselineEnd) || !duration(currentStart, currentEnd)) {
      announce(t('requiredError')); return;
    }
    const measureBasis = $('benefitMeasureBasis').value;
    const record = {
      id: newId('BEN'), cycleLabel: $('benefitCycleLabel').value.trim() || `${$('benefitRmu').value} · ${formatDate(currentStart)}`,
      rmu: $('benefitRmu').value, serviceArea: $('benefitServiceArea').value.trim(),
      baselineStart, baselineEnd, currentStart, currentEnd, baselineWaterM3: baselineWater, actualWaterM3: actualWater,
      baselineKwh: numberFrom('benefitBaselineKwh'), actualKwh: numberFrom('benefitActualKwh'), electricityRate: numberFrom('benefitElectricityRate'),
      baselineFuelL: numberFrom('benefitBaselineFuel'), actualFuelL: numberFrom('benefitActualFuel'), fuelRate: numberFrom('benefitFuelRate'), extraCost: numberFrom('benefitExtraCost') || 0,
      measureBasis, baselineEvidence: $('benefitBaselineEvidence').value.trim(), actualEvidence: $('benefitActualEvidence').value.trim(),
      checkScope: $('benefitCheckScope').checked, checkCrop: $('benefitCheckCrop').checked, checkWeather: $('benefitCheckWeather').checked,
      operatorNote: $('benefitOperatorNote').value.trim(), status: 'awaiting_farmer', demo: false,
      createdAt: new Date().toISOString(), history: []
    };
    addHistory(record, 'operator', 'recorded', record.operatorNote);
    state.records.unshift(record);
    if (!saveState()) { state.records.shift(); return; }
    event.target.reset();
    $('benefitMeasureBasis').value = 'meter';
    render(); announce(t('savedMessage'));
  }
  function loadDemo() {
    state.records = state.records.filter((record) => !record.demo);
    const record = {
      id: 'BEN-DEMO-SEASON', cycleLabel: language === 'vi' ? 'Ví dụ minh họa · vụ so sánh' : '예시 시나리오 · 동일 작기 비교',
      rmu: 'RMU-01', serviceArea: language === 'vi' ? 'Đoạn bơm thử nghiệm (giả định)' : '시범 펌프 구간 (가정)',
      baselineStart: '2024-07-01', baselineEnd: '2024-10-20', currentStart: '2025-07-01', currentEnd: '2025-10-20',
      baselineWaterM3: 10000, actualWaterM3: 8500, baselineKwh: 3200, actualKwh: 2800, electricityRate: 3000,
      baselineFuelL: 0, actualFuelL: 0, fuelRate: 0, extraCost: 300000,
      measureBasis: 'meter', baselineEvidence: '예시 계량 기록 (합성 값)', actualEvidence: '예시 계량 기록 (합성 값)',
      checkScope: true, checkCrop: true, checkWeather: true, operatorNote: '예시 계산 전용. 실제 측정·단가·급수권역 자료가 아닙니다.',
      status: 'awaiting_farmer', demo: true, createdAt: new Date().toISOString(), history: []
    };
    addHistory(record, 'demo', 'loaded', 'synthetic');
    state.records.unshift(record);
    if (!saveState()) { state.records.shift(); return; }
    render(); announce(t('demoBadge'));
  }
  function handleFarmerAction(event) {
    const button = event.target.closest('[data-farmer-action]');
    if (!button) return;
    const record = state.records.find((item) => item.id === button.dataset.id);
    if (!record || record.status === 'verified') return;
    const note = document.querySelector(`[data-farmer-note="${CSS.escape(record.id)}"]`)?.value?.trim() || '';
    if (button.dataset.farmerAction === 'confirm') {
      record.status = 'farmer_confirmed'; addHistory(record, 'farmer-view', 'confirmed delivery record', note); announce(t('confirmedMessage'));
    } else {
      record.status = 'disputed'; addHistory(record, 'farmer-view', 'disputed record', note); announce(t('disputedMessage'));
    }
    saveState(); render();
  }
  function handleReviewAction(event) {
    const button = event.target.closest('[data-review-action]');
    if (!button) return;
    const record = state.records.find((item) => item.id === button.dataset.id);
    if (!record || record.status === 'verified') return;
    const note = document.querySelector(`[data-review-note="${CSS.escape(record.id)}"]`)?.value?.trim() || '';
    if (button.dataset.reviewAction === 'verify') {
      if (!canVerify(record)) { announce(t('approveBlocked')); return; }
      record.status = 'verified'; addHistory(record, 'reviewer-view', 'verified', note);
    } else {
      record.status = 'revision'; addHistory(record, 'reviewer-view', 'revision requested / held', note);
    }
    saveState(); render(); announce(t('reviewSaved'));
  }
  function handleIncidentSubmit(event) {
    event.preventDefault();
    const details = $('benefitIssueDetails').value.trim();
    if (!details) { announce(t('requiredError')); return; }
    const incident = {
      id: newId('ISSUE'), rmu: $('benefitIssueRmu').value || '미배정', typeKey: $('benefitIssueType').value,
      details: details.slice(0, 1500), reviewNote: '', status: 'open', createdAt: new Date().toISOString(), history: [{ role: 'farmer-view', action: 'reported', at: new Date().toISOString() }]
    };
    state.incidents.unshift(incident);
    if (!saveState()) { state.incidents.shift(); return; }
    event.target.reset(); render(); announce(t('reportSaved'));
  }
  function handleIncidentAction(event) {
    const button = event.target.closest('[data-incident-action]');
    if (!button) return;
    const incident = state.incidents.find((item) => item.id === button.dataset.id);
    if (!incident) return;
    incident.status = button.dataset.incidentAction;
    incident.reviewNote = language === 'vi' ? 'Đã cập nhật trạng thái trong bản trình diễn.' : '시연 화면에서 검토 상태를 변경했습니다.';
    incident.history.push({ role: 'reviewer-view', action: incident.status, at: new Date().toISOString() });
    saveState(); render(); announce(t('reviewSaved'));
  }
  function exportRecords() {
    const columns = ['cycle_label','rmu','service_area','baseline_start','baseline_end','current_start','current_end','baseline_water_m3','actual_water_m3','water_delta_m3','baseline_kwh','actual_kwh','electricity_delta_vnd','baseline_fuel_l','actual_fuel_l','fuel_delta_vnd','status','demo'];
    const rows = state.records.map((record) => {
      const c = calculate(record);
      return [record.cycleLabel,record.rmu,record.serviceArea,record.baselineStart,record.baselineEnd,record.currentStart,record.currentEnd,record.baselineWaterM3,record.actualWaterM3,c.waterDelta,record.baselineKwh,record.actualKwh,c.electricity,record.baselineFuelL,record.actualFuelL,c.fuel,record.status,record.demo ? 'yes' : 'no'];
    });
    const quote = (value) => `"${String(value ?? '').replaceAll('"','""')}"`;
    const csv = [columns, ...rows].map((row) => row.map(quote).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'water-saving-comparison.csv'; link.click(); URL.revokeObjectURL(url);
  }
  function init() {
    document.querySelectorAll('[data-benefit-language]').forEach((button) => button.addEventListener('click', () => {
      language = button.dataset.benefitLanguage === 'vi' ? 'vi' : 'ko';
      try { localStorage.setItem('mekong-suksuk.benefit-language', language); } catch (_) {}
      render();
    }));
    document.querySelectorAll('[data-benefit-role]').forEach((button) => button.addEventListener('click', () => { activeRole = button.dataset.benefitRole; renderRoles(); }));
    $('benefitForm').addEventListener('submit', handleRecordSubmit);
    $('benefitForm').addEventListener('input', previewValues);
    $('benefitForm').addEventListener('change', previewValues);
    $('benefitLoadDemo').addEventListener('click', loadDemo);
    $('benefitExport').addEventListener('click', exportRecords);
    $('benefitFarmerFarm').addEventListener('change', renderFarmer);
    $('benefitFarmerRecords').addEventListener('click', handleFarmerAction);
    $('benefitIncidentForm').addEventListener('submit', handleIncidentSubmit);
    $('benefitReviewQueue').addEventListener('click', handleReviewAction);
    $('benefitIncidentQueue').addEventListener('click', handleIncidentAction);
    document.querySelectorAll('[data-benefit-zone-select]').forEach((select) => fillSelect(select, RMUS.map((rmu) => ({ value: rmu, label: rmu })), t('selectRmu'), select.value));
    render();
    window.MekongBenefit = { render, getState: () => JSON.parse(JSON.stringify(state)) };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
