(() => {
  'use strict';
  const languages=['ko','vi','en'];
  let language='ko';try{language=localStorage.getItem('mekong-suksuk.language')||localStorage.getItem('chau-phu-language')||'ko';}catch{}
  if(!languages.includes(language))language='ko';
  const messages={};
  const rows=`
language|언어|Ngôn ngữ|Language
entryTitle|어떤 역할로 이용하시나요?|Bạn sử dụng với vai trò nào?|Choose your workspace
entryDescription|농가의 물 계획부터 현장의 급수 관리까지, 역할에 맞는 화면에서 시작하세요.|Từ kế hoạch nước của nông hộ đến vận hành cấp nước, hãy chọn màn hình phù hợp.|Plan farm irrigation and manage water delivery in a workspace suited to your role.
farmer|농민|Nông dân|Farmer
manager|현장 관리자|Quản lý hiện trường|Field manager
operator|펌프 운영자|Người vận hành bơm|Pump operator
farmerDescription|내 농가의 관개 계획과 급수 현황을 확인합니다.|Xem kế hoạch tưới và tình trạng cấp nước của nông hộ.|Check irrigation plans and water delivery for your farm.
managerDescription|전체 RMU의 배분·급수·신고를 관리합니다.|Quản lý phân bổ, cấp nước và báo cáo của toàn bộ RMU.|Manage allocation, deliveries and reports across all RMUs.
operatorDescription|담당 RMU의 요청을 확인하고 실제 급수를 기록합니다.|Xem yêu cầu và ghi lượng thực cấp tại RMU phụ trách.|Handle requests and record actual deliveries in your assigned RMU.
farmerFeatures|농가 등록 · 관개 일정 · 급수 요청 · 절수 편익|Đăng ký · Lịch tưới · Yêu cầu nước · Lợi ích tiết kiệm|Registration · Irrigation · Water requests · Savings
managerFeatures|전체 지도 · 배분 알고리즘 · 운영 확인 · 신고 검토|Bản đồ · Thuật toán phân bổ · Vận hành · Xem xét báo cáo|Area map · Allocation · Operations · Report review
operatorFeatures|담당 지도 · 관개 일정 · 요청 처리 · 급수 기록|Bản đồ RMU · Lịch tưới · Xử lý yêu cầu · Nhật ký cấp|RMU map · Irrigation · Requests · Delivery records
enter|이 화면으로 시작|Mở màn hình|Open workspace
pilotFarms|시범농가|nông hộ thí điểm|pilot farms
farmsPerRmu|농가 / RMU|nông hộ / RMU|farms / RMU
demoAccess|현재는 역할별 화면을 선택하는 시연용 플랫폼입니다. 로그인 인증과 기기 간 기록 공유는 연결되지 않았으며, 입력 기록은 이 브라우저에 저장됩니다.|Đây là bản trình diễn chọn vai trò. Chưa có đăng nhập xác thực hoặc đồng bộ giữa thiết bị; hồ sơ lưu trong trình duyệt này.|This demo uses role selection. Sign-in and cross-device sharing are not connected; records are stored in this browser.
setup|농가 등록|Đăng ký nông hộ|Farm registration
allMap|전체 RMU·농가 현황|Toàn bộ RMU và nông hộ|All RMUs and farms
myMap|내 RMU 주변 현황|Khu vực RMU của tôi|My RMU area
allSchedule|전체 관개 시간표|Lịch tưới toàn khu|All irrigation schedules
mySchedule|나의 관개 일정|Lịch tưới của tôi|My irrigation schedule
algorithm|전체 배분 알고리즘|Thuật toán phân bổ toàn khu|Allocation algorithm
water|수자원 정보|Thông tin nguồn nước|Water resources
weather|기상 정보|Thông tin thời tiết|Weather
requestPage|급수 요청|Yêu cầu cấp nước|Request water
processRequests|급수 요청·처리 확인|Yêu cầu và xử lý cấp nước|Requests and deliveries
reportPage|비리·급수 문제 신고|Báo cáo sai phạm và cấp nước|Report concerns
reportUpdates|담당 RMU 신고 확인|Tình trạng báo cáo RMU|RMU report updates
reviewReports|비리신고 확인·처리|Xem xét và xử lý báo cáo|Review reports
allBenefits|전체 절수 편익|Lợi ích tiết kiệm toàn khu|All water savings
myBenefits|나의 절수 편익|Lợi ích tiết kiệm của tôi|My water savings
calendar|물수요 캘린더|Lịch nhu cầu nước|Water demand calendar
data|데이터·근거|Dữ liệu và nguồn|Data and sources
existingTools|농가·수요·자료 관리|Quản lý nông hộ, nhu cầu, dữ liệu|Farm, demand and data tools
allScope|전체 18개 RMU|Toàn bộ 18 RMU|All 18 RMUs
selectedFarm|내 농가 선택|Chọn nông hộ của tôi|Select my farm
assignedRmu|담당 RMU 선택|Chọn RMU phụ trách|Select assigned RMU
farmsUnit|개 농가|nông hộ|farms
demoWorkspace|시연용 역할·범위 선택|Chọn vai trò và phạm vi để trình diễn|Demo role and scope
changeRole|역할 다시 선택|Đổi vai trò|Switch role
startDemo|54개 농가 전체 시연|Trình diễn 54 nông hộ|Run 54-farm demo
demoScenarioNote|가상 공급량과 주간 배분을 함께 불러옵니다.|Tải nguồn cung giả định và phương án tuần.|Load synthetic supply and weekly allocation.
unassigned|RMU 미배정|Chưa gán RMU|RMU unassigned
scheduleDescription|주간 계획 취수량, 배분량, 실제 급수 기록을 한눈에 확인합니다.|Xem nhu cầu tuần, lượng phân bổ và hồ sơ thực cấp.|Compare weekly intake plans, allocation and recorded deliveries.
requestsDescription|농민의 요청과 실제 급수·처리 기록을 확인합니다.|Xem yêu cầu của nông dân và hồ sơ thực cấp, xử lý.|Review water requests and actual delivery records.
reportsDescription|확인이 필요한 사실을 기록하고 처리 상태를 확인합니다. 신고만으로 위반이 확정되지는 않습니다.|Ghi sự việc cần xem xét và theo dõi trạng thái. Báo cáo không tự xác định vi phạm.|Record concerns and follow their status. A report does not establish wrongdoing.
benefitsDescription|급수 기록과 비교 자료에 근거한 절수·운영비 차이를 확인합니다.|Xem chênh lệch nước và chi phí dựa trên hồ sơ cấp và dữ liệu so sánh.|Review water and operating-cost differences supported by records.
week|주차|Tuần|Week
weeklySchedule|주간 계획 · 확정된 시간 단위 운영 일정 아님|Kế hoạch tuần · chưa xác nhận giờ vận hành cụ thể|Weekly plan · exact operating times are not confirmed
farmsCount|표시 농가|Nông hộ hiển thị|Farms shown
plannedIntake|계획 요청량|Lượng yêu cầu theo kế hoạch|Planned request
allocated|배분 계획량|Lượng phân bổ|Allocated
pending|산정·배분 대기|Chờ tính/phân bổ|Pending calculation
delivered|실제 급수량|Lượng thực cấp|Delivered
notRecorded|미기록|Chưa ghi|Not recorded
farm|농가|Nông hộ|Farm
rmu|RMU|RMU|RMU
schedulePeriod|관개 계획 기간|Kỳ tưới dự kiến|Planned period
processing|급수 상태|Trạng thái cấp|Delivery status
action|작업|Thao tác|Action
request|요청하기|Gửi yêu cầu|Request
recordDelivery|급수 기록|Ghi lượng thực cấp|Record delivery
status_pending|대기|Chờ xử lý|Pending
status_in_progress|급수 중|Đang cấp|In progress
status_complete|완료|Hoàn tất|Complete
status_partial|부분 급수|Cấp một phần|Partial
status_not_delivered|미급수|Không cấp|Not delivered
noFarms|표시할 농가가 없습니다. 농가를 등록하거나 시범농가를 불러오세요.|Không có nông hộ. Hãy đăng ký hoặc tải nông hộ thí điểm.|No farms to show. Register a farm or load the pilot data.
scheduleNote|수량 단위: m³. 계획 요청량에는 유효강우 차감이 반영됩니다. 미기록은 급수량 0을 뜻하지 않습니다. 실제량은 현장 확인 후 별도로 기록합니다.|Đơn vị: m³. Nhu cầu kế hoạch đã trừ mưa hiệu quả. Chưa ghi không có nghĩa là 0; thực cấp phải xác nhận tại hiện trường.|Volumes are in m³. Planned requests deduct effective rainfall. Unrecorded does not mean zero; actual delivery requires field confirmation.
syntheticSupply|현재 공급량은 시연 가상값이며 실측이 아닙니다.|Nguồn cung hiện tại là giả định trình diễn, không phải số đo.|Current supply values are synthetic demo assumptions.
requestPrefill|선택 주차의 강우 차감 계획 취수량을 요청량으로 미리 입력했습니다. 필요하면 수정하세요.|Đã điền nhu cầu tuần sau khi trừ mưa hiệu quả. Có thể điều chỉnh.|The weekly intake plan after effective rainfall is prefilled. Adjust it if needed.
zeroDemand|선택 주차의 계획 요청량이 0이거나 아직 산정되지 않았습니다. 필요한 양이 있으면 사유와 함께 입력하세요.|Nhu cầu tuần bằng 0 hoặc chưa tính. Nếu cần nước, nhập lượng và lý do.|This week's planned request is zero or unavailable. Enter an amount and reason if water is needed.
myReports|내 신고 처리 현황|Tình trạng báo cáo của tôi|My report status
noReports|등록한 신고가 없습니다.|Chưa có báo cáo.|No reports submitted.
report_open|접수|Đã tiếp nhận|Received
report_investigating|확인 중|Đang xác minh|Under review
report_closed|검토 종료|Đã kết thúc|Closed
comparisonRecords|비교 기록|Hồ sơ so sánh|Comparison records
verifiedRecords|검증 완료 기록|Hồ sơ đã xác minh|Verified records
verifiedWater|검증 기록의 물량 감소 합계|Tổng giảm nước đã xác minh|Verified water reduction
sharedBenefitNote|내 농가가 속한 RMU의 공동 급수 편익입니다. 농가별 계량·합의가 없으면 개인 지급액을 계산하지 않습니다. 예시 기록과 실제 검증 기록은 구분됩니다.|Lợi ích cấp nước chung của RMU chứa nông hộ. Không tính tiền cá nhân khi chưa có số đo và quy tắc thống nhất. Hồ sơ ví dụ tách riêng hồ sơ thực đã xác minh.|These are shared records for your farm's RMU. Individual payments need farm metering and an agreed rule. Examples are separate from verified records.
pumpBenefitNote|담당 RMU의 운영비 비교 기록입니다. 절수량만으로 운영자 성과금이나 지급액을 확정하지 않습니다.|Hồ sơ so sánh chi phí của RMU phụ trách. Lượng nước giảm không tự xác định thưởng hay thanh toán.|Operating-cost comparisons for your RMU. Water reduction alone does not establish an operator bonus or payment.
benefitNote|18개 RMU의 비교 기록을 확인합니다. 비교 조건·농가 확인·독립 검증을 갖춘 실제 기록만 검증 완료 집계에 포함됩니다.|Xem hồ sơ so sánh của 18 RMU. Chỉ hồ sơ thực đủ điều kiện, được nông hộ xác nhận và xác minh độc lập mới vào tổng đã xác minh.|Review all 18 RMUs. Verified totals include only real, comparable records with farmer confirmation and independent review.
rice|벼|Lúa|Rice
durian|두리안|Sầu riêng|Durian
mango|망고|Xoài|Mango
jackfruit|잭프루트|Mít|Jackfruit
`;
  for(const line of rows.trim().split('\n')){const [key,ko,vi,en]=line.split('|');messages[key]={ko,vi,en};}
  const t=key=>messages[key]?.[language]||messages[key]?.ko||key;
  const exact={};
  let sortedExact=null, translationPattern=null;
  function add(ko,vi,en){exact[ko]={ko,vi,en};sortedExact=null;translationPattern=null;}
  const common=`
농가명|Tên nông hộ|Farm name
재배 작물|Cây trồng|Crop
품종|Giống|Variety
선택 입력|Không bắt buộc|Optional
새 농가 등록|Đăng ký nông hộ mới|Register a farm
입력 미리보기|Xem trước|Live preview
실시간|Trực tiếp|Live
위치 / 임시 관리구역|Vị trí / khu RMU tạm thời|Location / provisional RMU
경작 면적 (ha)|Diện tích (ha)|Farm area (ha)
파종 / 생육 시작일|Ngày gieo / bắt đầu sinh trưởng|Sowing / growth start date
관개 방식|Phương pháp tưới|Irrigation method
농가 GPS 좌표|Tọa độ GPS nông hộ|Farm GPS coordinates
위도 (Latitude)|Vĩ độ (Latitude)|Latitude
경도 (Longitude)|Kinh độ (Longitude)|Longitude
벼 (Lúa)|Lúa|Rice
두리안 (Sầu riêng)|Sầu riêng|Durian
망고 (Xoài)|Xoài|Mango
잭프루트 (Mít)|Mít|Jackfruit
표면/담수 관개 (벼, 효율 60%)|Tưới mặt/ngập (lúa, hiệu suất 60%)|Surface/flood irrigation (rice, 60% efficiency)
점적 관개 (과수, 효율 90%)|Tưới nhỏ giọt (cây ăn quả, hiệu suất 90%)|Drip irrigation (orchards, 90% efficiency)
미확인 — 계산 보류|Chưa xác minh — tạm dừng tính|Unconfirmed — calculation on hold
AWD 시범 건조기간 적용|Áp dụng giai đoạn khô AWD thử nghiệm|Apply demo AWD drying period
농가 저장하고 캘린더 보기|Lưu nông hộ và xem lịch|Save farm and view plan
수정 취소|Hủy sửa|Cancel edit
등록된 농가|Nông hộ đã đăng ký|Registered farms
농가 백업 복원|Khôi phục bản sao nông hộ|Restore farm backup
새 54개 시범 농가 불러오기|Tải mới 54 nông hộ thí điểm|Load 54 pilot farms
전체 삭제|Xóa tất cả|Delete all
농가 정보를 등록하세요|Đăng ký thông tin nông hộ|Register your farm
입력한 정보가 공간 현황과 16주 물수요 캘린더에 즉시 반영됩니다.|Thông tin đã nhập được cập nhật vào bản đồ và lịch nhu cầu nước 16 tuần.|Entered information updates the map and 16-week water demand calendar.
사용자가 표시한 파란 구획선을 기준으로 18개 RMU를 나눴습니다.|18 RMU được chia theo đường màu xanh do người dùng đánh dấu.|The 18 RMUs follow the blue divisions marked on the supplied map.
좌표를 입력한 농가만 지도에 개별 위치점으로 표시됩니다. 좌표가 없다면 구역별 농가 수로 표시합니다.|Chỉ nông hộ có tọa độ được ghim riêng. Không có tọa độ thì tổng hợp theo RMU.|Only farms with coordinates get individual map pins. Other farms are grouped by RMU.
벼에만 적용 · 생육 29~35일차 취수 0으로 가정 (실측·안전 권고 아님)|Chỉ cho lúa · giả định không lấy nước ngày 29–35 (không phải số đo hay hướng dẫn an toàn)|Rice only · assumes zero intake on days 29–35 (not a measurement or safety recommendation)
실제 위치 정보는 아직 없습니다.|Chưa xác minh vị trí thực tế.|Actual locations are not yet verified.
위치 선택은 사진의 파란 분할선을 기준으로 나눈 18개 RMU 배정이며, 지도 좌표나 정확한 수로 연결로 간주하지 않습니다.|Vị trí là phân RMU theo ảnh, không phải tọa độ hoặc kết nối thủy lực chính xác.|Location assigns one of 18 RMUs from the photo; it does not establish coordinates or canal connections.
농가 정보 입력 후 저장하면 Tab 2 지도와 Tab 3 캘린더를 함께 갱신합니다.|Lưu thông tin sẽ cập nhật bản đồ và lịch nhu cầu nước.|Saving updates both the map and demand calendar.
물 배분용 농업 위험 점검 (선택)|Đánh giá rủi ro để phân bổ nước (tùy chọn)|Agricultural risk assessment (optional)
생육단계의 물부족 민감도|Độ nhạy thiếu nước theo giai đoạn|Growth-stage sensitivity to water shortage
토양의 물 보유·배수 취약도|Rủi ro giữ nước và thoát nước của đất|Soil water-retention and drainage vulnerability
현재 작황 피해·물부족 징후|Thiệt hại cây trồng / dấu hiệu thiếu nước|Crop damage / signs of water shortage
대체 수원 부족 정도|Mức thiếu nguồn nước thay thế|Lack of alternative water sources
미입력 · 추정|Chưa nhập · ước tính|Not entered · estimated
0 · 낮음|0 · Thấp|0 · Low
1 · 다소 낮음|1 · Khá thấp|1 · Rather low
2 · 보통|2 · Trung bình|2 · Moderate
3 · 높음|3 · Cao|3 · High
4 · 매우 높음|4 · Rất cao|4 · Very high
수로·농가 통합 지도|Bản đồ kênh và nông hộ|Canal and farm map
공간 현황|Hiện trạng không gian|Area overview
선택된 지도 정보|Thông tin điểm đã chọn|Selected map information
농가별 정보|Thông tin nông hộ|Farm directory
수자원·시설|Nguồn nước và công trình|Water resources and facilities
지도 크게 보기|Phóng to bản đồ|Expand map
전체 농가|Tất cả nông hộ|All farms
좌표 미확정|Chưa xác định tọa độ|Coordinates unconfirmed
수로·시설 대장|Danh mục kênh/công trình|Canal and facility register
농가별 표시|Hiển thị nông hộ|Farm display
구역 선택|Chọn khu|Choose area
농가명 검색|Tìm tên nông hộ|Search farms
수로 / P1–P8 / G207 등 검색|Tìm kênh / P1–P8 / G207|Search canal / P1–P8 / G207
전체|Tất cả|All
표시|Hiển thị|Display
구역|Khu vực|Area
주차|Tuần|Week
강우|Mưa|Rain
수로|Kênh|Canal
펌프|Bơm|Pump
수문|Cống|Gate
관리구역|Khu quản lý|Management area
시작일|Ngày bắt đầu|Start date
표시 구역|Khu hiển thị|Displayed area
전체 18개 RMU|Toàn bộ 18 RMU|All 18 RMUs
18개 RMU · 사진 기준 경계|18 RMU · ranh theo ảnh|18 RMUs · photo-based boundaries
사진의 파란 분할선을 옮긴 18개 RMU와 등록 농가·수자원 시설 근거를 함께 살펴봅니다.|Xem 18 RMU theo ảnh cùng nông hộ đã đăng ký và dữ liệu công trình.|Explore the 18 photo-based RMUs, registered farms and facility evidence.
RMU · 수로 · 농가 · 시설 통합 지도|Bản đồ RMU, kênh, nông hộ và công trình|RMU, canal, farm and facility map
RMU 18개 경계|Ranh giới 18 RMU|18 RMU boundaries
확인된 물 공급 경로|Tuyến cấp nước đã xác nhận|Documented water routes
선택한 관리구역|Khu đã chọn|Selected area
관리구역별 농가·물수요 현황|Nông hộ và nhu cầu theo khu|Farms and demand by area
공간 데이터|Dữ liệu không gian|Spatial data
방법론 및 원자료 출처|Phương pháp và nguồn gốc|Methods and original sources
현장 운영 판단에는 사용 금지|Không dùng để quyết định vận hành thực địa|Do not use for field operating decisions
수자원|Nguồn nước|Water resources
기상|Thời tiết|Weather
시범지역 행정 경계|Ranh giới hành chính khu thí điểm|Pilot area administrative boundary
관측소별 연도 수위·강우|Mực nước và mưa theo năm, trạm|Yearly water level and rainfall by station
연결된 MRC 관측 이력을 월별 평균으로 요약합니다.|Tổng hợp lịch sử MRC thành trung bình tháng.|Connected MRC observations summarized as monthly averages.
관측소|Trạm quan trắc|Station
연도|Năm|Year
항목|Chỉ số|Metric
월 평균 수위 (m)|Mực nước trung bình tháng (m)|Monthly mean water level (m)
월 평균 24시간 강우 (mm)|Mưa 24 giờ trung bình tháng (mm)|Monthly mean 24-hour rainfall (mm)
관측자료 새로고침 ↻|Cập nhật quan trắc ↻|Refresh observations
관측 자료 조회 전|Chưa tải số liệu|Observations not yet loaded
자료 불러오는 중|Đang tải dữ liệu|Loading data
자료 없음|Không có dữ liệu|No data
연도별 관측자료를 불러옵니다.|Đang tải quan trắc theo năm.|Loading yearly observations.
원본 Châu Phú 참고지도 확대 ↗|Mở bản đồ gốc Châu Phú|Open original Châu Phú map
기상·관측 추이|Thời tiết và xu thế|Weather and trends
수위·강우 관측|Quan trắc mực nước và mưa|Water level and rainfall observations
● 관측 · 자료 지연 구분|Quan trắc · phân biệt dữ liệu trễ|Observations · delayed data identified
● 예보 · 과거 기상 추정|Dự báo · ước tính thời tiết quá khứ|Forecast · historical weather estimates
강우량과 7일 기상예보, 과거 날씨 추정, 30년 월평균 기후자료를 확인합니다.|Xem mưa, dự báo 7 ngày, thời tiết quá khứ và khí hậu trung bình 30 năm.|View rainfall, 7-day forecasts, past-weather estimates and 30-year monthly climate normals.
시범지역 행정 경계와 관측소 위치, MRC 수위·강우 및 연도별 추이를 확인합니다.|Xem ranh thí điểm, vị trí trạm, mực nước, mưa và xu thế MRC theo năm.|View pilot boundaries, station locations and yearly MRC water-level and rainfall trends.
16주 생육·물수요 캘린더|Lịch sinh trưởng và nhu cầu nước 16 tuần|16-week growth and water demand calendar
농가별 주간 계획 취수량|Lượng nước lấy theo tuần của nông hộ|Weekly planned intake by farm
구역별 주간 취수 계획|Kế hoạch lấy nước theo khu|Weekly intake plan by area
균형 기준 주간 물 배분안|Phương án phân bổ nước cân bằng hàng tuần|Balanced weekly water allocation
전체 시연 시나리오 불러오기|Tải toàn bộ tình huống trình diễn|Load full demo scenario
시범 농가만 불러오기|Chỉ tải nông hộ thí điểm|Load pilot farms only
RMU별 주간 공급 가능량|Nguồn cung hàng tuần theo RMU|Weekly supply capacity by RMU
수위 지표 반영 가상값 생성|Tạo giả định theo chỉ số mực nước|Generate stage-informed synthetic supply
실제 공급기록으로 전환|Chuyển sang hồ sơ nguồn cung thực|Switch to actual supply records
주별|Theo tuần|Weekly
월별 합계|Tổng theo tháng|Monthly total
공급자료 백업|Sao lưu nguồn cung|Back up supply records
공급자료 가져오기|Nhập nguồn cung|Import supply records
시연 공급량 · 실측 아님|Nguồn cung trình diễn · không phải số đo|Synthetic supply · not measured
자료 산정 방법|Phương pháp tính nguồn cung|Supply calculation method
RMU 인입부 유량계 합계|Tổng đồng hồ đầu vào RMU|RMU inlet meter total
수로 유량 계측 후 주간 합산|Tổng lưu lượng kênh theo tuần|Weekly integrated canal flow
수로 단면적 × 평균 유속|Diện tích mặt cắt × vận tốc trung bình|Canal cross-section × mean velocity
검증 유량 × 펌프 가동시간|Lưu lượng xác minh × giờ bơm|Verified flow × pump runtime
현장 보정 수문 곡선 × 개방시간|Đường cong cống hiệu chỉnh × giờ mở|Calibrated gate curve × opening time
운영기관 주간 공급 계획|Kế hoạch cung tuần của đơn vị vận hành|Agency weekly supply plan
과거 기록 기반 추정|Ước tính từ lịch sử|Estimate from historical records
주간 공급 가능량 (m³)|Nguồn cung tuần (m³)|Weekly supply capacity (m³)
유량 (m³/h)|Lưu lượng (m³/h)|Flow (m³/h)
유효 단면적 (m²)|Mặt cắt hữu hiệu (m²)|Effective cross-section (m²)
평균 유속 (m/s)|Vận tốc trung bình (m/s)|Mean velocity (m/s)
주간 실제/예정 가동시간 (h)|Giờ vận hành thực/dự kiến tuần (h)|Actual/planned weekly runtime (h)
수로 손실 추정 (%)|Tổn thất kênh ước tính (%)|Estimated canal loss (%)
자료 근거 / 계량 위치 / 기록 번호|Nguồn / điểm đo / mã hồ sơ|Evidence / measurement location / record ID
이 RMU·주차 공급량 저장|Lưu nguồn cung RMU và tuần này|Save supply for this RMU and week
입력 자료는 이 브라우저에 저장됩니다. 백업 파일로 다른 기기에 옮길 수 있습니다.|Dữ liệu lưu trong trình duyệt này. Có thể chuyển bằng tệp sao lưu.|Records are stored in this browser. Use backup files to move them to another device.
계산 구조와 적용 한계|Công thức và giới hạn|Calculation and limitations
중요한 한계|Giới hạn quan trọng|Important limitations
물수요 캘린더|Lịch nhu cầu nước|Water demand calendar
데이터 · 근거|Dữ liệu và nguồn|Data and sources
데이터 및 출처 관리|Quản lý dữ liệu và nguồn|Data and source management
관개 파라미터|Tham số tưới|Irrigation parameters
기본 데이터로 복원|Khôi phục dữ liệu mặc định|Restore default dataset
물관리 CSV 가져오기|Nhập CSV quản lý nước|Import water-management CSV
CSV 파일 선택|Chọn tệp CSV|Choose CSV file
기본값 CSV 내려받기|Tải CSV mặc định|Download default CSV
조회된 API 기후자료 CSV 내려받기|Tải CSV khí hậu API đã truy vấn|Download queried climate data CSV
로컬 기후 DB + 최근 API|Dữ liệu khí hậu cục bộ + API mới|Local climate database + recent API
기후자료 출처|Nguồn khí hậu|Climate source
로컬 내장 CSV + 최근 16일 API 갱신|CSV cục bộ + cập nhật API 16 ngày|Embedded CSV + recent 16-day API updates
내장 로컬 CSV만 (API 끔)|Chỉ CSV cục bộ (tắt API)|Embedded CSV only (API off)
최근 API 갱신 ↻|Cập nhật API gần đây|Refresh recent API
최근 16일 API 값 저장|Lưu API 16 ngày gần đây|Save recent 16-day API values
기후 DB CSV 가져오기|Nhập CSV khí hậu|Import climate CSV
전체 기후 DB 내보내기|Xuất toàn bộ dữ liệu khí hậu|Export climate database
계획 취수량 m³|Kế hoạch lấy nước m³|Planned intake m³
작물증발산 ETc mm|Bốc thoát hơi ETc mm|Crop evapotranspiration ETc mm
강우 반영 물수지 m³|Cân bằng nước sau mưa m³|Water balance after rainfall m³
배분계획|Kế hoạch phân bổ|Allocation plan
생육단계|Giai đoạn sinh trưởng|Growth stage
시연 시나리오|Tình huống trình diễn|Demo scenario
산정 대기|Chờ tính|Pending calculation
농가 선택|Chọn nông hộ|Choose farm
정보 수정|Sửa thông tin|Edit information
수정|Sửa|Edit
삭제|Xóa|Delete
등록 경작면적|Diện tích đã đăng ký|Registered farm area
RMU 배정|Phân RMU|RMU assignment
사진 기준 구역 분류|Phân khu theo ảnh|Photo-based grouping
사용자 입력 + 시범 농가|Nông hộ nhập + thí điểm|Registered and pilot farms
등록 농가 합계 · 공식 면적 아님|Tổng nông hộ đăng ký · không phải diện tích chính thức|Registered farms total · not official area
등록 농가|Nông hộ đăng ký|Registered farms
등록된 농가 면적|Diện tích nông hộ|Registered farm area
사진 기준 RMU|RMU theo ảnh|Photo-based RMUs
농가 입력값의 합계|Tổng số liệu nông hộ|Sum of farm inputs
좌표 입력 농가|Nông hộ có tọa độ|Farms with coordinates
18개 RMU에 연결|Liên kết 18 RMU|Linked to 18 RMUs
관측소 자료 없음|Không có dữ liệu trạm|No station data
연결된 관측자료가 없습니다.|Không có quan trắc được kết nối.|No connected observations.
물량|Lượng nước|Water volume
수원|Nguồn nước|Water source
농가|Nông hộ|Farm
수로·하천|Kênh/sông|Canal/river
펌프 후보|Vị trí bơm dự kiến|Pump candidate
수문·암거|Cống/cống ngầm|Gate/culvert
2017–18 급수 사례|Trường hợp cấp nước 2017–18|2017–18 water delivery case
원문 확인 ↗|Xem nguồn gốc|Open source
공급 가능량 한도|Giới hạn nguồn cung|Supply capacity limit
자료 입력 대기|Chờ nhập dữ liệu|Awaiting data
계량 또는 계획값|Số đo hoặc kế hoạch|Measured or planned value
현장 검증 유량|Lưu lượng xác minh thực địa|Field-verified flow
운영기록 시간|Số giờ trong nhật ký|Recorded operating hours
계측/근거 있는 손실률|Tỷ lệ tổn thất có căn cứ|Evidence-based loss rate
주간 계획 취수량|Lượng lấy nước dự kiến tuần|Weekly planned intake
배분 계획량|Lượng phân bổ|Planned allocation
2025 지도 참고|Tham khảo bản đồ 2025|2025 reference map
Châu Phú · An Giang 시범지역 참고 지도와 사진 기준 18개 RMU|Bản đồ tham khảo Châu Phú · An Giang và 18 RMU theo ảnh|Reference map of Châu Phú · An Giang and the 18 photo-based RMUs
행정 경계 참고도이며 공식 측량·급수 관할 경계가 아닙니다. RMU 경계는 사용자 사진을 옮긴 추정선입니다.|Ranh hành chính tham khảo, không phải ranh đo đạc hay phục vụ cấp nước chính thức. RMU là ước tính theo ảnh.|Administrative reference only, not an official survey or service boundary. RMUs are estimated from the supplied photo.
`;
  for(const row of common.trim().split('\n')){const [ko,vi,en]=row.split('|');add(ko,vi,en);}
  Object.values(messages).forEach(value=>add(value.ko,value.vi,value.en));
  const sourceNodes=new WeakMap(),sourceAttrs=new WeakMap();let observer,started=false;
  function displayName(value){return String(value||'').replace(/^\[시범\]\s*(RMU-\d+) 농가 ([A-C])$/,(_,id,slot)=>language==='ko'?`[시범] ${id} 농가 ${slot}`:language==='vi'?`[Thí điểm] ${id} Nông hộ ${slot}`:`[Demo] ${id} Farm ${slot}`);}
  function translateText(value){
    if(language==='ko'||!/[가-힣]/.test(value))return value;
    const trimmed=value.trim();let found=exact[trimmed];
    if(found)return value.replace(trimmed,found[language]);
    let text=displayName(value);
    if(!translationPattern){
      const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      const keys=Object.keys(exact).sort((a,b)=>b.length-a.length);
      translationPattern=new RegExp(keys.map(key=>key.length>=4?escape(key):`(?<![가-힣])${escape(key)}(?![가-힣])`).join('|'),'g');
    }
    text=text.replace(translationPattern,match=>exact[match][language]);
    text=text.replace(/(\d+)주차/g,(_,n)=>language==='vi'?`Tuần ${n}`:`Week ${n}`)
      .replace(/(\d+)개 농가/g,(_,n)=>`${n} ${language==='vi'?'nông hộ':'farms'}`)
      .replace(/(\d+)개 구역에 농가 등록/g,(_,n)=>language==='vi'?`Nông hộ tại ${n} khu`:`Farms in ${n} areas`)
      .replace(/(\d+)월/g,(_,n)=>language==='vi'?`Tháng ${n}`:`Month ${n}`)
      .replace(/(\d+)일/g,(_,n)=>`${n} ${language==='vi'?'ngày':'days'}`)
      .replace(/(\d+)개/g,(_,n)=>n);
    return text;
  }
  function translate(root=document.body){
    if(!root)return;
    if(root===document.body){document.querySelectorAll('#portalEntry:not([hidden]),#nav,#portalContext,.topbar,.sidebar-bottom,.page.active,#portalDemoTools,#benefitNotice,#toast,footer').forEach(node=>translate(node));return;}
    root.querySelectorAll('option:not([value])').forEach(option=>option.setAttribute('value',option.value));
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){
      if(!node.parentElement||node.parentElement.closest('script,style,noscript,textarea,[data-user-content],[data-i18n]'))continue;
      const saved=sourceNodes.get(node);const original=saved&&node.nodeValue===saved.last?saved.source:node.nodeValue;
      const next=translateText(original);sourceNodes.set(node,{source:original,last:next});if(next!==node.nodeValue)node.nodeValue=next;
    }
    root.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach(element=>{
      let saved=sourceAttrs.get(element)||{};
      for(const attribute of ['placeholder','aria-label','title','alt']){
        if(!element.hasAttribute(attribute))continue;
        const current=element.getAttribute(attribute),prior=saved[attribute];const original=prior&&prior.last===current?prior.source:current;const next=translateText(original);saved[attribute]={source:original,last:next};if(next!==current)element.setAttribute(attribute,next);
      }
      sourceAttrs.set(element,saved);
    });
  }
  function syncFrame(){
    const frame=document.getElementById('integratedDashboardFrame');frame?.contentWindow?.postMessage({type:'mekong-dashboard-language',lang:language},'*');
  }
  function setLanguage(next){
    language=languages.includes(next)?next:'ko';document.documentElement.lang=language;
    try{localStorage.setItem('mekong-suksuk.language',language);localStorage.setItem('chau-phu-language',language);localStorage.setItem('mekong-suksuk.benefit-language',language);}catch{}
    document.querySelectorAll('[data-portal-language]').forEach(s=>s.value=language);
    window.dispatchEvent(new CustomEvent('mekong:language-changed',{detail:{language}}));translate();syncFrame();
  }
  function start(){
    if(started)return;started=true;document.documentElement.lang=language;
    let queued=false;observer=new MutationObserver(records=>{
      if(!records.some(r=>r.type==='characterData'||r.addedNodes.length))return;
      if(queued)return;queued=true;queueMicrotask(()=>{queued=false;observer.disconnect();translate();observer.observe(document.body,{subtree:true,childList:true,characterData:true});});
    });
    translate();observer.observe(document.body,{subtree:true,childList:true,characterData:true});syncFrame();
  }
  window.MekongI18n={t,translate,translateText,displayName,setLanguage,start,syncFrame,add,get language(){return language;}};
})();
