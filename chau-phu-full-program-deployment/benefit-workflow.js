(() => {
  'use strict';

  const STORE_KEY = 'mekong-suksuk.benefits.v1';
  const FARM_KEYS = ['mekong-suksuk.farms.v4', 'mekong-suksuk.farms.v3'];
  const RMUS = Array.from({ length: 18 }, (_, i) => `RMU-${String(i + 1).padStart(2, '0')}`);
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const dict = {
    ko: {
      title: '절수 편익 · 운영 검증', subtitle: '주간 배분 계획과 실제 급수 현황, 절수 편익 기록을 한곳에서 관리하는 시범 화면입니다.',
      sim: '시범 화면 · 실제 정산 아님', noticeTitle: '계산과 권한의 경계', notice: '45·30·15·10은 주간 물 배분의 평가 가중치입니다. 절수 편익 배분 비율로 쓰지 않습니다. 물량은 기준기간 대비 차이, 전기·연료는 각각의 운영비 차이로 계산합니다. 확인되지 않은 금액은 지급액으로 표시하지 않습니다.',
      local: '이 브라우저에만 저장됩니다. 역할 전환은 화면 시연이며 로그인·공유 데이터베이스·실제 권한 분리는 아직 없습니다.',
      farmer: '농가 안내', operator: '운영자 기록', reviewer: '독립 감시자', farmViewTitle: '농가별 공동 급수 확인', chooseFarm: '농가 선택', noFarm: '농가 정보 없음 · 먼저 농가 등록 화면에서 불러오세요.',
      farmerHelp: '선택한 농가의 RMU 급수 기록을 확인하고, 필요한 주차의 급수 요청을 등록합니다. 확인은 편익 금액이나 지급 동의가 아닙니다.', noRecord: '이 RMU에 비교 기록이 없습니다.', individualBenefit: '공동 펌프의 RMU 합계만 기록됩니다. 농가별 계량이나 합의 규칙이 없으므로 개인 절수량·현금 편익은 계산하지 않습니다.', confirmFacts: '기록 확인', dispute: '이의 제기', farmerNote: '확인할 점 또는 이의 사유 (선택)', reportTitle: '급수 문제·순서 변경 제보', reportToggle: '제보 내용 작성', issueType: '제보 유형', issueBypass: '무단 우회 취수 의심', issueOrder: '급수 순서·일정 변경', issueMismatch: '계량·기록 불일치', issueShortage: '공급 부족·중단', issueOther: '기타 확인 요청', issueDetails: '관찰한 사실을 적어주세요. 제보만으로 위반이나 책임이 확정되지는 않습니다.', submitReport: '검토 요청 등록',
      operatorTitle: '주간 급수 운영', operatorHelp: '공급량 자료를 등록한 RMU의 주간 배분 계획을 확인하고 실제 급수량과 처리 상태를 기록합니다.', operatorHistoryHelp: '작기 종료 후 같은 급수 범위와 비교 가능한 기간을 입력합니다. RMU는 사진 기준 집계 구역이며 실제 펌프 공급권역은 확인되지 않았습니다.', seasonCompareTitle: '작기별 절수 편익 계산', sampleButton: '예시 시나리오 불러오기', exportButton: '기록 CSV 내보내기', cycleLabel: '현재 작기 / 비교 이름', rmuLabel: '시범 집계 RMU', serviceArea: '펌프·수로 구간명 (확인 전에는 추정)', baselinePeriod: '기준기간', currentPeriod: '현재기간', startDate: '시작일', endDate: '종료일', baselineWater: '기준기간 취수량 (m³)', actualWater: '현재기간 취수량 (m³)', baselineKwh: '기준 전력 (kWh)', actualKwh: '현재 전력 (kWh)', electricityRate: '전력 단가 (VND/kWh)', baselineFuel: '기준 연료 (L)', actualFuel: '현재 연료 (L)', fuelRate: '연료 단가 (VND/L)', extraCost: '추가 운영·계측 비용 (VND)', sourceTitle: '자료 근거', measureBasis: '계측 방식', basisMeter: '유량계·전력계 계측', basisLedger: '운영 대장·영수증', basisEstimate: '추정·자료 미확인', baselineEvidence: '기준 자료 출처/기록 번호', actualEvidence: '현재 자료 출처/기록 번호', checksTitle: '비교 가능성 확인', checkScope: '동일 펌프·수로와 급수 범위', checkCrop: '작물·면적·생육단계를 맞춤', checkWeather: '강우·날씨·공급일수 차이를 확인/조정', noteLabel: '운영 메모 (개인정보 제외)', saveRecord: '농가 확인 요청으로 저장', previewTitle: '계산 미리보기', previewHelp: '비교 입력값 기준의 추정입니다. 전기·연료 비용은 각각 표시하며, 절수량과 비용을 섞지 않습니다.', recordsTitle: '작기 기록', noRecords: '아직 기록이 없습니다.',
      volumeSaved: '기준 대비 물량 차이', waterRate: '물량 변화율', electricityDelta: '전기료 변화 추정', fuelDelta: '연료비 변화 추정', netCost: '추가비용 반영 운영비 차이', saved: '감소 추정', increased: '증가 추정', equal: '변화 없음', notCalculated: '입력 필요', compareReady: '비교 조건 확인', compareHold: '비교 조건 미확인', statusWaitingFarmer: '농가 확인 대기', statusFarmerConfirmed: '독립 검증 대기', statusDisputed: '농가 이의 제기', statusVerified: '독립 검증 완료 · 지급 아님', statusRevision: '수정·보류 요청', demoBadge: '예시 입력 · 실측 자료 아님',
      reviewerTitle: '삼자 확인·검증 대기열', reviewerHelp: '운영자 입력 → 농가 사실 확인 → 독립 감시자 검증 순서입니다. 검증 완료는 편익 지급이나 급수 우선순위 변경을 뜻하지 않습니다.', queueTitle: '비교 기록 검토', reviewNote: '검토 근거 또는 수정 요청', approve: '근거 확인 완료', hold: '수정·보류 요청', approveBlocked: '비교조건·자료 근거·농가 확인을 갖춘 실제 기록만 검증할 수 있습니다.', incidentTitle: '급수 제보 검토', noIncidents: '검토할 제보가 없습니다.', investigate: '확인 진행', closeIncident: '검토 종료', open: '접수', investigating: '확인 중', closed: '검토 종료',
      policyTitle: '성과 확인과 보류 기준', monitorRoles: '운영자: 계량·펌프·전기/연료 장부 기록 · 농가: 실제 공급량·일정 확인 및 이의 제기 · 독립 감시자: 비교 조건·근거·처리 이력 검토', success: '성과지표: 비교 조건이 맞는 검증 물량, 농가 확인률, 독립 검증 완료 기록', stop: '보류 조건: 유량계/대장 부재, 기준기간 불일치, 공급 부족·이의 제기 미해결, 비용 근거 누락. 보류는 자동 급수 제한이나 벌점으로 연결하지 않습니다.', payout: '농가별 분배 규칙과 실제 자금원은 확정되지 않아 자동 이체·환급·편익 배분은 구현하지 않았습니다.', savedMessage: '기록을 저장했습니다. 농가 확인 대기 상태입니다.', reportSaved: '제보를 접수했습니다. 사실 판단은 별도 검토가 필요합니다.', reviewSaved: '검토 상태를 저장했습니다.', selectRmu: 'RMU 선택', selectFarm: '농가를 선택하세요', requiredError: '기간과 기준/현재 물량을 입력해 주세요.', storageError: '이 브라우저에 저장하지 못했습니다. 저장 공간을 확인해 주세요.', confirmedMessage: '공급 기록을 확인했습니다. 금액 지급 동의는 아닙니다.', disputedMessage: '이의 상태를 기록했습니다. 급수 제한으로 이어지지 않습니다.',
      periodLength: '기간 일수', lengthMatched: '동일 기간 일수', lengthMismatch: '기간 일수 다름', noMeterWarning: '추정 자료는 비교 참고용이며 검증 완료될 수 없습니다.',
      formulaNote: '계산식: 물량 차이 = 기준기간 − 현재기간. 전기료·연료비 변화 = (기준 사용량 − 현재 사용량) × 입력 단가. 공급 부족은 절수로 보지 않으며, 절수량은 금액으로 자동 환산하지 않습니다.',
      reportDisclaimer: '제보는 확인 요청이며, 자동 위반 판정·벌점·급수 제한으로 사용되지 않습니다.',
      deliveryQuality: '현재 기간 공급 서비스 상태', qualityAdequate: '필요한 급수 서비스가 정상 제공됨', qualityShortage: '공급 부족·중단이 있었음', qualityUnknown: '확인되지 않음', qualityHold: '공급 부족 여부가 확인되지 않아 절수량 검증을 보류합니다.',
      opsWeek: '운영 주차', opsRmu: 'RMU 구역', opsAllRmus: '전체 RMU', opsMetricFarms: '급수 대상 농가', opsMetricPlanned: '배분 계획량', opsMetricDelivered: '실제 급수량 기록', opsMetricProcessed: '처리 완료', opsChartTitle: '계획 대비 실제 급수량', opsChartPlan: '계획', opsChartActual: '실제', opsChartEmpty: '표시할 급수 계획이 없습니다.', opsWorkTitle: '주간 급수 작업', opsWorkHelp: '실제 급수량은 현장에서 확인한 뒤 입력하세요. 배분 계획량을 실제량으로 자동 복사하지 않습니다.', opsNoPlan: '이번 주 배분안이 없습니다. 해당 RMU의 주간 공급량 자료와 계산 가능한 농가 수요를 확인하세요.', opsRequestAmount: '요청량', opsPlannedAmount: '배분 예정', opsActualAmount: '실제 급수량 (m³)', opsStatus: '처리 상태', opsNote: '간단 메모', opsSave: '급수 기록 저장', opsPending: '대기', opsInProgress: '급수 중', opsComplete: '완료', opsPartial: '부분 급수', opsNoWater: '미급수', opsNeedVolume: '완료·부분 급수·미급수 처리는 실제 급수량을 입력해 주세요.', opsNoWaterReason: '미급수 처리에는 사유를 적어 주세요.', opsInvalidVolume: '실제 급수량은 0 이상의 숫자로 입력해 주세요.', requestRequired: '농가, 주차, 0보다 큰 요청량을 확인해 주세요.', requestDeclineReason: '공급 불가 사유를 운영자 메모에 적어 주세요.', opsSaved: '급수 운영 기록을 저장했습니다.', requestTitle: '농가 급수 요청', requestHelp: '농가와 희망 주차를 선택하고 필요한 양을 적어 요청을 등록합니다.', requestWeek: '희망 주차', requestVolume: '요청 급수량 (m³)', requestDetails: '요청 사유 또는 전달사항 (선택)', requestSubmit: '급수 요청 등록', requestFarmNeeded: '요청을 등록하려면 먼저 농가를 선택하세요.', farmerRequestsTitle: '내 급수 요청', farmerRequestsEmpty: '등록한 급수 요청이 없습니다.', requestQueueTitle: '농가 요청 처리', requestQueueHelp: '요청을 확인해 처리 상태와 실제 공급량을 기록합니다.', requestQueueEmpty: '선택한 주차에 접수된 요청이 없습니다.', requestStatus: '요청 처리 상태', requestDelivered: '실제 공급량 (m³)', requestOperatorNote: '운영자 메모', requestSave: '요청 처리 저장', requestPending: '접수 대기', requestProcessing: '처리 중', requestCompleted: '처리 완료', requestPartial: '부분 공급', requestDeclined: '공급 불가', requestSaved: '급수 요청을 등록했습니다.', requestUpdated: '농가 요청 처리 기록을 저장했습니다.', requestStatusPending: '접수 대기', requestStatusProcessing: '처리 중', requestStatusCompleted: '처리 완료', requestStatusPartial: '부분 공급', requestStatusDeclined: '공급 불가', advancedTitle: '작기별 절수 편익 계산 · 자료 검증', advancedHelp: '작기 종료 후 비교 자료를 입력하거나 저장된 절수 편익 기록을 검토합니다.'
    },
    vi: {
      title: 'Lợi ích tiết kiệm nước · Vận hành và xác minh', subtitle: 'Quản lý kế hoạch phân bổ hàng tuần, lượng nước đã cấp và hồ sơ lợi ích tiết kiệm trên cùng một màn hình thử nghiệm.',
      sim: 'Bản thử nghiệm · không quyết toán', noticeTitle: 'Ranh giới tính toán và quyền hạn', notice: '45·30·15·10 là trọng số đánh giá cho phương án phân bổ nước hàng tuần, không phải tỷ lệ chia lợi ích tiết kiệm. Khối lượng nước được so sánh với kỳ cơ sở; điện và nhiên liệu được tính riêng. Số tiền chưa xác minh không được coi là khoản chi trả.',
      local: 'Dữ liệu chỉ lưu trong trình duyệt này. Chuyển vai trò chỉ để trình diễn; chưa có đăng nhập, cơ sở dữ liệu dùng chung hay phân quyền thực tế.',
      farmer: 'Thông tin nông hộ', operator: 'Nhật ký vận hành', reviewer: 'Giám sát độc lập', farmViewTitle: 'Xác nhận cấp nước chung của nông hộ', chooseFarm: 'Chọn nông hộ', noFarm: 'Chưa có dữ liệu nông hộ · hãy tải dữ liệu ở màn hình đăng ký.',
      farmerHelp: 'Xem hồ sơ cấp nước theo RMU và gửi yêu cầu cho tuần mong muốn. Xác nhận hồ sơ không phải đồng ý khoản lợi ích hay thanh toán.', noRecord: 'Chưa có hồ sơ so sánh cho RMU này.', individualBenefit: 'Chỉ ghi tổng lượng của RMU dùng chung. Không tính lượng tiết kiệm hay lợi ích tiền mặt cho từng hộ khi chưa có đồng hồ riêng hoặc quy tắc thỏa thuận.', confirmFacts: 'Xác nhận hồ sơ', dispute: 'Gửi ý kiến', farmerNote: 'Điểm cần kiểm tra hoặc lý do phản hồi (không bắt buộc)', reportTitle: 'Báo cáo vấn đề cấp nước/thay đổi thứ tự', reportToggle: 'Mở biểu mẫu báo cáo', issueType: 'Loại báo cáo', issueBypass: 'Nghi ngờ lấy nước qua đường vòng', issueOrder: 'Thay đổi thứ tự/lịch cấp', issueMismatch: 'Sai lệch giữa đồng hồ và sổ ghi', issueShortage: 'Thiếu nước/ngừng cấp', issueOther: 'Yêu cầu kiểm tra khác', issueDetails: 'Mô tả điều đã quan sát. Chỉ báo cáo không xác định vi phạm hay trách nhiệm.', submitReport: 'Gửi yêu cầu xem xét',
      operatorTitle: 'Vận hành cấp nước hàng tuần', operatorHelp: 'Xem phương án ở RMU đã đăng ký nguồn cung hàng tuần, sau đó ghi lượng thực cấp và trạng thái xử lý.', operatorHistoryHelp: 'Sau khi kết thúc vụ, nhập cùng phạm vi cấp nước và kỳ có thể so sánh. RMU là khu tổng hợp theo ảnh; ranh giới phục vụ của bơm thực tế chưa được xác nhận.', seasonCompareTitle: 'Tính lợi ích tiết kiệm theo vụ', sampleButton: 'Tải tình huống ví dụ', exportButton: 'Xuất CSV hồ sơ', cycleLabel: 'Vụ hiện tại / tên so sánh', rmuLabel: 'RMU tổng hợp thử nghiệm', serviceArea: 'Tên đoạn bơm/kênh (chưa xác minh)', baselinePeriod: 'Kỳ cơ sở', currentPeriod: 'Kỳ hiện tại', startDate: 'Ngày bắt đầu', endDate: 'Ngày kết thúc', baselineWater: 'Lượng nước kỳ cơ sở (m³)', actualWater: 'Lượng nước kỳ hiện tại (m³)', baselineKwh: 'Điện kỳ cơ sở (kWh)', actualKwh: 'Điện kỳ hiện tại (kWh)', electricityRate: 'Giá điện (VND/kWh)', baselineFuel: 'Nhiên liệu kỳ cơ sở (L)', actualFuel: 'Nhiên liệu kỳ hiện tại (L)', fuelRate: 'Giá nhiên liệu (VND/L)', extraCost: 'Chi phí vận hành/đo đạc bổ sung (VND)', sourceTitle: 'Bằng chứng dữ liệu', measureBasis: 'Phương thức đo', basisMeter: 'Đồng hồ lưu lượng/điện', basisLedger: 'Sổ vận hành/hóa đơn', basisEstimate: 'Ước tính/chưa xác minh', baselineEvidence: 'Nguồn/số hồ sơ kỳ cơ sở', actualEvidence: 'Nguồn/số hồ sơ kỳ hiện tại', checksTitle: 'Kiểm tra khả năng so sánh', checkScope: 'Cùng bơm/kênh và phạm vi cấp nước', checkCrop: 'Đã khớp cây trồng, diện tích, giai đoạn sinh trưởng', checkWeather: 'Đã xem xét/điều chỉnh mưa, thời tiết, số ngày cấp', noteLabel: 'Ghi chú vận hành (không nhập dữ liệu cá nhân)', saveRecord: 'Lưu và yêu cầu nông hộ xác nhận', previewTitle: 'Tính toán sơ bộ', previewHelp: 'Ước tính theo dữ liệu nhập. Điện và nhiên liệu hiển thị riêng; không cộng lẫn với lượng nước tiết kiệm.', recordsTitle: 'Hồ sơ theo vụ', noRecords: 'Chưa có hồ sơ.',
      volumeSaved: 'Chênh lệch nước so với kỳ cơ sở', waterRate: 'Tỷ lệ thay đổi lượng nước', electricityDelta: 'Ước tính thay đổi tiền điện', fuelDelta: 'Ước tính thay đổi tiền nhiên liệu', netCost: 'Chênh lệch chi phí vận hành sau chi phí bổ sung', saved: 'Ước tính giảm', increased: 'Ước tính tăng', equal: 'Không đổi', notCalculated: 'Cần nhập dữ liệu', compareReady: 'Điều kiện so sánh đã kiểm tra', compareHold: 'Chưa kiểm tra điều kiện so sánh', statusWaitingFarmer: 'Chờ nông hộ xác nhận', statusFarmerConfirmed: 'Chờ xác minh độc lập', statusDisputed: 'Nông hộ có ý kiến', statusVerified: 'Đã xác minh độc lập · không phải thanh toán', statusRevision: 'Yêu cầu sửa/tạm dừng', demoBadge: 'Dữ liệu ví dụ · không phải số đo thực',
      reviewerTitle: 'Quy trình xác nhận ba bên', reviewerHelp: 'Người vận hành nhập → nông hộ xác nhận sự việc → giám sát độc lập kiểm tra. Xác minh không đồng nghĩa với chi trả lợi ích hoặc thay đổi thứ tự cấp nước.', queueTitle: 'Hàng đợi hồ sơ so sánh', reviewNote: 'Căn cứ xem xét hoặc nội dung yêu cầu sửa', approve: 'Xác minh đủ căn cứ', hold: 'Yêu cầu sửa/tạm dừng', approveBlocked: 'Chỉ xác minh hồ sơ thực có điều kiện so sánh, bằng chứng và xác nhận của nông hộ.', incidentTitle: 'Xem xét báo cáo cấp nước', noIncidents: 'Không có báo cáo chờ xử lý.', investigate: 'Đang xác minh', closeIncident: 'Kết thúc xem xét', open: 'Đã tiếp nhận', investigating: 'Đang xác minh', closed: 'Đã kết thúc',
      policyTitle: 'Chỉ số kết quả và tiêu chí tạm dừng', monitorRoles: 'Người vận hành: ghi đồng hồ/bơm/điện và nhiên liệu · Nông hộ: xác nhận lượng/lịch cấp và phản hồi · Giám sát độc lập: kiểm tra điều kiện so sánh, bằng chứng và lịch sử xử lý', success: 'Chỉ số: lượng nước được xác minh trong điều kiện so sánh được, tỷ lệ nông hộ xác nhận, số hồ sơ được kiểm tra độc lập', stop: 'Tạm dừng khi thiếu đồng hồ/sổ ghi, kỳ cơ sở không phù hợp, thiếu nước/tranh chấp chưa giải quyết hoặc thiếu chứng từ chi phí. Không tự động hạn chế cấp nước hoặc phạt.', payout: 'Chưa thống nhất quy tắc chia cho từng hộ và nguồn tiền thực tế; chưa triển khai chuyển khoản, hoàn tiền hoặc tự chia lợi ích.', savedMessage: 'Đã lưu hồ sơ. Đang chờ nông hộ xác nhận.', reportSaved: 'Đã tiếp nhận báo cáo. Cần xem xét riêng trước khi kết luận.', reviewSaved: 'Đã lưu trạng thái xem xét.', selectRmu: 'Chọn RMU', selectFarm: 'Chọn nông hộ', requiredError: 'Vui lòng nhập kỳ và lượng nước cơ sở/hiện tại.', storageError: 'Không lưu được trong trình duyệt này. Hãy kiểm tra dung lượng lưu trữ.', confirmedMessage: 'Đã xác nhận hồ sơ cấp nước. Đây không phải đồng ý thanh toán.', disputedMessage: 'Đã ghi nhận ý kiến. Không dẫn đến hạn chế cấp nước.',
      periodLength: 'Số ngày', lengthMatched: 'Số ngày bằng nhau', lengthMismatch: 'Số ngày khác nhau', noMeterWarning: 'Dữ liệu ước tính chỉ để tham khảo và không thể được xác minh.',
      formulaNote: 'Công thức: chênh lệch nước = kỳ cơ sở − kỳ hiện tại. Thay đổi chi phí điện/nhiên liệu = (mức dùng kỳ cơ sở − kỳ hiện tại) × đơn giá nhập. Thiếu nước không được tính là tiết kiệm; lượng nước không tự quy đổi thành tiền.',
      reportDisclaimer: 'Báo cáo chỉ yêu cầu kiểm tra; không tự động kết luận vi phạm, phạt hoặc hạn chế cấp nước.',
      deliveryQuality: 'Tình trạng dịch vụ cấp nước kỳ hiện tại', qualityAdequate: 'Dịch vụ cấp nước cần thiết đã được cung cấp', qualityShortage: 'Có thiếu nước/ngừng cấp', qualityUnknown: 'Chưa xác minh', qualityHold: 'Chưa xác nhận thiếu nước hay không; tạm giữ việc xác minh tiết kiệm.',
      opsWeek: 'Tuần vận hành', opsRmu: 'Khu RMU', opsAllRmus: 'Tất cả RMU', opsMetricFarms: 'Nông hộ cần cấp nước', opsMetricPlanned: 'Lượng phân bổ', opsMetricDelivered: 'Lượng thực cấp đã ghi', opsMetricProcessed: 'Đã xử lý', opsChartTitle: 'So sánh kế hoạch và lượng thực cấp', opsChartPlan: 'Kế hoạch', opsChartActual: 'Thực tế', opsChartEmpty: 'Không có kế hoạch cấp nước để hiển thị.', opsWorkTitle: 'Công việc cấp nước theo tuần', opsWorkHelp: 'Nhập lượng đã cấp sau khi xác nhận tại hiện trường. Kế hoạch không tự động được sao chép thành lượng thực tế.', opsNoPlan: 'Chưa có phương án tuần này. Hãy kiểm tra dữ liệu nguồn cung của RMU và nhu cầu nông hộ đã tính được.', opsRequestAmount: 'Lượng yêu cầu', opsPlannedAmount: 'Lượng dự kiến', opsActualAmount: 'Lượng thực cấp (m³)', opsStatus: 'Trạng thái xử lý', opsNote: 'Ghi chú ngắn', opsSave: 'Lưu hồ sơ cấp nước', opsPending: 'Chờ xử lý', opsInProgress: 'Đang cấp nước', opsComplete: 'Hoàn tất', opsPartial: 'Cấp một phần', opsNoWater: 'Không cấp', opsNeedVolume: 'Vui lòng nhập lượng thực cấp cho trạng thái hoàn tất, cấp một phần hoặc không cấp.', opsNoWaterReason: 'Vui lòng ghi lý do khi chọn không cấp.', opsInvalidVolume: 'Vui lòng nhập lượng thực cấp là số từ 0 trở lên.', requestRequired: 'Vui lòng kiểm tra nông hộ, tuần và lượng yêu cầu lớn hơn 0.', requestDeclineReason: 'Vui lòng ghi lý do không thể cấp trong ghi chú vận hành.', opsSaved: 'Đã lưu hồ sơ vận hành cấp nước.', requestTitle: 'Yêu cầu cấp nước của nông hộ', requestHelp: 'Chọn tuần mong muốn, nhập lượng nước cần và gửi yêu cầu.', requestWeek: 'Tuần mong muốn', requestVolume: 'Lượng nước yêu cầu (m³)', requestDetails: 'Lý do hoặc ghi chú (không bắt buộc)', requestSubmit: 'Gửi yêu cầu cấp nước', requestFarmNeeded: 'Vui lòng chọn nông hộ trước khi gửi yêu cầu.', farmerRequestsTitle: 'Yêu cầu của tôi', farmerRequestsEmpty: 'Chưa có yêu cầu cấp nước.', requestQueueTitle: 'Xử lý yêu cầu của nông hộ', requestQueueHelp: 'Kiểm tra yêu cầu, cập nhật trạng thái và ghi lượng nước thực cấp.', requestQueueEmpty: 'Không có yêu cầu nào trong tuần đã chọn.', requestStatus: 'Trạng thái xử lý', requestDelivered: 'Lượng thực cấp (m³)', requestOperatorNote: 'Ghi chú của người vận hành', requestSave: 'Lưu xử lý yêu cầu', requestPending: 'Chờ tiếp nhận', requestProcessing: 'Đang xử lý', requestCompleted: 'Đã xử lý', requestPartial: 'Cấp một phần', requestDeclined: 'Không thể cấp', requestSaved: 'Đã gửi yêu cầu cấp nước.', requestUpdated: 'Đã lưu thông tin xử lý yêu cầu.', requestStatusPending: 'Chờ tiếp nhận', requestStatusProcessing: 'Đang xử lý', requestStatusCompleted: 'Đã xử lý', requestStatusPartial: 'Cấp một phần', requestStatusDeclined: 'Không thể cấp', advancedTitle: 'Tính lợi ích tiết kiệm theo vụ · xác minh dữ liệu', advancedHelp: 'Nhập dữ liệu so sánh sau vụ hoặc xem lại hồ sơ lợi ích tiết kiệm đã lưu.'
    }
  };

  dict.en = window.MekongI18n?.benefitEnglish || {};
  dict.ko.operatorReportPrivacy='신고 유형과 처리 상태만 표시합니다. 신고 원문과 식별 정보는 제3자 현장관리자가 확인합니다.';
  dict.vi.operatorReportPrivacy='Chỉ hiển thị loại và trạng thái. Giám sát hiện trường độc lập xem báo cáo gốc và thông tin định danh.';
  Object.keys(dict.ko).forEach(key => window.MekongI18n?.add(dict.ko[key],dict.vi[key]||dict.ko[key],dict.en[key]||dict.ko[key]));
  let language = window.MekongI18n?.language || 'ko';
  if(!window.MekongI18n) try { language = localStorage.getItem('mekong-suksuk.benefit-language') || 'ko'; } catch (_) {}
  let activeRole = 'operator';
  let state = loadState();
  const t = (key) => (dict[language] || dict.ko)[key] || dict.ko[key] || key;

  function emptyState() { return { schema: 'mekong-suksuk-benefits/v1', records: [], incidents: [], operations: [], requests: [] }; }
  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (parsed && Array.isArray(parsed.records) && Array.isArray(parsed.incidents)) return { ...emptyState(), ...parsed, operations: Array.isArray(parsed.operations) ? parsed.operations : [], requests: Array.isArray(parsed.requests) ? parsed.requests : [] };
    } catch (_) {}
    return emptyState();
  }
  function saveState() {
    if(window.MekongCloud?.enabled){announce(window.MekongCloud.t('error'));return false;}
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
  function numberText(value, digits) {
    if (!Number.isFinite(value)) return '—';
    const fractionDigits = Number.isFinite(digits) ? digits : (value !== 0 && Math.abs(value) < 1 ? 3 : 1);
    return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : language === 'en' ? 'en-GB' : 'ko-KR', { maximumFractionDigits: fractionDigits }).format(value);
  }
  function moneyText(value) {
    if (!Number.isFinite(value)) return t('notCalculated');
    const sign = value < 0 ? '−' : '';
    return `${sign}${new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : language === 'en' ? 'en-GB' : 'ko-KR', { maximumFractionDigits: 0 }).format(Math.abs(value))} VND`;
  }
  function formatDate(value) {
    if (!value) return '—';
    try { return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : language === 'en' ? 'en-GB' : 'ko-KR', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`)); }
    catch (_) { return value; }
  }
  function readFarms() {
    if(window.MekongCloud?.enabled)return window.__MEKONG_TEST__?.farms||[];
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
    const hasBaseWater = record.baselineWaterM3 !== null && record.baselineWaterM3 !== undefined && record.baselineWaterM3 !== '';
    const hasActualWater = record.actualWaterM3 !== null && record.actualWaterM3 !== undefined && record.actualWaterM3 !== '';
    const baseWater = Number(record.baselineWaterM3), actualWater = Number(record.actualWaterM3);
    const waterDelta = hasBaseWater && hasActualWater && Number.isFinite(baseWater) && Number.isFinite(actualWater) ? baseWater - actualWater : null;
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
      record.measureBasis !== 'estimate' && record.deliveryQuality === 'adequate' && record.baselineEvidence?.trim() && record.actualEvidence?.trim();
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
    document.querySelectorAll('#content [data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll('#content [data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
    document.querySelectorAll('#content [data-benefit-language]').forEach((button) => {
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
  function setRole(role) {
    if (!['farmer', 'operator', 'reviewer'].includes(role)) return;
    activeRole = role;
    renderRoles();
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
      <p class="benefit-record-meta">${esc(record.deliveryQuality === 'adequate' ? t('qualityAdequate') : t('qualityHold'))}</p>
      ${context === 'farmer' && record.status !== 'verified' ? `<label class="benefit-field benefit-note-field"><span>${esc(t('farmerNote'))}</span><textarea data-farmer-note="${esc(record.id)}" rows="2"></textarea></label><div class="benefit-actions"><button class="btn btn-secondary btn-small" data-farmer-action="confirm" data-id="${esc(record.id)}">${esc(t('confirmFacts'))}</button><button class="btn btn-secondary btn-small" data-farmer-action="dispute" data-id="${esc(record.id)}">${esc(t('dispute'))}</button></div>` : ''}
      ${context === 'reviewer' ? `<div class="benefit-review-tools"><label class="benefit-field"><span>${esc(t('reviewNote'))}</span><textarea data-review-note="${esc(record.id)}" rows="2"></textarea></label><div class="benefit-actions">${canVerify(record) ? `<button class="btn btn-primary btn-small" data-review-action="verify" data-id="${esc(record.id)}">${esc(t('approve'))}</button>` : `<span class="benefit-blocked">${esc(t('approveBlocked'))}</span>`}${record.status !== 'verified' ? `<button class="btn btn-secondary btn-small" data-review-action="revision" data-id="${esc(record.id)}">${esc(t('hold'))}</button>` : ''}</div></div>` : ''}
    </article>`;
  }
  function renderFarmer() {
    fillWeekChoices('benefitRequestWeek', t('requestWeek'), $('benefitRequestWeek')?.value || '1');
    const farms = window.MekongPortal?.scopeFarms(readFarms()) || readFarms();
    const select = $('benefitFarmerFarm');
    const old = window.MekongPortal?.farmId || select.value;
    fillSelect(select, farms.map((farm) => ({ value: String(farm.id), label: (farm.name || farm.id) + (farm.rmu ? ' · ' + farm.rmu : ' · 미배정') })), farms.length ? t('selectFarm') : t('noFarm'), old);
    const selected = farms.find((farm) => String(farm.id) === select.value);
    const output = $('benefitFarmerRecords');
    const requestButton = $('benefitRequestSubmit');
    if (requestButton) requestButton.disabled = !selected;
    const requestList = $('benefitFarmerRequests');
    if (!selected) {
      output.innerHTML = '<div class="benefit-empty">' + esc(t('noFarm')) + '</div>';
      $('benefitFarmerRMU').textContent = '—';
      if (requestList) requestList.innerHTML = '<div class="benefit-empty">' + esc(t('noFarm')) + '</div>';
      return;
    }
    $('benefitFarmerRMU').textContent = selected.rmu || '미배정';
    const records = selected.rmu ? state.records.filter((record) => record.rmu === selected.rmu) : [];
    output.innerHTML = records.length ? records.map((record) => recordCard(record, 'farmer')).join('') : '<div class="benefit-empty">' + esc(t('noRecord')) + '</div>';
    renderFarmerRequests(selected);
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
  function allocationWeeks() {
    const plan = window.__MEKONG_ALLOCATION_PLAN__;
    return Array.isArray(plan?.weeks) ? plan.weeks : Array.from({ length: 16 }, (_, index) => ({ index: index + 1, startDate: '', rows: [] }));
  }
  function fillWeekChoices(id, placeholder, preferred) {
    const weeks = allocationWeeks();
    const select = $(id);
    const options = weeks.map((week, index) => {
      const number = Number(week.index) || index + 1;
      const label = number + '주차' + (week.startDate ? ' · ' + formatDate(week.startDate) : '');
      return { value: String(number), label };
    });
    const old = preferred ?? select?.value ?? '1';
    fillSelect(select, options, placeholder, old || '1');
  }
  function operationId(weekStart, farmId) { return String(weekStart || 'undated') + '|' + String(farmId); }
  function operationStatusText(status) {
    return t(({ pending: 'opsPending', in_progress: 'opsInProgress', complete: 'opsComplete', partial: 'opsPartial', not_delivered: 'opsNoWater' })[status] || 'opsPending');
  }
  function requestStatusText(status) {
    return t(({ pending: 'requestStatusPending', processing: 'requestStatusProcessing', completed: 'requestStatusCompleted', partial: 'requestStatusPartial', declined: 'requestStatusDeclined' })[status] || 'requestStatusPending');
  }
  function statusSelectOptions(current, type) {
    const values = type === 'request'
      ? [['pending', 'requestStatusPending'], ['processing', 'requestStatusProcessing'], ['completed', 'requestStatusCompleted'], ['partial', 'requestStatusPartial'], ['declined', 'requestStatusDeclined']]
      : [['pending', 'opsPending'], ['in_progress', 'opsInProgress'], ['complete', 'opsComplete'], ['partial', 'opsPartial'], ['not_delivered', 'opsNoWater']];
    return values.map(([value, key]) => '<option value="' + value + '"' + (current === value ? ' selected' : '') + '>' + esc(t(key)) + '</option>').join('');
  }
  function renderFarmerRequests(farm) {
    const list = $('benefitFarmerRequests');
    if (!list) return;
    const requests = state.requests.filter((request) => String(request.farmId) === String(farm.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (!requests.length) { list.innerHTML = '<div class="benefit-empty">' + esc(t('farmerRequestsEmpty')) + '</div>'; return; }
    list.innerHTML = requests.map((request) => {
      const week = Number(request.weekIndex) || 1;
      const date = request.weekStart ? ' · ' + formatDate(request.weekStart) : '';
      return '<article class="benefit-request-farmer-card"><div class="benefit-record-top"><div><strong>' + esc(week + '주차' + date) + '</strong><small>' + esc(request.rmu || '미배정') + ' · ' + esc(formatDate((request.createdAt || '').slice(0, 10))) + '</small></div><span class="benefit-state">' + esc(requestStatusText(request.status)) + '</span></div><p class="benefit-record-meta">' + esc(t('requestVolume')) + ': ' + esc(numberText(Number(request.requestM3))) + ' m³' + (request.deliveredM3 !== null && request.deliveredM3 !== undefined ? ' · ' + esc(t('requestDelivered')) + ': ' + esc(numberText(Number(request.deliveredM3))) + ' m³' : '') + '</p><p class="benefit-record-meta">' + esc(request.reason || '—') + '</p>' + (request.operatorNote ? '<p class="benefit-record-meta"><strong>' + esc(t('requestOperatorNote')) + ':</strong> ' + esc(request.operatorNote) + '</p>' : '') + '</article>';
    }).join('');
  }
  function deliveryFor(weekStart, farmId) {
    const operation = state.operations.find(item => item.weekStart === weekStart && String(item.farmId) === String(farmId));
    if(operation && operation.actualM3 !== null && operation.actualM3 !== undefined) return {actualM3: Number(operation.actualM3), status: operation.status || 'pending'};
    const requests = state.requests.filter(item => item.weekStart === weekStart && String(item.farmId) === String(farmId));
    const delivered = requests.filter(item => ['completed','partial'].includes(item.status) && item.deliveredM3 !== null && item.deliveredM3 !== undefined);
    if(delivered.length) return {actualM3: delivered.reduce((n,item)=>n+Number(item.deliveredM3),0), status:requests.some(item=>['pending','processing','partial'].includes(item.status))?'partial':'complete'};
    return {actualM3:null,status:requests.some(item=>item.status==='processing')?'in_progress':'pending'};
  }
  function renderOperations() {
    const weeks = allocationWeeks();
    const weekSelect = $('benefitOpsWeek');
    const rmuSelect = $('benefitOpsRmu');
    if (!weekSelect || !rmuSelect) return;
    fillWeekChoices('benefitOpsWeek', t('opsWeek'), weekSelect.value || '1');
    fillSelect(rmuSelect, [{ value: 'all', label: t('opsAllRmus') }, ...RMUS.map((rmu) => ({ value: rmu, label: rmu }))], t('opsRmu'), rmuSelect.value || 'all');
    const weekNumber = Number(weekSelect.value) || 1;
    const planWeek = weeks.find((week, index) => (Number(week.index) || index + 1) === weekNumber) || null;
    const startDate = planWeek?.startDate || '';
    const allRows = (Array.isArray(planWeek?.rows) ? planWeek.rows : []).filter(row => window.MekongPortal?.allows(row) ?? true);
    const visibleRows = allRows.filter((row) => rmuSelect.value === 'all' || (row.rmu || '미배정') === rmuSelect.value).map((row) => {
      const id = operationId(startDate, row.farmId);
      const saved = state.operations.find((item) => item.id === id);
      const planned = saved && saved.plannedM3 !== null && saved.plannedM3 !== undefined && Number.isFinite(Number(saved.plannedM3)) ? Number(saved.plannedM3) : Number(row.plannedM3) || 0;
      const requested = saved && saved.requestM3 !== null && saved.requestM3 !== undefined && Number.isFinite(Number(saved.requestM3)) ? Number(saved.requestM3) : Number(row.requestM3) || 0;
      const delivery = deliveryFor(startDate,row.farmId);
      return { id, row, saved, planned, requested, actual: delivery.actualM3, deliveryStatus:delivery.status };
    });
    const plannedTotal = visibleRows.reduce((sum, item) => sum + item.planned, 0);
    const actualEntries = visibleRows.filter((item) => item.actual !== null && item.actual !== undefined && Number.isFinite(Number(item.actual))).length;
    const actualTotal = visibleRows.reduce((sum, item) => sum + (Number.isFinite(Number(item.actual)) ? Number(item.actual) : 0), 0);
    const processed = visibleRows.filter((item) => ['complete', 'partial', 'not_delivered'].includes(item.deliveryStatus)).length;
    $('benefitOpsMetrics').innerHTML =
      '<div class="benefit-mini-metric"><span>' + esc(t('opsMetricFarms')) + '</span><strong>' + visibleRows.length + '</strong></div>' +
      '<div class="benefit-mini-metric"><span>' + esc(t('opsMetricPlanned')) + '</span><strong>' + esc(numberText(plannedTotal)) + ' m³</strong></div>' +
      '<div class="benefit-mini-metric"><span>' + esc(t('opsMetricDelivered')) + '</span><strong>' + (actualEntries ? esc(numberText(actualTotal)) + ' m³' : '—') + '</strong></div>' +
      '<div class="benefit-mini-metric"><span>' + esc(t('opsMetricProcessed')) + '</span><strong>' + processed + ' / ' + visibleRows.length + '</strong></div>';
    const maxVolume = Math.max(1, ...visibleRows.map((item) => Math.max(item.planned, Number(item.actual) || 0)));
    $('benefitOpsChart').innerHTML = visibleRows.length ? visibleRows.map((item) => {
      const planWidth = Math.max(0, Math.min(100, item.planned / maxVolume * 100));
      const actualWidth = Math.max(0, Math.min(100, (Number(item.actual) || 0) / maxVolume * 100));
      const label = item.row.farmName || item.row.farmId;
      return '<div class="benefit-ops-chart-row"><div class="benefit-ops-chart-label"><strong>' + esc(label) + '</strong><small>' + esc(item.row.rmu || '미배정') + ' · ' + esc(t('opsRequestAmount')) + ' ' + esc(numberText(item.requested)) + ' m³</small></div><div class="benefit-ops-chart-lines"><div><span>' + esc(t('opsChartPlan')) + '</span><span class="benefit-ops-track"><i class="benefit-ops-bar plan" style="width:' + planWidth.toFixed(1) + '%"></i></span><b>' + esc(numberText(item.planned)) + '</b></div><div><span>' + esc(t('opsChartActual')) + '</span><span class="benefit-ops-track"><i class="benefit-ops-bar actual" style="width:' + actualWidth.toFixed(1) + '%"></i></span><b>' + esc(item.actual === null || item.actual === undefined ? '—' : numberText(Number(item.actual))) + '</b></div></div></div>';
    }).join('') : '<div class="benefit-empty">' + esc(t('opsChartEmpty')) + '</div>';
    $('benefitOpsWorklist').innerHTML = visibleRows.length ? visibleRows.map((item) => {
      const label = item.row.farmName || item.row.farmId;
      const currentStatus = item.deliveryStatus || 'pending';
      const actualValue = item.actual === null || item.actual === undefined ? '' : String(item.actual);
      return '<article class="benefit-operation-card" data-operation-card="' + esc(item.id) + '">' +
        '<div class="benefit-operation-top"><div><strong>' + esc(label) + '</strong><small>' + esc(item.row.rmu || '미배정') + ' · ' + esc(item.row.crop || '') + '</small></div><span class="benefit-state">' + esc(operationStatusText(currentStatus)) + '</span></div>' +
        '<div class="benefit-operation-volumes"><span>' + esc(t('opsRequestAmount')) + '<b>' + esc(numberText(item.requested)) + ' m³</b></span><span>' + esc(t('opsPlannedAmount')) + '<b>' + esc(numberText(item.planned)) + ' m³</b></span></div>' +
        '<div class="benefit-operation-fields"><label class="benefit-field"><span>' + esc(t('opsActualAmount')) + '</span><input type="number" min="0" step="0.1" inputmode="decimal" data-op-actual value="' + esc(actualValue) + '" placeholder="—"></label>' +
        '<label class="benefit-field"><span>' + esc(t('opsStatus')) + '</span><select data-op-status>' + statusSelectOptions(currentStatus, 'operation') + '</select></label>' +
        '<label class="benefit-field full"><span>' + esc(t('opsNote')) + '</span><input type="text" maxlength="240" data-op-note value="' + esc(item.saved?.note || '') + '"></label>' +
        '<div class="benefit-card-actions benefit-field full"><button type="button" class="btn btn-primary btn-small" data-operation-save="' + esc(item.id) + '">' + esc(t('opsSave')) + '</button></div></div></article>';
    }).join('') : '<div class="benefit-empty">' + esc(t('opsNoPlan')) + '</div>';
  }
  function renderRequests() {
    const list = $('benefitRequestQueue');
    if (!list) return;
    const weeks = allocationWeeks(), weekNumber = Number($('benefitOpsWeek')?.value) || 1;
    const planWeek = weeks.find((week, index) => (Number(week.index) || index + 1) === weekNumber);
    const weekStart = planWeek?.startDate || '';
    const rmu = $('benefitOpsRmu')?.value || 'all';
    const requests = state.requests.filter((request) => (window.MekongPortal?.allows(request) ?? true) && Number(request.weekIndex) === weekNumber && (!weekStart || !request.weekStart || request.weekStart === weekStart) && (rmu === 'all' || (request.rmu || '미배정') === rmu)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    $('benefitRequestCount').textContent = String(requests.filter((request) => ['pending', 'processing'].includes(request.status)).length);
    if (!requests.length) { list.innerHTML = '<div class="benefit-empty">' + esc(t('requestQueueEmpty')) + '</div>'; return; }
    list.innerHTML = requests.map((request) => {
      const status = request.status || 'pending';
      const delivered = request.deliveredM3 === null || request.deliveredM3 === undefined ? '' : String(request.deliveredM3);
      return '<article class="benefit-request-card" data-request-card="' + esc(request.id) + '">' +
        '<div class="benefit-operation-top"><div><strong>' + esc(request.farmName || request.farmId) + '</strong><small>' + esc(request.rmu || '미배정') + ' · ' + esc(formatDate((request.createdAt || '').slice(0, 10))) + '</small></div><span class="benefit-state">' + esc(requestStatusText(status)) + '</span></div>' +
        '<p class="benefit-record-meta">' + esc(t('requestWeek')) + ': ' + esc(String(request.weekIndex || '—') + '주차') + (request.weekStart ? ' · ' + esc(formatDate(request.weekStart)) : '') + ' · ' + esc(t('requestVolume')) + ': ' + esc(numberText(Number(request.requestM3))) + ' m³</p>' +
        '<p class="benefit-record-meta">' + esc(request.reason || '—') + '</p>' +
        '<div class="benefit-operation-fields"><label class="benefit-field"><span>' + esc(t('requestStatus')) + '</span><select data-request-status>' + statusSelectOptions(status, 'request') + '</select></label>' +
        '<label class="benefit-field"><span>' + esc(t('requestDelivered')) + '</span><input type="number" min="0" step="0.1" inputmode="decimal" data-request-delivered value="' + esc(delivered) + '" placeholder="—"></label>' +
        '<label class="benefit-field full"><span>' + esc(t('requestOperatorNote')) + '</span><input type="text" maxlength="300" data-request-note value="' + esc(request.operatorNote || '') + '"></label>' +
        '<div class="benefit-card-actions benefit-field full"><button type="button" class="btn btn-primary btn-small" data-request-save="' + esc(request.id) + '">' + esc(t('requestSave')) + '</button></div></div></article>';
    }).join('');
  }
  async function handleOperationSave(event) {
    const button = event.target.closest('[data-operation-save]');
    if (!button) return;
    const card = button.closest('[data-operation-card]');
    const id = button.dataset.operationSave;
    const actualRaw = card.querySelector('[data-op-actual]').value.trim();
    const status = card.querySelector('[data-op-status]').value;
    const note = card.querySelector('[data-op-note]').value.trim();
    const actual = actualRaw === '' ? null : Number(actualRaw);
    if (actual !== null && (!Number.isFinite(actual) || actual < 0)) { announce(t('opsInvalidVolume')); return; }
    if (['complete', 'partial', 'not_delivered'].includes(status) && actual === null) { announce(t('opsNeedVolume')); return; }
    if (['complete', 'partial'].includes(status) && actual <= 0) { announce(t('opsNeedVolume')); return; }
    if (status === 'not_delivered' && actual > 0) { announce(t('opsNeedVolume')); return; }
    if (status === 'not_delivered' && !note) { announce(t('opsNoWaterReason')); return; }
    const planWeeks = allocationWeeks(), weekNumber = Number($('benefitOpsWeek').value) || 1;
    const planWeek = planWeeks.find((week, index) => (Number(week.index) || index + 1) === weekNumber);
    const row = planWeek?.rows?.find((item) => operationId(planWeek.startDate, item.farmId) === id && (window.MekongPortal?.allows(item) ?? true));
    if (!row) { announce(t('opsNoPlan')); return; }
    if(window.MekongCloud?.enabled)return sharedSave('operation.upsert',{id,farmId:row.farmId,weekStart:planWeek.startDate,weekIndex:weekNumber,requestM3:row.requestM3,plannedM3:row.plannedM3,actualM3:actual,status,note},state.operations.find(x=>x.id===id)?._version||0,button,'opsSaved');
    let record = state.operations.find((item) => item.id === id);
    if (!record) {
      record = { id, farmId: row.farmId, farmName: row.farmName, rmu: row.rmu, weekIndex: weekNumber, weekStart: planWeek.startDate || '', requestM3: row.requestM3, plannedM3: row.plannedM3, actualM3: null, status: 'pending', note: '', createdAt: new Date().toISOString(), history: [] };
      state.operations.unshift(record);
    }
    record.actualM3 = actual;
    record.status = status;
    record.note = note.slice(0, 240);
    record.updatedAt = new Date().toISOString();
    addHistory(record, 'operator', 'updated water delivery', note);
    if (!saveState()) return;
    render(); window.dispatchEvent(new CustomEvent('mekong:records-updated'));
    announce(t('opsSaved'));
  }
  async function handleRequestSubmit(event) {
    event.preventDefault();
    const farm = readFarms().find((item) => String(item.id) === $('benefitFarmerFarm').value);
    if (!farm) { announce(t('requestFarmNeeded')); return; }
    const weekIndex = Number($('benefitRequestWeek').value);
    const amount = Number($('benefitRequestVolume').value);
    if (!Number.isFinite(amount) || amount <= 0 || !weekIndex) { announce(t('requestRequired')); return; }
    const planWeek = allocationWeeks().find((week, index) => (Number(week.index) || index + 1) === weekIndex);
    const request = {
      id: newId('WREQ'), farmId: String(farm.id), farmName: farm.name || String(farm.id), rmu: farm.rmu || '미배정',
      weekIndex, weekStart: planWeek?.startDate || '', requestM3: amount, reason: $('benefitRequestReason').value.trim().slice(0, 400),
      status: 'pending', deliveredM3: null, operatorNote: '', createdAt: new Date().toISOString(), updatedAt: '', history: []
    };
    if(window.MekongCloud?.enabled){request.id=event.target.dataset.sharedRequestId||(event.target.dataset.sharedRequestId=crypto.randomUUID());return sharedSave('request.create',request,0,$('benefitRequestSubmit'),'requestSaved',()=>{event.target.reset();delete event.target.dataset.sharedRequestId;});}
    addHistory(request, 'farmer-view', 'submitted water request', request.reason);
    state.requests.unshift(request);
    if (!saveState()) { state.requests.shift(); return; }
    event.target.reset();
    render(); window.dispatchEvent(new CustomEvent('mekong:records-updated'));
    announce(t('requestSaved'));
  }
  async function handleRequestQueueSave(event) {
    const button = event.target.closest('[data-request-save]');
    if (!button) return;
    const card = button.closest('[data-request-card]');
    const request = state.requests.find((item) => item.id === button.dataset.requestSave);
    if (!request || !(window.MekongPortal?.allows(request) ?? true) || window.MekongPortal?.role === 'farmer') return;
    const status = card.querySelector('[data-request-status]').value;
    const raw = card.querySelector('[data-request-delivered]').value.trim();
    const delivered = raw === '' ? null : Number(raw);
    const note = card.querySelector('[data-request-note]').value.trim();
    if (delivered !== null && (!Number.isFinite(delivered) || delivered < 0)) { announce(t('opsInvalidVolume')); return; }
    if (['completed', 'partial'].includes(status) && (delivered === null || delivered <= 0)) { announce(t('opsNeedVolume')); return; }
    if (status === 'declined' && delivered > 0) { announce(t('opsNeedVolume')); return; }
    if (status === 'declined' && !note) { announce(t('requestDeclineReason')); return; }
    if(window.MekongCloud?.enabled)return sharedSave('request.update',{id:request.id,status,deliveredM3:delivered,operatorNote:note},request._version,button,'requestUpdated');
    request.status = status;
    request.deliveredM3 = delivered;
    request.operatorNote = note.slice(0, 300);
    request.updatedAt = new Date().toISOString();
    addHistory(request, 'operator', 'updated request', note);
    if (!saveState()) return;
    render(); window.dispatchEvent(new CustomEvent('mekong:records-updated'));
    announce(t('requestUpdated'));
  }
  function renderOperator() {
    const select = $('benefitRmu');
    const old = select.value;
    fillSelect(select, RMUS.map((rmu) => ({ value: rmu, label: rmu })), t('selectRmu'), old);
    renderOperations();
    renderRequests();
    const list = $('benefitOperatorRecords');
    const scopedRecords = state.records.filter(record => window.MekongPortal?.allows(record) ?? true);
    list.innerHTML = scopedRecords.length ? [...scopedRecords].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((record) => recordCard(record, 'operator')).join('') : '<div class="benefit-empty">' + esc(t('noRecords')) + '</div>';
    previewValues();
  }
  function renderIncidents() {
    const list = $('benefitIncidentQueue');
    const incidents = state.incidents.filter(incident => window.MekongPortal?.allows(incident) ?? true);
    if (!incidents.length) { list.innerHTML = `<div class="benefit-empty">${esc(t('noIncidents'))}</div>`; return; }
    list.innerHTML = [...incidents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((incident) => {
      const status = incident.status === 'closed' ? t('closed') : incident.status === 'investigating' ? t('investigating') : t('open');
      const label = t(incident.typeKey || 'issueOther');
      return `<article class="benefit-record-card"><div class="benefit-record-top"><div><strong>${esc(label)}</strong><small>${esc(incident.rmu)} · ${esc(formatDate(incident.createdAt.slice(0, 10)))}</small></div><span class="benefit-state">${esc(status)}</span></div><p>${esc(!['manager','farmer'].includes(window.MekongPortal?.role) ? t('operatorReportPrivacy') : incident.details)}</p><p class="benefit-record-meta">${esc(t('reviewNote'))}: ${esc(incident.reviewNote || '—')}</p><div class="benefit-actions">${window.MekongPortal?.role !== 'manager' ? '' : `${incident.status === 'open' ? `<button class="btn btn-secondary btn-small" data-incident-action="investigating" data-id="${esc(incident.id)}">${esc(t('investigate'))}</button>` : ''}${incident.status !== 'closed' ? `<button class="btn btn-secondary btn-small" data-incident-action="closed" data-id="${esc(incident.id)}">${esc(t('closeIncident'))}</button>` : ''}`}</div></article>`;
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
    if(window.MekongCloud?.enabled)document.querySelectorAll('[data-i18n=local]').forEach(n=>n.textContent=window.MekongCloud.t('connected'));
    const issueRmu = $('benefitIssueRmu');
    if (issueRmu) fillSelect(issueRmu, RMUS.map((rmu) => ({ value: rmu, label: rmu })), t('selectRmu'), issueRmu.value);
    renderRoles();
    renderFarmer();
    renderOperator();
    renderReviewer();
    window.MekongPortal?.afterBenefitRender();
  }
  function addHistory(record, role, action, note) {
    record.history = Array.isArray(record.history) ? record.history : [];
    record.history.push({ at: new Date().toISOString(), role, action, note: String(note || '').slice(0, 600) });
  }
  async function handleRecordSubmit(event) {
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
      measureBasis, deliveryQuality: $('benefitDeliveryQuality').value, baselineEvidence: $('benefitBaselineEvidence').value.trim(), actualEvidence: $('benefitActualEvidence').value.trim(),
      checkScope: $('benefitCheckScope').checked, checkCrop: $('benefitCheckCrop').checked, checkWeather: $('benefitCheckWeather').checked,
      operatorNote: $('benefitOperatorNote').value.trim(), status: 'awaiting_farmer', demo: false,
      createdAt: new Date().toISOString(), history: []
    };
    if(window.MekongCloud?.enabled)return sharedSave('benefit.create',record,0,event.target.querySelector('[type=submit]'),'savedMessage',()=>event.target.reset());
    addHistory(record, 'operator', 'recorded', record.operatorNote);
    state.records.unshift(record);
    if (!saveState()) { state.records.shift(); return; }
    event.target.reset();
    $('benefitMeasureBasis').value = 'estimate';
    render(); announce(t('savedMessage'));
  }
  function loadDemo() {
    if(window.MekongCloud?.enabled){announce(window.MekongCloud.t('noReplace'));return;}
    state.records = state.records.filter((record) => !record.demo);
    const record = {
      id: 'BEN-DEMO-SEASON', cycleLabel: language === 'vi' ? 'Ví dụ minh họa · vụ so sánh' : '예시 시나리오 · 동일 작기 비교',
      rmu: 'RMU-01', serviceArea: language === 'vi' ? 'Đoạn bơm thử nghiệm (giả định)' : '시범 펌프 구간 (가정)',
      baselineStart: '2024-07-01', baselineEnd: '2024-10-20', currentStart: '2025-07-01', currentEnd: '2025-10-20',
      baselineWaterM3: 10000, actualWaterM3: 8500, baselineKwh: 3200, actualKwh: 2800, electricityRate: 3000,
      baselineFuelL: 0, actualFuelL: 0, fuelRate: 0, extraCost: 300000,
      measureBasis: 'meter', deliveryQuality: 'adequate', baselineEvidence: '예시 계량 기록 (합성 값)', actualEvidence: '예시 계량 기록 (합성 값)',
      checkScope: true, checkCrop: true, checkWeather: true, operatorNote: '예시 계산 전용. 실제 측정·단가·급수권역 자료가 아닙니다.',
      status: 'awaiting_farmer', demo: true, createdAt: new Date().toISOString(), history: []
    };
    addHistory(record, 'demo', 'loaded', 'synthetic');
    state.records.unshift(record);
    if (!saveState()) { state.records.shift(); return; }
    render(); announce(t('demoBadge'));
  }
  async function handleFarmerAction(event) {
    const button = event.target.closest('[data-farmer-action]');
    if (!button) return;
    const record = state.records.find((item) => item.id === button.dataset.id);
    if (!record || record.status === 'verified') return;
    const note = document.querySelector(`[data-farmer-note="${CSS.escape(record.id)}"]`)?.value?.trim() || '';
    if(window.MekongCloud?.enabled)return sharedSave('benefit.confirm',{id:record.id,status:button.dataset.farmerAction==='confirm'?'farmer_confirmed':'disputed',note},record._version,button,button.dataset.farmerAction==='confirm'?'confirmedMessage':'disputedMessage');
    if (button.dataset.farmerAction === 'confirm') {
      record.status = 'farmer_confirmed'; addHistory(record, 'farmer-view', 'confirmed delivery record', note); announce(t('confirmedMessage'));
    } else {
      record.status = 'disputed'; addHistory(record, 'farmer-view', 'disputed record', note); announce(t('disputedMessage'));
    }
    saveState(); render();
  }
  async function handleReviewAction(event) {
    const button = event.target.closest('[data-review-action]');
    if (!button) return;
    const record = state.records.find((item) => item.id === button.dataset.id);
    if (!record || record.status === 'verified') return;
    const note = document.querySelector(`[data-review-note="${CSS.escape(record.id)}"]`)?.value?.trim() || '';
    if(window.MekongCloud?.enabled)return sharedSave('benefit.review',{id:record.id,status:button.dataset.reviewAction==='verify'?'verified':'revision',note},record._version,button,'reviewSaved');
    if (button.dataset.reviewAction === 'verify') {
      if (!canVerify(record)) { announce(t('approveBlocked')); return; }
      record.status = 'verified'; addHistory(record, 'reviewer-view', 'verified', note);
    } else {
      record.status = 'revision'; addHistory(record, 'reviewer-view', 'revision requested / held', note);
    }
    saveState(); render(); window.dispatchEvent(new CustomEvent('mekong:records-updated')); announce(t('reviewSaved'));
  }
  async function handleIncidentSubmit(event) {
    event.preventDefault();
    const details = $('benefitIssueDetails').value.trim();
    if (!details) { announce(t('requiredError')); return; }
    const incident = {
      id: newId('ISSUE'), rmu: $('benefitIssueRmu').value || '미배정', typeKey: $('benefitIssueType').value,
      reporterFarmId: window.MekongPortal?.farmId || '', reporterRole: window.MekongPortal?.role || 'farmer', details: details.slice(0, 1500), reviewNote: '', status: 'open', createdAt: new Date().toISOString(), history: [{ role: 'farmer-view', action: 'reported', at: new Date().toISOString() }]
    };
    if(window.MekongCloud?.enabled)return sharedSave('incident.create',incident,0,event.target.querySelector('[type=submit]'),'reportSaved',()=>event.target.reset());
    state.incidents.unshift(incident);
    if (!saveState()) { state.incidents.shift(); return; }
    event.target.reset(); render(); window.dispatchEvent(new CustomEvent('mekong:records-updated')); announce(t('reportSaved'));
  }
  async function handleIncidentAction(event) {
    const button = event.target.closest('[data-incident-action]');
    if (!button) return;
    const incident = state.incidents.find((item) => item.id === button.dataset.id);
    if (!incident || (window.MekongPortal && window.MekongPortal.role !== 'manager')) return;
    if(window.MekongCloud?.enabled)return sharedSave('incident.update',{id:incident.id,status:button.dataset.incidentAction,note:''},incident._version,button,'reviewSaved');
    incident.status = button.dataset.incidentAction;
    incident.reviewNote = language === 'vi' ? 'Đã cập nhật trạng thái trong bản trình diễn.' : '시연 화면에서 검토 상태를 변경했습니다.';
    incident.history.push({ role: 'reviewer-view', action: incident.status, at: new Date().toISOString() });
    saveState(); render(); window.dispatchEvent(new CustomEvent('mekong:records-updated')); announce(t('reviewSaved'));
  }
  async function sharedSave(action,data,version,button,success,after){
    if(button)button.disabled=true;
    try{await window.MekongCloud.command(action,data,version||0);after?.();announce(t(success));}
    catch(e){announce(window.MekongCloud.message(e));}
    finally{if(button)button.disabled=false;}
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
      window.MekongI18n?.setLanguage(language);
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
    $('benefitRequestForm').addEventListener('submit', handleRequestSubmit);
    $('benefitOpsWeek').addEventListener('change', () => { renderOperations(); renderRequests(); });
    $('benefitOpsRmu').addEventListener('change', () => { renderOperations(); renderRequests(); });
    $('benefitOpsWorklist').addEventListener('click', handleOperationSave);
    $('benefitRequestQueue').addEventListener('click', handleRequestQueueSave);
    $('benefitIncidentForm').addEventListener('submit', handleIncidentSubmit);
    $('benefitReviewQueue').addEventListener('click', handleReviewAction);
    $('benefitIncidentQueue').addEventListener('click', handleIncidentAction);
    document.querySelectorAll('[data-benefit-zone-select]').forEach((select) => fillSelect(select, RMUS.map((rmu) => ({ value: rmu, label: rmu })), t('selectRmu'), select.value));
    render();
    window.MekongBenefit = {replaceSharedState(next,redraw=true){state={...emptyState(),...next};if(redraw)render();}, render, setRole, deliveryFor, setLanguage(value) { language = ['ko','vi','en'].includes(value) ? value : 'ko'; render(); }, getState: () => JSON.parse(JSON.stringify(state)) };
    if (!document.querySelector('script[data-platform-view]')) {
      const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = './platform-view.css'; document.head.append(style);
      const script = document.createElement('script'); script.src = './platform-view.js'; script.dataset.platformView = 'true'; document.body.append(script);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
