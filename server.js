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
