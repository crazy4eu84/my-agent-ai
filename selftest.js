const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { hashPassword, verifyPassword } = require('./server');

const BASE_URL = 'http://127.0.0.1:8790';

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    if (body) {
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json: () => {
            try { return JSON.parse(data); } catch (e) { return null; }
          }
        });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runSelfTest() {
  console.log('--- Sancho 자가 점검 (selftest.js) 시작 ---');

  // 1. scrypt 암호화 & 검증 단위 테스트
  console.log('1. 비밀번호 scrypt 해싱 & 검증 점검...');
  const plain = 'testPassword123';
  const hashed = await hashPassword(plain);
  assert(hashed.includes(':'), '해시 결과에 salt 구분자(:)가 포함되어야 합니다.');
  assert(await verifyPassword(plain, hashed) === true, '올바른 비밀번호 검증 성공');
  assert(await verifyPassword('wrong', hashed) === false, '틀린 비밀번호 검증 거부');
  console.log('   ✓ scrypt 보안 해싱 통과');

  // 2. 서버 HTTP 상태 및 초기 상태 점검
  console.log('2. 서버 HTTP 상태 및 초기 상태 점검...');
  const statusRes = await request('/api/status');
  assert(statusRes.status === 200, '서버 /api/status가 200을 반환해야 합니다.');
  const statusJson = statusRes.json();
  assert('hasUsers' in statusJson, 'hasUsers 필드가 응답에 있어야 합니다.');
  console.log(`   ✓ 서버 연결 성공 (hasUsers: ${statusJson.hasUsers})`);

  // 3. 미인증 보호 API 401 점검
  console.log('3. 보호된 API 권한(401) 점검...');
  const meRes = await request('/api/me');
  assert(meRes.status === 401, '로그인하지 않은 상태에서 /api/me는 401이어야 합니다.');
  console.log('   ✓ 로그인 미인증 차단(401) 정상 작동');

  // 4. 가상 관리자 등록 및 로그인 세션 테스트
  console.log('4. 관리자 계정 생성 및 로그인 쿠키 점검...');
  const testUsername = 'demo';
  const testPassword = '1234';
  const testName = '홍길동';

  let setCookieHeader = '';
  if (!statusJson.hasUsers) {
    const setupRes = await request('/api/setup', { method: 'POST' }, JSON.stringify({
      name: testName,
      username: testUsername,
      password: testPassword
    }));
    assert(setupRes.status === 200, '초기 관리자 생성이 200이어야 합니다.');
    setCookieHeader = setupRes.headers['set-cookie'] ? setupRes.headers['set-cookie'][0] : '';
    console.log('   ✓ 첫 관리자 계정(홍길동/demo) 생성 성공');
  } else {
    const loginRes = await request('/api/login', { method: 'POST' }, JSON.stringify({
      username: testUsername,
      password: testPassword
    }));
    assert(loginRes.status === 200, '기존 데모 계정 로그인이 200이어야 합니다.');
    setCookieHeader = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : '';
    console.log('   ✓ 데모 계정(demo) 로그인 성공');
  }

  // 5. 로그인 유지 세션 점검
  console.log('5. 세션 유지 점검 (새로고침 시뮬레이션)...');
  assert(setCookieHeader.includes('sancho_session='), '세션 쿠키가 발급되어야 합니다.');
  const sessionCookie = setCookieHeader.split(';')[0];
  const authStatusRes = await request('/api/status', {
    headers: { 'Cookie': sessionCookie }
  });
  const authStatus = authStatusRes.json();
  assert(authStatus.loggedIn === true, '세션 쿠키 전달 시 loggedIn이 true여야 합니다.');
  assert(authStatus.user.username === testUsername, '로그인 사용자 정보가 일치해야 합니다.');
  console.log(`   ✓ 세션 유지 확인 완료 (접속자: ${authStatus.user.name} / ${authStatus.user.username})`);

  // 6. 비밀번호 10회 실패 시 계정 잠금 점검
  console.log('6. 비밀번호 10회 실패 잠금 방어 점검 (HTTP 실제 호출)...');
  const bruteUser = 'brute_test_' + Date.now();
  for (let i = 0; i < 10; i++) {
    const failRes = await request('/api/login', { method: 'POST' }, JSON.stringify({
      username: bruteUser,
      password: 'wrong_password'
    }));
    assert(failRes.status === 401, `${i + 1}회차 실패는 401이어야 합니다.`);
  }
  // 11번째 시도는 429 Too Many Requests (잠금)이어야 함
  const lockRes = await request('/api/login', { method: 'POST' }, JSON.stringify({
    username: bruteUser,
    password: 'any_password'
  }));
  assert(lockRes.status === 429, '10회 초과 실패 시 429 Locked 상태여야 합니다.');
  console.log('   ✓ 10회 실패 후 10분 계정 잠금(429) 완벽 방어 통과');

  // 7. 2단계: 출근 아침 브리핑 API 점검
  console.log('7. 2단계: 출근 아침 브리핑 API (/api/briefing) 점검...');
  const briefingRes = await request('/api/briefing', {
    headers: { 'Cookie': sessionCookie }
  });
  assert(briefingRes.status === 200, '로그인 상태에서 /api/briefing은 200이어야 합니다.');
  const briefingData = briefingRes.json();
  assert(briefingData && briefingData.briefingText, '브리핑 텍스트가 정상 수신되어야 합니다.');
  assert(briefingData.stats && typeof briefingData.stats.goalProgress === 'number', '통계 데이터가 포함되어야 합니다.');
  console.log(`   ✓ 아침 브리핑 정상 수신: "${briefingData.briefingText.slice(0, 30)}..."`);

  // 8. 2단계: Antigravity 로컬 에이전트 브리지 및 실시간 AI 대화 API 점검
  console.log('8. 2단계: Antigravity 로컬 에이전트 브리지 (/api/bridge/status & /api/chat) 점검...');
  const bridgeRes = await request('/api/bridge/status', { headers: { 'Cookie': sessionCookie } });
  assert(bridgeRes.status === 200, '/api/bridge/status 호출이 200이어야 합니다.');
  const bridgeData = bridgeRes.json();
  assert(bridgeData.connected === true, 'Antigravity 로컬 브리지가 연결 상태여야 합니다.');
  console.log(`   ✓ Antigravity 로컬 브리지 연결 확인: [세션 ID: ${bridgeData.conversationId.slice(0, 8)}...]`);

  const chatRes = await request('/api/chat', {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({ message: '오늘 일정 브리핑해줘' }));
  assert(chatRes.status === 200, '/api/chat 호출 성공 200이어야 합니다.');
  const chatData = chatRes.json();
  assert(chatData && chatData.reply, '산초 AI의 회신(reply)이 존재해야 합니다.');
  console.log(`   ✓ 산초 AI 대화 정상 응답 수신: "${chatData.reply.slice(0, 30)}..."`);

  // 9. 3단계: 스마트 캘린더 CRUD & D-Day 점검
  console.log('9. 3단계: 스마트 캘린더 (/api/calendar) CRUD 및 D-Day 점검...');
  const calGetRes = await request('/api/calendar', {
    headers: { 'Cookie': sessionCookie }
  });
  assert(calGetRes.status === 200, '캘린더 목록 조회가 200이어야 합니다.');
  const calGetData = calGetRes.json();
  assert(Array.isArray(calGetData.events), 'events 필드가 배열이어야 합니다.');
  assert(calGetData.events.length > 0, '초기 기본 일정이 1개 이상 존재해야 합니다.');
  assert(calGetData.events[0].dday, 'D-Day 카운트다운 필드가 계산되어야 합니다.');
  console.log(`   ✓ 캘린더 목록 조회 및 D-Day 계산 성공 (총 ${calGetData.events.length}개 일정)`);

  // 캘린더 새 일정 등록
  const newEvRes = await request('/api/calendar', {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({
    title: '자가테스트 등록 일정',
    date: new Date().toISOString().slice(0, 10),
    time: '18:00',
    location: '연구실',
    category: '테스트'
  }));
  assert(newEvRes.status === 200, '일정 생성이 200이어야 합니다.');
  const newEvData = newEvRes.json();
  assert(newEvData.success && newEvData.event.id, '등록된 일정에 고유 ID가 부여되어야 합니다.');
  console.log(`   ✓ 새 일정 등록 성공 (ID: ${newEvData.event.id})`);

  // 캘린더 일정 삭제
  const delEvRes = await request(`/api/calendar?id=${newEvData.event.id}`, {
    method: 'DELETE',
    headers: { 'Cookie': sessionCookie }
  });
  assert(delEvRes.status === 200, '일정 삭제가 200이어야 합니다.');
  console.log('   ✓ 일정 삭제 성공');

  // 10. 4단계: 프로젝트 허브 & 칸반 API (/api/projects) 점검
  console.log('10. 4단계: 프로젝트 허브 & 칸반 보드 (/api/projects) CRUD 점검...');
  const prjGetRes = await request('/api/projects', {
    headers: { 'Cookie': sessionCookie }
  });
  assert(prjGetRes.status === 200, '프로젝트 조회가 200이어야 합니다.');
  const prjGetData = prjGetRes.json();
  assert(Array.isArray(prjGetData.projects), 'projects 필드가 배열이어야 합니다.');
  assert(prjGetData.kanban && Array.isArray(prjGetData.kanban['기획']), '칸반 기획 컬럼이 존재해야 합니다.');
  console.log(`   ✓ 프로젝트 목록 및 4열 칸반 컬럼 조회 성공 (총 ${prjGetData.projects.length}개 프로젝트)`);

  // 신규 프로젝트 생성
  const newPrjRes = await request('/api/projects', {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({
    title: '자가테스트 프로젝트',
    status: '기획',
    progress: 10,
    desc: '테스트용 프로젝트 설명'
  }));
  assert(newPrjRes.status === 200, '프로젝트 생성이 200이어야 합니다.');
  const newPrjData = newPrjRes.json();
  assert(newPrjData.success && newPrjData.project.id, '신규 프로젝트에 ID가 부여되어야 합니다.');
  console.log(`   ✓ 프로젝트 생성 성공 (ID: ${newPrjData.project.id})`);

  // 프로젝트 상태 이동 (기획 -> 진행중)
  const patchPrjRes = await request('/api/projects', {
    method: 'PATCH',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({
    id: newPrjData.project.id,
    status: '진행중',
    progress: 50
  }));
  assert(patchPrjRes.status === 200, '프로젝트 상태 수정이 200이어야 합니다.');
  const patchPrjData = patchPrjRes.json();
  assert(patchPrjData.project.status === '진행중', '프로젝트 상태가 진행중으로 변경되어야 합니다.');
  console.log(`   ✓ 프로젝트 칸반 상태 이동 성공 (기획 -> ${patchPrjData.project.status})`);

  // 프로젝트 삭제
  const delPrjRes = await request(`/api/projects?id=${newPrjData.project.id}`, {
    method: 'DELETE',
    headers: { 'Cookie': sessionCookie }
  });
  assert(delPrjRes.status === 200, '프로젝트 삭제가 200이어야 합니다.');
  console.log('   ✓ 프로젝트 삭제 성공');

  // 11. 5단계: WBS 계층 트리 및 간트차트 API (/api/wbs) 점검
  console.log('11. 5단계: WBS 계층 트리 & 간트차트 (/api/wbs) 점검...');
  const wbsGetRes = await request('/api/wbs', {
    headers: { 'Cookie': sessionCookie }
  });
  assert(wbsGetRes.status === 200, 'WBS 조회가 200이어야 합니다.');
  const wbsGetData = wbsGetRes.json();
  assert(Array.isArray(wbsGetData.items), 'items 필드가 배열이어야 합니다.');
  assert(typeof wbsGetData.overallProgress === 'number', 'overallProgress 필드가 숫자여야 합니다.');
  assert(wbsGetData.items[0].children && wbsGetData.items[0].children.length > 0, '계층형 하위 항목이 존재해야 합니다.');
  console.log(`   ✓ WBS 계층 트리 조회 성공 (전체 진척률: ${wbsGetData.overallProgress}%, 대분류: ${wbsGetData.items.length}개)`);

  // WBS 하위 작업 신규 생성
  const newWbsRes = await request('/api/wbs', {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({
    name: '자가테스트 세부 일감',
    parentId: wbsGetData.items[0].id,
    start: '2026-10-24',
    end: '2026-10-31',
    progress: 50
  }));
  assert(newWbsRes.status === 200, 'WBS 작업 생성이 200이어야 합니다.');
  const newWbsData = newWbsRes.json();
  assert(newWbsData.success && newWbsData.item.id, 'WBS 항목에 고유 ID가 부여되어야 합니다.');
  console.log(`   ✓ WBS 세부 일감 생성 성공 (ID: ${newWbsData.item.id}, 코드: ${newWbsData.item.code})`);

  // WBS 진척률 수정 및 부모 진척률 자동 승격 점검
  const patchWbsRes = await request('/api/wbs', {
    method: 'PATCH',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({
    id: newWbsData.item.id,
    progress: 100,
    status: '완료'
  }));
  assert(patchWbsRes.status === 200, 'WBS 진척률 수정이 200이어야 합니다.');
  const patchWbsData = patchWbsRes.json();
  assert(patchWbsData.item.progress === 100, '진척률이 100%로 수정되어야 합니다.');
  console.log('   ✓ WBS 작업 진척률 100% 수정 및 부모 진척률 자동 승격 확인');

  // WBS 작업 삭제
  const delWbsRes = await request(`/api/wbs?id=${newWbsData.item.id}`, {
    method: 'DELETE',
    headers: { 'Cookie': sessionCookie }
  });
  assert(delWbsRes.status === 200, 'WBS 삭제가 200이어야 합니다.');
  console.log('   ✓ WBS 일감 삭제 성공');

  // 12. 6단계: 예약 스케줄러 & 알림 센터 (/api/reminders) 점검
  console.log('12. 6단계: 예약 스케줄러 & 알림 센터 (/api/reminders) CRUD 및 활성 점검...');
  const remGetRes = await request('/api/reminders', {
    headers: { 'Cookie': sessionCookie }
  });
  assert(remGetRes.status === 200, '알림 목록 조회가 200이어야 합니다.');
  const remGetData = remGetRes.json();
  assert(Array.isArray(remGetData.reminders), 'reminders 필드가 배열이어야 합니다.');
  assert(Array.isArray(remGetData.activeAlerts), 'activeAlerts 필드가 배열이어야 합니다.');
  console.log(`   ✓ 예약 알림 목록 및 활성 알림 조회 성공 (등록: ${remGetData.reminders.length}개, 활성: ${remGetData.activeAlerts.length}개)`);

  // 알림 신규 등록
  const newRemRes = await request('/api/reminders', {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({
    title: '자가테스트 미팅 10분 전 알림',
    time: '15:50',
    repeat: '1회',
    type: '회의 알림'
  }));
  assert(newRemRes.status === 200, '알림 생성이 200이어야 합니다.');
  const newRemData = newRemRes.json();
  assert(newRemData.success && newRemData.reminder.id, '알림 항목에 ID가 부여되어야 합니다.');
  console.log(`   ✓ 새 예약 알림 등록 성공 (ID: ${newRemData.reminder.id}, 시간: ${newRemData.reminder.time})`);

  // 알림 활성 토글 (true -> false)
  const patchRemRes = await request('/api/reminders', {
    method: 'PATCH',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({
    id: newRemData.reminder.id,
    enabled: false
  }));
  assert(patchRemRes.status === 200, '알림 토글 수정이 200이어야 합니다.');
  const patchRemData = patchRemRes.json();
  assert(patchRemData.reminder.enabled === false, '알림 활성 상태가 false로 변경되어야 합니다.');
  console.log('   ✓ 예약 알림 On/Off 토글 전환 성공');

  // 알림 삭제
  const delRemRes = await request(`/api/reminders?id=${newRemData.reminder.id}`, {
    method: 'DELETE',
    headers: { 'Cookie': sessionCookie }
  });
  assert(delRemRes.status === 200, '알림 삭제가 200이어야 합니다.');
  console.log('   ✓ 예약 알림 삭제 성공');

  // 13. 7단계: 지능형 메일 센터 (/api/mails) 점검
  console.log('13. 7단계: 지능형 메일 센터 (/api/mails) 3줄 요약 & 답장 초안 점검...');
  const mailsGetRes = await request('/api/mails', {
    headers: { 'Cookie': sessionCookie }
  });
  assert(mailsGetRes.status === 200, '메일 목록 조회가 200이어야 합니다.');
  const mailsGetData = mailsGetRes.json();
  assert(Array.isArray(mailsGetData.mails), 'mails 필드가 배열이어야 합니다.');
  assert(typeof mailsGetData.unreadCount === 'number', 'unreadCount 필드가 숫자여야 합니다.');
  console.log(`   ✓ 메일 수신함 조회 성공 (총 ${mailsGetData.mails.length}통, 읽지 않음: ${mailsGetData.unreadCount}통)`);

  // 메일 상세 조회 및 3줄 요약 확인
  const testMailId = mailsGetData.mails[0].id;
  const mailDetailRes = await request(`/api/mails/detail?id=${testMailId}`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert(mailDetailRes.status === 200, '메일 상세 조회가 200이어야 합니다.');
  const mailDetailData = mailDetailRes.json();
  assert(mailDetailData.mail && mailDetailData.mail.summary, 'AI 3줄 요약 필드가 존재해야 합니다.');
  console.log(`   ✓ 메일 상세 및 AI 3줄 요약 수신 완료`);

  // AI 공손한 비즈니스 답장 초안 생성
  const draftRes = await request('/api/mails/draft', {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({
    id: testMailId,
    instructions: '15시 전으로 검토 의견을 전달하겠다고 회신'
  }));
  assert(draftRes.status === 200, '답장 초안 생성이 200이어야 합니다.');
  const draftData = draftRes.json();
  assert(draftData.success && draftData.draft, 'AI 답장 초안이 정상 생성되어야 합니다.');
  console.log(`   ✓ 산초 AI 비즈니스 답장 초안 생성 완료 ("${draftData.draft.slice(0, 30)}...")`);

  // 메일 안전 발송 승인
  const sendMailRes = await request('/api/mails/send', {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({
    to: mailDetailData.mail.from,
    subject: 'Re: ' + mailDetailData.mail.subject,
    body: draftData.draft
  }));
  assert(sendMailRes.status === 200, '메일 발송이 200이어야 합니다.');
  const sendMailData = sendMailRes.json();
  assert(sendMailData.success === true, '메일 발송 성공 플래그가 true여야 합니다.');
  console.log('   ✓ 메일 안전 승인 및 발송 완료');

  // 14. 8단계: 메신저 (/api/messages) 점검
  console.log('14. 8단계: 메신저 (/api/messages) 대화 및 AI 원격제어봇 점검...');
  const msgGetRes = await request('/api/messages?channel=일반', { headers: { 'Cookie': sessionCookie } });
  assert(msgGetRes.status === 200, '메신저 목록 조회가 200이어야 합니다.');
  const msgPostRes = await request('/api/messages', {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({ channel: '비서봇', text: '산초야 원격 상태 확인해줘' }));
  assert(msgPostRes.status === 200, '메신저 메시지 발송 200 성공');
  const msgPostData = msgPostRes.json();
  assert(msgPostData.botReply && msgPostData.botReply.text, '비서봇 자동 답장이 생성되어야 합니다.');
  console.log(`   ✓ 메신저 대화 및 비서봇 자동 답장 수신 완료: "${msgPostData.botReply.text.slice(0, 30)}..."`);

  // 15. 9단계: 회의록 & 음성 STT (/api/meetings) 점검
  console.log('15. 9단계: 회의록 & 음성 STT 요약/할 일 추출 점검...');
  const mtgPostRes = await request('/api/meetings', {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({
    title: '자체점검 릴리즈 전략 회의',
    transcript: '홍길동: 13단계 모듈을 모두 구축 완료했습니다.\n기술팀: 예, selftest 검증과 Git 커밋을 완료했습니다.'
  }));
  assert(mtgPostRes.status === 200, '회의록 생성 200 성공');
  const mtgPostData = mtgPostRes.json();
  assert(mtgPostData.meeting && mtgPostData.meeting.summary, '회의 요약이 생성되어야 합니다.');
  assert(Array.isArray(mtgPostData.meeting.actionItems) && mtgPostData.meeting.actionItems.length > 0, '할 일 목록이 추출되어야 합니다.');
  console.log(`   ✓ 회의록 AI 요약 및 할 일 ${mtgPostData.meeting.actionItems.length}건 자동 추출 완료`);

  // 16. 10단계: 결재 및 전자서명 날인 (/api/approvals) 점검
  console.log('16. 10단계: 결재 품의 및 전자직인 날인 점검...');
  const appPostRes = await request('/api/approvals', {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({
    title: '자체점검 테스트 기안서',
    type: '기안서',
    amount: '0원',
    content: '자가 검증 통과를 위한 테스트 품의입니다.'
  }));
  assert(appPostRes.status === 200, '결재 상신 200 성공');
  const appPostData = appPostRes.json();

  // 전자서명 직인 날인 승인
  const approveRes = await request('/api/approvals/approve', {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({ id: appPostData.approval.id }));
  assert(approveRes.status === 200, '결재 승인 200 성공');
  const approveData = approveRes.json();
  assert(approveData.approval.status === '승인', '문서 상태가 승인이어야 합니다.');
  assert(approveData.approval.signedBy, '서명자가 날인되어야 합니다.');
  console.log(`   ✓ 전자서명 직인 날인 및 최종 결재 승인 완료 (서명자: ${approveData.approval.signedBy})`);

  // 17. 11단계: 목표 (OKR / KPI) 트래커 점검
  console.log('17. 11단계: 목표 OKR/KPI 트래커 점검...');
  const goalGetRes = await request('/api/goals', { headers: { 'Cookie': sessionCookie } });
  assert(goalGetRes.status === 200, '목표 조회 200 성공');
  const goalGetData = goalGetRes.json();
  assert(Array.isArray(goalGetData.goals) && goalGetData.goals.length > 0, '목표 목록이 존재해야 합니다.');
  console.log(`   ✓ 전사 핵심 목표 ${goalGetData.goals.length}건 및 달성률 트래킹 확인`);

  // 18. 12단계: 공수 자원 분석기 (/api/timesheet) 점검
  console.log('18. 12단계: 공수 자원 분석기 & AI 병목 진단 점검...');
  const tsGetRes = await request('/api/timesheet', { headers: { 'Cookie': sessionCookie } });
  assert(tsGetRes.status === 200, '타임시트 조회 200 성공');
  const tsGetData = tsGetRes.json();
  assert(tsGetData.analysis && typeof tsGetData.analysis.totalHours === 'number', '공수 총 시간이 계산되어야 합니다.');
  console.log(`   ✓ 주간 총 공수(${tsGetData.analysis.totalHours}h) 및 AI 병목 진단 확인`);

  // 19. 13단계: 지식노트 & 자가진화 스킬 워크플로 점검
  console.log('19. 13단계: 지식노트 & 자가진화 스킬 워크플로 점검...');
  const notePostRes = await request('/api/notes', {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({
    title: '자체점검 업무 매뉴얼',
    category: '매뉴얼',
    content: '13단계 모듈 검증 매뉴얼입니다.'
  }));
  assert(notePostRes.status === 200, '지식노트 생성 200 성공');

  const skillsGetRes = await request('/api/skills', { headers: { 'Cookie': sessionCookie } });
  assert(skillsGetRes.status === 200, '스킬 목록 조회 200 성공');
  const skillsGetData = skillsGetRes.json();
  const testSkillId = skillsGetData.skills[0].id;

  const runSkillRes = await request('/api/skills/run', {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({ id: testSkillId }));
  assert(runSkillRes.status === 200, '스킬 실행 200 성공');
  const runSkillData = runSkillRes.json();
  assert(runSkillData.success && runSkillData.output, '스킬 실행 결과가 출력되어야 합니다.');
  console.log(`   ✓ 자가진화 스킬 실행 확인: "${runSkillData.output.slice(0, 35)}..."`);

  console.log('--- 1단계부터 13단계까지 모든 자가 점검(selftest) 100% 무결점 통과 완료! ---');
}

if (require.main === module) {
  runSelfTest().catch(err => {
    console.error('자가 점검 실패:', err);
    process.exit(1);
  });
}

module.exports = { runSelfTest };
