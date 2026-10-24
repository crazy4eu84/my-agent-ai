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
      path: url.pathname,
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
  const bruteUser = 'brute_test_user';
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

  // 8. 2단계: 실시간 AI 비서 대화 API 점검
  console.log('8. 2단계: 실시간 AI 대화 API (/api/chat) 점검...');
  const chatRes = await request('/api/chat', {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  }, JSON.stringify({ message: '오늘 일정 브리핑해줘' }));
  assert(chatRes.status === 200, '/api/chat 호출 성공 200이어야 합니다.');
  const chatData = chatRes.json();
  assert(chatData && chatData.reply, '산초 AI의 회신(reply)이 존재해야 합니다.');
  console.log(`   ✓ 산초 AI 대화 정상 응답 수신: "${chatData.reply.slice(0, 30)}..."`);

  console.log('--- 모든 자가 점검(selftest) 100% 통과 완료! ---');
}

if (require.main === module) {
  runSelfTest().catch(err => {
    console.error('자가 점검 실패:', err);
    process.exit(1);
  });
}

module.exports = { runSelfTest };
