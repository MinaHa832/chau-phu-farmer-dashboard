(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const words={
    demoTitle:['시연 계정으로 둘러보기','Khám phá bằng tài khoản mẫu','Explore with a demo account'], demoHelp:['이메일 없이 역할을 선택하세요. 18개 RMU·54개 시범농가의 요청과 처리 결과를 다른 기기에서도 함께 확인합니다.','Chọn vai trò, không cần email. Yêu cầu và kết quả của 54 nông hộ thuộc 18 RMU được chia sẻ giữa các thiết bị.','Choose a role without email. Requests and results for 54 pilot farms in 18 RMUs are shared across devices.'],
    demoEnter:['이 역할로 시연 시작','Bắt đầu với vai trò này','Start demo with this role'], demoAccount:['시연 계정','Tài khoản mẫu','Demo account'], demoFarm:['시범농가','Nông hộ thí điểm','Pilot farm'], demoRmu:['담당 RMU','RMU phụ trách','Assigned RMU'],
    demoAccess:['선택한 시연 역할과 담당 구역으로 접속합니다.','Truy cập theo vai trò mẫu và khu vực đã chọn.','Access follows the selected demo role and area.'],
    demoBanner:['공용 시연 공간 · 가상 자료입니다. 실제 개인정보를 입력하지 마세요.','Không gian mẫu dùng chung · dữ liệu giả lập. Không nhập thông tin cá nhân thật.','Shared demo · fictional data. Do not enter real personal information.'], liveEntry:['실제 계정으로 로그인','Đăng nhập tài khoản thật','Sign in with a real account'], demoEntry:['이메일 없이 시연하기','Dùng bản mẫu không cần email','Try the demo without email'], switchDemo:['역할 바꾸기','Đổi vai trò','Switch role'], demoPlans:['공유 계획 관리','Quản lý kế hoạch chia sẻ','Shared plan management'],
    resend:['확인 메일 재전송','Gửi lại email xác nhận','Resend confirmation email'], EMAIL_UNCONFIRMED:['아직 이메일 확인이 완료되지 않았습니다. 확인 메일을 다시 받을 수 있습니다.','Email chưa được xác nhận. Bạn có thể yêu cầu gửi lại.','Your email is not confirmed yet. You can resend the confirmation.'],
    MAIL_UNAVAILABLE:['확인 메일을 보낼 수 없습니다. 관리자에게 메일 발송 연결 확인을 요청해 주세요.','Không gửi được email xác nhận. Nhờ quản trị viên kiểm tra dịch vụ gửi email.','Confirmation email is unavailable. Ask the administrator to check the email service.'], EMAIL_RATE_LIMITED:['메일 발송이 잠시 제한되었습니다. 잠시 기다린 뒤 한 번만 다시 요청해 주세요.','Tạm giới hạn gửi email. Vui lòng đợi rồi thử lại một lần.','Email sending is temporarily limited. Wait before trying once more.'], CONFIRM_LINK_INVALID:['확인 링크가 만료되었거나 유효하지 않습니다. 확인 메일을 다시 요청해 주세요.','Liên kết xác nhận đã hết hạn hoặc không hợp lệ. Yêu cầu email mới.','The confirmation link is expired or invalid. Request a new email.'],
    signIn:['로그인','Đăng nhập','Sign in'], signUp:['계정 만들기','Tạo tài khoản','Create account'], email:['이메일','Email','Email'], password:['비밀번호','Mật khẩu','Password'], name:['이름','Họ tên','Name'],
    loginTitle:['내 계정으로 접속하기','Truy cập bằng tài khoản của bạn','Access your workspace'], loginHelp:['승인된 역할과 담당 농가·RMU로 연결됩니다.','Truy cập theo vai trò và nông hộ/RMU được phê duyệt.','Your approved role and farm/RMU determine access.'],
    approval:['관리자 승인 대기','Đang chờ quản trị viên phê duyệt','Awaiting administrator approval'], approvalHelp:['이메일 확인 후 관리자가 역할과 담당 농가·RMU를 배정해야 접속할 수 있습니다.','Sau khi xác nhận email, quản trị viên cần gán vai trò và nông hộ/RMU.','After email confirmation, an administrator must approve your role and assignment.'],
    signOut:['로그아웃','Đăng xuất','Sign out'], refresh:['새로 확인','Kiểm tra lại','Refresh'], recover:['비밀번호 찾기','Quên mật khẩu','Forgot password'], checkEmail:['이메일을 확인해 주세요. 확인 링크로 돌아온 뒤 로그인할 수 있습니다.','Kiểm tra email và mở liên kết xác nhận, sau đó đăng nhập.','Check your email and open the confirmation link, then sign in.'],
    passwordHint:['새 비밀번호는 12자 이상으로 입력하세요.','Mật khẩu mới cần ít nhất 12 ký tự.','Use at least 12 characters for a new password.'], updatePassword:['새 비밀번호 저장','Lưu mật khẩu mới','Save new password'], savedPassword:['비밀번호를 변경했습니다.','Đã đổi mật khẩu.','Password updated.'],
    connected:['서버와 연결됨','Đã kết nối máy chủ','Connected to shared records'], syncing:['최신 기록 확인 중…','Đang kiểm tra hồ sơ mới…','Checking for updates…'], saved:['서버에 저장했습니다. 다른 기기에도 반영됩니다.','Đã lưu trên máy chủ; các thiết bị khác sẽ được cập nhật.','Saved to the server. Other devices will receive the update.'],
    offline:['연결이 끊겼습니다. 마지막으로 확인한 기록입니다. 저장하려면 다시 연결해 주세요.','Mất kết nối. Đang hiển thị hồ sơ đã tải trước đó; cần kết nối để lưu.','Connection lost. Showing the last loaded records; reconnect to save.'], updates:['새 기록이 있습니다. 입력을 마친 뒤 새로 확인해 주세요.','Có hồ sơ mới. Hoàn tất nhập rồi làm mới.','Updates are available. Finish editing, then refresh.'],
    accounts:['계정·공유 관리','Tài khoản và chia sẻ','Accounts and sharing'], accountsDescription:['계정을 승인하고 담당 농가·RMU를 지정합니다. 관개 계획은 검토 후 공유합니다.','Phê duyệt tài khoản, gán nông hộ/RMU và công bố kế hoạch tưới đã kiểm tra.','Approve accounts, assign farms/RMUs, and publish reviewed irrigation plans.'],
    pending:['승인 대기','Chờ phê duyệt','Pending approval'], approved:['접속 허용','Cho phép truy cập','Allow access'], assignment:['담당 농가 / RMU','Nông hộ / RMU phụ trách','Assigned farm / RMU'], saveMember:['권한 저장','Lưu quyền','Save access'],
    publish:['현재 관개 계획 공유','Công bố kế hoạch tưới hiện tại','Publish current irrigation plan'], publishHelp:['검토한 주간 배분안과 공급자료를 서버에 저장합니다. 농민과 운영자는 같은 공유 계획을 확인합니다.','Lưu kế hoạch tuần và dữ liệu nguồn cung đã kiểm tra; nông dân và người vận hành xem cùng kế hoạch.','Save reviewed allocations and supply inputs so farmers and operators see the same plan.'],
    draftSupply:['공급자료 초안을 준비했습니다. 계정·공유 관리에서 관개 계획을 공유해야 다른 기기에 반영됩니다.','Đã chuẩn bị dữ liệu nguồn cung. Công bố kế hoạch trong Tài khoản và chia sẻ để cập nhật thiết bị khác.','Supply draft prepared. Publish the irrigation plan in Accounts and sharing to update other devices.'],
    noPlan:['관리자가 아직 관개 계획을 공유하지 않았습니다.','Quản trị viên chưa công bố kế hoạch tưới.','An administrator has not published an irrigation plan yet.'], stalePlan:['농가 정보가 바뀌었습니다. 배분안을 검토하고 다시 공유해 주세요.','Thông tin nông hộ đã thay đổi. Kiểm tra và công bố lại kế hoạch.','Farm data changed. Review and publish the allocation again.'],
    lockedRole:['계정에 승인된 역할로 접속합니다.','Truy cập theo vai trò đã được phê duyệt.','Access follows your approved account role.'], demoLocal:['시연 화면 · 서버 계정 연결 전입니다. 입력은 이 기기에만 저장됩니다.','Bản trình diễn · chưa kết nối tài khoản máy chủ; dữ liệu chỉ lưu trên thiết bị này.','Demo workspace · shared accounts are not connected; data stays on this device.'],
    select:['선택하세요','Vui lòng chọn','Select'], noReplace:['기존 시범농가 54개를 유지합니다. 공급자료와 배분안을 조정한 뒤 공유해 주세요.','Giữ nguyên 54 nông hộ thí điểm. Điều chỉnh nguồn cung và công bố kế hoạch.','The existing 54 pilot farms are preserved. Adjust supply and publish the plan.'],
    retry:['다시 연결','Kết nối lại','Reconnect'], error:['처리하지 못했습니다. 연결과 입력을 확인해 주세요.','Không xử lý được. Kiểm tra kết nối và dữ liệu.','Unable to complete this action. Check the connection and inputs.'],
    AUTH_FAILED:['이메일·비밀번호와 이메일 인증 여부를 확인해 주세요.','Kiểm tra email, mật khẩu và xác nhận email.','Check your email, password, and email confirmation.'], AUTH_REQUIRED:['다시 로그인해 주세요.','Vui lòng đăng nhập lại.','Please sign in again.'], FORBIDDEN:['이 작업에 대한 권한이 없습니다.','Bạn không có quyền thực hiện thao tác này.','Your account cannot perform this action.'],
    VERSION_CONFLICT:['다른 기기에서 기록을 변경했습니다. 새로 확인한 뒤 다시 저장해 주세요.','Thiết bị khác đã sửa hồ sơ. Làm mới trước khi lưu lại.','Another device changed this record. Refresh and review before saving again.'],
    DUPLICATE_REQUEST:['이 농가·주차에 처리 중인 요청이 이미 있습니다. 내 요청을 확인해 주세요.','Đã có yêu cầu đang xử lý cho nông hộ và tuần này.','This farm already has an open request for this week. Review your requests.'],
    DELIVERY_INVALID:['완료는 요청량 이상, 부분 공급은 요청량 미만의 실제량을 입력하세요. 미급수·초과 공급은 사유가 필요합니다.','Hoàn tất: lượng thực cấp ≥ yêu cầu; cấp một phần: ít hơn yêu cầu. Ghi lý do khi không cấp hoặc cấp vượt.','Completed requires at least the requested amount; partial requires less. Give a reason for no supply or excess delivery.'],
    TERMINAL_REQUEST:['처리된 요청의 정정은 관리자가 사유와 함께 기록해야 합니다.','Quản trị viên phải ghi lý do khi sửa yêu cầu đã kết thúc.','An administrator must give a reason to correct a closed request.'],
    LAST_MANAGER:['마지막 관리자 계정은 해제할 수 없습니다.','Không thể gỡ quản trị viên cuối cùng.','The last administrator cannot be removed.'], PLAN_CHANGED:['공유 계획이 바뀌었습니다. 새로 확인한 뒤 주차를 선택해 주세요.','Kế hoạch đã đổi. Làm mới và chọn lại tuần.','The shared plan changed. Refresh and select the week again.'],
    VERIFY_BLOCKED:['독립된 관리자와 비교 조건·실측 근거·농가 확인이 필요합니다.','Cần quản trị viên độc lập, điều kiện so sánh, bằng chứng và xác nhận nông hộ.','Independent review, comparable periods, evidence, and farmer confirmation are required.'],
    PASSWORD_LENGTH:['새 비밀번호는 12~128자로 입력하세요.','Mật khẩu mới cần 12–128 ký tự.','Use 12–128 characters for a new password.'], RATE_LIMITED:['요청이 많습니다. 잠시 후 다시 시도해 주세요.','Quá nhiều yêu cầu. Vui lòng thử lại sau.','Too many attempts. Try again shortly.'],
    NOT_CONFIGURED:['공용 서버 설정을 먼저 연결해야 합니다.','Cần cấu hình máy chủ dùng chung.','The shared server must be configured first.'], busy:['저장 중입니다. 잠시 기다려 주세요.','Đang lưu. Vui lòng đợi.','A save is in progress. Please wait.']
  };
  const language=()=>window.MekongI18n?.language||'ko';
  const t=key=>(words[profile()?.demo?({accounts:'demoPlans',accountsDescription:'publishHelp',lockedRole:'demoAccess',signOut:'switchDemo'}[key]||key):key]||words.error)[{ko:0,vi:1,en:2}[language()]];
  let active=false, ready=false, snapshot=null, fingerprint='', editingRole='farmer', formMode='login';
  let workspace='live', entryMode='demo', demoAvailable=false, demoRmu='RMU-01', demoFarm='B', authEmail='';
  let mutating=false, fetching=false, generation=0, lastSync='', status='syncing', gateMessage='', pendingSnapshot=null;
  function profile(){return snapshot?.profile;}
  function approved(){return !!profile()?.approved && ['farmer','operator','manager','cooperative','platform'].includes(profile()?.role);}
  async function api(url,data) {
    let response;
    try {response=await fetch(url,{method:data===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:data===undefined?{}:{'Content-Type':'application/json','X-Mekong-Request':'1'},body:data===undefined?undefined:JSON.stringify(data)});}catch {throw Object.assign(new Error('SERVICE_UNAVAILABLE'),{code:'SERVICE_UNAVAILABLE'});}
    const result=await response.json().catch(()=>({error:'SERVICE_UNAVAILABLE'}));
    if(!response.ok)throw Object.assign(new Error(result.error||'SERVICE_UNAVAILABLE'),{code:result.error||'SERVICE_UNAVAILABLE',status:response.status});
    return result;
  }
  function message(e){return words[e?.code]?t(e.code):t('error');}
  const sharedUrl=()=>'/api/shared'+(workspace==='demo'?'?workspace=demo':'');
  function announceAuth(){if(typeof BroadcastChannel!=='undefined'){const channel=new BroadcastChannel('mekong-auth');channel.postMessage('changed');channel.close();}}
  function demoControls() {
    return `<form id="cloudDemoForm">${!['manager','platform'].includes(editingRole)?`<label>${t('demoRmu')}<select id="cloudDemoRmu">${Array.from({length:18},(_,i)=>`RMU-${String(i+1).padStart(2,'0')}`).map(r=>`<option${r===demoRmu?' selected':''}>${r}</option>`).join('')}</select></label>`:''}${editingRole==='farmer'?`<label>${t('demoFarm')}<select id="cloudDemoFarm">${['A','B','C'].map(x=>`<option${x===demoFarm?' selected':''}>${x}</option>`).join('')}</select></label>`:''}<p class="cloud-demo-identity">${t('demoAccount')}: <strong>demo-${editingRole}${['manager','platform'].includes(editingRole)?'':'-'+demoRmu.toLowerCase()}${editingRole==='farmer'?'-'+demoFarm.toLowerCase():''}</strong></p><button class="btn btn-primary" type="submit">${t('demoEnter')}</button></form><p class="cloud-demo-notice">${t('demoBanner')}</p><div class="cloud-auth-links"><button type="button" data-cloud-entry="live">${t('liveEntry')}</button></div>`;
  }
  function showGate() {
    if(!active)return;
    document.body.dataset.cloudGate='true';
    $('cloudGate').hidden=false;
    const p=profile(), demo=demoAvailable&&entryMode==='demo'&&!p;
    const actionWord=x=>x==='signup'?'signUp':x==='recover'?'recover':x==='resend'?'resend':'signIn';
    $('cloudGate').innerHTML=`<div class="cloud-auth-card"><div class="cloud-wordmark">MEKONG WATER LAB</div><div class="cloud-languages">${['ko','vi','en'].map(x=>`<button type="button" data-cloud-language="${x}" aria-pressed="${language()===x}">${{ko:'한국어',vi:'Tiếng Việt',en:'English'}[x]}</button>`).join('')}</div><h1>${t(p?'approval':demo?'demoTitle':'loginTitle')}</h1><p>${t(p?'approvalHelp':demo?'demoHelp':'loginHelp')}</p>${!p?`<div class="cloud-role-options">${['farmer','cooperative','operator','platform','manager'].map(r=>`<button type="button" data-cloud-request-role="${r}" aria-pressed="${editingRole===r}">${window.MekongI18n.t(r)}</button>`).join('')}</div>`:''}${p?`<p><strong>${esc(p.email)}</strong></p><button type="button" class="btn btn-primary" data-cloud-refresh>${t('refresh')}</button><button type="button" class="btn btn-secondary" data-cloud-logout>${t('signOut')}</button>${demoAvailable?`<button type="button" class="btn btn-secondary" data-cloud-entry="demo">${t('demoEntry')}</button>`:''}`:demo?demoControls():
      `<form id="cloudAuthForm"><label>${t('email')}<input name="email" type="email" autocomplete="email" value="${esc(authEmail)}" required maxlength="254"></label>${formMode==='signup'?`<label>${t('name')}<input name="displayName" autocomplete="name" required maxlength="100"></label>`:''}${['recover','resend'].includes(formMode)?'':`<label>${t('password')}<input name="password" type="password" autocomplete="${formMode==='signup'?'new-password':'current-password'}" required ${formMode==='signup'?'minlength="12"':''} maxlength="128"></label>`}<button class="btn btn-primary" type="submit">${t(actionWord(formMode))}</button></form><div class="cloud-auth-links">${['login','signup','recover','resend'].filter(x=>x!==formMode).map(x=>`<button type="button" data-cloud-mode="${x}">${t(actionWord(x))}</button>`).join('')}${demoAvailable?`<button type="button" data-cloud-entry="demo">${t('demoEntry')}</button>`:''}</div>`}<p id="cloudGateMessage" class="cloud-message" role="status" aria-live="polite">${esc(gateMessage)}</p></div>`;
  }
  function statusBar() {
    if(!$('cloudStatus'))return;
    $('cloudStatus').hidden=!active||!approved();
    $('cloudStatus').dataset.status=status;
    $('cloudStatusText').textContent=(profile()?.demo?t('demoBanner')+' · ':'')+t(status)+(status==='connected'&&lastSync?' · '+new Date(lastSync).toLocaleTimeString(language()==='vi'?'vi-VN':language()==='en'?'en-GB':'ko-KR'): '');
    $('cloudRefresh').textContent=t('refresh');$('cloudLogout').textContent=t(profile()?.demo?'switchDemo':'signOut');
  }
  function apply(next,{force=false}={}) {
    if(!next?.profile)throw new Error('Invalid shared profile');
    const identityChanged=JSON.stringify(next.profile)!==JSON.stringify(snapshot?.profile);
    const farmsChanged=identityChanged||JSON.stringify(next.farms)!==JSON.stringify(snapshot?.farms);
    const planningChanged=identityChanged||next.planning?.publishedAt!==snapshot?.planning?.publishedAt;
    const sig=JSON.stringify({...next,serverTime:null});
    if(!force&&sig===fingerprint){status='connected';lastSync=next.serverTime||new Date().toISOString();statusBar();return;}
    if(!force&&!identityChanged&&document.activeElement?.matches('#content input,#content textarea,#content select')){pendingSnapshot=next;status='updates';statusBar();return;}
    if(identityChanged&&$('benefitNotice'))$('benefitNotice').textContent='';
    snapshot=next;fingerprint=sig;pendingSnapshot=null;lastSync=next.serverTime||new Date().toISOString();status='connected';
    if(!approved()) {
      window.__MEKONG_TEST__.replaceSharedFarms([]);window.MekongBenefit.replaceSharedState({});showGate();statusBar();return;
    }
    // The shared data is kept in memory. Device-local demo stores remain untouched.
    window.MekongBenefit.replaceSharedState(benefitState(next),false);
    if(planningChanged)window.MekongWeeklySupply.replaceShared(next.planning?.supplyRecords||[],next.planning?.supplyMode||'actual');
    if(farmsChanged||planningChanged)window.__MEKONG_TEST__.replaceSharedFarms(next.farms||[],planningChanged?(next.planning||{calendarStart:'2026-05-01',climateMode:'csv'}):{});
    document.body.dataset.cloudGate='false';$('cloudGate').hidden=true;
    window.MekongPortal.acceptSession(next.profile);
    window.MekongBenefit.render();renderAdmin();statusBar();window.MekongWorkspace?.refresh();
    window.dispatchEvent(new CustomEvent('mekong:records-updated'));
  }
  function benefitState(data) {
    const state={records:[],incidents:[],operations:[],requests:[]};
    for(const item of data?.items||[])if(state[item.kind])state[item.kind].push(item.data);
    return state;
  }
  async function refresh({force=false}={}) {
    if(!active||fetching||mutating)return;
    if(!force&&!profile())return;
    if(force&&pendingSnapshot){apply(pendingSnapshot,{force:true});}
    fetching=true;const started=generation;
    try {const data=await api(sharedUrl());if(started===generation)apply(data,{force});}
    catch(e) {
      if(e.status===401){const hadSession=!!profile();snapshot=null;fingerprint='';window.__MEKONG_TEST__.replaceSharedFarms([]);window.MekongBenefit.replaceSharedState({});if(hadSession)gateMessage=message(e);showGate();}
      else {status='offline';if(!approved()){gateMessage=message(e);showGate();}}
      statusBar();
    }finally {fetching=false;}
  }
  async function command(action,data,expectedVersion=0) {
    if(!active||!approved())throw Object.assign(new Error('AUTH_REQUIRED'),{code:'AUTH_REQUIRED'});
    if(mutating)throw Object.assign(new Error('busy'),{code:'busy'});
    mutating=true;generation++;
    try {
      const result=await api(sharedUrl(),{action,data,expectedVersion});
      generation++;apply(result,{force:true});return result;
    }catch(e) {
      if(e.status===401){snapshot=null;gateMessage=message(e);showGate();}
      // Keep the form's original revision on a conflict: refreshing is explicit,
      // so clicking Save again cannot accidentally overwrite the newer record.
      if(!e.status||e.status>=500){status='offline';statusBar();}if(e.status===403){setTimeout(()=>refresh({force:true}),0);}
      throw e;
    }finally{mutating=false;}
  }
  async function logout() {
    try {await api('/api/session?action='+(workspace==='demo'?'demo-logout':'logout'),{});}catch(e){gateMessage=message(e);showGate();return;}
    generation++;snapshot=null;fingerprint='';pendingSnapshot=null;if($('benefitNotice'))$('benefitNotice').textContent='';window.__MEKONG_TEST__.replaceSharedFarms([]);window.MekongBenefit.replaceSharedState({});
    window.MekongPortal.lockSession();gateMessage='';showGate();statusBar();
    announceAuth();
  }
  async function demoSubmit(event) {
    event.preventDefault();const button=event.target.querySelector('button[type=submit]');button.disabled=true;
    try {
      await api('/api/session?action=demo',{role:editingRole,rmu:demoRmu,farmId:'DEMO-'+demoRmu+'-'+demoFarm});
      generation++;snapshot=null;fingerprint='';pendingSnapshot=null;workspace='demo';gateMessage='';
      await refresh({force:true});announceAuth();
    }catch(e){gateMessage=message(e);$('cloudGateMessage').textContent=gateMessage;}
    finally{button.disabled=false;}
  }
  async function authSubmit(event) {
    event.preventDefault();const button=event.target.querySelector('button[type=submit]');button.disabled=true;
    const data=Object.fromEntries(new FormData(event.target));data.requestedRole=editingRole;authEmail=data.email||authEmail;
    try {
      if(formMode==='password') {await api('/api/session?action=password',{password:data.password});formMode='login';gateMessage=t('savedPassword');$('cloudPasswordReset')?.remove();await refresh({force:true});return;}
      await api('/api/session?action='+formMode,data);
      event.target.reset();gateMessage=formMode==='login'?'':t('checkEmail');
      if(formMode==='login'){workspace='live';await refresh({force:true});announceAuth();}else {if(formMode==='signup')formMode='resend';showGate();}
    }catch(e){gateMessage=message(e);if(e.code==='EMAIL_UNCONFIRMED'){formMode='resend';showGate();}else $('cloudGateMessage').textContent=gateMessage;}
    finally{button.disabled=false;}
  }
  function renderAdmin() {
    const root=$('portalAccountsContent');if(!root||profile()?.role!=='platform')return;
    const planning=snapshot.planning;
    root.innerHTML=`<div class="card cloud-publish"><h2>${t('publish')}</h2><p>${t('publishHelp')}</p><p class="cloud-message">${planning?.stale?t('stalePlan'):planning?.publishedAt?esc(new Date(planning.publishedAt).toLocaleString(language()==='vi'?'vi-VN':language()==='en'?'en-GB':'ko-KR')):t('noPlan')}</p><button type="button" class="btn btn-primary" data-cloud-publish>${t('publish')}</button></div><div class="card"><h2>${t('accounts')}</h2><div class="table-wrap"><table><thead><tr><th>${t('name')} / ${t('email')}</th><th>${t('assignment')}</th><th>${t('approved')}</th><th></th></tr></thead><tbody>${(snapshot.members||[]).map(m=>`<tr data-cloud-member="${esc(m.id)}" data-version="${m._version}"><td><strong>${esc(m.displayName)}</strong><br>${esc(m.email)}</td><td><label><select data-member-role>${['pending','farmer','operator','manager','cooperative','platform'].map(r=>`<option value="${r}"${m.role===r?' selected':''}>${r==='pending'?t('pending'):window.MekongI18n.t(r)}</option>`).join('')}</select></label><label><select data-member-farm><option value="">${t('select')}</option>${(snapshot.farms||[]).map(f=>`<option value="${esc(f.id)}"${m.farmId===f.id?' selected':''}>${esc(window.MekongI18n.displayName(f.name))} · ${esc(f.rmu)}</option>`).join('')}</select></label><label><select data-member-rmu><option value="">${t('select')}</option>${Array.from({length:18},(_,i)=>`RMU-${String(i+1).padStart(2,'0')}`).map(r=>`<option${m.rmu===r?' selected':''}>${r}</option>`).join('')}</select></label></td><td><label><input type="checkbox" data-member-approved${m.approved?' checked':''}> ${t('approved')}</label></td><td><button type="button" class="btn btn-primary btn-small" data-member-save>${t('saveMember')}</button></td></tr>`).join('')}</tbody></table></div><p id="cloudAdminMessage" class="cloud-message" role="status"></p></div>`;
    if(profile().demo){
      root.querySelector('.card:not(.cloud-publish)')?.remove();
      const notice=document.createElement('p');notice.id='cloudAdminMessage';notice.className='cloud-message';notice.setAttribute('role','status');root.querySelector('.cloud-publish').append(notice);
    }
    root.querySelectorAll('[data-cloud-member]').forEach(memberControls);
  }
  function memberControls(row) {
    const r=row.querySelector('[data-member-role]').value;
    row.querySelector('[data-member-farm]').hidden=r!=='farmer';row.querySelector('[data-member-rmu]').hidden=!['operator','cooperative'].includes(r);
    row.querySelector('[data-member-approved]').disabled=r==='pending';
  }
  async function adminClick(event) {
    const button=event.target.closest('[data-member-save],[data-cloud-publish]');if(!button)return;
    button.disabled=true;
    try {
      if(button.hasAttribute('data-cloud-publish')) {
        await command('planning.publish',{...window.__MEKONG_TEST__.sharedPlanning(),plan:window.__MEKONG_ALLOCATION_PLAN__,supplyRecords:window.MekongWeeklySupply.records(),supplyMode:window.MekongWeeklySupply.sharedMode()},snapshot.planning?._version||0);
      }else {
        const row=button.closest('[data-cloud-member]');
        await command('member.update',{id:row.dataset.cloudMember,role:row.querySelector('[data-member-role]').value,approved:row.querySelector('[data-member-approved]').checked,farmId:row.querySelector('[data-member-farm]').value,rmu:row.querySelector('[data-member-rmu]').value},Number(row.dataset.version));
      }
      if($('cloudAdminMessage'))$('cloudAdminMessage').textContent=t('saved');
    }catch(e){if($('cloudAdminMessage'))$('cloudAdminMessage').textContent=message(e);}
    finally{button.disabled=false;}
  }
  async function init() {
    const gate=document.createElement('section');gate.id='cloudGate';gate.className='cloud-gate';gate.hidden=true;document.body.prepend(gate);
    document.body.dataset.cloudGate='true';gate.hidden=false;
    gate.innerHTML=`<div class="cloud-auth-card"><div class="cloud-wordmark">MEKONG WATER LAB</div><p role="status">${t('syncing')}</p></div>`;
    const bar=document.createElement('div');bar.id='cloudStatus';bar.className='cloud-status';bar.hidden=true;bar.innerHTML='<span id="cloudStatusText" role="status" aria-live="polite"></span><button id="cloudRefresh" type="button" data-cloud-refresh></button><button id="cloudLogout" type="button" data-cloud-logout></button>';$('content').prepend(bar);
    document.addEventListener('submit',e=>{if(e.target.id==='cloudAuthForm')authSubmit(e);if(e.target.id==='cloudDemoForm')demoSubmit(e);});
    document.addEventListener('click',e=>{
      const node=e.target.closest('[data-cloud-language],[data-cloud-mode],[data-cloud-refresh],[data-cloud-logout],[data-cloud-entry]');
      const roleButton=e.target.closest('[data-cloud-request-role]');if(roleButton){editingRole=roleButton.dataset.cloudRequestRole;showGate();return;}
      if(node?.dataset.cloudLanguage){window.MekongI18n.setLanguage(node.dataset.cloudLanguage);return;}
      if(node?.dataset.cloudMode){formMode=node.dataset.cloudMode;gateMessage='';showGate();return;}
      if(node?.dataset.cloudEntry){
        generation++;snapshot=null;fingerprint='';pendingSnapshot=null;entryMode=node.dataset.cloudEntry;workspace=entryMode==='demo'?'demo':'live';gateMessage='';
        window.__MEKONG_TEST__.replaceSharedFarms([]);window.MekongBenefit.replaceSharedState({});window.MekongPortal.lockSession();showGate();statusBar();return;
      }
      if(node?.hasAttribute('data-cloud-refresh')){refresh({force:true});return;}
      if(node?.hasAttribute('data-cloud-logout')){logout();return;}
      adminClick(e);
    });
    document.addEventListener('input',e=>{if(e.target.matches('#cloudAuthForm input[name=email]'))authEmail=e.target.value;});
    document.addEventListener('change',e=>{
      if(e.target.hasAttribute('data-member-role'))memberControls(e.target.closest('tr'));
      if(e.target.id==='cloudDemoRmu'){demoRmu=e.target.value;showGate();}
      if(e.target.id==='cloudDemoFarm'){demoFarm=e.target.value;showGate();}
    });
    window.addEventListener('mekong:language-changed',()=>{if(active&&!approved())showGate();renderAdmin();statusBar();});
    try {const setup=await api('/api/session?action=status');active=setup.enabled===true;demoAvailable=setup.demoAvailable===true;entryMode=new URLSearchParams(location.search).get('mode')==='live'?'live':'demo';workspace=setup.demoSession&&entryMode==='demo'?'demo':'live';}
    catch {active=true;gateMessage=t('error');}
    const route=new URLSearchParams(location.search);const selected=window.MekongWorkspace?.normalizeRole(route.get('role'),route.get('actor'));if(selected)editingRole=selected;
    ready=true;
    if(!active){document.body.dataset.cloudGate='false';gate.hidden=true;return false;}
    showGate();
    const hash=new URLSearchParams(location.hash.slice(1));
    if(hash.has('access_token')||hash.has('error_description')) {
      workspace='live';entryMode='live';
      const type=hash.get('type');history.replaceState(null,'',location.pathname+location.search);
      try {
        if(hash.has('error_description'))throw Object.assign(new Error('CONFIRM_LINK_INVALID'),{code:'CONFIRM_LINK_INVALID'});
        await api('/api/session?action=exchange',{access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token')});
        announceAuth();
        if(type==='recovery') {
          // A separate form is shown after verified recovery; password values never enter storage.
          const reset=document.createElement('dialog');reset.id='cloudPasswordReset';reset.innerHTML=`<form id="cloudResetForm"><h2>${t('updatePassword')}</h2><label>${t('password')}<input name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></label><button type="submit" class="btn btn-primary">${t('updatePassword')}</button><p role="status"></p></form>`;document.body.append(reset);reset.showModal();
          reset.querySelector('form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;try{await api('/api/session?action=password',{password:new FormData(e.target).get('password')});reset.close();reset.remove();await refresh({force:true});}catch(err){e.target.querySelector('p').textContent=message(err);}finally{b.disabled=false;}};
        }
      }catch(e){gateMessage=message(e);showGate();}
    }
    await refresh({force:true});
    setInterval(()=>{if(!document.hidden)refresh();},15000);
    window.addEventListener('focus',()=>refresh());document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});window.addEventListener('online',()=>refresh());
    if(typeof BroadcastChannel!=='undefined'){const channel=new BroadcastChannel('mekong-auth');channel.onmessage=()=>refresh({force:true});}
    return true;
  }
  window.MekongCloud={init,command,refresh,message,t,renderAdmin,showGate,logout,
    requestRole(value){editingRole=value;showGate();},
    allocationPlan(local) {
      if(!active||!approved()||profile().role==='platform')return local;
      if(snapshot.planning?.plan?.weeks?.length)return structuredClone(snapshot.planning.plan);
      return {...local,weeks:(local.weeks||[]).map(w=>({...w,rows:[]}))};
    },
    get enabled(){return active;},get ready(){return ready;},get profile(){return profile();},get snapshot(){return snapshot;},get approved(){return approved();}
  };
})();
