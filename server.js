const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 8790;
const HOST = '127.0.0.1';

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const CALENDAR_FILE = path.join(DATA_DIR, 'calendar.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const WBS_FILE = path.join(DATA_DIR, 'wbs.json');
const REMINDERS_FILE = path.join(DATA_DIR, 'reminders.json');
const MAILS_FILE = path.join(DATA_DIR, 'mails.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const MEETINGS_FILE = path.join(DATA_DIR, 'meetings.json');
const APPROVALS_FILE = path.join(DATA_DIR, 'approvals.json');
const SIGNATURES_FILE = path.join(DATA_DIR, 'signatures.json');
const GOALS_FILE = path.join(DATA_DIR, 'goals.json');
const TIMESHEET_FILE = path.join(DATA_DIR, 'timesheet.json');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');
const SKILLS_FILE = path.join(DATA_DIR, 'skills.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readJSON(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function getCalendarEvents() {
  const defaultEvents = [
    {
      id: 'evt_1',
      title: '4분기 비서 플랫폼 릴리즈 회의',
      date: new Date().toISOString().slice(0, 10),
      time: '14:00 - 15:30',
      location: '대회의실 A',
      category: '회의',
      notes: 'Sancho 13단계 모듈 검수 및 릴리즈 계획 논의'
    },
    {
      id: 'evt_2',
      title: 'WBS 간트차트 엔진 최종 점검',
      date: new Date().toISOString().slice(0, 10),
      time: '16:00 - 17:00',
      location: '온라인 화상회의',
      category: '개발',
      notes: '진척률 자동 계산 및 계층 구조 검증'
    },
    {
      id: 'evt_3',
      title: '경영진 주간 정례 브리핑',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      time: '10:00 - 11:30',
      location: '임원회의실',
      category: '보고',
      notes: 'Sancho AI 플랫폼 도입 성과 보고'
    }
  ];
  return readJSON(CALENDAR_FILE, defaultEvents);
}

function getProjects() {
  const defaultProjects = [
    {
      id: 'prj_1',
      title: '산초 AI 비서 엔터프라이즈 플랫폼 구축',
      status: '진행중',
      leader: '홍길동',
      period: '2026.10 - 2026.11',
      progress: 75,
      desc: 'Antigravity 두뇌 기반 로컬 AI 비서 및 13개 업무 모듈 개발'
    },
    {
      id: 'prj_2',
      title: '사내 보안 메신저 & 결재 연동 시스템',
      status: '기획',
      leader: '홍길동',
      period: '2026.11 - 2026.12',
      progress: 20,
      desc: '전자서명 직인 날인 및 외부 메신저 웹훅 연계'
    },
    {
      id: 'prj_3',
      title: '3분기 인프라 최적화 및 보안 점검',
      status: '완료',
      leader: '홍길동',
      period: '2026.08 - 2026.09',
      progress: 100,
      desc: '외부 패키지 의존성 제거 및 순수 Node.js 경량화 완료'
    }
  ];
  return readJSON(PROJECTS_FILE, defaultProjects);
}

function getWBS() {
  const defaultWBS = [
    {
      id: 'wbs_1',
      code: '1.0',
      name: '플랫폼 코어 및 보안 엔진 구축',
      level: '대',
      start: '2026-10-01',
      end: '2026-10-15',
      progress: 100,
      assignee: '홍길동',
      status: '완료',
      children: [
        {
          id: 'wbs_1_1',
          code: '1.1',
          name: 'HTTP 코어 서버 및 scrypt 보안 해싱',
          level: '중',
          start: '2026-10-01',
          end: '2026-10-08',
          progress: 100,
          status: '완료'
        },
        {
          id: 'wbs_1_2',
          code: '1.2',
          name: '다중 세션 관리 및 무차별 대입 방어',
          level: '중',
          start: '2026-10-08',
          end: '2026-10-15',
          progress: 100,
          status: '완료'
        }
      ]
    },
    {
      id: 'wbs_2',
      code: '2.0',
      name: '비서 지능 모듈 및 UI 개발',
      level: '대',
      start: '2026-10-16',
      end: '2026-11-10',
      progress: 70,
      assignee: '홍길동',
      status: '진행중',
      children: [
        {
          id: 'wbs_2_1',
          code: '2.1',
          name: '대시보드 출근 브리핑 및 AI 실시간 대화',
          level: '중',
          start: '2026-10-16',
          end: '2026-10-22',
          progress: 100,
          status: '완료'
        },
        {
          id: 'wbs_2_2',
          code: '2.2',
          name: '스마트 캘린더 및 프로젝트 칸반 허브',
          level: '중',
          start: '2026-10-23',
          end: '2026-10-28',
          progress: 100,
          status: '완료'
        },
        {
          id: 'wbs_2_3',
          code: '2.3',
          name: 'MS Project급 WBS 계층 트리 및 간트차트 엔진',
          level: '중',
          start: '2026-10-29',
          end: '2026-11-10',
          progress: 30,
          status: '진행중'
        }
      ]
    }
  ];
  return readJSON(WBS_FILE, defaultWBS);
}

function getReminders() {
  const defaultReminders = [
    {
      id: 'rem_1',
      title: '아침 9시 데일리 모닝 브리핑',
      time: '09:00',
      repeat: '매일',
      type: '정기 브리핑',
      enabled: true,
      lastTriggered: '2026-10-24 09:00'
    },
    {
      id: 'rem_2',
      title: '오후 6시 퇴근 업무일지 자동 정리',
      time: '18:00',
      repeat: '평일',
      type: '업무일지',
      enabled: true,
      lastTriggered: null
    },
    {
      id: 'rem_3',
      title: '4분기 릴리즈 회의 시작 10분 전 알림',
      time: '13:50',
      repeat: '1회',
      type: '회의 알림',
      enabled: true,
      lastTriggered: null
    }
  ];
  return readJSON(REMINDERS_FILE, defaultReminders);
}

function getMails() {
  const defaultMails = [
    {
      id: 'mail_1',
      subject: '[긴급] 4분기 비서 플랫폼 로드맵 검토 요청 건',
      from: '기술지원팀 김철수 <tech@sancho.local>',
      to: '홍길동 <demo@sancho.local>',
      date: new Date().toISOString().slice(0, 10) + ' 10:15',
      body: '안녕하세요 홍길동 관리자님, 기술지원팀 김철수입니다. 현재 진행 중인 4분기 산초 플랫폼 릴리즈 로드맵 관련하여, WBS 일정 및 전자서명 결재 연동 방식에 대해 금일 15시까지 확인 부탁드립니다. 감사합니다.',
      unread: true,
      summary: '1. 4분기 비서 플랫폼 릴리즈 로드맵 검토 요청\n2. WBS 일정 및 전자서명 결재 연동 방식 확인 필요\n3. 회신 마감: 금일 15시까지',
      draft: '안녕하세요 김철수 팀장님, 홍길동입니다.\n\n문의주신 4분기 플랫폼 릴리즈 로드맵 검토 요청 건 확인하였습니다. WBS 일정 및 전자서명 결재 연동은 현재 안정적으로 완료되었으며 세부 사안은 금일 15시 전으로 회신드리겠습니다.\n\n감사합니다.\n홍길동 드림'
    },
    {
      id: 'mail_2',
      subject: '[공지] 전사 개발 보안 가이드라인 배포 안내',
      from: '정보보안팀 <sec@sancho.local>',
      to: '전 임직원',
      date: new Date().toISOString().slice(0, 10) + ' 09:30',
      body: '임직원 여러분 안녕하십니까. 외부 패키지 설치를 지양하고 자체 검증(selftest)을 준수하는 새로운 개발 보안 수칙이 배포되었으니 확인 바랍니다.',
      unread: false,
      summary: '1. 전사 개발 보안 가이드라인 배포\n2. 외부 패키지 지양 및 selftest 준수 요망\n3. 모든 프로젝트 형상 관리에 적용',
      draft: '확인 완료하였습니다. 가이드라인을 철저히 준수하겠습니다. 감사합니다.'
    }
  ];
  return readJSON(MAILS_FILE, defaultMails);
}

function getMessages() {
  const defaultMessages = [
    {
      id: 'msg_1',
      channel: '일반',
      sender: '홍길동',
      text: '산초 AI 비서 플랫폼 8단계 메신저 모듈 구축이 시작되었습니다.',
      time: '10:00'
    },
    {
      id: 'msg_2',
      channel: '일반',
      sender: 'Sancho AI',
      text: '네! 원격에서도 명령을 지시할 수 있는 실시간 웹 메신저가 정상 연동되었습니다.',
      time: '10:01'
    },
    {
      id: 'msg_3',
      channel: '프로젝트',
      sender: '기술팀장',
      text: '오늘 릴리즈 일정 및 WBS 진척률 확인 부탁드립니다.',
      time: '10:15'
    }
  ];
  return readJSON(MESSAGES_FILE, defaultMessages);
}

function getMeetings() {
  const defaultMeetings = [
    {
      id: 'mtg_1',
      title: '산초 플랫폼 4분기 종합 릴리즈 기획 회의',
      date: new Date().toISOString().slice(0, 10),
      duration: '45분',
      transcript: '홍길동: 오늘 회의에서는 13개 전체 모듈 연동 상태를 최종 점검하겠습니다. 메신저와 회의록 STT, 결재 서명까지 오늘 내로 완료해야 합니다.\n기술팀: WBS 진척률과 연계하여 13단계 스킬 워크플로까지 문제없이 통과되도록 selftest를 지속 검증하겠습니다.',
      summary: '1. 산초 플랫폼 13개 모듈 연동 최종 점검\n2. 메신저, 회의록 STT, 전자서명 결재 집중 완성\n3. selftest 기반 품질 무결성 유지',
      actionItems: [
        '전자서명 직인 날인 엔진 구현 (담당: 홍길동)',
        '회의록 STT 텍스트 WBS 일감 자동 연동 (담당: 기술팀)'
      ]
    }
  ];
  return readJSON(MEETINGS_FILE, defaultMeetings);
}

function getApprovals() {
  const defaultApprovals = [
    {
      id: 'app_1',
      title: '산초 AI 플랫폼 엔터프라이즈 도입 품의서',
      type: '품의서',
      author: '홍길동',
      dept: '개발기획팀',
      date: new Date().toISOString().slice(0, 10),
      amount: '0원 (순수 오픈소스/내장모듈)',
      content: 'Antigravity 두뇌 복제 및 13대 업무 모듈 통합 구축을 승인 요청합니다.',
      status: '대기',
      signedBy: null,
      signedAt: null
    }
  ];
  return readJSON(APPROVALS_FILE, defaultApprovals);
}

function getSignatures() {
  return readJSON(SIGNATURES_FILE, {
    defaultStampText: '홍길동인',
    stampRegistered: true
  });
}

function getGoals() {
  const defaultGoals = [
    {
      id: 'goal_1',
      title: '산초 13단계 모듈 100% 완전 무결점 릴리즈',
      period: '2026 4분기',
      target: 100,
      current: 85,
      unit: '%',
      keyResults: [
        { name: '1~7단계 코어 및 정보 모듈 완성', done: true },
        { name: '8~10단계 협업/회의/결재 엔진 완성', done: true },
        { name: '11~13단계 지능/공수/스킬 완성', done: false }
      ]
    },
    {
      id: 'goal_2',
      title: '외부 패키지 의존성 0개 (순수 Node.js 100%)',
      period: '2026 연간',
      target: 100,
      current: 100,
      unit: '%',
      keyResults: [
        { name: 'npm install 0회 유지', done: true },
        { name: '가벼운 초경량 PC 로컬 구동', done: true }
      ]
    }
  ];
  return readJSON(GOALS_FILE, defaultGoals);
}

function getTimesheet() {
  const defaultTimesheet = [
    { day: '월', core: 4.5, ui: 3.0, test: 1.5 },
    { day: '화', core: 5.0, ui: 2.5, test: 1.0 },
    { day: '수', core: 3.5, ui: 4.0, test: 1.5 },
    { day: '목', core: 4.0, ui: 3.5, test: 1.5 },
    { day: '금', core: 5.5, ui: 2.0, test: 2.0 }
  ];
  return readJSON(TIMESHEET_FILE, defaultTimesheet);
}

function getNotes() {
  const defaultNotes = [
    {
      id: 'note_1',
      title: '산초 AI 비서 아키텍처 및 철학',
      category: '아키텍처',
      updatedAt: new Date().toISOString().slice(0, 10),
      content: '# 산초 철학\n1. 사용자는 코드를 몰라도 누구나 쉽게 사용합니다.\n2. 외부 패키지 없이 순수 Node.js로 영구 보존됩니다.\n3. 스스로 진화하는 스킬 워크플로를 탑재합니다.'
    }
  ];
  return readJSON(NOTES_FILE, defaultNotes);
}

function getSkills() {
  const defaultSkills = [
    {
      id: 'skl_1',
      name: '출근 아침 원클릭 브리핑 생성',
      desc: '메일, 캘린더, WBS를 읽고 오늘 할 일을 3줄로 자동 요약합니다.',
      category: '자동화',
      status: '활성'
    },
    {
      id: 'skl_2',
      name: '회의록 액션 아이템 WBS 자동 등록',
      desc: '녹음된 회의 요약에서 결정된 할 일을 WBS 세부 일감으로 변환합니다.',
      category: '연동',
      status: '활성'
    },
    {
      id: 'skl_3',
      name: '퇴근 일일 업무일지 자동 결재 상신',
      desc: '오늘 처리한 WBS와 타임시트를 묶어 일일 업무보고서로 자동 기안합니다.',
      category: '문서',
      status: '활성'
    }
  ];
  return readJSON(SKILLS_FILE, defaultSkills);
}

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPassword(password, hash) {
  return new Promise((resolve) => {
    const [salt, key] = (hash || '').split(':');
    if (!salt || !key) return resolve(false);
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
    });
  });
}

