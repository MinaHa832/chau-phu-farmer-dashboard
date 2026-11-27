(() => {
'use strict';
const rows=`
home|내 물관리 시작|Bắt đầu quản lý nước|My water management
homeDescription|새 물 취수, 저장수 사용, 급수 변경 중 필요한 업무를 선택하세요.|Chọn lấy nước mới, dùng nước trữ hoặc đổi yêu cầu cấp nước.|Choose a new intake, stored water use or a water request change.
cooperative|현장 협동조합 운영자|Điều phối hợp tác xã|Field cooperative operator
platform|플랫폼 운영자|Quản trị nền tảng|Platform operator
manager|제3자 현장관리자|Giám sát hiện trường độc lập|Independent field reviewer
cooperativeDescription|담당 RMU의 요청을 접수·조정하고 농가 고지서를 전달합니다.|Tiếp nhận, điều phối yêu cầu và giao thông báo trong RMU phụ trách.|Triage requests and deliver farm notices in your assigned RMU.
platformDescription|전체 배분 계획, 공급 모형과 계정 권한을 관리합니다.|Quản lý phân bổ, mô hình nguồn cung và quyền tài khoản.|Manage allocation plans, supply models and account access.
managerDescription|급수 결과와 신고·절수 근거를 독립적으로 검증합니다.|Xác minh độc lập kết quả cấp nước, báo cáo và bằng chứng tiết kiệm.|Independently review delivery results, reports and savings evidence.
cooperativeFeatures|요청 접수 · 현장 조정 · 앱/종이 고지|Tiếp nhận · Điều phối · Thông báo ứng dụng/giấy|Request intake · Coordination · App/paper notices
platformFeatures|전체 배분 · 공급 모형 · 계정 승인|Phân bổ · Mô hình nguồn cung · Phê duyệt tài khoản|Allocation · Supply models · Account approval
managerFeatures|전체 기록 열람 · 신고 검토 · 독립 검증|Xem hồ sơ · Xem xét báo cáo · Xác minh độc lập|Read records · Review concerns · Independent verification
notices|고지 방법·수신 확인|Thông báo và xác nhận|Notices and receipt
noticesDescription|앱 또는 종이를 선택하고 관개 배분 고지의 전달 상태를 확인합니다.|Chọn ứng dụng hoặc giấy và theo dõi thông báo phân bổ nước.|Choose app or paper delivery and track irrigation allocation notices.
watermodel|수위→공급량 모형|Mô hình mực nước→nguồn cung|Stage to supply model
watermodelDescription|같은 지점에서 측정한 수위·유량으로 곡선을 보정하고 공급 계획에 반영합니다.|Hiệu chỉnh bằng cặp mực nước–lưu lượng cùng điểm rồi lập kế hoạch nguồn cung.|Calibrate paired stage/discharge at one site, then estimate planning supply.
sources|자료·물 계산 확인|Kiểm tra dữ liệu và tính nước|Data and water calculations
sourcesDescription|연결 출처, 관측 시각과 수요·공급 계산 경로를 확인합니다.|Kiểm tra nguồn, thời gian quan trắc và cách tính nhu cầu, nguồn cung.|Check sources, observation times and the demand/supply calculation path.
newIntake|새로 취수하기|Lấy nước mới|New water intake
storedWater|저장한 물 사용하기|Dùng nước đã trữ|Use stored water
changeRequest|물 부족·급수 변경 요청|Thiếu nước hoặc đổi cấp nước|Shortage or delivery change
intakeHelp|수원·현장 수질을 먼저 확인하고 계획량에 맞춰 요청하세요.|Kiểm tra nguồn và chất lượng tại chỗ trước khi yêu cầu theo kế hoạch.|Check the source and field water quality before requesting the planned amount.
storedHelp|저장 위치·잔량·수질을 기록하고 관개 일정을 확인하세요.|Ghi vị trí, lượng còn lại, chất lượng rồi xem lịch tưới.|Record storage, remaining volume and quality, then check the irrigation schedule.
requestHelp|현재 요청량·처리 상태를 보고 변경 사유를 남기세요.|Xem lượng yêu cầu, trạng thái xử lý và ghi lý do thay đổi.|Review requested amounts and processing status, then record the reason for a change.
fieldCheck|취수·저장수 현장 확인|Kiểm tra nguồn/nước trữ|Intake and storage field check
fieldCheckHelp|수원, 측정 시각, 잔량·염도 등 확인한 내용을 적으세요. 이 기록만으로 수질 적합 판정이나 펌프 제어를 하지 않습니다.|Ghi nguồn, giờ đo, lượng còn lại, độ mặn. Hồ sơ không tự kết luận chất lượng hay điều khiển bơm.|Record the source, measurement time, volume and salinity. This record does not certify water quality or control a pump.
saveCheck|확인 기록 저장|Lưu kiểm tra|Save field check
openSchedule|나의 관개 일정 보기|Xem lịch tưới của tôi|View my irrigation schedule
recentChecks|최근 현장 확인|Kiểm tra gần đây|Recent field checks
appChannel|앱 안에서 확인|Xem trong ứng dụng|View in the app
paperChannel|종이 고지서로 받기|Nhận thông báo giấy|Receive paper notices
noticeHelp|앱 고지는 이 화면에 게시됩니다. 종이는 협동조합이 출력하여 전달합니다. 이메일·문자 자동 발송과 요금 청구 기능은 아닙니다.|Thông báo ứng dụng hiện ở đây; hợp tác xã in và giao bản giấy. Không tự gửi email/SMS hay thu phí.|App notices appear here. The cooperative prints and hands over paper notices. Email, SMS and fee billing are not included.
noticeChannel|수신 방법|Cách nhận|Delivery preference
savePreference|수신 방법 저장|Lưu cách nhận|Save preference
issueNotice|배분 고지 만들기|Tạo thông báo phân bổ|Create allocation notice
printNotice|종이 고지서 인쇄|In thông báo giấy|Print paper notice
handover|종이 전달 완료 기록|Ghi đã giao bản giấy|Record paper handover
handoverNote|전달 일시·방법 기록 (개인정보 제외)|Thời gian/cách giao (không ghi dữ liệu cá nhân)|Handover time and method (no personal information)
acknowledge|내용 확인했어요|Tôi đã xem|I have read this
noticeIssued|고지됨|Đã thông báo|Issued
noticeDelivered|종이 전달 기록됨|Đã ghi giao giấy|Paper handover recorded
noticeAcknowledged|농가 확인됨|Nông hộ đã xác nhận|Acknowledged by farm
noNotices|아직 게시된 고지가 없습니다.|Chưa có thông báo.|No notices have been issued.
noPublishedPlan|공유된 배분 계획이 필요합니다. 플랫폼 운영자가 먼저 계획을 공유해 주세요.|Cần kế hoạch đã công bố từ quản trị nền tảng.|A published allocation plan is required. The platform operator must publish it first.
noticeSnapshot|발행 당시 계획량입니다. 계획 변경 시 새 고지를 발행하세요.|Lượng tại thời điểm phát hành; tạo thông báo mới khi kế hoạch đổi.|This records the plan at issue time. Issue a new notice when plans change.
viewOnly|이 역할에서는 기록을 열람합니다.|Vai trò này chỉ xem hồ sơ.|This role has read access here.
triageOnly|요청을 접수·조정할 수 있습니다. 실제 급수량은 펌프 운영자가 기록합니다.|Có thể tiếp nhận và điều phối; người vận hành bơm ghi lượng thực cấp.|You can triage requests. The pump operator records actual delivery.
modelDemo|18개 RMU 가상 곡선 준비|Tạo đường cong mẫu cho 18 RMU|Prepare synthetic curves for 18 RMUs
modelDemoHelp|수위는 연결 자료를 우선 사용합니다. 곡선·펌프 성능·가동시간·손실률은 가상이며 실제 공급량이 아닙니다.|Ưu tiên mực nước liên kết; đường cong, công suất bơm, giờ chạy, tổn thất đều giả lập.|Linked stage readings are preferred. Curves, pump capacity, hours and losses are synthetic, so outputs are not measured supply.
modelScope|모형 RMU|RMU mô hình|Model RMU
station|수위 관측소|Trạm mực nước|Stage station
sourceId|공유 수원 식별자|Mã nguồn nước chung|Shared source ID
siteName|유량을 측정한 지점|Vị trí đo lưu lượng|Discharge measurement site
datum|수위 기준면·관측소 대응 근거|Mốc mực nước và đối chiếu trạm|Stage datum and station linkage evidence
zeroStage|유량 0 기준 수위 h₀ (m)|Mực nước h₀ khi Q=0 (m)|Zero-flow stage h₀ (m)
calibrationPairs|현장 수위(m), 유량(m³/s) — 한 줄에 한 쌍|Mực nước (m), lưu lượng (m³/s) — mỗi dòng một cặp|Field stage (m), discharge (m³/s) — one pair per line
calibrationHelp|같은 지점·기준면에서 수위와 유량을 동시에 반복 측정하세요. 3개 이상 수위는 입력 최소 조건일 뿐 현장 검증을 대신하지 않습니다. 역류·배수위 영향이 있으면 이 단일 곡선을 쓰지 않습니다.|Đo đồng thời tại cùng điểm và mốc. Ba mực nước chỉ là điều kiện nhập tối thiểu, không thay xác minh. Không dùng đường cong đơn khi có chảy ngược/dềnh nước.|Measure stage and discharge together at the same site and datum. Three levels are only an input minimum, not field validation. Do not use this single curve under backwater or reverse flow.
pumpCap|해당 RMU 펌프 검증용량 (m³/h)|Công suất bơm RMU đã kiểm tra (m³/h)|Verified RMU pump capacity (m³/h)
sourceCap|공유 수원 최대 취수용량 (m³/h)|Giới hạn nguồn chung (m³/h)|Shared intake capacity (m³/h)
sourceShare|공유 수원 중 이 RMU 몫 (%)|Tỷ phần nguồn chung cho RMU (%)|RMU share of common source (%)
runtime|주간 예정 가동시간 (h)|Giờ chạy dự kiến mỗi tuần (h)|Planned weekly runtime (h)
loss|근거 있는 손실률 (%)|Tỷ lệ tổn thất có căn cứ (%)|Evidence-based loss (%)
uncertainty|계획 안전 여유 (%)|Mức dự phòng kế hoạch (%)|Planning margin (%)
evidence|계측·현장 근거|Bằng chứng đo tại chỗ|Measurement and field evidence
saveModel|보정 자료 저장·검증 요청|Lưu hiệu chỉnh và yêu cầu xác minh|Save calibration for review
reviewModel|독립 검증 승인|Phê duyệt xác minh độc lập|Approve independent verification
reviewEvidence|검증 근거 기록|Bằng chứng xác minh|Review evidence
modelPending|현장 검증 대기|Chờ xác minh tại chỗ|Awaiting field verification
modelVerified|독립 검증된 모형|Mô hình đã xác minh độc lập|Independently reviewed model
synthetic|가상 시연 자료|Dữ liệu giả lập|Synthetic demo data
fetchStage|연동 수위 새로 확인|Cập nhật mực nước liên kết|Refresh linked stage
simulatedStage|연결 자료가 없을 때 가상 수위 사용|Dùng mực nước mẫu khi thiếu dữ liệu|Use a simulated stage when no reading is available
observedAt|관측 시각|Thời gian quan trắc|Observation time
stageLevel|수위 (m)|Mực nước (m)|Stage (m)
applyFlow|이 RMU 모형으로 주간 공급 초안 계산|Tính dự thảo nguồn cung tuần cho RMU|Calculate this RMU's weekly supply draft
applyAllFlow|18개 가상 모형으로 공급·배분 계산|Tính nguồn cung và phân bổ 18 RMU mẫu|Calculate supply and allocation for 18 synthetic RMUs
publishFlowHelp|공급 초안을 계산한 뒤 계정·공유 관리에서 계획을 공유하면 다른 기기에 반영됩니다. 미래 주차는 최신 수위를 일정하게 유지한 시나리오입니다.|Sau khi tính dự thảo, công bố trong Tài khoản và chia sẻ. Các tuần tương lai giả định giữ nguyên mực nước mới nhất.|After calculating a draft, publish it in Accounts and sharing. Future weeks assume the latest stage stays constant.
curveDetails|측정 자료·시설 조건 편집|Sửa dữ liệu đo và điều kiện công trình|Edit calibration and operating conditions
curve|수위·유량 보정 곡선|Đường quan hệ mực nước–lưu lượng|Stage–discharge calibration
flow|수원 추정 유량|Lưu lượng nguồn ước tính|Estimated source discharge
usableFlow|몫·시설 한도 적용 유량|Lưu lượng sau chia phần và giới hạn|Flow after share and facility limits
netSupply|계획 반영 순공급량|Nguồn cung ròng dùng lập kế hoạch|Net planning supply
conservativeHelp|보수적 계획값 = 작은 값[유량×안전계수×RMU 몫, 펌프용량, 수원용량×몫]×시간×(1−손실률). 통계적 신뢰구간이 아닙니다.|Giá trị thận trọng = min[lưu lượng×hệ số dự phòng×tỷ phần, công suất bơm, giới hạn nguồn×tỷ phần]×giờ×(1−tổn thất). Không phải khoảng tin cậy thống kê.|Conservative plan = min[flow×margin factor×share, pump capacity, source capacity×share]×hours×(1−loss). This is not a statistical confidence interval.
modelSaved|모형을 저장했습니다. 입력값 변경 시 독립 검증을 다시 받아야 합니다.|Đã lưu mô hình; cần xác minh lại sau khi sửa.|Model saved. Any edit requires a new independent review.
flowApplied|공급 초안을 배분 계산에 반영했습니다. 공유하려면 계획을 게시하세요.|Đã áp dụng dự thảo vào phân bổ; công bố để chia sẻ.|Supply draft applied to allocation. Publish the plan to share it.
FLOW_INPUT|빈 값, 범위 또는 숫자 형식을 확인해 주세요.|Kiểm tra ô trống, khoảng và định dạng số.|Check missing values, ranges and number formats.
FLOW_SAMPLES|수위·유량 측정쌍을 3개 이상 입력하세요.|Nhập ít nhất ba cặp đo.|Enter at least three measured stage/discharge pairs.
FLOW_RANGE|서로 다른 수위와 유효한 h₀가 필요합니다.|Cần mực nước khác nhau và h₀ hợp lệ.|Distinct levels and a valid h₀ are required.
FLOW_BACKWATER|역류·배수위 영향에서는 단일 수위 곡선을 사용할 수 없습니다.|Không dùng đường cong đơn khi có chảy ngược hoặc dềnh nước.|A single stage curve is unsuitable for backwater or reversing flow.
FLOW_FIT|측정 자료로 유효한 곡선을 만들지 못했습니다.|Không khớp được đường cong hợp lệ.|The samples do not produce a valid rating curve.
FLOW_STALE|관측이 오래됐거나 시각이 잘못되었습니다. 최신 자료를 확인하거나 가상 시연을 선택하세요.|Quan trắc cũ hoặc giờ không hợp lệ. Cập nhật hoặc chọn giả lập.|The reading is stale or its time is invalid. Refresh or choose a simulated demo.
FLOW_OUTSIDE_RANGE|수위가 현장 보정 범위를 벗어났습니다. 외삽 공급량은 만들지 않습니다.|Mực nước ngoài khoảng hiệu chỉnh; không ngoại suy nguồn cung.|Stage is outside the calibration range. Supply is not extrapolated.
FLOW_STATION|보정 자료의 관측소와 현재 수위 관측소가 다릅니다.|Trạm hiệu chỉnh khác trạm quan trắc hiện tại.|The observation station does not match the calibration.
FLOW_DATUM|측정 지점과 수위 기준면 근거가 필요합니다.|Cần vị trí đo và căn cứ mốc nước.|Measurement site and stage datum evidence are required.
FLOW_NOT_VERIFIED|실제 계획에는 독립 검증된 현장 모형이 필요합니다.|Kế hoạch thật cần mô hình tại chỗ đã xác minh độc lập.|Real planning requires an independently reviewed field model.
FLOW_SOURCE|공유 수원 식별자를 입력하세요.|Nhập mã nguồn chung.|Enter a shared source ID.
FLOW_SHARES|같은 수원의 RMU 몫 합계가 100%를 넘습니다.|Tổng tỷ phần cùng nguồn vượt 100%.|RMU shares for the same source exceed 100%.
FLOW_SOURCE_MISMATCH|같은 수원은 관측소와 최대용량이 같아야 합니다.|Cùng nguồn phải có cùng trạm và giới hạn công suất.|Models sharing a source must use the same station and intake capacity.
linkedReadings|연동 관측|Quan trắc liên kết|Linked observations
noReading|유효한 연결 수위가 없습니다.|Chưa có mực nước liên kết hợp lệ.|No valid linked stage is available.
refreshData|연결·계산 근거 새로 확인|Kiểm tra lại kết nối và căn cứ|Refresh sources and calculation evidence
rainfall|강우량|Lượng mưa|Rainfall
source|자료 출처|Nguồn dữ liệu|Data source
requestTime|조회 시각|Thời gian truy vấn|Fetched at
connectionOk|응답 확인|Đã nhận phản hồi|Response received
connectionError|조회 실패|Truy vấn thất bại|Fetch failed
demandFormula|농가 수요 = max(ET₀×Kc−유효강우,0)×면적(ha)×10÷(포장효율×수로효율)|Nhu cầu = max(ET₀×Kc−mưa hiệu quả,0)×diện tích(ha)×10÷(hiệu suất ruộng×hiệu suất kênh)|Demand = max(ET₀×Kc−effective rain,0)×area(ha)×10÷(field efficiency×canal efficiency)
rainFormula|유효강우는 월 강우와 ETc를 쓰는 SCS 산식으로 계산하여 일별 강우 비율로 나눕니다. 같은 비를 다시 차감하지 않습니다.|Mưa hiệu quả dùng công thức SCS theo tháng và ETc, chia theo tỷ lệ mưa ngày; không trừ hai lần.|Effective rain uses the monthly SCS equation with ETc and is distributed by daily rain. Rain is deducted once.
allocationFormula|검증된 공급자료 → 최소 비례 배분 → 농업위험 45%·대기 30%·형평 15%·효율 10% → 농가별 계획|Nguồn cung có căn cứ → mức chia tối thiểu → rủi ro 45%·chờ 30%·công bằng 15%·hiệu quả 10% → kế hoạch nông hộ|Supply inputs → minimum proportional allocation → risk 45%, wait 30%, equity 15%, efficiency 10% → farm plans
sourceHelp|수위·강우는 MRC 자료를 옮긴 Google Sheets CSV를 조회합니다. 기상은 Open-Meteo입니다. 수위는 RMU 실측 유량이 아니며 관측 시각을 별도로 확인해야 합니다.|Mực nước/mưa lấy từ CSV Google Sheets tổng hợp MRC; thời tiết từ Open-Meteo. Mực nước không phải lưu lượng RMU, cần kiểm tra giờ đo.|Stage/rain come from a Google Sheets CSV mirror of MRC data; weather comes from Open-Meteo. Stage is not measured RMU flow; check observation times.
climateHelp|수요 계산의 최근 ET₀·강우는 Open-Meteo, 과거는 내장 기후자료, 예보 이후는 월별 기후 시나리오를 사용합니다. 계획값과 관측값을 구분합니다.|ET₀/mưa gần đây dùng Open-Meteo, quá khứ dùng dữ liệu khí hậu tích hợp, sau dự báo dùng khí hậu tháng. Phân biệt kế hoạch và quan trắc.|Demand uses recent Open-Meteo ET₀/rain, bundled historical climate and monthly scenarios beyond the forecast. Planning values are distinguished from observations.
savedOk|서버에 저장했습니다.|Đã lưu trên máy chủ.|Saved to the server.
working|처리 중…|Đang xử lý…|Working…
empty|기록 없음|Chưa có hồ sơ|No records
`;
const extras=`
주요 페이지|Trang chính|Main navigation
시연 공급량 · 실측 아님|Nguồn cung mẫu · không phải số đo|Synthetic supply · not measured
현장 보정 수위·유량 곡선 (모형 화면에서 수정)|Đường cong mực nước–lưu lượng (sửa trong Mô hình)|Calibrated stage–discharge (edit in Model)
현장 보정 수위·유량 곡선|Đường cong mực nước–lưu lượng hiệu chỉnh|Calibrated stage–discharge curve
수위 보정 계획 추정|Ước tính kế hoạch theo mực nước|Stage-calibrated planning estimate
큰 물길의 연결|Kết nối dòng chính|Main waterway connection
큰 물길 연결만 확인; 특정 펌프·필지 급수 연결 아님|Chỉ xác nhận kết nối dòng chính, chưa phải kết nối bơm/thửa ruộng|Main waterway connection only; specific pump/field links unverified
과거 보도 사례|Trường hợp báo chí trước đây|Historical reported case
개인 양수기|Máy bơm cá nhân|Private pump
자기 논|Ruộng của hộ|Own rice field
다른 농가 논|Ruộng hộ khác|Another farm's field
디젤 중계 펌프|Bơm chuyển tiếp diesel|Diesel relay pump
대상 논|Ruộng nhận nước|Receiving field
협동조합 중계 양수 사례|Trường hợp bơm chuyển tiếp hợp tác xã|Cooperative relay pumping case
취수원과 중계 시설의 이름·좌표 미상|Chưa rõ tên/vị trí nguồn và trạm chuyển tiếp|Source and relay facility names/coordinates unknown
과거 농민 진술. 현재 노선·양수능력 확인 불가|Lời kể trước đây; chưa xác nhận tuyến/công suất hiện tại|Historical farmer statement; current route/capacity unverified
이름 중복 후보|Ứng viên trùng tên|Duplicate-name candidate
경계 다각형|Đa giác ranh giới|Boundary polygons
지도 확대|Phóng to bản đồ|Zoom in
지도 축소|Thu nhỏ bản đồ|Zoom out
지도 확대 초기화|Đặt lại thu phóng|Reset zoom
수원|Nguồn nước|Water source
조회 실패|Truy vấn thất bại|Fetch failed
암거|Cống ngầm|Culvert
시설 검색 종류|Loại công trình tìm kiếm|Facility search types
원본 canal-name map에서 위치를 옮긴 C01~C22 이미지 참조점|Điểm tham chiếu C01–C22 từ bản đồ tên kênh gốc|C01–C22 image reference points transferred from the canal-name map
농가, RMU, 펌프 및 수문 참조 배지|Nhãn tham chiếu nông hộ, RMU, bơm và cống|Farm, RMU, pump and gate reference badges
관련|liên quan|associated
설치위치 미확인|Chưa xác định vị trí lắp đặt|Installation position unverified
이미지 참조 위치 확인|Xem vị trí tham chiếu ảnh|View image reference location
RMU 안의 도식 대표 위치 · 실제 필지 아님|Vị trí sơ đồ trong RMU, không phải thửa đất thực|Schematic RMU location, not an actual parcel
정보 보기|Xem thông tin|View details
과거 기록 기반 추정|Ước tính theo hồ sơ cũ|Historical-record estimate
주간 공급 가능량|Nguồn cung tuần|Weekly available supply
실제 공급기록으로 전환|Chuyển về hồ sơ nguồn cung thật|Return to actual supply records
수위 지표 반영 가상값 생성|Mô hình lưu lượng theo mực nước mẫu|Model synthetic flow from stage
수위 지표 가상|Giả lập theo mực nước|Stage-based synthetic scenario
자료 산정 방법|Phương pháp tính dữ liệu|Estimation method
모형 화면에서 수정|Sửa trong màn hình Mô hình|Edit in the model workspace
`;
for(const line of extras.trim().split('\n'))window.MekongI18n.add(...line.split('|'));
window.MekongI18n.register(rows.trim().split('\n').map(x=>x.split('|')));
})();
