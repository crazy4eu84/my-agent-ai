const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const ANTIGRAVITY_EXE = path.join(
  process.env.LOCALAPPDATA || 'C:\\Users\\USER\\AppData\\Local',
  'Programs', 'antigravity', 'resources', 'bin', 'language_server.exe'
);

const BRAIN_DIR = path.join(
  process.env.USERPROFILE || 'C:\\Users\\USER',
  '.gemini', 'antigravity', 'brain'
);

const DATA_DIR = path.join(__dirname, 'data');
const BRIDGE_SESSION_FILE = path.join(DATA_DIR, 'bridge_session.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Get or create persistent conversation session with Antigravity
 */
async function getOrCreateConversationId() {
  if (fs.existsSync(BRIDGE_SESSION_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(BRIDGE_SESSION_FILE, 'utf8'));
      if (data && data.conversationId) {
        const convDir = path.join(BRAIN_DIR, data.conversationId);
        if (fs.existsSync(convDir)) {
          return data.conversationId;
        }
      }
    } catch (_) {}
  }

  // Check known active conversation directory
  const knownId = '7e954d00-ac25-4c82-821a-e7572283740c';
  if (fs.existsSync(path.join(BRAIN_DIR, knownId))) {
    fs.writeFileSync(BRIDGE_SESSION_FILE, JSON.stringify({ conversationId: knownId, updatedAt: new Date().toISOString() }, null, 2));
    return knownId;
  }

  // Create new conversation via language_server.exe agentapi
  return new Promise((resolve, reject) => {
    execFile(
      ANTIGRAVITY_EXE,
      [
        'agentapi', 'new-conversation',
        '--title=Sancho AI Assistant Bridge',
        '--model=flash',
        '당신은 사용자 홍길동님의 로컬 올인원 AI 비서 산초(Sancho)입니다. 일정, WBS, 결재, 메일 등 업무를 돕고 질문에 정중하고 친절한 한국어로 답변하세요.'
      ],
      { windowsHide: true },
      (err, stdout, stderr) => {
        if (err) return reject(new Error('Antigravity 생성 오류: ' + (stderr || err.message)));
        try {
          const res = JSON.parse(stdout);
          const newId = res.response?.newConversation?.conversationId;
          if (newId) {
            fs.writeFileSync(BRIDGE_SESSION_FILE, JSON.stringify({ conversationId: newId, updatedAt: new Date().toISOString() }, null, 2));
            resolve(newId);
          } else {
            reject(new Error('새 세션 ID를 받지 못했습니다: ' + stdout));
          }
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

/**
 * Ask Antigravity AI Agent and wait for intelligent response
 * @param {string} userMessage - Prompt from user
 * @param {number} timeoutMs - Max wait duration
 * @returns {Promise<string>}
 */
async function askAntigravity(userMessage, timeoutMs = 25000) {
  const convId = await getOrCreateConversationId();
  const transcriptPath = path.join(BRAIN_DIR, convId, '.system_generated', 'logs', 'transcript.jsonl');
  const transcriptFullPath = path.join(BRAIN_DIR, convId, '.system_generated', 'logs', 'transcript_full.jsonl');

  // Record max step index before sending
  let maxStepBefore = -1;
  if (fs.existsSync(transcriptPath)) {
    try {
      const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n').filter(Boolean);
      if (lines.length > 0) {
        const last = JSON.parse(lines[lines.length - 1]);
        if (typeof last.step_index === 'number') maxStepBefore = last.step_index;
      }
    } catch (_) {}
  }

  // Send message via agentapi
  await new Promise((resolve, reject) => {
    execFile(
      ANTIGRAVITY_EXE,
      ['agentapi', 'send-message', convId, userMessage],
      { windowsHide: true },
      (err, stdout, stderr) => {
        if (err) return reject(new Error('메시지 전송 실패: ' + (stderr || err.message)));
        resolve(stdout);
      }
    );
  });

  // Poll transcript until model finishes final PLANNER_RESPONSE
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    await new Promise(r => setTimeout(r, 400));
    if (!fs.existsSync(transcriptPath)) continue;

    try {
      const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n').filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        const item = JSON.parse(lines[i]);
        if (item.step_index > maxStepBefore) {
          if (item.source === 'MODEL' && item.type === 'PLANNER_RESPONSE') {
            const hasTools = Array.isArray(item.tool_calls) && item.tool_calls.length > 0;
            if (!hasTools && typeof item.content === 'string' && item.content.trim().length > 0) {
              let text = item.content.trim();
              if (item.truncated_fields && item.truncated_fields.includes('content') && fs.existsSync(transcriptFullPath)) {
                try {
                  const fullLines = fs.readFileSync(transcriptFullPath, 'utf8').trim().split('\n').filter(Boolean);
                  if (fullLines[i]) {
                    const fullItem = JSON.parse(fullLines[i]);
                    if (fullItem.content) text = fullItem.content.trim();
                  }
                } catch (_) {}
              }
              return text;
            }
          }
        }
      }
    } catch (_) {}
  }

  throw new Error(`Antigravity 에이전트 응답 대기 시간(${timeoutMs / 1000}초)이 초과되었습니다.`);
}

/**
 * Check bridge health and connection state
 */
async function getBridgeStatus() {
  try {
    const convId = await getOrCreateConversationId();
    const convDir = path.join(BRAIN_DIR, convId);
    return {
      connected: fs.existsSync(convDir),
      engine: 'Antigravity Local Agent API',
      conversationId: convId,
      model: 'Gemini 3.8 / Flash Agent',
      exePath: ANTIGRAVITY_EXE,
      brainDir: BRAIN_DIR
    };
  } catch (err) {
    return {
      connected: false,
      engine: 'Antigravity Local Agent API',
      error: err.message
    };
  }
}

module.exports = {
  getOrCreateConversationId,
  askAntigravity,
  getBridgeStatus
};