const loginAttempts = {}; // username -> { count, lockedUntil }

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  return list;
}

function getSessionUser(req) {
  const cookies = parseCookies(req);
  const token = cookies.sancho_session;
  if (!token) return null;
  const sessions = readJSON(SESSIONS_FILE, {});
  const session = sessions[token];
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    delete sessions[token];
    writeJSON(SESSIONS_FILE, sessions);
    return null;
  }
  return session.user;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const pathname = url.pathname;

  // JSON helper
  const sendJSON = (status, obj, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
    res.end(JSON.stringify(obj));
  };

  // Helper to read body
  const readBody = () => new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch (e) { resolve({}); }
    });
  });

  // API 라우트
  if (pathname.startsWith('/api/')) {
    // 1. 초기 상태 체크 (계정 존재 여부 및 로그인 사용자)
    if (pathname === '/api/status' && req.method === 'GET') {
      const users = readJSON(USERS_FILE, []);
      const currentUser = getSessionUser(req);
      return sendJSON(200, {
        hasUsers: users.length > 0,
        loggedIn: !!currentUser,
        user: currentUser ? { username: currentUser.username, name: currentUser.name } : null
      });
    }

    // 2. 관리자 첫 계정 생성
    if (pathname === '/api/setup' && req.method === 'POST') {
      const users = readJSON(USERS_FILE, []);
      if (users.length > 0) {
        return sendJSON(400, { error: '관리자 계정이 이미 존재합니다.' });
      }
      const { name, username, password } = await readBody();
      if (!name || !username || !password) {
        return sendJSON(400, { error: '이름, 아이디, 비밀번호를 모두 입력해 주세요.' });
      }
      if (password.length < 4) {
        return sendJSON(400, { error: '비밀번호는 최소 4자 이상이어야 합니다.' });
      }
      const pwHash = await hashPassword(password);
      const newUser = { id: 'usr_' + Date.now(), name, username, passwordHash: pwHash, createdAt: new Date().toISOString() };
      users.push(newUser);
      writeJSON(USERS_FILE, users);

      // 자동 로그인 세션 발급 (30일)
      const token = crypto.randomBytes(32).toString('hex');
      const sessions = readJSON(SESSIONS_FILE, {});
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      sessions[token] = { user: { id: newUser.id, username: newUser.username, name: newUser.name }, expiresAt };
      writeJSON(SESSIONS_FILE, sessions);

      return sendJSON(200, { success: true, user: { username: newUser.username, name: newUser.name } }, {
        'Set-Cookie': `sancho_session=${token}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`
      });
    }

    // 3. 로그인
    if (pathname === '/api/login' && req.method === 'POST') {
      const { username, password } = await readBody();
      if (!username || !password) {
        return sendJSON(400, { error: '아이디와 비밀번호를 입력해 주세요.' });
      }

      const attempt = loginAttempts[username] || { count: 0, lockedUntil: null };
      if (attempt.lockedUntil && new Date() < new Date(attempt.lockedUntil)) {
        const remainingMin = Math.ceil((new Date(attempt.lockedUntil) - new Date()) / 60000);
        return sendJSON(429, { error: `로그인 시도 횟수를 초과하여 계정이 잠겼습니다. ${remainingMin}분 후 다시 시도해 주세요.` });
      }

      const users = readJSON(USERS_FILE, []);
      const user = users.find(u => u.username === username);
      const isValid = user ? await verifyPassword(password, user.passwordHash) : false;

      if (!isValid) {
        attempt.count = (attempt.count || 0) + 1;
        if (attempt.count >= 10) {
          attempt.lockedUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        }
        loginAttempts[username] = attempt;
        return sendJSON(401, { error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      }

      // 로그인 성공 -> 시도 카운트 초기화
      delete loginAttempts[username];

      const token = crypto.randomBytes(32).toString('hex');
      const sessions = readJSON(SESSIONS_FILE, {});
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      sessions[token] = { user: { id: user.id, username: user.username, name: user.name }, expiresAt };
      writeJSON(SESSIONS_FILE, sessions);

      return sendJSON(200, { success: true, user: { username: user.username, name: user.name } }, {
        'Set-Cookie': `sancho_session=${token}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`
      });
    }

    // 4. 로그아웃
    if (pathname === '/api/logout' && req.method === 'POST') {
      const cookies = parseCookies(req);
      const token = cookies.sancho_session;
      if (token) {
        const sessions = readJSON(SESSIONS_FILE, {});
        delete sessions[token];
        writeJSON(SESSIONS_FILE, sessions);
      }
      return sendJSON(200, { success: true }, {
        'Set-Cookie': `sancho_session=; HttpOnly; Path=/; Max-Age=0`
      });
    }

    // 5. 보호된 API (로그인 필수)
    const currentUser = getSessionUser(req);
    if (!currentUser) {
      return sendJSON(401, { error: '로그인이 필요합니다.' });
    }

    // 사용자 정보
    if (pathname === '/api/me' && req.method === 'GET') {
      return sendJSON(200, { user: currentUser });
    }

    // 2단계: 출근 아침 브리핑 API
    if (pathname === '/api/briefing' && req.method === 'GET') {
      const today = new Date().toISOString().slice(0, 10);
      return sendJSON(200, {
        date: today,
        greeting: `좋은 아침입니다, ${currentUser.name || currentUser.username}님!`,
        briefingText: `오늘 예정된 주요 일정 2건과 긴급 WBS 프로젝트 일감 1건이 준비되어 있습니다. 수신된 중요 메일 1건에 대한 회신을 권장드립니다.`,
        stats: {
          todayScheduleCount: 2,
          urgentWbsCount: 1,
          unreadMailCount: 1,
          goalProgress: 68
        },
        highlights: [
          { type: 'schedule', title: '14:00 4분기 비서 플랫폼 릴리즈 회의', location: '대회의실' },
          { type: 'wbs', title: 'WBS 간트차트 엔진 계층 데이터 연동', dday: 'D-Today' },
          { type: 'mail', title: '[긴급] 프로젝트 로드맵 검토 요청 건', sender: '기술지원팀' }
        ]
      });
    }

    // 2단계: 실시간 AI 비서 대화 API (Antigravity 로컬 브리지)
    if (pathname === '/api/chat' && req.method === 'POST') {
      const { message } = await readBody();
      if (!message || !message.trim()) {
        return sendJSON(400, { error: '메시지를 입력해 주세요.' });
      }

      const q = message.trim();
      let reply = '';

      if (q.includes('브리핑') || q.includes('오늘') || q.includes('출근')) {
        reply = `오늘의 출근 브리핑입니다: \n1. [일정] 14:00 4분기 비서 플랫폼 릴리즈 회의\n2. [WBS] 간트차트 엔진 계층 데이터 연동 작업 (마감 D-Day)\n3. [메일] 기술지원팀의 로드맵 검토 요청 1건 수신. 무엇부터 도와드릴까요?`;
      } else if (q.includes('일정') || q.includes('캘린더')) {
        reply = `오늘 캘린더에 2건의 일정이 등록되어 있습니다. 14시 비서 플랫폼 릴리즈 회의 준비를 도와드릴까요?`;
      } else if (q.includes('WBS') || q.includes('간트') || q.includes('진행률')) {
        reply = `현재 WBS 프로젝트 전체 진행률은 68%입니다. '간트차트 엔진 연동' 작업이 금일 중 완료 예정입니다.`;
      } else if (q.includes('결재') || q.includes('서명')) {
        reply = `대기 중인 결재 문서가 1건 있습니다. 확인하시고 등록된 전자서명으로 바로 승인하실 수 있습니다.`;
      } else if (q.includes('안녕') || q.includes('반가')) {
        reply = `반갑습니다, ${currentUser.name || currentUser.username}님! 무엇이든 말씀하시면 산초가 신속하게 처리해 드리겠습니다.`;
      } else {
        reply = `'${q}' 지시 사항을 접수했습니다. 산초 로컬 AI 엔진이 해당 작업을 분석하여 대시보드 및 WBS/일정에 안전하게 반영할 준비를 완료했습니다. 추가 세부 지침이 있으신가요?`;
      }

      return sendJSON(200, {
        reply,
        timestamp: new Date().toISOString(),
        user: currentUser.username
      });
    }

    // 3단계: 캘린더 일정 API
    if (pathname === '/api/calendar' && req.method === 'GET') {
      const events = getCalendarEvents();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const enhancedEvents = events.map(e => {
        const evDate = new Date(e.date);
        evDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((evDate - today) / (1000 * 60 * 60 * 24));
        let dday = 'D-Day';
        if (diffDays > 0) dday = `D-${diffDays}`;
        else if (diffDays < 0) dday = `D+${Math.abs(diffDays)}`;
        return { ...e, dday, diffDays };
      });
      return sendJSON(200, { events: enhancedEvents });
    }

    if (pathname === '/api/calendar' && req.method === 'POST') {
      const { title, date, time, location, category, notes } = await readBody();
      if (!title || !date) {
        return sendJSON(400, { error: '일정 제목과 날짜를 입력해 주세요.' });
      }
      const events = getCalendarEvents();
      const newEvent = {
        id: 'evt_' + Date.now(),
        title,
        date,
        time: time || '종일',
        location: location || '미지정',
        category: category || '일반',
        notes: notes || '',
        createdAt: new Date().toISOString()
      };
      events.push(newEvent);
      writeJSON(CALENDAR_FILE, events);
      return sendJSON(200, { success: true, event: newEvent });
    }

    if (pathname === '/api/calendar' && req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return sendJSON(400, { error: '삭제할 일정 ID가 필요합니다.' });
      let events = getCalendarEvents();
      events = events.filter(e => e.id !== id);
      writeJSON(CALENDAR_FILE, events);
      return sendJSON(200, { success: true });
    }

    // 4단계: 프로젝트 허브 & 칸반 API
    if (pathname === '/api/projects' && req.method === 'GET') {
      const projects = getProjects();
      const kanban = {
        '기획': projects.filter(p => p.status === '기획'),
        '진행중': projects.filter(p => p.status === '진행중'),
        '검토': projects.filter(p => p.status === '검토'),
        '완료': projects.filter(p => p.status === '완료')
      };
      return sendJSON(200, { projects, kanban });
    }

    if (pathname === '/api/projects' && req.method === 'POST') {
      const { title, leader, period, desc, status, progress } = await readBody();
      if (!title) {
        return sendJSON(400, { error: '프로젝트 제목을 입력해 주세요.' });
      }
      const projects = getProjects();
      const newPrj = {
        id: 'prj_' + Date.now(),
        title,
        leader: leader || currentUser.name || currentUser.username,
        period: period || '2026.10 - 2026.12',
        desc: desc || '',
        status: status || '기획',
        progress: typeof progress === 'number' ? progress : 0,
        createdAt: new Date().toISOString()
      };
      projects.push(newPrj);
      writeJSON(PROJECTS_FILE, projects);
      return sendJSON(200, { success: true, project: newPrj });
    }

    if (pathname === '/api/projects' && req.method === 'PATCH') {
      const { id, status, progress } = await readBody();
      if (!id) return sendJSON(400, { error: '프로젝트 ID가 필요합니다.' });
      const projects = getProjects();
      const prj = projects.find(p => p.id === id);
      if (!prj) return sendJSON(404, { error: '프로젝트를 찾을 수 없습니다.' });
      if (status) prj.status = status;
      if (typeof progress === 'number') prj.progress = progress;
      writeJSON(PROJECTS_FILE, projects);
      return sendJSON(200, { success: true, project: prj });
    }

    if (pathname === '/api/projects' && req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return sendJSON(400, { error: '삭제할 프로젝트 ID가 필요합니다.' });
      let projects = getProjects();
      projects = projects.filter(p => p.id !== id);
      writeJSON(PROJECTS_FILE, projects);
      return sendJSON(200, { success: true });
    }

    // 5단계: MS Project급 WBS 계층 트리 및 간트차트 API
    if (pathname === '/api/wbs' && req.method === 'GET') {
      const items = getWBS();
      let totalWeighted = 0;
      items.forEach(parent => {
        if (parent.children && parent.children.length > 0) {
          const sum = parent.children.reduce((acc, c) => acc + (c.progress || 0), 0);
          parent.progress = Math.round(sum / parent.children.length);
          parent.status = parent.progress === 100 ? '완료' : (parent.progress > 0 ? '진행중' : '대기');
        }
        totalWeighted += (parent.progress || 0);
      });
      const overallProgress = items.length > 0 ? Math.round(totalWeighted / items.length) : 0;
      return sendJSON(200, { items, overallProgress });
    }

    if (pathname === '/api/wbs' && req.method === 'POST') {
      const { name, level, start, end, progress, status, parentId, assignee } = await readBody();
      if (!name) {
        return sendJSON(400, { error: '작업명을 입력해 주세요.' });
      }
      const items = getWBS();
      const newItem = {
        id: 'wbs_' + Date.now(),
        code: '',
        name,
        level: level || '중',
        start: start || new Date().toISOString().slice(0, 10),
        end: end || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        progress: typeof progress === 'number' ? progress : 0,
        status: status || '진행중',
        assignee: assignee || currentUser.name || currentUser.username,
        children: []
      };

      if (parentId) {
        const parent = items.find(p => p.id === parentId);
        if (parent) {
          if (!parent.children) parent.children = [];
          newItem.code = `${parent.code}.${parent.children.length + 1}`;
          parent.children.push(newItem);
        } else {
          newItem.code = `${items.length + 1}.0`;
          items.push(newItem);
        }
      } else {
        newItem.code = `${items.length + 1}.0`;
        items.push(newItem);
      }

      writeJSON(WBS_FILE, items);
      return sendJSON(200, { success: true, item: newItem });
    }

    if (pathname === '/api/wbs' && req.method === 'PATCH') {
      const { id, progress, status, start, end } = await readBody();
      if (!id) return sendJSON(400, { error: '작업 ID가 필요합니다.' });
      const items = getWBS();
      let found = null;

      for (const p of items) {
        if (p.id === id) { found = p; break; }
        if (p.children) {
          const c = p.children.find(ch => ch.id === id);
          if (c) { found = c; break; }
        }
      }

      if (!found) return sendJSON(404, { error: '작업을 찾을 수 없습니다.' });
      if (typeof progress === 'number') found.progress = progress;
      if (status) found.status = status;
      if (start) found.start = start;
      if (end) found.end = end;

      // 부모 진척률 자동 승격
      items.forEach(parent => {
        if (parent.children && parent.children.length > 0) {
          const sum = parent.children.reduce((acc, c) => acc + (c.progress || 0), 0);
          parent.progress = Math.round(sum / parent.children.length);
          parent.status = parent.progress === 100 ? '완료' : (parent.progress > 0 ? '진행중' : '대기');
        }
      });

      writeJSON(WBS_FILE, items);
      return sendJSON(200, { success: true, item: found });
    }

    if (pathname === '/api/wbs' && req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return sendJSON(400, { error: '삭제할 작업 ID가 필요합니다.' });
      let items = getWBS();
      items = items.filter(p => p.id !== id);
      items.forEach(p => {
        if (p.children) p.children = p.children.filter(c => c.id !== id);
      });
      writeJSON(WBS_FILE, items);
      return sendJSON(200, { success: true });
    }

    // 6단계: 예약 스케줄러 & 알림 센터 API
    if (pathname === '/api/reminders' && req.method === 'GET') {
      const reminders = getReminders();
      const activeAlerts = reminders
        .filter(r => r.enabled)
        .map(r => ({
          id: r.id,
          title: r.title,
          time: r.time,
          type: r.type,
          message: `[${r.type}] ${r.title} (${r.time}) 스케줄이 활성화되어 있습니다.`
        }));
      return sendJSON(200, { reminders, activeAlerts });
    }

    if (pathname === '/api/reminders' && req.method === 'POST') {
      const { title, time, repeat, type } = await readBody();
      if (!title || !time) {
        return sendJSON(400, { error: '알림 제목과 시간을 입력해 주세요.' });
      }
      const reminders = getReminders();
      const newReminder = {
        id: 'rem_' + Date.now(),
        title,
        time,
        repeat: repeat || '매일',
        type: type || '정기 알림',
        enabled: true,
        lastTriggered: null,
        createdAt: new Date().toISOString()
      };
      reminders.push(newReminder);
      writeJSON(REMINDERS_FILE, reminders);
      return sendJSON(200, { success: true, reminder: newReminder });
    }

    if (pathname === '/api/reminders' && req.method === 'PATCH') {
      const { id, enabled, title, time } = await readBody();
      if (!id) return sendJSON(400, { error: '알림 ID가 필요합니다.' });
      const reminders = getReminders();
      const rem = reminders.find(r => r.id === id);
      if (!rem) return sendJSON(404, { error: '알림을 찾을 수 없습니다.' });
      if (typeof enabled === 'boolean') rem.enabled = enabled;
      if (title) rem.title = title;
      if (time) rem.time = time;
      writeJSON(REMINDERS_FILE, reminders);
      return sendJSON(200, { success: true, reminder: rem });
    }

    if (pathname === '/api/reminders' && req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return sendJSON(400, { error: '삭제할 알림 ID가 필요합니다.' });
      let reminders = getReminders();
      reminders = reminders.filter(r => r.id !== id);
      writeJSON(REMINDERS_FILE, reminders);
      return sendJSON(200, { success: true });
    }

    // 7단계: 지능형 메일 센터 API
    if (pathname === '/api/mails' && req.method === 'GET') {
      const mails = getMails();
      const unreadCount = mails.filter(m => m.unread).length;
      return sendJSON(200, { mails, unreadCount });
    }

    if (pathname === '/api/mails/detail' && req.method === 'GET') {
      const id = url.searchParams.get('id');
      if (!id) return sendJSON(400, { error: '메일 ID가 필요합니다.' });
      const mails = getMails();
      const mail = mails.find(m => m.id === id);
      if (!mail) return sendJSON(404, { error: '메일을 찾을 수 없습니다.' });
      if (mail.unread) {
        mail.unread = false;
        writeJSON(MAILS_FILE, mails);
      }
      return sendJSON(200, { mail });
    }

    if (pathname === '/api/mails/draft' && req.method === 'POST') {
      const { id, instructions } = await readBody();
      const mails = getMails();
      const mail = mails.find(m => m.id === id);
      const subject = mail ? mail.subject : '회신';
      const sender = mail ? mail.from.split('<')[0].trim() : '담당자님';

      let aiDraft = `안녕하세요 ${sender},\n\n보내주신 "${subject}" 메일 확인하였습니다.\n\n요청하신 사항에 대해 긍정적으로 검토하였으며, ${instructions || '안내해주신 일정 및 절차에 맞추어 차질 없이 진행하겠습니다.'}\n\n추가 논의가 필요하신 경우 언제든 연락 주시기 바랍니다.\n\n감사합니다.\n${currentUser.name || currentUser.username} 드림`;

      return sendJSON(200, { success: true, draft: aiDraft });
    }

    if (pathname === '/api/mails/send' && req.method === 'POST') {
      const { to, subject, body } = await readBody();
      if (!to || !subject || !body) {
        return sendJSON(400, { error: '수신인, 제목, 본문을 모두 입력해 주세요.' });
      }
      return sendJSON(200, {
        success: true,
        message: '메일이 성공적으로 발송되었습니다.',
        sentAt: new Date().toISOString()
      });
    }

    // 8단계: 메신저 API
    if (pathname === '/api/messages' && req.method === 'GET') {
      const messages = getMessages();
      const channel = url.searchParams.get('channel') || '일반';
      const filtered = messages.filter(m => m.channel === channel);
      return sendJSON(200, { messages: filtered, channels: ['일반', '프로젝트', '비서봇'] });
    }

    if (pathname === '/api/messages' && req.method === 'POST') {
      const { channel, text } = await readBody();
      if (!text || !text.trim()) {
        return sendJSON(400, { error: '메시지를 입력해 주세요.' });
      }
      const messages = getMessages();
      const userMsg = {
        id: 'msg_' + Date.now(),
        channel: channel || '일반',
        sender: currentUser.name || currentUser.username,
        text: text.trim(),
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };
      messages.push(userMsg);

      let botMsg = null;
      if (channel === '비서봇' || text.includes('산초') || text.includes('비서')) {
        botMsg = {
          id: 'msg_' + (Date.now() + 1),
          channel: channel || '일반',
          sender: 'Sancho AI',
          text: `[산초 자동응답] "${text.trim()}" 지시를 접수했습니다. 즉시 분석하여 결과를 처리하겠습니다.`,
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        };
        messages.push(botMsg);
      }

      writeJSON(MESSAGES_FILE, messages);
      return sendJSON(200, { success: true, message: userMsg, botReply: botMsg });
    }

    // 9단계: 회의록 API
    if (pathname === '/api/meetings' && req.method === 'GET') {
      const meetings = getMeetings();
      return sendJSON(200, { meetings });
    }

    if (pathname === '/api/meetings' && req.method === 'POST') {
      const { title, transcript, duration } = await readBody();
      if (!title || !transcript) {
        return sendJSON(400, { error: '회의 제목과 녹음 대화 내용을 입력해 주세요.' });
      }
      const meetings = getMeetings();
      const newMeeting = {
        id: 'mtg_' + Date.now(),
        title,
        date: new Date().toISOString().slice(0, 10),
        duration: duration || '30분',
        transcript,
        summary: `1. [안건] ${title} 관련 핵심 논의 진행\n2. [결론] 순수 Node.js 기반 완전 무결 구현 방향 확정\n3. [진행] 담당자별 액션 아이템 일정 배정 완료`,
        actionItems: [
          `${title} 관련 후속 조치 계획 수립 (담당: ${currentUser.name || currentUser.username})`,
          'WBS 세부 일감 및 캘린더 일정 연동 검토'
        ]
      };
      meetings.unshift(newMeeting);
      writeJSON(MEETINGS_FILE, meetings);
      return sendJSON(200, { success: true, meeting: newMeeting });
    }

    // 10단계: 결재 및 전자서명 API
    if (pathname === '/api/approvals' && req.method === 'GET') {
      const approvals = getApprovals();
      const signatures = getSignatures();
      return sendJSON(200, { approvals, signatures });
    }

    if (pathname === '/api/approvals' && req.method === 'POST') {
      const { title, type, content, amount, dept } = await readBody();
      if (!title || !content) {
        return sendJSON(400, { error: '문서 제목과 내용을 입력해 주세요.' });
      }
      const approvals = getApprovals();
      const newApp = {
        id: 'app_' + Date.now(),
        title,
        type: type || '품의서',
        author: currentUser.name || currentUser.username,
        dept: dept || '개발기획팀',
        date: new Date().toISOString().slice(0, 10),
        amount: amount || '0원',
        content,
        status: '대기',
        signedBy: null,
        signedAt: null
      };
      approvals.unshift(newApp);
      writeJSON(APPROVALS_FILE, approvals);
      return sendJSON(200, { success: true, approval: newApp });
    }

    if (pathname === '/api/approvals/approve' && req.method === 'POST') {
      const { id } = await readBody();
      if (!id) return sendJSON(400, { error: '결재할 문서 ID가 필요합니다.' });
      const approvals = getApprovals();
      const app = approvals.find(a => a.id === id);
      if (!app) return sendJSON(404, { error: '문서를 찾을 수 없습니다.' });

      app.status = '승인';
      app.signedBy = currentUser.name || currentUser.username;
      app.signedAt = new Date().toISOString();
      writeJSON(APPROVALS_FILE, approvals);
      return sendJSON(200, { success: true, approval: app });
    }

    if (pathname === '/api/signatures' && req.method === 'POST') {
      const { stampText } = await readBody();
      const signatures = {
        defaultStampText: stampText || `${currentUser.name || currentUser.username}인`,
        stampRegistered: true,
        updatedAt: new Date().toISOString()
      };
      writeJSON(SIGNATURES_FILE, signatures);
      return sendJSON(200, { success: true, signatures });
    }

    // 11단계: 목표 (OKR / KPI) API
    if (pathname === '/api/goals' && req.method === 'GET') {
      const goals = getGoals();
      return sendJSON(200, { goals });
    }

    if (pathname === '/api/goals' && req.method === 'POST') {
      const { title, target, current, unit, period } = await readBody();
      if (!title) return sendJSON(400, { error: '목표 제목을 입력해 주세요.' });
      const goals = getGoals();
      const newGoal = {
        id: 'goal_' + Date.now(),
        title,
        period: period || '2026 4분기',
        target: target || 100,
        current: current || 0,
        unit: unit || '%',
        keyResults: [
          { name: `${title} 세부 실행 계획 수립`, done: true },
          { name: `${title} 1차 중간 마일스톤 달성`, done: false }
        ]
      };
      goals.push(newGoal);
      writeJSON(GOALS_FILE, goals);
      return sendJSON(200, { success: true, goal: newGoal });
    }

    // 12단계: 공수 (타임시트) API
    if (pathname === '/api/timesheet' && req.method === 'GET') {
      const timesheet = getTimesheet();
      const totalHours = timesheet.reduce((sum, d) => sum + (d.core + d.ui + d.test), 0);
      return sendJSON(200, {
        timesheet,
        analysis: {
          totalHours: Math.round(totalHours * 10) / 10,
          bottleneck: 'UI 퍼블리싱 및 WBS 연동 단계에서 집중 투입됨',
          recommendation: '스킬 워크플로 자동화 도입으로 시간 30% 절감 가능'
        }
      });
    }

    if (pathname === '/api/timesheet' && req.method === 'POST') {
      const { day, core, ui, test } = await readBody();
      const timesheet = getTimesheet();
      const entry = timesheet.find(t => t.day === day);
      if (entry) {
        if (typeof core === 'number') entry.core = core;
        if (typeof ui === 'number') entry.ui = ui;
        if (typeof test === 'number') entry.test = test;
      } else {
        timesheet.push({ day, core: core || 0, ui: ui || 0, test: test || 0 });
      }
      writeJSON(TIMESHEET_FILE, timesheet);
      return sendJSON(200, { success: true, timesheet });
    }

    // 13단계: 지식노트 & 스킬 워크플로 API
    if (pathname === '/api/notes' && req.method === 'GET') {
      const notes = getNotes();
      return sendJSON(200, { notes });
    }

    if (pathname === '/api/notes' && req.method === 'POST') {
      const { title, category, content } = await readBody();
      if (!title || !content) {
        return sendJSON(400, { error: '노트 제목과 내용을 입력해 주세요.' });
      }
      const notes = getNotes();
      const newNote = {
        id: 'note_' + Date.now(),
        title,
        category: category || '일반',
        updatedAt: new Date().toISOString().slice(0, 10),
        content
      };
      notes.unshift(newNote);
      writeJSON(NOTES_FILE, notes);
      return sendJSON(200, { success: true, note: newNote });
    }

    if (pathname === '/api/notes' && req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return sendJSON(400, { error: '노트 ID가 필요합니다.' });
      let notes = getNotes();
      notes = notes.filter(n => n.id !== id);
      writeJSON(NOTES_FILE, notes);
      return sendJSON(200, { success: true });
    }

    if (pathname === '/api/skills' && req.method === 'GET') {
      const skills = getSkills();
      return sendJSON(200, { skills });
    }

    if (pathname === '/api/skills/run' && req.method === 'POST') {
      const { id } = await readBody();
      const skills = getSkills();
      const skill = skills.find(s => s.id === id);
      if (!skill) return sendJSON(404, { error: '스킬을 찾을 수 없습니다.' });

      return sendJSON(200, {
        success: true,
        skill: skill.name,
        output: `[자가진화 스킬 실행 완료] "${skill.name}" 작업이 백그라운드에서 정상 수행되었습니다. (소요시간: 0.12s)`
      });
    }

    return sendJSON(404, { error: '알 수 없는 API입니다.' });
  }

  // 정적 파일 라우팅
  let safePath = pathname;
  if (safePath === '/') {
    const user = getSessionUser(req);
    safePath = user ? '/index.html' : '/login.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('접근 거부');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('파일을 찾을 수 없습니다.');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`Sancho Server running at http://${HOST}:${PORT}`);
  });
}

module.exports = { server, hashPassword, verifyPassword, loginAttempts };
