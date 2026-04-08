// ============================================================
// QUAD Decisive Signals - Main Application
// ============================================================

const API_BASE = '/api'
let currentUser = null
let currentPage = 'landing'

// ============================================================
// API Helper
// ============================================================
const api = {
  async get(path) {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}${path}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    return res.json()
  },
  async post(path, data) {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    })
    return res.json()
  },
  async put(path, data = {}) {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    return res.json()
  },
  async delete(path) {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return res.json()
  }
}

// ============================================================
// Toast Notifications
// ============================================================
function showToast(message, type = 'success') {
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

// ============================================================
// Router
// ============================================================
async function navigate(page, params = {}) {
  // ── 페이지 이탈 시 뉴스 타이머 정리 ──
  if (page !== 'news') {
    if (newsRefreshTimer)    { clearInterval(newsRefreshTimer);    newsRefreshTimer = null }
    if (newsTimeUpdateTimer) { clearInterval(newsTimeUpdateTimer); newsTimeUpdateTimer = null }
  }

  currentPage = page
  const app = document.getElementById('app')
  
  if (!app) return

  if (page === 'landing') {
    renderLanding()
  } else if (page === 'login') {
    renderLogin()
  } else if (page === 'register') {
    renderRegister()
  } else if (currentUser) {
    if (currentUser.role === 'admin') {
      renderAdminLayout(page, params)
    } else {
      renderUserLayout(page, params)
    }
  } else {
    renderLanding()
  }
}

// ============================================================
// Auth Check
// ============================================================
async function checkAuth() {
  const token = localStorage.getItem('token')
  if (!token) return false

  try {
    const result = await api.get('/auth/verify')
    if (result.success) {
      currentUser = result.user
      return true
    }
  } catch (e) {}
  
  localStorage.removeItem('token')
  return false
}

// ============================================================
// LANDING PAGE
// ============================================================
function getLogoSVG(w, h) {
  w = w || 200; h = h || 50;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 60" width="' + w + '" height="' + h + '" fill="none">' +
    '<defs>' +
      '<linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#e0eaff"/>' +
        '<stop offset="50%" stop-color="#ffffff"/>' +
        '<stop offset="100%" stop-color="#b8d0ff"/>' +
      '</linearGradient>' +
      '<linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="0%">' +
        '<stop offset="0%" stop-color="#f5c842"/>' +
        '<stop offset="100%" stop-color="#ffd966"/>' +
      '</linearGradient>' +
      '<filter id="gs1" x="-40%" y="-40%" width="180%" height="180%">' +
        '<feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#4a7fff" flood-opacity="0.5"/>' +
      '</filter>' +
    '</defs>' +
    '<g filter="url(#gs1)" transform="translate(2,4)">' +
      '<circle cx="26" cy="26" r="24" stroke="url(#lg1)" stroke-width="2.2" fill="none"/>' +
      '<circle cx="26" cy="25" r="11" stroke="url(#lg1)" stroke-width="3.5" fill="none"/>' +
      '<line x1="33" y1="32" x2="38" y2="38" stroke="url(#lg1)" stroke-width="3.5" stroke-linecap="round"/>' +
      '<line x1="33" y1="14" x2="44" y2="5" stroke="url(#lg1)" stroke-width="2.5" stroke-linecap="round"/>' +
      '<polyline points="37,5 44,5 44,12" stroke="url(#lg1)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</g>' +
    '<text x="66" y="34" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="27" letter-spacing="2.5" fill="url(#lg1)">QUAD</text>' +
    '<text x="67" y="50" font-family="Arial,sans-serif" font-weight="700" font-size="10" letter-spacing="3" fill="url(#lg2)">DECISIVE SIGNALS</text>' +
  '</svg>'
}

function getLogoIcon(sz) {
  sz = sz || 40;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="' + sz + '" height="' + sz + '" fill="none">' +
    '<defs>' +
      '<linearGradient id="li1" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#e0eaff"/>' +
        '<stop offset="60%" stop-color="#ffffff"/>' +
        '<stop offset="100%" stop-color="#b8d0ff"/>' +
      '</linearGradient>' +
      '<filter id="gi1" x="-40%" y="-40%" width="180%" height="180%">' +
        '<feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#4a7fff" flood-opacity="0.6"/>' +
      '</filter>' +
    '</defs>' +
    '<g filter="url(#gi1)">' +
      '<circle cx="30" cy="30" r="27" stroke="url(#li1)" stroke-width="2.5" fill="none"/>' +
      '<circle cx="30" cy="29" r="12" stroke="url(#li1)" stroke-width="4" fill="none"/>' +
      '<line x1="38" y1="37" x2="44" y2="44" stroke="url(#li1)" stroke-width="4" stroke-linecap="round"/>' +
      '<line x1="38" y1="17" x2="50" y2="7" stroke="url(#li1)" stroke-width="2.8" stroke-linecap="round"/>' +
      '<polyline points="43,7 50,7 50,14" stroke="url(#li1)" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</g>' +
  '</svg>'
}

function renderLanding() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div style="min-height:100vh; background:#080d14; position:relative; overflow:hidden;">

      <div style="position:absolute; inset:0; pointer-events:none;
        background:
          radial-gradient(ellipse 80% 50% at 20% 10%, rgba(249,115,22,0.07) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 80%, rgba(245,158,11,0.05) 0%, transparent 55%),
          radial-gradient(ellipse 100% 60% at 50% 50%, rgba(232,58,0,0.03) 0%, transparent 70%);
      "></div>

      <div style="position:absolute; inset:0; pointer-events:none;
        background-image:linear-gradient(rgba(249,115,22,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.025) 1px, transparent 1px);
        background-size:60px 60px;
        mask-image:radial-gradient(ellipse at center, black 40%, transparent 100%);
        -webkit-mask-image:radial-gradient(ellipse at center, black 40%, transparent 100%);
      "></div>

      <div id="particles" style="position:absolute; inset:0; pointer-events:none; overflow:hidden;"></div>

      <div style="position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.5) 30%, rgba(245,158,11,0.5) 70%, transparent 100%); pointer-events:none;"></div>

      <!-- Navigation -->
      <nav style="position:relative; z-index:10; display:flex; align-items:center; justify-content:space-between; padding:0 16px; height:60px; background:rgba(8,13,20,0.6); backdrop-filter:blur(24px); border-bottom:1px solid rgba(249,115,22,0.1);">
        <div style="display:flex; align-items:center;">${getLogoSVG(160,40)}</div>
        <div style="display:flex; gap:8px; align-items:center;">
          <div style="display:flex; align-items:center; gap:5px;">
            <div style="width:6px; height:6px; background:#22c55e; border-radius:50%; box-shadow:0 0 6px #22c55e;"></div>
            <span style="font-size:10px; color:#22c55e; font-weight:700; letter-spacing:0.08em;">LIVE</span>
          </div>
          <button onclick="navigate('login')" class="btn-secondary" style="padding:8px 14px; font-size:13px; min-height:40px;">로그인</button>
          <button onclick="navigate('register')" class="btn-primary" style="padding:8px 14px; font-size:13px; min-height:40px;">무료 가입</button>
        </div>
      </nav>

      <!-- Hero -->
      <div style="position:relative; z-index:10; text-align:center; padding:clamp(36px,7vw,80px) 20px clamp(32px,5vw,60px);">
        <div style="display:inline-flex; align-items:center; gap:7px; background:rgba(249,115,22,0.08); border:1px solid rgba(249,115,22,0.18); border-radius:24px; padding:7px 18px; margin-bottom:28px; backdrop-filter:blur(8px);">
          <div style="width:6px; height:6px; background:#22c55e; border-radius:50%; box-shadow:0 0 7px #22c55e;"></div>
          <span style="font-size:12px; color:#f97316; font-weight:600;">실시간 주식 시그널 서비스 운영 중</span>
        </div>

        <div style="display:flex; justify-content:center; margin-bottom:24px;">${getLogoIcon(64)}</div>

        <h1 style="font-size:clamp(32px,7vw,72px); font-weight:900; line-height:1.1; margin-bottom:20px; letter-spacing:-0.02em;">
          <span style="color:rgba(255,255,255,0.92);">한국 주식 시장의</span><br>
          <span style="background:linear-gradient(135deg,#e83a00 0%,#f97316 45%,#f59e0b 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; filter:drop-shadow(0 0 24px rgba(249,115,22,0.3));">결정적 시그널</span>
        </h1>

        <p style="font-size:clamp(14px,2.5vw,17px); color:#6b7280; max-width:520px; margin:0 auto 28px; line-height:1.75; padding:0 4px;">
          코스피·코스닥 핵심 종목의 매수/매도 시그널을 실시간으로 제공합니다.<br>
          뉴스와 연동된 관련 종목 분석으로 투자 기회를 포착하세요.
        </p>

        <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; padding:0 12px;">
          <button onclick="navigate('register')" class="btn-primary" style="padding:clamp(12px,2vw,15px) clamp(24px,5vw,40px); font-size:clamp(14px,2vw,16px); border-radius:12px; box-shadow:0 0 28px rgba(249,115,22,0.25);">
            <i class="fas fa-rocket" style="margin-right:7px;"></i>지금 시작하기
          </button>
          <button onclick="navigate('login')" class="btn-secondary" style="padding:clamp(12px,2vw,15px) clamp(24px,5vw,40px); font-size:clamp(14px,2vw,16px); border-radius:12px;">
            <i class="fas fa-sign-in-alt" style="margin-right:7px;"></i>로그인
          </button>
        </div>
      </div>

      <!-- Stats bar -->
      <div style="position:relative; z-index:10; display:grid; grid-template-columns:repeat(2,1fr); border-top:1px solid rgba(249,115,22,0.08); border-bottom:1px solid rgba(249,115,22,0.08); background:rgba(10,15,26,0.6); backdrop-filter:blur(16px);">
        ${[{num:'200+',label:'분석 종목',icon:'fas fa-chart-bar'},{num:'98.5%',label:'시그널 정확도',icon:'fas fa-bullseye'},{num:'24/7',label:'실시간 모니터링',icon:'fas fa-satellite-dish'},{num:'10K+',label:'활성 회원',icon:'fas fa-users'}].map((s,i) => `
          <div style="text-align:center; padding:clamp(16px,3vw,32px) clamp(12px,3vw,48px); border-right:${i%2===0?'1px solid rgba(249,115,22,0.06)':'none'}; border-bottom:${i<2?'1px solid rgba(249,115,22,0.06)':'none'};">
            <div style="color:#f97316; font-size:12px; margin-bottom:6px; opacity:0.8;"><i class="${s.icon}"></i></div>
            <div style="font-size:clamp(22px,5vw,32px); font-weight:900; background:linear-gradient(135deg,#f97316,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent; line-height:1;">${s.num}</div>
            <div style="font-size:11px; color:#4b5563; margin-top:5px; letter-spacing:0.03em;">${s.label}</div>
          </div>
        `).join('')}
      </div>

      <!-- Features -->
      <div style="position:relative; z-index:10; padding:clamp(36px,6vw,72px) clamp(16px,4vw,56px); max-width:1100px; margin:0 auto;">
        <div style="text-align:center; margin-bottom:40px;">
          <h2 style="font-size:clamp(24px,5vw,36px); font-weight:800; margin-bottom:12px;">
            <span style="color:rgba(255,255,255,0.9);">왜 </span>
            <span style="background:linear-gradient(135deg,#f97316,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">QUAD</span>
            <span style="color:rgba(255,255,255,0.9);">인가?</span>
          </h2>
          <div style="width:50px; height:2px; background:linear-gradient(90deg,#f97316,#f59e0b); margin:14px auto 0; border-radius:2px;"></div>
          <p style="color:#4b5563; margin-top:14px; font-size:14px;">전문가 수준의 투자 시그널을 누구나 쉽게</p>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%,260px), 1fr)); gap:14px;">
          ${[
            {icon:'fa-chart-line', bg:'34,197,94', color:'#22c55e', title:'실시간 매수/매도 시그널', desc:'코스피·코스닥 주요 종목의 기술적·기본적 분석을 결합한 고정확도 시그널을 실시간으로 제공합니다.'},
            {icon:'fa-newspaper', bg:'59,130,246', color:'#3b82f6', title:'뉴스 종목 연동 분석', desc:'구글 금융 뉴스와 관련 주식 종목을 자동으로 매핑하여 뉴스의 투자 영향력을 즉시 파악합니다.'},
            {icon:'fa-shield-alt', bg:'245,158,11', color:'#f59e0b', title:'검증된 회원 전용 서비스', desc:'관리자 승인 시스템으로 신뢰할 수 있는 회원만 이용 가능한 프리미엄 서비스입니다.'},
            {icon:'fa-bolt', bg:'249,115,22', color:'#f97316', title:'시그널 강도 표시', desc:'매수/매도 신호의 강도를 0-100% 수치로 표시하여 투자 결정의 확신도를 한눈에 확인합니다.'},
            {icon:'fa-trophy', bg:'167,139,250', color:'#a78bfa', title:'코스피·코스닥 전문', desc:'한국 주식 시장에 특화된 분석으로 삼성전자부터 코스닥 성장주까지 폭넓게 다룹니다.'},
            {icon:'fa-tachometer-alt', bg:'52,211,153', color:'#34d399', title:'전문 대시보드', desc:'직관적인 인터페이스로 시장 전체 현황을 한눈에 파악하고 원하는 종목을 빠르게 확인하세요.'},
          ].map(f => `
            <div style="background:rgba(15,20,30,0.7); border:1px solid rgba(249,115,22,0.08); border-radius:16px; padding:clamp(18px,3vw,26px); backdrop-filter:blur(12px); transition:all 0.25s;">
              <div style="width:42px; height:42px; background:rgba(${f.bg},0.12); border-radius:11px; display:flex; align-items:center; justify-content:center; margin-bottom:14px;">
                <i class="fas ${f.icon}" style="color:${f.color}; font-size:17px;"></i>
              </div>
              <h3 style="font-size:15px; font-weight:700; color:rgba(255,255,255,0.9); margin-bottom:9px;">${f.title}</h3>
              <p style="font-size:13px; color:#4b5563; line-height:1.7;">${f.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- CTA -->
      <div style="position:relative; z-index:10; text-align:center; padding:clamp(36px,6vw,72px) 20px; background:linear-gradient(180deg,transparent 0%,rgba(249,115,22,0.04) 50%,transparent 100%); border-top:1px solid rgba(249,115,22,0.06); border-bottom:1px solid rgba(249,115,22,0.06);">
        <div style="display:flex; justify-content:center; margin-bottom:20px;">${getLogoIcon(48)}</div>
        <h2 style="font-size:clamp(22px,5vw,36px); font-weight:900; color:rgba(255,255,255,0.92); margin-bottom:12px;">지금 바로 시작하세요</h2>
        <p style="color:#4b5563; font-size:clamp(13px,2vw,15px); margin-bottom:28px; padding:0 12px;">회원가입 후 관리자 승인을 받으면 모든 서비스를 이용할 수 있습니다.</p>
        <button onclick="navigate('register')" class="btn-primary" style="padding:clamp(13px,2vw,16px) clamp(32px,6vw,52px); font-size:clamp(14px,2vw,17px); border-radius:14px; box-shadow:0 0 40px rgba(249,115,22,0.3);">
          <i class="fas fa-user-plus" style="margin-right:9px;"></i>무료 회원가입
        </button>
      </div>

      <!-- Footer -->
      <footer style="position:relative; z-index:10; padding:24px 16px; text-align:center; border-top:1px solid rgba(249,115,22,0.06);">
        <div style="display:flex; align-items:center; justify-content:center; margin-bottom:12px;">${getLogoSVG(160,40)}</div>
        <p style="color:#2d3748; font-size:11px; margin-top:4px; line-height:1.6;">© 2024 QUAD Decisive Signals. 본 서비스는 투자 참고용이며, 투자 결정에 대한 책임은 투자자 본인에게 있습니다.</p>
      </footer>
    </div>
  `
  createParticles()
}

function createParticles() {
  const container = document.getElementById('particles')
  if (!container) return
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div')
    p.className = 'particle'
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 10 + 8}s;
      animation-delay: ${Math.random() * 5}s;
      width: ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      opacity: ${Math.random() * 0.5};
    `
    container.appendChild(p)
  }
}

// ============================================================
// LOGIN PAGE
// ============================================================
function renderLogin() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, #080d14, #0d1117); position:relative; overflow:hidden; padding:20px 16px;">
      
      <div style="position:absolute; inset:0; background-image:linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px); background-size:50px 50px;"></div>
      <div style="position:absolute; top:-200px; left:-200px; width:400px; height:400px; background:radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%);"></div>
      
      <div style="position:relative; z-index:10; width:100%; max-width:420px;">
        
        <div style="text-align:center; margin-bottom:32px;">
          ${getLogoIcon(60)}
        </div>

        <div style="background:rgba(22,27,34,0.9); border:1px solid rgba(249,115,22,0.15); border-radius:20px; padding:clamp(24px,5vw,40px) clamp(20px,5vw,36px); backdrop-filter:blur(20px);">
          <h2 style="font-size:22px; font-weight:700; color:white; margin-bottom:6px;">로그인</h2>
          <p style="color:#6b7280; font-size:14px; margin-bottom:24px;">서비스를 이용하려면 로그인이 필요합니다</p>

          <div id="login-error" style="display:none;" class="alert-error"></div>

          <form onsubmit="handleLogin(event)">
            <div style="margin-bottom:18px;">
              <label style="display:block; font-size:13px; font-weight:600; color:#9ca3af; margin-bottom:7px;">아이디</label>
              <div style="position:relative;">
                <i class="fas fa-user" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:14px;"></i>
                <input type="text" id="login-username" class="form-input" placeholder="아이디를 입력하세요" style="padding-left:42px;" required autocomplete="username">
              </div>
            </div>
            
            <div style="margin-bottom:24px;">
              <label style="display:block; font-size:13px; font-weight:600; color:#9ca3af; margin-bottom:7px;">비밀번호</label>
              <div style="position:relative;">
                <i class="fas fa-lock" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:14px;"></i>
                <input type="password" id="login-password" class="form-input" placeholder="비밀번호를 입력하세요" style="padding-left:42px;" required autocomplete="current-password">
              </div>
            </div>

            <button type="submit" class="btn-primary" style="width:100%; padding:15px; font-size:16px; border-radius:12px;" id="login-btn">
              <i class="fas fa-sign-in-alt" style="margin-right:8px;"></i>로그인
            </button>
          </form>

          <div class="divider" style="margin:22px 0;"></div>
          
          <p style="text-align:center; color:#6b7280; font-size:14px;">
            계정이 없으신가요?
            <button onclick="navigate('register')" style="background:none; border:none; color:var(--brand-orange); font-weight:600; cursor:pointer; font-size:14px; padding:4px 2px;">회원가입</button>
          </p>

          <div style="margin-top:14px; padding:14px; background:rgba(249,115,22,0.05); border-radius:10px; border:1px solid rgba(249,115,22,0.1);">
            <p style="font-size:12px; color:#6b7280; text-align:center;">
              <i class="fas fa-info-circle" style="color:var(--brand-orange); margin-right:6px;"></i>
              회원가입 후 관리자 승인이 필요합니다
            </p>
          </div>
        </div>

        <p style="text-align:center; margin-top:20px;">
          <button onclick="navigate('landing')" style="background:none; border:none; color:#4b5563; font-size:13px; cursor:pointer; padding:8px;">
            <i class="fas fa-arrow-left" style="margin-right:6px;"></i>메인으로 돌아가기
          </button>
        </p>
      </div>
    </div>
  `
}

async function handleLogin(e) {
  e.preventDefault()
  const btn = document.getElementById('login-btn')
  const errorDiv = document.getElementById('login-error')
  const username = document.getElementById('login-username').value
  const password = document.getElementById('login-password').value

  btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>로그인 중...'
  btn.disabled = true
  errorDiv.style.display = 'none'

  try {
    const result = await api.post('/auth/login', { username, password })
    
    if (result.success) {
      localStorage.setItem('token', result.token)
      currentUser = result.user
      showToast(`${result.user.name}님, 환영합니다!`)
      navigate(result.user.role === 'admin' ? 'admin-dashboard' : 'dashboard')
    } else {
      errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${result.message}`
      errorDiv.style.display = 'flex'
    }
  } catch (err) {
    errorDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> 서버 오류가 발생했습니다.'
    errorDiv.style.display = 'flex'
  }
  
  btn.innerHTML = '<i class="fas fa-sign-in-alt" style="margin-right:8px;"></i>로그인'
  btn.disabled = false
}

// ============================================================
// REGISTER PAGE
// ============================================================
function renderRegister() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div style="min-height:100vh; display:flex; align-items:flex-start; justify-content:center; background:linear-gradient(135deg, #080d14, #0d1117); position:relative; overflow:hidden; padding:20px 16px;">
      
      <div style="position:absolute; inset:0; background-image:linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px); background-size:50px 50px;"></div>
      
      <div style="position:relative; z-index:10; width:100%; max-width:460px; padding-bottom:40px;">
        
        <div style="text-align:center; margin-bottom:28px; padding-top:16px;">
          ${getLogoIcon(52)}
        </div>

        <div style="background:rgba(22,27,34,0.9); border:1px solid rgba(249,115,22,0.15); border-radius:20px; padding:clamp(20px,5vw,36px) clamp(18px,5vw,32px); backdrop-filter:blur(20px);">
          <h2 style="font-size:21px; font-weight:700; color:white; margin-bottom:6px;">회원가입</h2>
          <p style="color:#6b7280; font-size:13px; margin-bottom:22px;">아래 정보를 입력하면 관리자 승인 후 이용 가능합니다</p>

          <div id="register-msg" style="display:none; margin-bottom:16px;"></div>

          <form onsubmit="handleRegister(event)">
            <!-- 아이디 + 이름 (모바일: 1칸씩) -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
              <div>
                <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">아이디 *</label>
                <div style="position:relative;">
                  <i class="fas fa-user" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:12px;"></i>
                  <input type="text" id="reg-username" class="form-input" placeholder="아이디" style="padding-left:34px; padding-top:12px; padding-bottom:12px; font-size:14px;" required autocomplete="username">
                </div>
              </div>
              <div>
                <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">이름 *</label>
                <div style="position:relative;">
                  <i class="fas fa-id-card" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:12px;"></i>
                  <input type="text" id="reg-name" class="form-input" placeholder="실명" style="padding-left:34px; padding-top:12px; padding-bottom:12px; font-size:14px;" required>
                </div>
              </div>
            </div>

            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">이메일 *</label>
              <div style="position:relative;">
                <i class="fas fa-envelope" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;"></i>
                <input type="email" id="reg-email" class="form-input" placeholder="이메일 주소" style="padding-left:40px;" required autocomplete="email">
              </div>
            </div>

            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">전화번호 *</label>
              <div style="position:relative;">
                <i class="fas fa-phone" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;"></i>
                <input type="tel" id="reg-phone" class="form-input" placeholder="010-0000-0000" style="padding-left:40px;" required autocomplete="tel">
              </div>
            </div>

            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">비밀번호 * (8자 이상)</label>
              <div style="position:relative;">
                <i class="fas fa-lock" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;"></i>
                <input type="password" id="reg-password" class="form-input" placeholder="비밀번호 (8자 이상)" style="padding-left:40px;" required minlength="8" autocomplete="new-password">
              </div>
            </div>

            <div style="margin-bottom:22px;">
              <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">비밀번호 확인 *</label>
              <div style="position:relative;">
                <i class="fas fa-lock" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;"></i>
                <input type="password" id="reg-confirm" class="form-input" placeholder="비밀번호 재입력" style="padding-left:40px;" required autocomplete="new-password">
              </div>
            </div>

            <button type="submit" class="btn-primary" style="width:100%; padding:15px; font-size:15px; border-radius:12px;" id="reg-btn">
              <i class="fas fa-user-plus" style="margin-right:8px;"></i>회원가입 신청
            </button>
          </form>

          <div class="divider" style="margin:18px 0;"></div>
          
          <p style="text-align:center; color:#6b7280; font-size:13px;">
            이미 계정이 있으신가요?
            <button onclick="navigate('login')" style="background:none; border:none; color:var(--brand-orange); font-weight:600; cursor:pointer; font-size:13px; padding:4px 2px;">로그인</button>
          </p>
        </div>

        <p style="text-align:center; margin-top:18px;">
          <button onclick="navigate('landing')" style="background:none; border:none; color:#4b5563; font-size:13px; cursor:pointer; padding:8px;">
            <i class="fas fa-arrow-left" style="margin-right:6px;"></i>메인으로
          </button>
        </p>
      </div>
    </div>
  `
}

async function handleRegister(e) {
  e.preventDefault()
  const btn = document.getElementById('reg-btn')
  const msgDiv = document.getElementById('register-msg')
  
  const username = document.getElementById('reg-username').value
  const name = document.getElementById('reg-name').value
  const email = document.getElementById('reg-email').value
  const phone = document.getElementById('reg-phone').value
  const password = document.getElementById('reg-password').value
  const confirm = document.getElementById('reg-confirm').value

  if (password !== confirm) {
    msgDiv.innerHTML = '<div class="alert-error"><i class="fas fa-exclamation-circle"></i> 비밀번호가 일치하지 않습니다.</div>'
    msgDiv.style.display = 'block'
    return
  }

  btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>처리 중...'
  btn.disabled = true
  msgDiv.style.display = 'none'

  try {
    const result = await api.post('/auth/register', { username, name, email, phone, password })
    
    if (result.success) {
      msgDiv.innerHTML = `<div class="alert-success"><i class="fas fa-check-circle"></i> ${result.message}</div>`
      msgDiv.style.display = 'block'
      setTimeout(() => navigate('login'), 3000)
    } else {
      msgDiv.innerHTML = `<div class="alert-error"><i class="fas fa-exclamation-circle"></i> ${result.message}</div>`
      msgDiv.style.display = 'block'
    }
  } catch (err) {
    msgDiv.innerHTML = '<div class="alert-error"><i class="fas fa-exclamation-circle"></i> 서버 오류가 발생했습니다.</div>'
    msgDiv.style.display = 'block'
  }
  
  btn.innerHTML = '<i class="fas fa-user-plus" style="margin-right:8px;"></i>회원가입 신청'
  btn.disabled = false
}

// ============================================================
// USER LAYOUT
// ============================================================
function renderUserLayout(page, params) {
  const app = document.getElementById('app')
  app.innerHTML = `
    <!-- Navbar (fixed, z=1000) -->
    <nav id="main-navbar" style="
      position:fixed; top:0; left:0; right:0; height:56px; z-index:1000;
      background:rgba(8,13,20,0.97); backdrop-filter:blur(20px);
      border-bottom:1px solid rgba(249,115,22,0.12);
      display:flex; align-items:center; justify-content:space-between; padding:0 14px;
    ">
      <div style="display:flex; align-items:center; gap:8px;">
        <button onclick="toggleSidebar()" style="background:none; border:none; color:#9ca3af; cursor:pointer; font-size:20px; padding:8px; border-radius:8px; min-width:44px; min-height:44px; display:flex; align-items:center; justify-content:center;">
          <i class="fas fa-bars"></i>
        </button>
        <div onclick="navigate('dashboard')" style="cursor:pointer; display:flex; align-items:center;">${getLogoSVG(140,36)}</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="display:none; align-items:center; gap:4px;" id="navbar-live">
          <div style="width:6px; height:6px; background:#22c55e; border-radius:50%; box-shadow:0 0 5px #22c55e;"></div>
          <span style="font-size:10px; color:#22c55e; font-weight:700;">LIVE</span>
        </div>
        <div style="display:flex; align-items:center; gap:7px;">
          <div style="width:32px; height:32px; background:linear-gradient(135deg,#e83a00,#f59e0b); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; color:white; flex-shrink:0;">
            ${(currentUser?.name?.[0] || 'U').toUpperCase()}
          </div>
          <span style="font-size:13px; font-weight:600; color:white; max-width:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${currentUser?.name || '사용자'}</span>
        </div>
        <button onclick="handleLogout()" title="로그아웃"
          style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); color:#ef4444; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:13px; min-height:40px;">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </nav>

    <!-- Ticker Tape (fixed, z=999, top=56px) -->
    <div id="ticker-bar" style="
      position:fixed; top:56px; left:0; right:0; z-index:999;
      background:rgba(8,13,20,0.95); border-bottom:1px solid rgba(249,115,22,0.08);
      overflow:hidden; white-space:nowrap; height:30px; display:flex; align-items:center;
    ">
      <div style="display:inline-block; animation:ticker 40s linear infinite; padding-left:100%;">
        <span style="font-size:11px; color:#9ca3af;">
          삼성전자&nbsp;<span style="color:#ef4444;">▲ 72,500</span>&nbsp;<span style="color:#4b5563;">(+1.68%)</span>
          &nbsp;&nbsp;│&nbsp;&nbsp;
          SK하이닉스&nbsp;<span style="color:#3b82f6;">▼ 185,000</span>&nbsp;<span style="color:#4b5563;">(-1.33%)</span>
          &nbsp;&nbsp;│&nbsp;&nbsp;
          에코프로비엠&nbsp;<span style="color:#ef4444;">▲ 115,000</span>&nbsp;<span style="color:#4b5563;">(+7.97%)</span>
          &nbsp;&nbsp;│&nbsp;&nbsp;
          HLB&nbsp;<span style="color:#ef4444;">▲ 95,000</span>&nbsp;<span style="color:#4b5563;">(+14.46%)</span>
          &nbsp;&nbsp;│&nbsp;&nbsp;
          NAVER&nbsp;<span style="color:#3b82f6;">▼ 198,000</span>&nbsp;<span style="color:#4b5563;">(-1.49%)</span>
          &nbsp;&nbsp;│&nbsp;&nbsp;
          현대차&nbsp;<span style="color:#ef4444;">▲ 235,000</span>&nbsp;<span style="color:#4b5563;">(+1.29%)</span>
          &nbsp;&nbsp;│&nbsp;&nbsp;
          셀트리온&nbsp;<span style="color:#ef4444;">▲ 175,000</span>&nbsp;<span style="color:#4b5563;">(+2.94%)</span>
          &nbsp;&nbsp;│&nbsp;&nbsp;
          카카오&nbsp;<span style="color:#3b82f6;">▼ 42,000</span>&nbsp;<span style="color:#4b5563;">(-1.18%)</span>
          &nbsp;&nbsp;│&nbsp;&nbsp;
          알테오젠&nbsp;<span style="color:#ef4444;">▲ 285,000</span>&nbsp;<span style="color:#4b5563;">(+6.74%)</span>
          &nbsp;&nbsp;│&nbsp;&nbsp;
          루닛&nbsp;<span style="color:#ef4444;">▲ 58,000</span>&nbsp;<span style="color:#4b5563;">(+8.41%)</span>
          &nbsp;&nbsp;│&nbsp;&nbsp;
          레인보우로보틱스&nbsp;<span style="color:#ef4444;">▲ 185,000</span>&nbsp;<span style="color:#4b5563;">(+6.92%)</span>
          &nbsp;&nbsp;│&nbsp;&nbsp;
          삼성SDI&nbsp;<span style="color:#3b82f6;">▼ 325,000</span>&nbsp;<span style="color:#4b5563;">(-1.52%)</span>
          &nbsp;&nbsp;│&nbsp;&nbsp;
          LG에너지솔루션&nbsp;<span style="color:#ef4444;">▲ 385,000</span>&nbsp;<span style="color:#4b5563;">(+2.26%)</span>
          &nbsp;&nbsp;&nbsp;&nbsp;
        </span>
      </div>
    </div>

    <!-- Sidebar overlay (mobile) -->
    <div id="sidebar-overlay" class="sidebar-overlay" onclick="closeSidebar()"></div>

    <!-- Sidebar (fixed) -->
    <aside id="sidebar" style="
      position:fixed; top:86px; left:0; bottom:0; width:240px; z-index:600;
      background:rgba(10,14,20,0.98); border-right:1px solid rgba(249,115,22,0.08);
      overflow-y:auto; padding:12px 0; transition:transform 0.3s ease;
    ">
      <div style="padding:0 16px 10px; margin-bottom:4px;">
        <p style="font-size:10px; font-weight:700; color:#374151; letter-spacing:0.12em; text-transform:uppercase;">메인 메뉴</p>
      </div>
      ${[
        { id: 'dashboard', icon: 'fas fa-tachometer-alt', label: '대시보드', badge: '' },
        { id: 'signals',   icon: 'fas fa-signal',         label: '주가 시그널', badge: '' },
        { id: 'kospi',     icon: 'fas fa-chart-line',     label: 'KOSPI', badge: '' },
        { id: 'kosdaq',    icon: 'fas fa-chart-bar',      label: 'KOSDAQ', badge: '' },
        { id: 'crypto',    icon: 'fab fa-bitcoin',        label: '코인 시그널', badge: 'NEW' },
        { id: 'news',      icon: 'fas fa-newspaper',      label: '뉴스 & 종목 추천', badge: 'LIVE' },
      ].map(item => `
        <div class="sidebar-item ${page === item.id ? 'active' : ''}" onclick="navigate('${item.id}'); closeSidebar();"
          style="${item.id === 'news' ? 'border-left: 2px solid rgba(249,115,22,0.4);' : ''}">
          <i class="${item.icon}" style="width:16px; text-align:center; font-size:14px;"></i>
          <span style="font-size:14px; flex:1;">${item.label}</span>
          ${item.badge ? `<span style="font-size:9px; font-weight:800; color:#22c55e; background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.25); border-radius:4px; padding:1px 5px; letter-spacing:0.05em;">${item.badge}</span>` : ''}
        </div>
      `).join('')}

      <div style="margin: 14px 16px 0; padding-top:14px; border-top:1px solid rgba(255,255,255,0.04);">
        <p style="font-size:10px; font-weight:700; color:#374151; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px;">계정</p>
      </div>
      <div class="sidebar-item ${page === 'settings' ? 'active' : ''}" onclick="navigate('settings'); closeSidebar();">
        <i class="fas fa-cog" style="width:16px; text-align:center; font-size:14px;"></i>
        <span style="font-size:14px;">계정 설정</span>
      </div>
      <div class="sidebar-item" onclick="handleLogout()">
        <i class="fas fa-sign-out-alt" style="width:16px; text-align:center; font-size:14px; color:#ef4444;"></i>
        <span style="font-size:14px; color:#ef4444;">로그아웃</span>
      </div>
    </aside>

    <!-- Main Content -->
    <main id="main-content" style="
      margin-left:240px; margin-top:86px;
      padding:24px 24px 40px;
      min-height:calc(100vh - 86px);
      box-sizing:border-box;
    ">
      <div id="page-content"></div>
    </main>

    <!-- Bottom Nav (모바일 전용) -->
    <nav class="bottom-nav" id="bottom-nav">
      <div class="bottom-nav-items">
        ${[
          { id: 'dashboard', icon: 'fa-tachometer-alt', label: '대시보드' },
          { id: 'signals',   icon: 'fa-signal',         label: '시그널' },
          { id: 'crypto',    icon: 'fa-bitcoin',        label: '코인' },
          { id: 'news',      icon: 'fa-newspaper',      label: '뉴스' },
        ].map(item => `
          <button class="bottom-nav-item ${page === item.id ? 'active' : ''}" onclick="navigate('${item.id}')" id="bnav-${item.id}">
            <i class="fas ${item.icon}"></i>
            <span>${item.label}</span>
          </button>
        `).join('')}
        <button class="bottom-nav-item" onclick="toggleSidebar()" id="bnav-more">
          <i class="fas fa-ellipsis-h"></i>
          <span>더보기</span>
        </button>
      </div>
    </nav>
  `

  setTimeout(initSidebarResponsive, 0)

  if (page === 'dashboard') renderDashboard()
  else if (page === 'signals') renderSignals()
  else if (page === 'kospi') renderMarket('KOSPI')
  else if (page === 'kosdaq') renderMarket('KOSDAQ')
  else if (page === 'news') renderNews()
  else if (page === 'crypto') renderCrypto()
  else if (page === 'settings') renderSettings()
  else renderDashboard()
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebar-overlay')
  const main = document.getElementById('main-content')
  if (!sidebar) return
  const isMobile = window.innerWidth <= 768
  if (isMobile) {
    const isOpen = sidebar.classList.contains('open')
    if (isOpen) {
      sidebar.classList.remove('open')
      sidebar.style.transform = 'translateX(-100%)'
      if (overlay) overlay.classList.remove('active')
    } else {
      sidebar.classList.add('open')
      sidebar.style.transform = 'translateX(0)'
      if (overlay) overlay.classList.add('active')
    }
  } else {
    const isHidden = sidebar.style.transform === 'translateX(-100%)'
    sidebar.style.transform = isHidden ? '' : 'translateX(-100%)'
    if (main) main.style.marginLeft = isHidden ? '240px' : '0'
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebar-overlay')
  if (!sidebar) return
  if (window.innerWidth <= 768) {
    sidebar.classList.remove('open')
    sidebar.style.transform = 'translateX(-100%)'
    if (overlay) overlay.classList.remove('active')
  }
}

function initSidebarResponsive() {
  const sidebar = document.getElementById('sidebar')
  const main = document.getElementById('main-content')
  if (!sidebar || !main) return
  if (window.innerWidth <= 768) {
    sidebar.style.transform = 'translateX(-100%)'
    main.style.marginLeft = '0'
    main.style.marginTop = '86px'
    main.style.paddingBottom = '80px'
  } else {
    sidebar.style.transform = ''
    main.style.marginLeft = '240px'
  }
}

window.addEventListener('resize', () => {
  const sidebar = document.getElementById('sidebar')
  const main = document.getElementById('main-content')
  const overlay = document.getElementById('sidebar-overlay')
  if (!sidebar || !main) return
  if (window.innerWidth > 768) {
    sidebar.style.transform = ''
    sidebar.classList.remove('open')
    main.style.marginLeft = '240px'
    main.style.paddingBottom = ''
    if (overlay) overlay.classList.remove('active')
  } else {
    if (!sidebar.classList.contains('open')) {
      sidebar.style.transform = 'translateX(-100%)'
      main.style.marginLeft = '0'
    }
    main.style.paddingBottom = '80px'
  }
})

async function handleLogout() {
  await api.post('/auth/logout', {})
  localStorage.removeItem('token')
  currentUser = null
  showToast('로그아웃되었습니다.')
  navigate('landing')
}

// ============================================================
// DASHBOARD
// ============================================================
async function renderDashboard() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:8px;">
      <div>
        <h1 style="font-size:clamp(20px,5vw,26px); font-weight:800; color:white;">대시보드</h1>
        <p style="color:#6b7280; font-size:13px; margin-top:3px;">주식 시그널 현황을 한눈에 확인하세요</p>
      </div>
      <div style="font-size:12px; color:#4b5563;"><i class="fas fa-clock" style="margin-right:5px;"></i>${new Date().toLocaleString('ko-KR')}</div>
    </div>
    
    <div id="dashboard-content">
      <div style="display:flex; justify-content:center; padding:60px;"><div class="spinner"></div></div>
    </div>
  `

  try {
    const [summaryRes, stocksRes] = await Promise.all([
      api.get('/signals/summary'),
      api.get('/stocks?market=ALL&limit=20')
    ])

    const summary = summaryRes.success ? summaryRes.summary : { buyCount: 0, sellCount: 0, strongBuys: [], strongSells: [] }
    const stocks = stocksRes.success ? stocksRes.stocks : []
    const dataSource = stocksRes.source || 'fallback'

    document.getElementById('dashboard-content').innerHTML = `
      ${dataSource === 'fallback' ? `
      <div style="display:flex; align-items:center; gap:8px; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:10px; padding:10px 14px; margin-bottom:14px;">
        <i class="fas fa-info-circle" style="color:#f59e0b; font-size:14px; flex-shrink:0;"></i>
        <span style="font-size:12px; color:#d97706;">현재 <b>샘플 가격</b>이 표시됩니다. 네이버 증권 실시간 시세 연동 중입니다.</span>
      </div>` : ''}
      <!-- Stats Row -->
      <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; margin-bottom:18px;">
        ${[
          { label: '매수 시그널', value: summary.buyCount + (stocks.filter(s=>s.signal==='BUY').length), icon: 'fas fa-arrow-up', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { label: '매도 시그널', value: summary.sellCount + (stocks.filter(s=>s.signal==='SELL').length), icon: 'fas fa-arrow-down', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { label: '분석 종목', value: stocks.length, icon: 'fas fa-chart-pie', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
          { label: '시그널 정확도', value: '98.5%', icon: 'fas fa-bullseye', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        ].map(stat => `
          <div class="stat-card">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
              <span style="font-size:12px; color:#6b7280; font-weight:500;">${stat.label}</span>
              <div style="width:36px; height:36px; background:${stat.bg}; border-radius:9px; display:flex; align-items:center; justify-content:center;">
                <i class="${stat.icon}" style="color:${stat.color}; font-size:14px;"></i>
              </div>
            </div>
            <div style="font-size:clamp(24px,6vw,32px); font-weight:800; color:${stat.color};">${stat.value}</div>
          </div>
        `).join('')}
      </div>

      <!-- Strong signals: 모바일 1칸, 데스크탑 2칸 -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%,280px), 1fr)); gap:16px; margin-bottom:20px;">
        
        <!-- Strong Buy -->
        <div style="background:rgba(22,27,34,0.8); border:1px solid rgba(34,197,94,0.15); border-radius:16px; padding:18px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
            <div style="width:9px; height:9px; background:#22c55e; border-radius:50%; box-shadow:0 0 8px #22c55e;"></div>
            <h3 style="font-size:14px; font-weight:700; color:white;">강력 매수 종목</h3>
          </div>
          ${stocks.filter(s => s.signal === 'BUY').slice(0, 5).map(s => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
              <div style="display:flex; align-items:center; gap:8px; min-width:0;">
                <span class="${s.market === 'KOSPI' ? 'badge-kospi' : 'badge-kosdaq'}" style="flex-shrink:0;">${s.market}</span>
                <div style="min-width:0;">
                  <div style="font-size:13px; font-weight:600; color:white; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${s.name}</div>
                  <div style="font-size:11px; color:#6b7280;">${s.code}</div>
                </div>
              </div>
              <div style="text-align:right; flex-shrink:0;">
                <div style="font-size:13px; font-weight:700; color:#22c55e;">${(s.price||0).toLocaleString()}원</div>
                <div style="font-size:11px; color:${(s.changeRate||0) >= 0 ? '#ef4444' : '#3b82f6'};">${(s.changeRate||0) >= 0 ? '+' : ''}${(s.changeRate||0).toFixed(2)}%</div>
              </div>
            </div>
          `).join('')}
          ${stocks.filter(s => s.signal === 'BUY').length === 0 ? '<div style="text-align:center; color:#4b5563; padding:16px;">시그널 데이터 없음</div>' : ''}
        </div>

        <!-- Strong Sell -->
        <div style="background:rgba(22,27,34,0.8); border:1px solid rgba(239,68,68,0.15); border-radius:16px; padding:18px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
            <div style="width:9px; height:9px; background:#ef4444; border-radius:50%; box-shadow:0 0 8px #ef4444;"></div>
            <h3 style="font-size:14px; font-weight:700; color:white;">주의 종목</h3>
          </div>
          ${stocks.filter(s => s.signal === 'SELL').slice(0, 5).map(s => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
              <div style="display:flex; align-items:center; gap:8px; min-width:0;">
                <span class="${s.market === 'KOSPI' ? 'badge-kospi' : 'badge-kosdaq'}" style="flex-shrink:0;">${s.market}</span>
                <div style="min-width:0;">
                  <div style="font-size:13px; font-weight:600; color:white; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${s.name}</div>
                  <div style="font-size:11px; color:#6b7280;">${s.code}</div>
                </div>
              </div>
              <div style="text-align:right; flex-shrink:0;">
                <div style="font-size:13px; font-weight:700; color:#ef4444;">${(s.price||0).toLocaleString()}원</div>
                <div style="font-size:11px; color:${(s.changeRate||0) >= 0 ? '#ef4444' : '#3b82f6'};">${(s.changeRate||0) >= 0 ? '+' : ''}${(s.changeRate||0).toFixed(2)}%</div>
              </div>
            </div>
          `).join('')}
          ${stocks.filter(s => s.signal === 'SELL').length === 0 ? '<div style="text-align:center; color:#4b5563; padding:16px;">시그널 데이터 없음</div>' : ''}
        </div>
      </div>

      <!-- All Stocks Table (scrollable on mobile) -->
      <div style="background:rgba(22,27,34,0.8); border:1px solid rgba(249,115,22,0.08); border-radius:16px; overflow:hidden;">
        <div style="padding:16px 18px; border-bottom:1px solid var(--brand-border); display:flex; align-items:center; justify-content:space-between;">
          <h3 style="font-size:15px; font-weight:700; color:white;">주요 종목 시그널</h3>
          <button onclick="navigate('signals')" style="background:rgba(249,115,22,0.1); border:1px solid rgba(249,115,22,0.2); color:var(--brand-orange); padding:6px 14px; border-radius:8px; font-size:12px; cursor:pointer; font-weight:600; white-space:nowrap;">전체보기</button>
        </div>
        <div class="table-wrap">
          <table class="data-table" style="min-width:600px;">
            <thead>
              <tr>
                <th>종목명</th>
                <th>시장</th>
                <th>현재가</th>
                <th>등락률</th>
                <th>시그널</th>
                <th>강도</th>
              </tr>
            </thead>
            <tbody>
              ${stocks.slice(0, 10).map(s => `
                <tr onclick="showStockDetail('${s.code}', '${s.name}')" style="cursor:pointer;">
                  <td>
                    <div style="font-weight:600; color:white; font-size:13px;">${s.name}</div>
                    <div style="font-size:11px; color:#4b5563;">${s.code}</div>
                  </td>
                  <td><span class="${s.market === 'KOSPI' ? 'badge-kospi' : 'badge-kosdaq'}">${s.market}</span></td>
                  <td style="font-weight:700; color:white; white-space:nowrap;">${(s.price||0).toLocaleString()}원</td>
                  <td class="${(s.changeRate||0) >= 0 ? 'price-up' : 'price-down'}" style="font-weight:600; white-space:nowrap;">
                    ${(s.changeRate||0) >= 0 ? '▲' : '▼'} ${Math.abs(s.changeRate||0).toFixed(2)}%
                  </td>
                  <td><span class="signal-${(s.signal||'HOLD').toLowerCase()}">${s.signal||'HOLD'}</span></td>
                  <td>
                    <div style="display:flex; align-items:center; gap:6px;">
                      <div class="strength-bar" style="width:60px;">
                        <div class="strength-fill" style="width:${s.strength||50}%; background:${(s.signal==='BUY') ? '#22c55e' : (s.signal==='SELL') ? '#ef4444' : '#f59e0b'};"></div>
                      </div>
                      <span style="font-size:11px; color:#6b7280;">${s.strength||50}%</span>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 뉴스 배너 -->
      <div onclick="navigate('news')" style="
        margin-top:16px; padding:16px 18px; border-radius:14px; cursor:pointer;
        background:linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(245,158,11,0.05) 100%);
        border:1px solid rgba(249,115,22,0.2);
        display:flex; align-items:center; justify-content:space-between; gap:12px;
        transition:all 0.3s ease;
      ">
        <div style="display:flex; align-items:center; gap:12px; min-width:0;">
          <div style="width:42px; height:42px; background:var(--brand-gradient); border-radius:11px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">
            📰
          </div>
          <div style="min-width:0;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:3px; flex-wrap:wrap;">
              <span style="font-size:14px; font-weight:700; color:white;">실시간 뉴스 & 종목 추천</span>
              <span style="font-size:9px; font-weight:800; color:#22c55e; background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.25); border-radius:4px; padding:2px 5px;">● LIVE</span>
            </div>
            <p style="font-size:12px; color:#6b7280; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">최신 금융 뉴스 · 매수 추천 TOP5 · 섹터 강도 분석</p>
          </div>
        </div>
        <div style="color:var(--brand-orange); font-size:18px; flex-shrink:0;">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    `
  } catch (err) {
    document.getElementById('dashboard-content').innerHTML = '<div style="color:#ef4444; padding:20px;">데이터를 불러오는 중 오류가 발생했습니다.</div>'
  }
}

// ============================================================
// SIGNALS PAGE
// ============================================================
async function renderSignals() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div style="margin-bottom:18px;">
      <h1 style="font-size:clamp(20px,5vw,26px); font-weight:800; color:white;">주가 시그널</h1>
      <p style="color:#6b7280; font-size:13px; margin-top:3px;">KOSPI·KOSDAQ 전 종목 매수/매도 시그널</p>
    </div>

    <!-- Filters (가로 스크롤) -->
    <div style="margin-bottom:18px;">
      <div style="overflow-x:auto; -webkit-overflow-scrolling:touch; padding-bottom:4px;">
        <div style="display:flex; gap:8px; min-width:max-content;">
          <button class="tab-btn active" id="tab-all" onclick="filterSignals('ALL', 'ALL')">전체</button>
          <button class="tab-btn" id="tab-kospi" onclick="filterSignals('KOSPI', 'ALL')">KOSPI</button>
          <button class="tab-btn" id="tab-kosdaq" onclick="filterSignals('KOSDAQ', 'ALL')">KOSDAQ</button>
          <div style="width:1px; height:32px; background:var(--brand-border); flex-shrink:0; align-self:center;"></div>
          <button class="tab-btn" id="sig-all" onclick="filterSignals(currentMarketFilter, 'ALL')">전체</button>
          <button class="tab-btn" id="sig-buy" onclick="filterSignals(currentMarketFilter, 'BUY')">
            <span style="color:#22c55e;">▲</span> 매수
          </button>
          <button class="tab-btn" id="sig-sell" onclick="filterSignals(currentMarketFilter, 'SELL')">
            <span style="color:#ef4444;">▼</span> 매도
          </button>
          <button class="tab-btn" id="sig-hold" onclick="filterSignals(currentMarketFilter, 'HOLD')">
            <span style="color:#f59e0b;">—</span> 홀드
          </button>
        </div>
      </div>
    </div>

    <div id="signals-content">
      <div style="display:flex; justify-content:center; padding:60px;"><div class="spinner"></div></div>
    </div>
  `
  window.currentMarketFilter = 'ALL'
  await loadSignals('ALL', 'ALL')
}

async function filterSignals(market, signal) {
  window.currentMarketFilter = market
  await loadSignals(market, signal)
}

async function loadSignals(market, signal) {
  const content = document.getElementById('signals-content')
  if (!content) return
  
  content.innerHTML = '<div style="display:flex; justify-content:center; padding:60px;"><div class="spinner"></div></div>'

  try {
    const res = await api.get(`/stocks?market=${market}&limit=50`)
    let stocks = res.success ? res.stocks : []
    
    if (signal !== 'ALL') {
      stocks = stocks.filter(s => s.signal === signal)
    }

    content.innerHTML = `
      <!-- Summary cards -->
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:18px;">
        <div style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); border-radius:12px; padding:14px; text-align:center;">
          <div style="font-size:clamp(22px,6vw,32px); font-weight:800; color:#22c55e;">${stocks.filter(s=>s.signal==='BUY').length}</div>
          <div style="font-size:11px; color:#6b7280; margin-top:3px;">매수</div>
        </div>
        <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:12px; padding:14px; text-align:center;">
          <div style="font-size:clamp(22px,6vw,32px); font-weight:800; color:#ef4444;">${stocks.filter(s=>s.signal==='SELL').length}</div>
          <div style="font-size:11px; color:#6b7280; margin-top:3px;">매도</div>
        </div>
        <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:12px; padding:14px; text-align:center;">
          <div style="font-size:clamp(22px,6vw,32px); font-weight:800; color:#f59e0b;">${stocks.filter(s=>s.signal==='HOLD').length}</div>
          <div style="font-size:11px; color:#6b7280; margin-top:3px;">홀드</div>
        </div>
      </div>

      <!-- Stocks Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%,260px), 1fr)); gap:12px;">
        ${stocks.map(s => `
          <div class="glass-card" style="padding:16px; cursor:pointer;" onclick="showStockDetail('${s.code}', '${s.name}')">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
              <div style="min-width:0;">
                <div style="font-size:15px; font-weight:700; color:white; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${s.name}</div>
                <div style="font-size:11px; color:#4b5563; margin-top:1px;">${s.code}</div>
              </div>
              <span class="signal-${(s.signal||'HOLD').toLowerCase()}" style="flex-shrink:0; margin-left:8px;">${s.signal||'HOLD'}</span>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
              <div>
                <div style="font-size:20px; font-weight:800; color:white;">${(s.price||0).toLocaleString()}<span style="font-size:12px; color:#6b7280; font-weight:400;">원</span></div>
                <div style="font-size:12px; margin-top:2px; color:${(s.changeRate||0) >= 0 ? '#ef4444' : '#3b82f6'}; font-weight:600;">
                  ${(s.changeRate||0) >= 0 ? '▲' : '▼'} ${Math.abs(s.changeRate||0).toFixed(2)}%
                </div>
              </div>
              <span class="${s.market === 'KOSPI' ? 'badge-kospi' : 'badge-kosdaq'}">${s.market}</span>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span style="font-size:11px; color:#6b7280;">시그널 강도</span>
                <span style="font-size:11px; font-weight:700; color:${(s.signal==='BUY') ? '#22c55e' : (s.signal==='SELL') ? '#ef4444' : '#f59e0b'};">${s.strength||50}%</span>
              </div>
              <div class="strength-bar">
                <div class="strength-fill" style="width:${s.strength||50}%; background:${(s.signal==='BUY') ? 'linear-gradient(90deg,#16a34a,#22c55e)' : (s.signal==='SELL') ? 'linear-gradient(90deg,#b91c1c,#ef4444)' : 'linear-gradient(90deg,#b45309,#f59e0b)'};"></div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${stocks.length === 0 ? '<div style="text-align:center; color:#4b5563; padding:60px; font-size:16px;"><i class="fas fa-inbox" style="font-size:36px; display:block; margin-bottom:14px;"></i>해당 조건의 시그널이 없습니다</div>' : ''}
    `
  } catch (err) {
    content.innerHTML = '<div style="color:#ef4444; padding:20px;">데이터 로드 실패</div>'
  }
}

// ============================================================
// MARKET PAGE (KOSPI / KOSDAQ)
// ============================================================
let marketAllStocks  = []   // 전체 종목 보관
let marketFilteredStocks = [] // 필터 후 종목
let marketCurrentPage = 1
const MARKET_PAGE_SIZE = 100

async function renderMarket(market) {
  const content = document.getElementById('page-content')
  const isKospi = market === 'KOSPI'
  const marketColor = isKospi ? '#60a5fa' : '#c084fc'
  const marketBg    = isKospi ? 'rgba(96,165,250,0.08)' : 'rgba(192,132,252,0.08)'

  content.innerHTML = `
    <div style="margin-bottom:18px;">
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <h1 style="font-size:clamp(20px,5vw,26px); font-weight:800; color:white;">${market} 시장</h1>
        <span id="mkt-source-badge" style="font-size:11px; font-weight:700; color:#f59e0b; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); border-radius:6px; padding:2px 10px; display:none;">
          <i class="fas fa-satellite-dish" style="margin-right:4px;"></i>샘플
        </span>
      </div>
      <p style="color:#6b7280; font-size:13px; margin-top:3px;">
        ${isKospi ? '코스피' : '코스닥'} 상장 종목 실시간 시세 &amp; 시그널 분석
        <span id="mkt-stock-count" style="color:${marketColor}; font-weight:700; margin-left:6px;">로딩 중...</span>
      </p>
    </div>

    <!-- 통계 카드 -->
    <div id="mkt-stat-cards" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; margin-bottom:18px;">
      ${['전체 종목','매수','매도','평균 강도'].map(l=>`
        <div class="stat-card" style="text-align:center; opacity:0.4;">
          <div style="font-size:clamp(20px,5vw,30px); font-weight:900; color:#6b7280; margin-bottom:4px;">-</div>
          <div style="font-size:11px; color:#6b7280;">${l}</div>
        </div>`).join('')}
    </div>

    <!-- 검색 + 필터 + 정렬 -->
    <div style="background:rgba(17,24,34,0.7); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:12px 14px; margin-bottom:14px; display:flex; flex-wrap:wrap; gap:10px; align-items:center;">
      <div style="position:relative; flex:1; min-width:160px;">
        <i class="fas fa-search" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;"></i>
        <input type="text" id="mkt-search" class="form-input"
          placeholder="종목명·코드·섹터 검색"
          style="padding:9px 12px 9px 32px; font-size:13px; width:100%; box-sizing:border-box;"
          oninput="applyMarketFilter()">
      </div>
      <select id="mkt-signal-filter" class="form-input" style="padding:9px 12px; font-size:13px; width:auto; flex-shrink:0;" onchange="applyMarketFilter()">
        <option value="ALL">전체 시그널</option>
        <option value="BUY">BUY만</option>
        <option value="HOLD">HOLD만</option>
        <option value="SELL">SELL만</option>
      </select>
      <select id="mkt-sort" class="form-input" style="padding:9px 12px; font-size:13px; width:auto; flex-shrink:0;" onchange="applyMarketFilter()">
        <option value="volume">거래량순</option>
        <option value="changeRate_desc">상승률순</option>
        <option value="changeRate_asc">하락률순</option>
        <option value="strength_desc">강도 높은순</option>
        <option value="price_desc">고가순</option>
      </select>
      <button onclick="applyMarketFilter()" class="btn-primary" style="padding:9px 14px; font-size:13px; flex-shrink:0;">
        <i class="fas fa-filter" style="margin-right:5px;"></i>적용
      </button>
    </div>

    <div id="market-content">
      <div style="display:flex; flex-direction:column; align-items:center; padding:60px; gap:16px;">
        <div class="spinner"></div>
        <p style="color:#6b7280; font-size:13px;">네이버 증권에서 종목 데이터를 가져오는 중...</p>
      </div>
    </div>
  `

  try {
    const res = await api.get(`/stocks/${market.toLowerCase()}?limit=2000`)
    const stocks = res.success ? res.stocks : []
    const source  = res.source || 'fallback'
    marketAllStocks = stocks

    // 통계 카드 업데이트
    const buyCount  = stocks.filter(s=>s.signal==='BUY').length
    const sellCount = stocks.filter(s=>s.signal==='SELL').length
    const avgStr    = stocks.length ? Math.round(stocks.reduce((a,s)=>a+(s.strength||50),0)/stocks.length) : 0
    document.getElementById('mkt-stat-cards').innerHTML = [
      { label:'전체 종목',   value: stocks.length,               color: marketColor },
      { label:'매수 시그널', value: buyCount,                    color: '#22c55e' },
      { label:'매도 시그널', value: sellCount,                   color: '#ef4444' },
      { label:'평균 강도',   value: avgStr + '%',                color: '#f59e0b' },
    ].map(stat => `
      <div class="stat-card" style="text-align:center;">
        <div style="font-size:clamp(20px,5vw,30px); font-weight:900; color:${stat.color}; margin-bottom:4px;">${stat.value}</div>
        <div style="font-size:11px; color:#6b7280;">${stat.label}</div>
      </div>`).join('')

    // 데이터 소스 뱃지
    const srcBadge = document.getElementById('mkt-source-badge')
    if (srcBadge) {
      if (source === 'naver') {
        srcBadge.innerHTML = '<i class="fas fa-check-circle" style="margin-right:4px;"></i>네이버 실시간'
        srcBadge.style.color = '#22c55e'
        srcBadge.style.background = 'rgba(34,197,94,0.1)'
        srcBadge.style.borderColor = 'rgba(34,197,94,0.25)'
      } else if (source === 'naver_partial') {
        srcBadge.innerHTML = '<i class="fas fa-chart-line" style="margin-right:4px;"></i>네이버(일부)'
        srcBadge.style.color = '#16a34a'
        srcBadge.style.background = 'rgba(22,163,74,0.1)'
        srcBadge.style.borderColor = 'rgba(22,163,74,0.25)'
      } else if (source === 'kiwoom') {
        srcBadge.innerHTML = '<i class="fas fa-check-circle" style="margin-right:4px;"></i>키움 실시간'
        srcBadge.style.color = '#22c55e'
        srcBadge.style.background = 'rgba(34,197,94,0.1)'
        srcBadge.style.borderColor = 'rgba(34,197,94,0.25)'
      } else if (source === 'naver_cache') {
        srcBadge.innerHTML = '<i class="fas fa-bolt" style="margin-right:4px;"></i>네이버 캐시'
        srcBadge.style.color = '#0ea5e9'
        srcBadge.style.background = 'rgba(14,165,233,0.1)'
        srcBadge.style.borderColor = 'rgba(14,165,233,0.25)'
      } else {
        srcBadge.innerHTML = '<i class="fas fa-database" style="margin-right:4px;"></i>샘플 데이터'
        srcBadge.style.color = '#6b7280'
        srcBadge.style.background = 'rgba(107,114,128,0.1)'
        srcBadge.style.borderColor = 'rgba(107,114,128,0.25)'
      }
      srcBadge.style.display = 'inline-flex'
      srcBadge.style.alignItems = 'center'
    }
    const cntEl = document.getElementById('mkt-stock-count')
    if (cntEl) cntEl.textContent = `총 ${stocks.length.toLocaleString()}종목`

    // 초기 필터 적용
    applyMarketFilter()

  } catch (err) {
    document.getElementById('market-content').innerHTML =
      '<div style="color:#ef4444; padding:20px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>데이터 로드 실패. 잠시 후 다시 시도해주세요.</div>'
  }
}

function applyMarketFilter() {
  const search  = (document.getElementById('mkt-search')?.value || '').toLowerCase()
  const sigFilt = document.getElementById('mkt-signal-filter')?.value || 'ALL'
  const sortBy  = document.getElementById('mkt-sort')?.value || 'volume'

  let filtered = marketAllStocks.filter(s => {
    const matchSearch = !search ||
      (s.name||'').toLowerCase().includes(search) ||
      (s.code||'').includes(search) ||
      (s.sector||'').toLowerCase().includes(search)
    const matchSig = sigFilt === 'ALL' || s.signal === sigFilt
    return matchSearch && matchSig
  })

  // 정렬
  filtered.sort((a,b) => {
    if (sortBy === 'changeRate_desc') return (b.changeRate||0) - (a.changeRate||0)
    if (sortBy === 'changeRate_asc')  return (a.changeRate||0) - (b.changeRate||0)
    if (sortBy === 'strength_desc')   return (b.strength||0)   - (a.strength||0)
    if (sortBy === 'price_desc')      return (b.price||0)       - (a.price||0)
    return (b.volume||0) - (a.volume||0)  // 기본: 거래량
  })

  marketFilteredStocks = filtered
  marketCurrentPage = 1
  renderMarketTable()
}

function renderMarketTable() {
  const container = document.getElementById('market-content')
  if (!container) return
  const total  = marketFilteredStocks.length
  const start  = (marketCurrentPage - 1) * MARKET_PAGE_SIZE
  const end    = Math.min(start + MARKET_PAGE_SIZE, total)
  const page   = marketFilteredStocks.slice(start, end)
  const totalPages = Math.ceil(total / MARKET_PAGE_SIZE)

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
      <span style="font-size:13px; color:#9ca3af;">
        <b style="color:white;">${total.toLocaleString()}</b>종목 중
        <b style="color:white;">${start+1}–${end}</b> 표시
      </span>
      <div style="display:flex; gap:6px; align-items:center;">
        <button onclick="changeMarketPage(${marketCurrentPage-1})"
          style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:#9ca3af; padding:6px 12px; border-radius:7px; cursor:pointer; font-size:12px; ${marketCurrentPage<=1?'opacity:0.4;cursor:default;':''}">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span style="font-size:12px; color:#9ca3af;">${marketCurrentPage} / ${totalPages}</span>
        <button onclick="changeMarketPage(${marketCurrentPage+1})"
          style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:#9ca3af; padding:6px 12px; border-radius:7px; cursor:pointer; font-size:12px; ${marketCurrentPage>=totalPages?'opacity:0.4;cursor:default;':''}">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <div style="background:rgba(22,27,34,0.8); border:1px solid rgba(249,115,22,0.08); border-radius:16px; overflow:hidden;">
      <div class="table-wrap">
        <table class="data-table" style="min-width:560px;">
          <thead>
            <tr>
              <th style="width:32px;">#</th>
              <th>종목명</th>
              <th>현재가</th>
              <th>등락률</th>
              <th>거래량</th>
              <th>섹터</th>
              <th>시그널</th>
              <th>강도</th>
            </tr>
          </thead>
          <tbody>
            ${page.map((s, idx) => {
              const rank = start + idx + 1
              const chgColor = (s.changeRate||0) >= 0 ? '#ef4444' : '#3b82f6'
              return `
              <tr onclick="showStockDetail('${s.code}', '${s.name}')" style="cursor:pointer;">
                <td style="color:#4b5563; font-size:12px; font-weight:600;">${rank}</td>
                <td>
                  <div style="font-weight:700; color:white; font-size:13px;">${s.name}</div>
                  <div style="font-size:10px; color:#4b5563; letter-spacing:0.03em;">${s.code}</div>
                </td>
                <td style="font-weight:700; color:white; white-space:nowrap; font-size:13px;">${s.price > 0 ? s.price.toLocaleString() + '<span style="font-size:10px; color:#6b7280; margin-left:2px;">원</span>' : '<span style="color:#4b5563; font-size:12px;">-</span>'}</td>
                <td style="color:${chgColor}; font-weight:700; white-space:nowrap; font-size:13px;">
                  ${s.changeRate !== 0 ? ((s.changeRate||0) >= 0 ? '▲' : '▼') + ' ' + Math.abs(s.changeRate||0).toFixed(2) + '%' : '<span style="color:#6b7280">-</span>'}
                </td>
                <td style="font-size:12px; color:#9ca3af; white-space:nowrap;">${s.volume > 0 ? (s.volume||0).toLocaleString() : '-'}</td>
                <td style="font-size:11px; color:#6b7280; max-width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${s.sector||'-'}">${s.sector||'-'}</td>
                <td><span class="signal-${(s.signal||'HOLD').toLowerCase()}">${s.signal||'HOLD'}</span></td>
                <td>
                  <div style="display:flex; align-items:center; gap:5px;">
                    <div class="strength-bar" style="width:50px;">
                      <div class="strength-fill" style="width:${s.strength||50}%; background:${s.signal==='BUY'?'#22c55e':s.signal==='SELL'?'#ef4444':'#f59e0b'};"></div>
                    </div>
                    <span style="font-size:11px; color:#9ca3af; min-width:28px;">${s.strength||50}%</span>
                  </div>
                </td>
              </tr>`
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div style="display:flex; justify-content:center; gap:6px; margin-top:14px; flex-wrap:wrap;">
      ${Array.from({length: Math.min(totalPages,10)}, (_,i) => i+1).map(p => `
        <button onclick="changeMarketPage(${p})"
          style="padding:6px 12px; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer;
            background:${p===marketCurrentPage?'linear-gradient(135deg,#e83a00,#f97316)':'rgba(255,255,255,0.05)'};
            border:1px solid ${p===marketCurrentPage?'transparent':'rgba(255,255,255,0.08)'};
            color:${p===marketCurrentPage?'white':'#9ca3af'};">
          ${p}
        </button>`).join('')}
      ${totalPages > 10 ? `<span style="color:#4b5563; font-size:12px; padding:6px 8px;">... ${totalPages}페이지</span>` : ''}
    </div>
  `
}

function changeMarketPage(page) {
  const totalPages = Math.ceil(marketFilteredStocks.length / MARKET_PAGE_SIZE)
  if (page < 1 || page > totalPages) return
  marketCurrentPage = page
  renderMarketTable()
  document.getElementById('page-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ============================================================
// NEWS & RECOMMEND PAGE  (실시간 자동 갱신)
// ============================================================

let newsRefreshTimer = null
let newsCountdown   = 30

async function renderNews() {
  const content = document.getElementById('page-content')
  if (!content) return

  if (newsRefreshTimer) { clearInterval(newsRefreshTimer); newsRefreshTimer = null }
  if (newsTimeUpdateTimer) { clearInterval(newsTimeUpdateTimer); newsTimeUpdateTimer = null }

  content.innerHTML = `
    <!-- 헤더 -->
    <div style="margin-bottom:16px;">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div>
          <h1 style="font-size:clamp(18px,5vw,24px); font-weight:800; color:white; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-newspaper" style="color:var(--brand-orange);"></i>
            실시간 뉴스 &amp; 종목 추천
          </h1>

        </div>
        <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
          <!-- 자동갱신 표시 -->
          <div style="display:flex; align-items:center; gap:6px; background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); border-radius:16px; padding:6px 12px;">
            <div id="live-dot" style="width:6px; height:6px; background:#22c55e; border-radius:50%; box-shadow:0 0 5px #22c55e; animation: glow 2s ease-in-out infinite;"></div>
            <span style="font-size:11px; color:#22c55e; font-weight:700;">LIVE</span>
            <span style="font-size:10px; color:#4b5563;" id="refresh-countdown">30초</span>
          </div>
          <button onclick="manualRefreshNews()" style="background:rgba(249,115,22,0.1); border:1px solid rgba(249,115,22,0.2); color:var(--brand-orange); padding:8px 12px; border-radius:8px; cursor:pointer; font-size:13px; min-height:40px;">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      <!-- 검색 -->
      <div style="display:flex; gap:8px; margin-top:12px;">
        <input type="text" id="news-search"
          class="form-input"
          placeholder="종목·키워드 검색"
          style="flex:1; padding:10px 14px; font-size:14px;"
          onkeydown="if(event.key==='Enter') searchNews()">
        <button onclick="searchNews()" class="btn-primary" style="padding:10px 18px; font-size:14px; border-radius:8px; flex-shrink:0;">
          <i class="fas fa-search"></i>
        </button>
      </div>

      <!-- 마지막 갱신 -->
      <div style="display:flex; align-items:center; gap:6px; margin-top:8px;">
        <i class="fas fa-clock" style="color:#4b5563; font-size:11px;"></i>
        <span style="font-size:11px; color:#4b5563;" id="last-updated">갱신 중...</span>
      </div>
    </div>

    <!-- 카테고리 탭 (가로 스크롤) -->
    <div style="overflow-x:auto; -webkit-overflow-scrolling:touch; margin-bottom:14px; padding-bottom:4px;">
      <div style="display:flex; gap:7px; min-width:max-content;">
        <button class="tab-btn active" id="ntab-all"    onclick="switchNewsTab('all',    '주식 코스피 코스닥')">전체</button>
        <button class="tab-btn"        id="ntab-kospi"  onclick="switchNewsTab('kospi',  'KOSPI 코스피')">KOSPI</button>
        <button class="tab-btn"        id="ntab-kosdaq" onclick="switchNewsTab('kosdaq', 'KOSDAQ 코스닥')">KOSDAQ</button>
        <button class="tab-btn"        id="ntab-bio"    onclick="switchNewsTab('bio',    '바이오 제약 임상')">바이오</button>
        <button class="tab-btn"        id="ntab-semi"   onclick="switchNewsTab('semi',   '반도체 AI 시스템반도체')">반도체·AI</button>
        <button class="tab-btn"        id="ntab-bat"    onclick="switchNewsTab('bat',    '2차전지 배터리 전기차')">2차전지</button>
        <button class="tab-btn"        id="ntab-robot"  onclick="switchNewsTab('robot',  '로봇 AI로봇')">로봇</button>
      </div>
    </div>

    <!-- 메인 레이아웃: 모바일=1단, 데스크탑=뉴스+사이드패널 -->
    <div id="news-layout" style="display:flex; flex-direction:column; gap:16px;">
      
      <!-- 뉴스 목록 -->
      <div id="news-list">
        <div style="display:flex; justify-content:center; padding:60px;"><div class="spinner"></div></div>
      </div>

      <!-- 추천 사이드패널 (모바일: 아래에 배치, 데스크탑: 오른쪽에 배치) -->
      <div id="rec-panel" style="display:flex; flex-direction:column; gap:14px;">
        
        <!-- TOP 5 매수 추천 -->
        <div style="background:rgba(22,27,34,0.9); border:1px solid rgba(249,115,22,0.15); border-radius:16px; overflow:hidden;">
          <div style="padding:14px 16px; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:7px;">
              <div style="width:7px; height:7px; background:var(--brand-orange); border-radius:50%; box-shadow:0 0 6px var(--brand-orange);"></div>
              <span style="font-size:13px; font-weight:700; color:white;">TODAY 매수 추천 TOP 5</span>
            </div>
            <span style="font-size:11px; color:#4b5563;">강도순</span>
          </div>
          <div id="rec-buy-list">
            <div style="display:flex; justify-content:center; padding:24px;"><div class="spinner" style="width:24px; height:24px; border-width:2px;"></div></div>
          </div>
        </div>

        <!-- 섹터 강도 -->
        <div style="background:rgba(22,27,34,0.9); border:1px solid rgba(249,115,22,0.1); border-radius:16px; overflow:hidden;">
          <div style="padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="font-size:13px; font-weight:700; color:white;"><i class="fas fa-fire" style="color:var(--brand-orange); margin-right:5px;"></i>섹터 강도</span>
          </div>
          <div id="sector-list" style="padding:12px 14px;">
            <div style="display:flex; justify-content:center; padding:16px;"><div class="spinner" style="width:20px; height:20px; border-width:2px;"></div></div>
          </div>
        </div>

        <!-- 주의 종목 -->
        <div style="background:rgba(22,27,34,0.9); border:1px solid rgba(239,68,68,0.12); border-radius:16px; overflow:hidden;">
          <div style="padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; align-items:center; gap:7px;">
            <div style="width:7px; height:7px; background:#ef4444; border-radius:50%; box-shadow:0 0 6px #ef4444;"></div>
            <span style="font-size:13px; font-weight:700; color:white;">주의 종목</span>
          </div>
          <div id="rec-sell-list">
            <div style="display:flex; justify-content:center; padding:16px;"><div class="spinner" style="width:20px; height:20px; border-width:2px;"></div></div>
          </div>
        </div>
      </div>
    </div>
  `

  // 데스크탑에서 2단 레이아웃 적용
  applyNewsLayout()
  window.addEventListener('resize', applyNewsLayout)

  // 초기 카테고리 상태 초기화
  window._currentNewsCategory = 'all'
  window._currentNewsQuery = ''
  window._currentIsSearch = false

  await Promise.all([
    loadNewsList('', false, 'all', false),
    loadRecommendPanel()
  ])

  newsCountdown = 30
  // 기존 타이머가 남아있으면 반드시 정리 후 재시작
  if (newsRefreshTimer) { clearInterval(newsRefreshTimer); newsRefreshTimer = null }

  newsRefreshTimer = setInterval(async () => {
    // 뉴스 페이지에서 이탈했으면 타이머 자동 종료
    if (currentPage !== 'news') {
      clearInterval(newsRefreshTimer)
      newsRefreshTimer = null
      return
    }

    newsCountdown--
    const el = document.getElementById('refresh-countdown')
    if (el) el.textContent = `${newsCountdown}초`

    if (newsCountdown <= 0) {
      newsCountdown = 30
      const query    = window._currentNewsQuery    || ''
      const category = window._currentNewsCategory || 'all'
      const isSearch = window._currentIsSearch     || false
      try {
        await Promise.all([
          loadNewsList(query, true, category, isSearch),
          loadRecommendPanel(true)
        ])
        const lu = document.getElementById('last-updated')
        if (lu) lu.textContent = `마지막 갱신: ${new Date().toLocaleTimeString('ko-KR')}`
      } catch(e) {
        console.warn('[News] 자동갱신 오류, 10초 후 재시도:', e)
        newsCountdown = 10  // 오류 시 10초 후 재시도
      }
    }
  }, 1000)
}

function applyNewsLayout() {
  const layout = document.getElementById('news-layout')
  const recPanel = document.getElementById('rec-panel')
  if (!layout || !recPanel) return
  if (window.innerWidth > 768) {
    layout.style.flexDirection = 'row'
    layout.style.alignItems = 'flex-start'
    recPanel.style.width = '320px'
    recPanel.style.flexShrink = '0'
    recPanel.style.position = 'sticky'
    recPanel.style.top = '20px'
  } else {
    layout.style.flexDirection = 'column'
    recPanel.style.width = ''
    recPanel.style.flexShrink = ''
    recPanel.style.position = ''
    recPanel.style.top = ''
  }
}

window._currentNewsQuery = ''
window._currentNewsTab   = 'all'
window._currentIsSearch  = false

// 탭별 API 쿼리 및 카테고리 매핑
const NEWS_TAB_CONFIG = {
  all:    { query: '주식 코스피 코스닥 증시',        category: 'all'   },
  kospi:  { query: 'KOSPI 코스피 주식',             category: 'kospi' },
  kosdaq: { query: 'KOSDAQ 코스닥 주식',            category: 'kosdaq'},
  bio:    { query: '바이오 제약 신약 임상 의료',     category: 'bio'   },
  semi:   { query: '반도체 AI HBM 파운드리',        category: 'semi'  },
  bat:    { query: '2차전지 배터리 전기차 이차전지', category: 'bat'   },
  robot:  { query: '로봇 AI로봇 협동로봇 자동화',   category: 'robot' },
}

async function switchNewsTab(tab, query) {
  ;['all','kospi','kosdaq','bio','semi','bat','robot'].forEach(t => {
    const el = document.getElementById(`ntab-${t}`)
    if (el) el.classList.toggle('active', t === tab)
  })
  window._currentNewsTab   = tab
  const config = NEWS_TAB_CONFIG[tab] || NEWS_TAB_CONFIG.all
  window._currentNewsQuery = ''
  window._currentNewsCategory = config.category
  window._currentIsSearch = false
  await loadNewsList('', false, config.category, false)
}

async function searchNews() {
  const q = (document.getElementById('news-search')?.value || '').trim()
  if (!q) return
  window._currentNewsQuery = q
  window._currentNewsCategory = 'all'
  window._currentIsSearch = true
  ;['all','kospi','kosdaq','bio','semi','bat','robot'].forEach(t => {
    const el = document.getElementById(`ntab-${t}`)
    if (el) el.classList.remove('active')
  })
  await loadNewsList(q, false, 'all', true)
}

async function manualRefreshNews() {
  newsCountdown = 30
  const el = document.getElementById('refresh-countdown')
  if (el) el.textContent = '30초'
  const query = window._currentNewsQuery || ''
  const category = window._currentNewsCategory || 'all'
  const isSearch = window._currentIsSearch || false
  await Promise.all([
    loadNewsList(query, false, category, isSearch),
    loadRecommendPanel()
  ])
}

async function loadNewsList(query = '', silent = false, category = 'all', isSearch = false) {
  const list = document.getElementById('news-list')
  if (!list) return

  if (!silent) {
    list.innerHTML = '<div style="display:flex; justify-content:center; padding:60px;"><div class="spinner"></div></div>'
  }

  try {
    // 검색 시에만 query+isSearch=1 전송, 탭 전환/자동갱신은 category만 전송
    const searchParam = isSearch && query ? `&query=${encodeURIComponent(query)}&isSearch=1` : ''
    const res = await api.get(`/news?category=${encodeURIComponent(category)}&display=25${searchParam}`)
    const news   = res.success ? res.news : []
    const isMock = res.isMock

    // 관련 종목 코드 추출 후 시그널 정보 가져오기
    const allCodes = [...new Set(news.flatMap(n => (n.relatedStocks || []).map(s => s.code)))]
    let stockSigMap = {}
    if (allCodes.length > 0) {
      try {
        const sigRes = await api.get(`/recommend/news-stocks?codes=${allCodes.join(',')}`)
        if (sigRes.success) {
          for (const s of sigRes.stocks) stockSigMap[s.code] = s
        }
      } catch(_) {}
    }

    // 현재 탭 레이블
    const tabLabels = { all:'전체', kospi:'KOSPI', kosdaq:'KOSDAQ', bio:'바이오', semi:'반도체·AI', bat:'2차전지', robot:'로봇' }
    const tabLabel = tabLabels[category] || '전체'

    list.innerHTML = `
      <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
        <span style="font-size:11px; color:#4b5563;">${news.length}건</span>
      </div>

      <div style="display:flex; flex-direction:column; gap:10px;">
        ${news.map((n, idx) => {
          const stocks = n.relatedStocks || []
          const enrichedStocks = stocks.map(s => stockSigMap[s.code] ? { ...s, ...stockSigMap[s.code] } : s)
          const newsLink = (n.link || '').replace(/'/g, '%27')
          const timeAgo = formatDate(n.pubDate)

          // 뉴스 카테고리 배지 (최대 2개)
          const cats = n.categories || []
          const catBadgeMap = { kospi:'KOSPI', kosdaq:'KOSDAQ', bio:'바이오', semi:'반도체', bat:'2차전지', robot:'로봇' }
          const catColors   = { kospi:'#60a5fa', kosdaq:'#c084fc', bio:'#34d399', semi:'#fb923c', bat:'#facc15', robot:'#38bdf8' }
          const catBadges   = cats.slice(0,2).map(c => catBadgeMap[c] ? `<span style="font-size:9px; font-weight:700; color:${catColors[c]||'#9ca3af'}; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:1px 5px;">${catBadgeMap[c]}</span>` : '').join('')

          return `
          <div class="news-card" style="animation:fadeInUp 0.3s ease both; animation-delay:${Math.min(idx * 0.03, 0.5)}s;"
            onclick="openNewsLink('${newsLink}')">

            <!-- 카테고리 배지 + 시각 -->
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:7px; gap:6px;">
              <div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap; flex:1; min-width:0;">
                ${idx < 3 ? `<span style="font-size:9px; font-weight:700; color:#ef4444; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:4px; padding:1px 5px;">NEW</span>` : ''}
                ${catBadges}
              </div>
              <!-- 몇 분 전 표시 (data-pubdate 속성으로 실시간 갱신) -->
              <span data-pubdate="${n.pubDate}" style="font-size:11px; color:#6b7280; white-space:nowrap; flex-shrink:0; display:flex; align-items:center; gap:3px;">
                <i class="fas fa-clock" style="font-size:9px; color:#4b5563;"></i>
                ${timeAgo}
              </span>
            </div>

            <!-- 제목 -->
            <h3 style="font-size:14px; font-weight:700; color:white; line-height:1.5; margin-bottom:8px;">${n.title}</h3>

            <!-- 본문 요약 -->
            ${n.description && n.description !== n.title ? `
            <p style="font-size:12px; color:#6b7280; line-height:1.6; margin-bottom:10px;
              display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
              ${n.description}
            </p>` : ''}

            <!-- 관련 종목 + 시그널 자동 추천 -->
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px; margin-top:4px;">
              <div style="display:flex; flex-wrap:wrap; gap:5px; flex:1; min-width:0;">
                ${enrichedStocks.length > 0 ? enrichedStocks.map(s => {
                  const sig    = s.signal || 'HOLD'
                  const str    = s.strength || 0
                  const sigCol = sig === 'BUY' ? '#22c55e' : sig === 'SELL' ? '#ef4444' : '#f59e0b'
                  const sigBg  = sig === 'BUY' ? 'rgba(34,197,94,0.08)' : sig === 'SELL' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)'
                  const sigBd  = sig === 'BUY' ? 'rgba(34,197,94,0.25)' : sig === 'SELL' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'
                  const mktCol = s.market === 'KOSPI' ? '#60a5fa' : '#c084fc'
                  const chgStr = s.changeRate !== undefined ? `${s.changeRate >= 0 ? '▲' : '▼'}${Math.abs(s.changeRate).toFixed(1)}%` : ''
                  const chgCol = s.changeRate !== undefined ? (s.changeRate >= 0 ? '#ef4444' : '#3b82f6') : '#9ca3af'
                  return `
                    <div onclick="event.stopPropagation(); showStockDetail('${s.code}','${s.name}')"
                      style="display:flex; align-items:center; gap:5px; background:${sigBg}; border:1px solid ${sigBd};
                        border-radius:18px; padding:5px 10px; cursor:pointer; min-height:32px; transition:all 0.15s;">
                      <div style="display:flex; flex-direction:column; line-height:1.2;">
                        <span style="font-size:12px; font-weight:700; color:white;">${s.name}</span>
                        <div style="display:flex; gap:4px; align-items:center;">
                          <span style="font-size:9px; color:${mktCol};">${s.market||''}</span>
                          ${chgStr ? `<span style="font-size:9px; color:${chgCol}; font-weight:600;">${chgStr}</span>` : ''}
                        </div>
                      </div>
                      <div style="display:flex; flex-direction:column; align-items:center; gap:1px; border-left:1px solid rgba(255,255,255,0.08); padding-left:6px;">
                        <span style="font-size:10px; font-weight:800; color:${sigCol};">${sig}</span>
                        ${str > 0 ? `<span style="font-size:9px; color:#6b7280;">${str}%</span>` : ''}
                      </div>
                    </div>
                  `
                }).join('') : `
                  <span style="font-size:11px; color:#374151; display:flex; align-items:center; gap:4px;">
                    <i class="fas fa-search" style="font-size:10px;"></i>관련 종목 없음
                  </span>`}
              </div>
              <span style="font-size:11px; color:var(--brand-orange); white-space:nowrap; flex-shrink:0;">
                <i class="fas fa-external-link-alt" style="margin-right:2px;"></i>원문
              </span>
            </div>
          </div>
          `
        }).join('')}
      </div>

      ${news.length === 0 ? `
        <div style="text-align:center; color:#4b5563; padding:60px;">
          <i class="fas fa-newspaper" style="font-size:36px; display:block; margin-bottom:14px; color:#374151;"></i>
          <div style="font-size:15px; font-weight:600; color:#6b7280; margin-bottom:6px;">${tabLabel} 관련 뉴스가 없습니다</div>
          <div style="font-size:12px; color:#374151;">다른 탭을 선택하거나 검색어를 입력해보세요</div>
        </div>
      ` : ''}
    `

    const lu = document.getElementById('last-updated')
    if (lu) lu.textContent = `마지막 갱신: ${new Date().toLocaleTimeString('ko-KR')}`

    // 시간 실시간 업데이트 시작
    startNewsTimeUpdater()

  } catch (err) {
    console.error('[News] loadNewsList 오류:', err)
    if (!silent) {
      list.innerHTML = `
        <div style="text-align:center; padding:40px;">
          <i class="fas fa-exclamation-triangle" style="font-size:32px; color:#ef4444; display:block; margin-bottom:12px;"></i>
          <div style="color:#ef4444; font-size:14px; margin-bottom:8px;">뉴스 로드에 실패했습니다</div>
          <div style="color:#6b7280; font-size:12px; margin-bottom:16px;">네트워크 상태를 확인하거나 잠시 후 다시 시도하세요</div>
          <button onclick="manualRefreshNews()" style="background:rgba(249,115,22,0.1); border:1px solid rgba(249,115,22,0.3); color:var(--brand-orange); padding:8px 20px; border-radius:8px; cursor:pointer; font-size:13px;">
            <i class="fas fa-redo" style="margin-right:6px;"></i>다시 시도
          </button>
        </div>`
    }
    // 오류 발생 시 카운트다운을 15초로 단축해 빠르게 재시도
    newsCountdown = 15
  }
}

async function loadRecommendPanel(silent = false) {
  await Promise.all([
    loadRecBuy(silent),
    loadSectorPanel(silent),
    loadRecSell(silent),
  ])
}

async function loadRecBuy(silent = false) {
  const el = document.getElementById('rec-buy-list')
  if (!el) return
  if (!silent) el.innerHTML = '<div style="display:flex; justify-content:center; padding:24px;"><div class="spinner" style="width:24px; height:24px; border-width:2px;"></div></div>'

  try {
    const res = await api.get('/recommend/top?type=BUY&limit=5')
    const stocks = res.success ? res.stocks : []

    el.innerHTML = `
      <div style="padding:6px 4px;">
        ${stocks.map((s, i) => `
          <div onclick="showStockDetail('${s.code}','${s.name}')"
            style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; cursor:pointer; transition:background 0.2s; margin-bottom:1px; min-height:52px;"
            onmouseover="this.style.background='rgba(249,115,22,0.06)'" onmouseout="this.style.background='transparent'">
            <div style="width:22px; height:22px; border-radius:50%; background:${i===0?'var(--brand-gradient)':i===1?'rgba(249,115,22,0.3)':i===2?'rgba(249,115,22,0.15)':'rgba(255,255,255,0.05)'}; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; color:${i<3?'white':'#4b5563'}; flex-shrink:0;">${i+1}</div>
            <div style="flex:1; min-width:0;">
              <div style="display:flex; align-items:center; gap:5px; margin-bottom:2px;">
                <span style="font-size:13px; font-weight:700; color:white; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${s.name}</span>
                <span style="font-size:9px; font-weight:700; color:${s.market==='KOSPI'?'#60a5fa':'#c084fc'}; border:1px solid ${s.market==='KOSPI'?'rgba(96,165,250,0.3)':'rgba(192,132,252,0.3)'}; border-radius:3px; padding:1px 4px; flex-shrink:0;">${s.market}</span>
              </div>
              <div style="display:flex; align-items:center; gap:5px;">
                <span style="font-size:11px; color:#9ca3af;">${(s.price||0).toLocaleString()}원</span>
                <span style="font-size:11px; color:${(s.changeRate||0)>=0?'#ef4444':'#3b82f6'}; font-weight:600;">${(s.changeRate||0)>=0?'▲':'▼'}${Math.abs(s.changeRate||0).toFixed(1)}%</span>
              </div>
            </div>
            <div style="text-align:right; flex-shrink:0;">
              <div style="font-size:13px; font-weight:800; color:#22c55e;">${s.strength||50}%</div>
              <div style="width:44px; height:4px; background:#1f2937; border-radius:2px; margin-top:3px;">
                <div style="width:${s.strength||50}%; height:100%; border-radius:2px; background:linear-gradient(90deg,#16a34a,#22c55e);"></div>
              </div>
            </div>
          </div>
        `).join('')}
        ${stocks.length === 0 ? '<div style="text-align:center; color:#4b5563; padding:16px; font-size:13px;">추천 종목 없음</div>' : ''}
      </div>
    `
  } catch(_) {}
}

async function loadSectorPanel(silent = false) {
  const el = document.getElementById('sector-list')
  if (!el) return
  if (!silent) el.innerHTML = '<div style="display:flex; justify-content:center; padding:16px;"><div class="spinner" style="width:20px; height:20px; border-width:2px;"></div></div>'

  try {
    const res = await api.get('/recommend/sectors')
    const sectors = res.success ? res.sectors : []

    el.innerHTML = sectors.slice(0, 6).map(sec => {
      const pct  = sec.avgStrength
      const col  = pct >= 65 ? '#22c55e' : pct <= 40 ? '#ef4444' : '#f59e0b'
      return `
        <div style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <div style="display:flex; align-items:center; gap:5px;">
              <span style="font-size:12px; font-weight:600; color:#d1d5db;">${sec.sector}</span>
              <span style="font-size:10px; color:#4b5563;">${sec.topStock?.name||''}</span>
            </div>
            <span style="font-size:12px; font-weight:700; color:${col};">${pct}%</span>
          </div>
          <div style="height:5px; background:#1f2937; border-radius:3px; overflow:hidden;">
            <div style="width:${pct}%; height:100%; background:${col}; border-radius:3px; transition:width 0.5s ease;"></div>
          </div>
        </div>
      `
    }).join('')
  } catch(_) {}
}

async function loadRecSell(silent = false) {
  const el = document.getElementById('rec-sell-list')
  if (!el) return
  if (!silent) el.innerHTML = '<div style="display:flex; justify-content:center; padding:16px;"><div class="spinner" style="width:20px; height:20px; border-width:2px;"></div></div>'

  try {
    const res = await api.get('/recommend/top?type=SELL&limit=4')
    const stocks = res.success ? res.stocks : []

    el.innerHTML = `
      <div style="padding:6px 4px 10px;">
        ${stocks.map(s => `
          <div onclick="showStockDetail('${s.code}','${s.name}')"
            style="display:flex; align-items:center; justify-content:space-between; padding:9px 12px; border-radius:8px; cursor:pointer; transition:background 0.2s; min-height:48px;"
            onmouseover="this.style.background='rgba(239,68,68,0.06)'" onmouseout="this.style.background='transparent'">
            <div>
              <div style="font-size:13px; font-weight:600; color:white;">${s.name}
                <span style="font-size:9px; color:${s.market==='KOSPI'?'#60a5fa':'#c084fc'}; margin-left:4px;">${s.market}</span>
              </div>
              <div style="font-size:11px; color:#3b82f6; margin-top:1px;">▼ ${Math.abs(s.changeRate||0).toFixed(1)}%</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:12px; font-weight:700; color:#ef4444;">SELL</div>
              <div style="font-size:11px; color:#6b7280;">${s.strength||50}%</div>
            </div>
          </div>
        `).join('')}
        ${stocks.length === 0 ? '<div style="text-align:center; color:#4b5563; padding:14px; font-size:12px;">주의 종목 없음</div>' : ''}
      </div>
    `
  } catch(_) {}
}

function openNewsLink(url) {
  if (!url || url === 'undefined') return
  window.open(url, '_blank')
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d   = new Date(dateStr)
    const now = new Date()
    const diff = now - d
    if (isNaN(diff)) return ''
    if (diff < 0)         return '방금 전'
    if (diff < 60000)     return '방금 전'
    if (diff < 3600000)   return Math.floor(diff / 60000) + '분 전'
    if (diff < 86400000)  return Math.floor(diff / 3600000) + '시간 전'
    if (diff < 604800000) return Math.floor(diff / 86400000) + '일 전'
    return d.toLocaleDateString('ko-KR', { month:'numeric', day:'numeric' })
  } catch { return '' }
}

// 뉴스 카드의 시간 표시를 실시간으로 업데이트하는 함수
let newsTimeUpdateTimer = null
function startNewsTimeUpdater() {
  if (newsTimeUpdateTimer) clearInterval(newsTimeUpdateTimer)
  newsTimeUpdateTimer = setInterval(() => {
    const timeEls = document.querySelectorAll('[data-pubdate]')
    timeEls.forEach(el => {
      const dateStr = el.getAttribute('data-pubdate')
      if (dateStr) el.textContent = formatDate(dateStr)
    })
  }, 30000) // 30초마다 업데이트
}


// ============================================================
// STOCK DETAIL MODAL (모바일 하단 시트)
// ============================================================
async function showStockDetail(code, name) {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.id = 'stock-modal'
  overlay.innerHTML = `
    <div class="modal-content" style="position:relative;">
      <button onclick="document.getElementById('stock-modal').remove()" style="position:absolute; top:12px; right:14px; background:rgba(255,255,255,0.06); border:none; color:#9ca3af; width:36px; height:36px; border-radius:9px; cursor:pointer; font-size:16px; z-index:1;">✕</button>
      
      <div style="display:flex; align-items:center; justify-content:center; padding:32px;">
        <div class="spinner"></div>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  try {
    const res = await api.get(`/stocks/${code}`)
    const stock = res.stock
    const chartData = res.chartData || []

    if (!stock) {
      overlay.querySelector('.modal-content').innerHTML = `
        <button onclick="document.getElementById('stock-modal').remove()" style="position:absolute; top:12px; right:14px; background:rgba(255,255,255,0.06); border:none; color:#9ca3af; width:36px; height:36px; border-radius:9px; cursor:pointer; font-size:16px;">✕</button>
        <p style="color:#ef4444; padding:20px;">종목 정보를 불러올 수 없습니다.</p>
      `
      return
    }

    overlay.querySelector('.modal-content').innerHTML = `
      <button onclick="document.getElementById('stock-modal').remove()" style="position:absolute; top:12px; right:14px; background:rgba(255,255,255,0.06); border:none; color:#9ca3af; width:36px; height:36px; border-radius:9px; cursor:pointer; font-size:16px; z-index:1;">✕</button>
      
      <!-- 종목 헤더 -->
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px; padding-right:40px;">
        <div style="width:44px; height:44px; background:var(--brand-gradient); border-radius:11px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px; flex-shrink:0;">
          ${stock.name[0]}
        </div>
        <div style="min-width:0; flex:1;">
          <h2 style="font-size:clamp(18px,5vw,22px); font-weight:800; color:white; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${stock.name}</h2>
          <div style="display:flex; gap:7px; align-items:center; margin-top:4px; flex-wrap:wrap;">
            <span class="${stock.market === 'KOSPI' ? 'badge-kospi' : 'badge-kosdaq'}">${stock.market}</span>
            <span style="font-size:12px; color:#4b5563;">${stock.code}</span>
          </div>
        </div>
        <span class="signal-${(stock.signal||'HOLD').toLowerCase()}" style="flex-shrink:0;">${stock.signal||'HOLD'}</span>
      </div>

      <!-- 가격 정보 (3칸 → 모바일 3칸 유지, 폰트 축소) -->
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:18px;">
        <div style="background:rgba(255,255,255,0.03); border-radius:11px; padding:12px; text-align:center;">
          <div style="font-size:10px; color:#6b7280; margin-bottom:5px;">현재가</div>
          <div style="font-size:clamp(16px,4vw,22px); font-weight:800; color:white;">${(stock.price||0).toLocaleString()}</div>
          <div style="font-size:11px; color:${(stock.changeRate||0)>=0?'#ef4444':'#3b82f6'}; margin-top:3px; font-weight:600;">${(stock.changeRate||0)>=0?'▲':'▼'} ${Math.abs(stock.changeRate||0).toFixed(2)}%</div>
        </div>
        <div style="background:rgba(34,197,94,0.08); border-radius:11px; padding:12px; text-align:center; border:1px solid rgba(34,197,94,0.1);">
          <div style="font-size:10px; color:#6b7280; margin-bottom:5px;">시그널 강도</div>
          <div style="font-size:clamp(16px,4vw,22px); font-weight:800; color:${stock.signal==='BUY'?'#22c55e':stock.signal==='SELL'?'#ef4444':'#f59e0b'};">${stock.strength||50}%</div>
        </div>
        <div style="background:rgba(255,255,255,0.03); border-radius:11px; padding:12px; text-align:center;">
          <div style="font-size:10px; color:#6b7280; margin-bottom:5px;">거래량</div>
          <div style="font-size:clamp(13px,3vw,17px); font-weight:700; color:white;">${(stock.volume||0).toLocaleString()}</div>
        </div>
      </div>

      <!-- Mini Chart -->
      <div style="margin-bottom:16px;">
        <h4 style="font-size:13px; font-weight:600; color:#9ca3af; margin-bottom:10px;">30일 주가 차트 (모의)</h4>
        <div class="chart-container" style="height:180px;">
          <canvas id="stock-chart"></canvas>
        </div>
      </div>

      <!-- Strength Bar -->
      <div style="background:rgba(255,255,255,0.03); border-radius:11px; padding:14px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:7px;">
          <span style="font-size:13px; color:#9ca3af; font-weight:600;">시그널 강도</span>
          <span style="font-size:13px; color:${stock.signal==='BUY'?'#22c55e':stock.signal==='SELL'?'#ef4444':'#f59e0b'}; font-weight:700;">${stock.strength||50}/100</span>
        </div>
        <div class="strength-bar" style="height:8px;">
          <div class="strength-fill" style="width:${stock.strength||50}%; background:${stock.signal==='BUY'?'linear-gradient(90deg,#16a34a,#22c55e)':stock.signal==='SELL'?'linear-gradient(90deg,#b91c1c,#ef4444)':'linear-gradient(90deg,#b45309,#f59e0b)'};"></div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:5px; font-size:10px; color:#374151;">
          <span>매도 강함</span>
          <span>중립</span>
          <span>매수 강함</span>
        </div>
      </div>
    `

    setTimeout(() => {
      const ctx = document.getElementById('stock-chart')
      if (ctx && chartData.length > 0) {
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: chartData.map(d => d.date.slice(5)),
            datasets: [{
              data: chartData.map(d => d.close),
              borderColor: stock.signal === 'BUY' ? '#22c55e' : stock.signal === 'SELL' ? '#ef4444' : '#f59e0b',
              backgroundColor: stock.signal === 'BUY' ? 'rgba(34,197,94,0.1)' : stock.signal === 'SELL' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 0,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { 
                grid: { color: 'rgba(255,255,255,0.03)' },
                ticks: { color: '#4b5563', font: { size: 9 }, maxTicksLimit: 6 }
              },
              y: { 
                grid: { color: 'rgba(255,255,255,0.03)' },
                ticks: { color: '#4b5563', font: { size: 9 }, callback: v => v.toLocaleString() }
              }
            }
          }
        })
      }
    }, 100)

  } catch (err) {
    console.error(err)
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove()
  })
}

// ============================================================
// ADMIN LAYOUT
// ============================================================
function renderAdminLayout(page, params) {
  const app = document.getElementById('app')
  app.innerHTML = `
    <!-- Navbar (fixed, z=1000) -->
    <nav style="
      position:fixed; top:0; left:0; right:0; height:56px; z-index:1000;
      background:rgba(8,13,20,0.97); backdrop-filter:blur(20px);
      border-bottom:1px solid rgba(249,115,22,0.15);
      display:flex; align-items:center; justify-content:space-between; padding:0 14px;
    ">
      <div style="display:flex; align-items:center; gap:8px;">
        <button onclick="toggleSidebar()" style="background:none; border:none; color:#9ca3af; cursor:pointer; font-size:20px; padding:8px; border-radius:8px; min-width:44px; min-height:44px; display:flex; align-items:center; justify-content:center;">
          <i class="fas fa-bars"></i>
        </button>
        <div onclick="navigate('admin-dashboard')" style="cursor:pointer; display:flex; align-items:center; gap:6px;">
          ${getLogoIcon(32)}
          <div style="line-height:1; margin-left:4px;">
            <div style="font-weight:800; font-size:15px; background:linear-gradient(135deg,#f97316,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">QUAD</div>
            <div style="font-size:8px; color:#4b5563; letter-spacing:0.1em;">ADMIN</div>
          </div>
          <span style="background:linear-gradient(135deg,#e83a00,#f59e0b); color:white; padding:2px 8px; border-radius:5px; font-size:10px; font-weight:700;">ADMIN</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="display:flex; align-items:center; gap:7px;">
          <div style="width:30px; height:30px; background:linear-gradient(135deg,#e83a00,#f59e0b); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px; color:white;">A</div>
          <div style="line-height:1.2;">
            <div style="font-size:12px; font-weight:600; color:white; max-width:70px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${currentUser?.name || '관리자'}</div>
            <div style="font-size:9px; color:#f97316; font-weight:600;">Admin</div>
          </div>
        </div>
        <button onclick="handleLogout()" title="로그아웃"
          style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); color:#ef4444; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:13px; min-height:40px;">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </nav>

    <!-- Sidebar overlay -->
    <div id="sidebar-overlay" class="sidebar-overlay" onclick="closeSidebar()"></div>

    <!-- Sidebar -->
    <aside id="sidebar" style="
      position:fixed; top:56px; left:0; bottom:0; width:240px; z-index:600;
      background:rgba(10,14,20,0.98); border-right:1px solid rgba(249,115,22,0.1);
      overflow-y:auto; padding:14px 0; transition:transform 0.3s ease;
    ">
      <div style="padding:0 16px 10px; margin-bottom:4px;">
        <p style="font-size:10px; font-weight:700; color:#374151; letter-spacing:0.12em; text-transform:uppercase;">관리자 메뉴</p>
      </div>
      ${[
        { id: 'admin-dashboard', icon: 'fas fa-tachometer-alt', label: '관리 대시보드' },
        { id: 'admin-pending',   icon: 'fas fa-user-clock',     label: '승인 대기' },
        { id: 'admin-users',     icon: 'fas fa-users',          label: '전체 회원' },
        { id: 'admin-signals',   icon: 'fas fa-signal',         label: '시그널 관리' },
      ].map(item => `
        <div class="sidebar-item ${page === item.id ? 'active' : ''}" onclick="navigate('${item.id}'); closeSidebar();">
          <i class="${item.icon}" style="width:16px; text-align:center; font-size:14px;"></i>
          <span style="font-size:14px;">${item.label}</span>
        </div>
      `).join('')}

      <div style="margin:14px 16px 0; padding-top:14px; border-top:1px solid rgba(255,255,255,0.04);">
        <p style="font-size:10px; font-weight:700; color:#374151; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:7px;">서비스</p>
      </div>
      <div class="sidebar-item ${page === 'admin-settings' ? 'active' : ''}" onclick="navigate('admin-settings'); closeSidebar();">
        <i class="fas fa-cog" style="width:16px; text-align:center; font-size:14px;"></i>
        <span style="font-size:14px;">관리자 설정</span>
      </div>
      <div class="sidebar-item" onclick="navigate('dashboard'); closeSidebar();">
        <i class="fas fa-chart-line" style="width:16px; text-align:center; font-size:14px;"></i>
        <span style="font-size:14px;">사용자 뷰</span>
      </div>
      <div class="sidebar-item" onclick="handleLogout()">
        <i class="fas fa-sign-out-alt" style="width:16px; text-align:center; font-size:14px; color:#ef4444;"></i>
        <span style="font-size:14px; color:#ef4444;">로그아웃</span>
      </div>
    </aside>

    <!-- Main Content -->
    <main id="main-content" style="
      margin-left:240px; margin-top:56px;
      padding:clamp(14px,3vw,24px);
      min-height:calc(100vh - 56px);
      box-sizing:border-box;
    ">
      <div id="page-content"></div>
    </main>

    <!-- Bottom Nav (어드민 모바일) -->
    <nav class="bottom-nav" id="bottom-nav">
      <div class="bottom-nav-items">
        ${[
          { id: 'admin-dashboard', icon: 'fa-tachometer-alt', label: '대시보드' },
          { id: 'admin-pending',   icon: 'fa-user-clock',     label: '승인대기' },
          { id: 'admin-users',     icon: 'fa-users',          label: '회원' },
          { id: 'admin-signals',   icon: 'fa-signal',         label: '시그널' },
        ].map(item => `
          <button class="bottom-nav-item ${page === item.id ? 'active' : ''}" onclick="navigate('${item.id}')">
            <i class="fas ${item.icon}"></i>
            <span>${item.label}</span>
          </button>
        `).join('')}
        <button class="bottom-nav-item" onclick="toggleSidebar()">
          <i class="fas fa-ellipsis-h"></i>
          <span>더보기</span>
        </button>
      </div>
    </nav>
  `

  setTimeout(initSidebarResponsive, 0)

  if (page === 'admin-dashboard') renderAdminDashboard()
  else if (page === 'admin-pending') renderAdminPending()
  else if (page === 'admin-users') renderAdminUsers()
  else if (page === 'admin-signals') renderAdminSignals()
  else if (page === 'admin-settings') renderAdminSettings()
  else renderAdminDashboard()
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
async function renderAdminDashboard() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div style="margin-bottom:20px;">
      <h1 style="font-size:clamp(20px,5vw,26px); font-weight:800; color:white;">관리자 대시보드</h1>
      <p style="color:#6b7280; font-size:13px; margin-top:3px;">회원 및 시그널 현황을 관리합니다</p>
    </div>
    <div id="admin-dash-content">
      <div style="display:flex; justify-content:center; padding:60px;"><div class="spinner"></div></div>
    </div>
  `

  try {
    const statsRes = await api.get('/admin/stats')
    const stats = statsRes.success ? statsRes.stats : {}
    const pendingRes = await api.get('/admin/users/pending')
    const pendingUsers = pendingRes.success ? pendingRes.users : []

    document.getElementById('admin-dash-content').innerHTML = `
      <!-- Stats -->
      <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; margin-bottom:18px;">
        ${[
          { label: '전체 회원', value: stats.totalUsers || 0, icon: 'fas fa-users', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
          { label: '승인 대기', value: stats.pendingUsers || 0, icon: 'fas fa-user-clock', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', urgent: (stats.pendingUsers||0) > 0 },
          { label: '승인된 회원', value: stats.approvedUsers || 0, icon: 'fas fa-user-check', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { label: '등록 시그널', value: stats.totalSignals || 0, icon: 'fas fa-signal', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
        ].map(stat => `
          <div class="stat-card" style="${stat.urgent ? 'border-color:rgba(245,158,11,0.4);' : ''}">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
              <span style="font-size:12px; color:#6b7280;">${stat.label}</span>
              <div style="width:36px; height:36px; background:${stat.bg}; border-radius:9px; display:flex; align-items:center; justify-content:center;">
                <i class="${stat.icon}" style="color:${stat.color}; font-size:14px;"></i>
              </div>
            </div>
            <div style="font-size:clamp(26px,6vw,36px); font-weight:900; color:${stat.color};">${stat.value}</div>
            ${stat.urgent ? '<div style="font-size:11px; color:#f59e0b; margin-top:3px; font-weight:600;"><i class="fas fa-exclamation-circle" style="margin-right:3px;"></i>승인 필요</div>' : ''}
          </div>
        `).join('')}
      </div>

      <!-- Pending Users -->
      ${pendingUsers.length > 0 ? `
        <div style="background:rgba(22,27,34,0.8); border:1px solid rgba(245,158,11,0.25); border-radius:16px; overflow:hidden; margin-bottom:18px;">
          <div style="padding:14px 18px; border-bottom:1px solid var(--brand-border); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; background:rgba(245,158,11,0.04);">
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:8px; height:8px; background:#f59e0b; border-radius:50%; box-shadow:0 0 6px #f59e0b; animation:glow 2s ease-in-out infinite;"></div>
              <h3 style="font-size:14px; font-weight:700; color:white;">승인 대기 (${pendingUsers.length}명)</h3>
              <span style="font-size:11px; color:#6b7280;">— 행을 클릭하면 상세 정보를 볼 수 있습니다</span>
            </div>
            <button onclick="navigate('admin-pending')" style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.25); color:#f59e0b; padding:6px 14px; border-radius:7px; font-size:12px; cursor:pointer; font-weight:600;">
              <i class="fas fa-list" style="margin-right:4px;"></i>전체 보기
            </button>
          </div>
          <div class="table-wrap">
            <table class="data-table" style="min-width:520px;">
              <thead>
                <tr>
                  <th>이름 / 아이디</th>
                  <th>이메일</th>
                  <th>전화번호</th>
                  <th>신청일</th>
                  <th>처리</th>
                </tr>
              </thead>
              <tbody>
                ${pendingUsers.slice(0, 5).map(u => `
                  <tr style="cursor:pointer;" onclick="showUserDetailModal(${JSON.stringify(u).replace(/"/g,'&quot;')})">
                    <td>
                      <div style="display:flex; align-items:center; gap:8px;">
                        <div style="width:32px; height:32px; background:rgba(249,115,22,0.15); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px; color:var(--brand-orange); flex-shrink:0;">
                          ${(u.name||'?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style="font-size:13px; font-weight:700; color:white;">${u.name}</div>
                          <div style="font-size:11px; color:#6b7280;">@${u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style="color:#9ca3af; font-size:12px;">${u.email}</td>
                    <td style="color:#9ca3af; font-size:12px;">${u.phone || '-'}</td>
                    <td style="color:#6b7280; font-size:12px;">${new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                    <td onclick="event.stopPropagation()">
                      <div style="display:flex; gap:5px;">
                        <button onclick="approveUser(${u.id})"
                          style="background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.3); color:#22c55e; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:700; min-height:34px; white-space:nowrap;">
                          <i class="fas fa-check" style="margin-right:3px;"></i>승인
                        </button>
                        <button onclick="rejectUser(${u.id})"
                          style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); color:#ef4444; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:12px; min-height:34px; white-space:nowrap;">
                          <i class="fas fa-times" style="margin-right:3px;"></i>거부
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ${pendingUsers.length > 5 ? `
            <div style="padding:10px 18px; text-align:center; border-top:1px solid rgba(255,255,255,0.04);">
              <button onclick="navigate('admin-pending')" style="background:none; border:none; color:#f59e0b; font-size:12px; cursor:pointer; font-weight:600;">
                <i class="fas fa-chevron-down" style="margin-right:4px;"></i>나머지 ${pendingUsers.length - 5}명 더 보기
              </button>
            </div>
          ` : ''}
        </div>
      ` : `
        <div style="background:rgba(34,197,94,0.04); border:1px solid rgba(34,197,94,0.15); border-radius:16px; padding:28px; text-align:center; margin-bottom:18px;">
          <i class="fas fa-check-circle" style="font-size:36px; color:#22c55e; display:block; margin-bottom:10px;"></i>
          <div style="font-size:15px; font-weight:600; color:#22c55e;">모든 가입 신청이 처리되었습니다</div>
          <div style="font-size:12px; color:#6b7280; margin-top:5px;">새로운 가입 신청이 없습니다</div>
        </div>
      `}

      <!-- Quick Actions -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%,160px), 1fr)); gap:10px;">
        ${[
          { label: '승인 대기 관리', icon: 'fas fa-user-clock', page: 'admin-pending', color: '#f59e0b' },
          { label: '전체 회원 관리', icon: 'fas fa-users', page: 'admin-users', color: '#f97316' },
          { label: '시그널 관리', icon: 'fas fa-signal', page: 'admin-signals', color: '#3b82f6' },
        ].map(a => `
          <div onclick="navigate('${a.page}')" class="glass-card" style="padding:20px; text-align:center; cursor:pointer;">
            <i class="${a.icon}" style="font-size:26px; color:${a.color}; display:block; margin-bottom:10px;"></i>
            <div style="font-size:13px; font-weight:600; color:white;">${a.label}</div>
          </div>
        `).join('')}
      </div>
    `
  } catch (err) {
    document.getElementById('admin-dash-content').innerHTML = '<div style="color:#ef4444; padding:20px;">데이터 로드 실패</div>'
  }
}

// ============================================================
// ADMIN PENDING USERS
// ============================================================
async function renderAdminPending() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div style="margin-bottom:20px;">
      <h1 style="font-size:clamp(20px,5vw,26px); font-weight:800; color:white;">승인 대기 회원</h1>
      <p style="color:#6b7280; font-size:13px; margin-top:3px;">가입 신청한 회원을 승인하거나 거부합니다</p>
    </div>
    <div id="pending-content">
      <div style="display:flex; justify-content:center; padding:60px;"><div class="spinner"></div></div>
    </div>
  `
  await loadPendingUsers()
}

async function loadPendingUsers() {
  const content = document.getElementById('pending-content')
  if (!content) return

  try {
    const res = await api.get('/admin/users/pending')
    const users = res.success ? res.users : []

    if (users.length === 0) {
      content.innerHTML = `
        <div style="text-align:center; padding:60px; background:rgba(22,27,34,0.6); border:1px solid rgba(34,197,94,0.15); border-radius:20px;">
          <i class="fas fa-check-circle" style="font-size:52px; color:#22c55e; display:block; margin-bottom:16px;"></i>
          <h3 style="font-size:18px; font-weight:700; color:white; margin-bottom:7px;">대기 중인 신청이 없습니다</h3>
          <p style="color:#6b7280; font-size:13px;">모든 가입 신청이 처리되었습니다.</p>
        </div>
      `
      return
    }

    content.innerHTML = `
      <!-- 카운트 배지 -->
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
        <div style="background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:8px 16px; display:flex; align-items:center; gap:8px;">
          <div style="width:8px; height:8px; background:#f59e0b; border-radius:50%; box-shadow:0 0 6px #f59e0b; animation:glow 2s ease-in-out infinite;"></div>
          <span style="font-size:13px; font-weight:700; color:#f59e0b;">${users.length}명 승인 대기 중</span>
        </div>
        <span style="font-size:12px; color:#4b5563;">가입 신청서를 검토 후 승인 또는 거부해 주세요</span>
      </div>

      <div style="display:grid; gap:14px;">
        ${users.map((u, idx) => {
          const regDate = new Date(u.created_at)
          const diffMs  = Date.now() - regDate
          const diffH   = Math.floor(diffMs / 3600000)
          const diffD   = Math.floor(diffMs / 86400000)
          const waitStr = diffD > 0 ? `${diffD}일 전 신청` : diffH > 0 ? `${diffH}시간 전 신청` : '방금 신청'
          const isUrgent = diffD >= 2

          return `
          <div class="glass-card" style="padding:0; overflow:hidden; border:1px solid ${isUrgent ? 'rgba(239,68,68,0.25)' : 'rgba(249,115,22,0.12)'};">
            <!-- 카드 헤더 -->
            <div style="padding:16px 18px; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:space-between; gap:10px; background:rgba(255,255,255,0.02);">
              <div style="display:flex; align-items:center; gap:12px;">
                <!-- 아바타 -->
                <div style="width:48px; height:48px; background:linear-gradient(135deg,rgba(249,115,22,0.3),rgba(245,158,11,0.3)); border:2px solid rgba(249,115,22,0.3); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:800; color:var(--brand-orange); flex-shrink:0;">
                  ${(u.name||'?')[0].toUpperCase()}
                </div>
                <div>
                  <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span style="font-size:16px; font-weight:800; color:white;">${u.name}</span>
                    <span style="font-size:11px; color:#9ca3af; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:5px; padding:2px 7px;">@${u.username}</span>
                    ${isUrgent ? `<span style="font-size:10px; color:#ef4444; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:4px; padding:1px 6px; font-weight:700;"><i class="fas fa-clock" style="margin-right:2px;"></i>장기 대기</span>` : ''}
                  </div>
                  <div style="font-size:12px; color:#6b7280; margin-top:3px;">
                    <i class="fas fa-clock" style="margin-right:4px; font-size:10px;"></i>${waitStr}
                  </div>
                </div>
              </div>
              <div style="text-align:right; flex-shrink:0;">
                <div style="font-size:10px; color:#4b5563;">신청번호</div>
                <div style="font-size:13px; font-weight:700; color:#6b7280;">#${String(u.id).padStart(4,'0')}</div>
              </div>
            </div>

            <!-- 인적 정보 섹션 -->
            <div style="padding:16px 18px; border-bottom:1px solid rgba(255,255,255,0.04);">
              <div style="font-size:10px; font-weight:700; color:#4b5563; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:12px;">
                <i class="fas fa-id-card" style="margin-right:5px; color:#f97316;"></i>제출된 인적 정보
              </div>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:11px 14px;">
                  <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
                    <i class="fas fa-user" style="font-size:10px; color:#f97316; width:12px;"></i>
                    <span style="font-size:10px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">이름</span>
                  </div>
                  <div style="font-size:14px; font-weight:700; color:white;">${u.name}</div>
                </div>
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:11px 14px;">
                  <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
                    <i class="fas fa-at" style="font-size:10px; color:#3b82f6; width:12px;"></i>
                    <span style="font-size:10px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">아이디</span>
                  </div>
                  <div style="font-size:14px; font-weight:700; color:#60a5fa;">@${u.username}</div>
                </div>
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:11px 14px;">
                  <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
                    <i class="fas fa-envelope" style="font-size:10px; color:#22c55e; width:12px;"></i>
                    <span style="font-size:10px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">이메일</span>
                  </div>
                  <div style="font-size:13px; font-weight:600; color:#86efac; word-break:break-all;">${u.email}</div>
                </div>
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:11px 14px;">
                  <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
                    <i class="fas fa-phone" style="font-size:10px; color:#a78bfa; width:12px;"></i>
                    <span style="font-size:10px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">전화번호</span>
                  </div>
                  <div style="font-size:14px; font-weight:700; color:#c4b5fd;">${u.phone || '미입력'}</div>
                </div>
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:11px 14px;">
                  <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
                    <i class="fas fa-calendar-alt" style="font-size:10px; color:#f59e0b; width:12px;"></i>
                    <span style="font-size:10px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">신청일시</span>
                  </div>
                  <div style="font-size:13px; font-weight:600; color:#fcd34d;">${regDate.toLocaleDateString('ko-KR')} ${regDate.toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:11px 14px;">
                  <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
                    <i class="fas fa-shield-alt" style="font-size:10px; color:#ef4444; width:12px;"></i>
                    <span style="font-size:10px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">상태</span>
                  </div>
                  <div style="font-size:13px; font-weight:700; color:#f59e0b;"><i class="fas fa-hourglass-half" style="margin-right:4px;"></i>승인 대기 중</div>
                </div>
              </div>
            </div>

            <!-- 액션 버튼 -->
            <div style="padding:14px 18px; display:flex; gap:10px; flex-wrap:wrap;">
              <button onclick="approveUser(${u.id})"
                style="flex:1; min-width:120px; padding:13px 20px; background:linear-gradient(135deg,#16a34a,#22c55e); border:none; border-radius:10px; color:white; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; transition:all 0.2s; box-shadow:0 2px 12px rgba(34,197,94,0.25);"
                onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 18px rgba(34,197,94,0.4)';"
                onmouseout="this.style.transform=''; this.style.boxShadow='0 2px 12px rgba(34,197,94,0.25)';">
                <i class="fas fa-check-circle"></i> 승인하기
              </button>
              <button onclick="rejectUser(${u.id})"
                style="flex:1; min-width:120px; padding:13px 20px; background:rgba(239,68,68,0.08); border:1.5px solid rgba(239,68,68,0.35); border-radius:10px; color:#ef4444; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; transition:all 0.2s;"
                onmouseover="this.style.background='rgba(239,68,68,0.15)';"
                onmouseout="this.style.background='rgba(239,68,68,0.08)';">
                <i class="fas fa-times-circle"></i> 거부하기
              </button>
            </div>
          </div>
          `
        }).join('')}
      </div>
    `
  } catch (err) {
    content.innerHTML = '<div style="color:#ef4444; padding:20px;">데이터 로드 실패</div>'
  }
}

async function approveUser(id) {
  try {
    const res = await api.put(`/admin/users/${id}/approve`)
    if (res.success) {
      showToast('회원이 승인되었습니다.')
      await loadPendingUsers()
      if (document.getElementById('admin-dash-content')) await renderAdminDashboard()
    }
  } catch (err) {
    showToast('처리 실패', 'error')
  }
}

async function rejectUser(id) {
  if (!confirm('정말 이 회원의 가입을 거부하시겠습니까?')) return
  try {
    const res = await api.put(`/admin/users/${id}/reject`)
    if (res.success) {
      showToast('회원 가입이 거부되었습니다.')
      await loadPendingUsers()
    }
  } catch (err) {
    showToast('처리 실패', 'error')
  }
}

// ============================================================
// ADMIN USERS
// ============================================================
let _adminAllUsers = []

async function renderAdminUsers() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:18px; gap:12px; flex-wrap:wrap;">
      <div>
        <h1 style="font-size:clamp(20px,5vw,26px); font-weight:800; color:white;">전체 회원 관리</h1>
        <p style="color:#6b7280; font-size:13px; margin-top:3px;">가입된 모든 회원의 인적 정보 및 상태를 관리합니다</p>
      </div>
    </div>

    <!-- 검색 + 필터 -->
    <div style="display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap;">
      <div style="flex:1; min-width:180px; position:relative;">
        <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;"></i>
        <input type="text" id="user-search" placeholder="이름, 아이디, 이메일 검색…"
          oninput="filterAdminUsers()"
          style="width:100%; padding:10px 12px 10px 36px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:white; font-size:13px; box-sizing:border-box;">
      </div>
      <select id="user-filter" onchange="filterAdminUsers()"
        style="padding:10px 14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:#d1d5db; font-size:13px; cursor:pointer;">
        <option value="all">전체 상태</option>
        <option value="pending">대기중</option>
        <option value="approved">승인됨</option>
        <option value="rejected">거부됨</option>
      </select>
    </div>

    <div id="users-content">
      <div style="display:flex; justify-content:center; padding:60px;"><div class="spinner"></div></div>
    </div>
  `

  try {
    const res = await api.get('/admin/users')
    _adminAllUsers = res.success ? res.users : []
    renderUserTable(_adminAllUsers)
  } catch (err) {
    document.getElementById('users-content').innerHTML = '<div style="color:#ef4444; padding:20px;">데이터 로드 실패</div>'
  }
}

function filterAdminUsers() {
  const q      = (document.getElementById('user-search')?.value || '').toLowerCase().trim()
  const filter = document.getElementById('user-filter')?.value || 'all'
  let list = _adminAllUsers
  if (filter !== 'all') list = list.filter(u => u.status === filter)
  if (q) list = list.filter(u =>
    (u.name||'').toLowerCase().includes(q) ||
    (u.username||'').toLowerCase().includes(q) ||
    (u.email||'').toLowerCase().includes(q) ||
    (u.phone||'').includes(q)
  )
  renderUserTable(list)
}

function renderUserTable(users) {
  const el = document.getElementById('users-content')
  if (!el) return

  const statusCount = {
    total: users.length,
    pending:  users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    rejected: users.filter(u => u.status === 'rejected').length,
  }

  el.innerHTML = `
    <!-- 요약 배지 -->
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
      ${[
        { label:'전체', count: statusCount.total,    col:'#9ca3af', bg:'rgba(255,255,255,0.05)' },
        { label:'대기', count: statusCount.pending,  col:'#f59e0b', bg:'rgba(245,158,11,0.08)' },
        { label:'승인', count: statusCount.approved, col:'#22c55e', bg:'rgba(34,197,94,0.08)'  },
        { label:'거부', count: statusCount.rejected, col:'#ef4444', bg:'rgba(239,68,68,0.08)'  },
      ].map(s => `
        <div style="background:${s.bg}; border:1px solid ${s.col}33; border-radius:8px; padding:6px 14px; display:flex; align-items:center; gap:6px;">
          <span style="font-size:11px; color:${s.col}; font-weight:600;">${s.label}</span>
          <span style="font-size:14px; font-weight:800; color:${s.col};">${s.count}</span>
        </div>
      `).join('')}
    </div>

    <!-- 데스크탑: 테이블 / 모바일: 카드 -->
    <div class="table-wrap" style="display:none;" id="user-table-wrap">
      <table class="data-table" style="min-width:640px;">
        <thead>
          <tr>
            <th style="width:40px;">#</th>
            <th>이름 / 아이디</th>
            <th>이메일</th>
            <th>전화번호</th>
            <th>상태</th>
            <th>가입일</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          ${users.map((u, idx) => {
            const statusStyle = u.status === 'approved'
              ? 'background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.25);'
              : u.status === 'pending'
              ? 'background:rgba(245,158,11,0.1);color:#f59e0b;border:1px solid rgba(245,158,11,0.25);'
              : 'background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);'
            const statusLabel = u.status === 'approved' ? '✓ 승인됨' : u.status === 'pending' ? '⏳ 대기중' : '✗ 거부됨'
            return `
            <tr style="cursor:pointer;" onclick="showUserDetailModal(${JSON.stringify(u).replace(/"/g,'&quot;')})">
              <td style="color:#4b5563; font-size:12px;">${idx+1}</td>
              <td>
                <div style="display:flex; align-items:center; gap:9px;">
                  <div style="width:34px; height:34px; background:linear-gradient(135deg,rgba(249,115,22,0.25),rgba(245,158,11,0.25)); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; color:var(--brand-orange); flex-shrink:0;">
                    ${(u.name||'?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style="font-size:13px; font-weight:700; color:white;">${u.name}</div>
                    <div style="font-size:11px; color:#6b7280;">@${u.username}</div>
                  </div>
                </div>
              </td>
              <td style="color:#9ca3af; font-size:12px;">${u.email}</td>
              <td style="color:#9ca3af; font-size:12px;">${u.phone || '-'}</td>
              <td onclick="event.stopPropagation()">
                <span style="padding:3px 10px; border-radius:16px; font-size:11px; font-weight:700; ${statusStyle}">${statusLabel}</span>
              </td>
              <td style="color:#6b7280; font-size:12px;">${new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
              <td onclick="event.stopPropagation()">
                <div style="display:flex; gap:5px; flex-wrap:wrap;">
                  ${u.status === 'pending' ? `
                    <button onclick="approveUserFromList(${u.id})" style="background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);color:#22c55e;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:700;min-height:32px;">
                      <i class="fas fa-check"></i> 승인
                    </button>
                    <button onclick="rejectUserFromList(${u.id})" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#ef4444;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;min-height:32px;">
                      <i class="fas fa-times"></i> 거부
                    </button>
                  ` : u.status === 'rejected' ? `
                    <button onclick="approveUserFromList(${u.id})" style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);color:#22c55e;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;min-height:32px;">
                      <i class="fas fa-redo"></i> 재승인
                    </button>
                  ` : ''}
                  ${u.role !== 'admin' ? `
                    <button onclick="deleteUser(${u.id})" style="background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.1);color:#6b7280;padding:5px 9px;border-radius:6px;cursor:pointer;font-size:11px;min-height:32px;">
                      <i class="fas fa-trash"></i>
                    </button>
                  ` : `<span style="font-size:11px; color:#f97316; padding:4px 8px;"><i class="fas fa-crown"></i> 관리자</span>`}
                </div>
              </td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
    </div>

    <!-- 모바일: 카드 목록 -->
    <div id="user-card-list" style="display:flex; flex-direction:column; gap:10px;">
      ${users.map(u => {
        const statusStyle = u.status === 'approved'
          ? 'color:#22c55e; border-color:rgba(34,197,94,0.3);'
          : u.status === 'pending'
          ? 'color:#f59e0b; border-color:rgba(245,158,11,0.3);'
          : 'color:#ef4444; border-color:rgba(239,68,68,0.3);'
        const statusLabel = u.status === 'approved' ? '승인됨' : u.status === 'pending' ? '대기중' : '거부됨'
        const statusIcon  = u.status === 'approved' ? 'fa-check-circle' : u.status === 'pending' ? 'fa-hourglass-half' : 'fa-times-circle'
        return `
        <div class="glass-card" style="padding:14px; cursor:pointer;" onclick="showUserDetailModal(${JSON.stringify(u).replace(/"/g,'&quot;')})">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
            <div style="width:40px; height:40px; background:linear-gradient(135deg,rgba(249,115,22,0.25),rgba(245,158,11,0.25)); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:15px; color:var(--brand-orange); flex-shrink:0;">
              ${(u.name||'?')[0].toUpperCase()}
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:14px; font-weight:700; color:white;">${u.name}</div>
              <div style="font-size:11px; color:#6b7280;">@${u.username}</div>
            </div>
            <div style="display:flex; align-items:center; gap:4px; border:1px solid; border-radius:20px; padding:3px 10px; flex-shrink:0; ${statusStyle}">
              <i class="fas ${statusIcon}" style="font-size:10px;"></i>
              <span style="font-size:11px; font-weight:700;">${statusLabel}</span>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:7px; font-size:12px; padding:10px; background:rgba(255,255,255,0.02); border-radius:8px; margin-bottom:10px;">
            <div><span style="color:#4b5563;">이메일</span><br><span style="color:#9ca3af; word-break:break-all;">${u.email}</span></div>
            <div><span style="color:#4b5563;">전화번호</span><br><span style="color:#9ca3af;">${u.phone || '-'}</span></div>
            <div><span style="color:#4b5563;">가입일</span><br><span style="color:#9ca3af;">${new Date(u.created_at).toLocaleDateString('ko-KR')}</span></div>
            <div><span style="color:#4b5563;">권한</span><br><span style="color:${u.role==='admin'?'#f97316':'#9ca3af'}; font-weight:${u.role==='admin'?'700':'400'};">${u.role === 'admin' ? '관리자' : '일반'}</span></div>
          </div>
          <div style="display:flex; gap:8px;" onclick="event.stopPropagation()">
            ${u.status === 'pending' ? `
              <button onclick="approveUserFromList(${u.id})" style="flex:1; padding:10px; background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.3); border-radius:8px; color:#22c55e; font-size:13px; font-weight:700; cursor:pointer;">
                <i class="fas fa-check" style="margin-right:4px;"></i>승인
              </button>
              <button onclick="rejectUserFromList(${u.id})" style="flex:1; padding:10px; background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.2); border-radius:8px; color:#ef4444; font-size:13px; cursor:pointer;">
                <i class="fas fa-times" style="margin-right:4px;"></i>거부
              </button>
            ` : u.status === 'rejected' ? `
              <button onclick="approveUserFromList(${u.id})" style="flex:1; padding:10px; background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); border-radius:8px; color:#22c55e; font-size:13px; cursor:pointer;">
                <i class="fas fa-redo" style="margin-right:4px;"></i>재승인
              </button>
            ` : `<div style="flex:1; text-align:center; padding:8px; font-size:12px; color:#4b5563;"><i class="fas fa-info-circle" style="margin-right:4px;"></i>상세 정보 보기</div>`}
            ${u.role !== 'admin' ? `
              <button onclick="deleteUser(${u.id})" style="padding:10px 14px; background:rgba(239,68,68,0.04); border:1px solid rgba(239,68,68,0.1); border-radius:8px; color:#6b7280; font-size:13px; cursor:pointer;">
                <i class="fas fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `}).join('')}
    </div>

    ${users.length === 0 ? `
      <div style="text-align:center; padding:60px; color:#6b7280;">
        <i class="fas fa-users" style="font-size:40px; display:block; margin-bottom:14px; color:#374151;"></i>
        검색 결과가 없습니다
      </div>
    ` : ''}
  `

  // 화면 크기에 따라 테이블/카드 전환
  applyUserTableLayout()
  window.addEventListener('resize', applyUserTableLayout)
}

function applyUserTableLayout() {
  const tableWrap = document.getElementById('user-table-wrap')
  const cardList  = document.getElementById('user-card-list')
  if (!tableWrap || !cardList) return
  if (window.innerWidth > 768) {
    tableWrap.style.display = 'block'
    cardList.style.display  = 'none'
  } else {
    tableWrap.style.display = 'none'
    cardList.style.display  = 'flex'
  }
}

// 회원 상세 정보 모달
function showUserDetailModal(u) {
  if (typeof u === 'string') { try { u = JSON.parse(u) } catch { return } }
  const existing = document.getElementById('user-detail-modal')
  if (existing) existing.remove()

  const statusLabel = u.status === 'approved' ? '승인됨' : u.status === 'pending' ? '승인 대기중' : '거부됨'
  const statusColor = u.status === 'approved' ? '#22c55e' : u.status === 'pending' ? '#f59e0b' : '#ef4444'
  const regDate = new Date(u.created_at)
  const approvedDate = u.approved_at ? new Date(u.approved_at) : null

  const overlay = document.createElement('div')
  overlay.id = 'user-detail-modal'
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:520px; padding:0; overflow:hidden;">
      <!-- 모달 헤더 -->
      <div style="padding:20px 22px 16px; border-bottom:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:52px; height:52px; background:linear-gradient(135deg,rgba(249,115,22,0.3),rgba(245,158,11,0.3)); border:2px solid rgba(249,115,22,0.35); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:800; color:var(--brand-orange); flex-shrink:0;">
            ${(u.name||'?')[0].toUpperCase()}
          </div>
          <div>
            <div style="font-size:17px; font-weight:800; color:white;">${u.name}</div>
            <div style="display:flex; align-items:center; gap:7px; margin-top:3px;">
              <span style="font-size:12px; color:#6b7280;">@${u.username}</span>
              <span style="font-size:11px; font-weight:700; color:${statusColor}; background:${statusColor}18; border:1px solid ${statusColor}44; border-radius:5px; padding:1px 7px;">${statusLabel}</span>
              ${u.role === 'admin' ? `<span style="font-size:10px; color:#f97316; background:rgba(249,115,22,0.12); border:1px solid rgba(249,115,22,0.25); border-radius:4px; padding:1px 6px; font-weight:700;"><i class="fas fa-crown" style="margin-right:2px;"></i>관리자</span>` : ''}
            </div>
          </div>
        </div>
        <button onclick="document.getElementById('user-detail-modal').remove()" style="background:rgba(255,255,255,0.06); border:none; color:#9ca3af; width:36px; height:36px; border-radius:9px; cursor:pointer; font-size:16px; flex-shrink:0;">✕</button>
      </div>

      <!-- 인적 정보 -->
      <div style="padding:20px 22px;">
        <div style="font-size:10px; font-weight:700; color:#4b5563; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:14px;">
          <i class="fas fa-id-card" style="margin-right:5px; color:#f97316;"></i>인적 정보
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px;">
          ${[
            { icon:'fa-user',         label:'이름',     val: u.name,                                                    color:'#f97316' },
            { icon:'fa-at',           label:'아이디',   val: '@'+u.username,                                            color:'#3b82f6' },
            { icon:'fa-envelope',     label:'이메일',   val: u.email,                                                   color:'#22c55e' },
            { icon:'fa-phone',        label:'전화번호', val: u.phone || '미입력',                                       color:'#a78bfa' },
            { icon:'fa-calendar-alt', label:'가입일시', val: regDate.toLocaleDateString('ko-KR')+' '+regDate.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}), color:'#f59e0b' },
            { icon:'fa-check-circle', label:'승인일시', val: approvedDate ? approvedDate.toLocaleDateString('ko-KR')+' '+approvedDate.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}) : '-', color:'#22c55e' },
          ].map(f => `
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:12px 14px;">
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:6px;">
                <i class="fas ${f.icon}" style="font-size:10px; color:${f.color}; width:12px;"></i>
                <span style="font-size:10px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">${f.label}</span>
              </div>
              <div style="font-size:13px; font-weight:600; color:#e5e7eb; word-break:break-all;">${f.val}</div>
            </div>
          `).join('')}
        </div>

        <!-- 액션 버튼 -->
        ${u.role !== 'admin' ? `
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          ${u.status === 'pending' ? `
            <button onclick="approveUserFromList(${u.id}); document.getElementById('user-detail-modal').remove();"
              style="flex:1; min-width:110px; padding:12px 16px; background:linear-gradient(135deg,#16a34a,#22c55e); border:none; border-radius:10px; color:white; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; box-shadow:0 2px 12px rgba(34,197,94,0.25);">
              <i class="fas fa-check-circle"></i> 승인하기
            </button>
            <button onclick="rejectUserFromList(${u.id}); document.getElementById('user-detail-modal').remove();"
              style="flex:1; min-width:110px; padding:12px 16px; background:rgba(239,68,68,0.08); border:1.5px solid rgba(239,68,68,0.3); border-radius:10px; color:#ef4444; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px;">
              <i class="fas fa-times-circle"></i> 거부하기
            </button>
          ` : u.status === 'rejected' ? `
            <button onclick="approveUserFromList(${u.id}); document.getElementById('user-detail-modal').remove();"
              style="flex:1; padding:12px 16px; background:linear-gradient(135deg,#16a34a,#22c55e); border:none; border-radius:10px; color:white; font-size:14px; font-weight:700; cursor:pointer;">
              <i class="fas fa-redo" style="margin-right:6px;"></i>재승인
            </button>
          ` : `
            <button onclick="rejectUserFromList(${u.id}); document.getElementById('user-detail-modal').remove();"
              style="flex:1; padding:12px 16px; background:rgba(239,68,68,0.08); border:1.5px solid rgba(239,68,68,0.3); border-radius:10px; color:#ef4444; font-size:14px; font-weight:700; cursor:pointer;">
              <i class="fas fa-ban" style="margin-right:6px;"></i>승인 취소
            </button>
          `}
          <button onclick="if(confirm('정말 삭제하시겠습니까?')){deleteUser(${u.id}); document.getElementById('user-detail-modal').remove();}"
            style="padding:12px 16px; background:rgba(239,68,68,0.04); border:1px solid rgba(239,68,68,0.1); border-radius:10px; color:#6b7280; font-size:14px; cursor:pointer;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        ` : `<div style="text-align:center; padding:12px; color:#f97316; font-size:13px; font-weight:600;"><i class="fas fa-crown" style="margin-right:6px;"></i>관리자 계정은 수정할 수 없습니다</div>`}
      </div>
    </div>
  `
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove() })
  document.body.appendChild(overlay)
}

async function approveUserFromList(id) {
  const res = await api.put(`/admin/users/${id}/approve`)
  if (res.success) {
    showToast('승인되었습니다.')
    await renderAdminUsers()
    if (document.getElementById('admin-dash-content')) await renderAdminDashboard()
  } else {
    showToast(res.message || '처리 실패', 'error')
  }
}

async function rejectUserFromList(id) {
  if (!confirm('정말 거부하시겠습니까?')) return
  const res = await api.put(`/admin/users/${id}/reject`)
  if (res.success) {
    showToast('거부되었습니다.')
    await renderAdminUsers()
  } else {
    showToast(res.message || '처리 실패', 'error')
  }
}

async function deleteUser(id) {
  if (!confirm('정말 이 회원을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return
  const res = await api.delete(`/admin/users/${id}`)
  if (res.success) { showToast('삭제되었습니다.'); await renderAdminUsers() }
  else showToast(res.message || '삭제 실패', 'error')
}

// ============================================================
// ADMIN SIGNALS
// ============================================================
async function renderAdminSignals() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; gap:12px; flex-wrap:wrap;">
      <div>
        <h1 style="font-size:clamp(20px,5vw,26px); font-weight:800; color:white;">시그널 관리</h1>
        <p style="color:#6b7280; font-size:13px; margin-top:3px;">주가 시그널을 추가하고 관리합니다</p>
      </div>
      <button onclick="showAddSignalModal()" class="btn-primary" style="padding:11px 20px; font-size:14px; white-space:nowrap;">
        <i class="fas fa-plus" style="margin-right:7px;"></i>시그널 추가
      </button>
    </div>
    <div id="signals-admin-content">
      <div style="display:flex; justify-content:center; padding:60px;"><div class="spinner"></div></div>
    </div>
  `
  await loadAdminSignals()
}

async function loadAdminSignals() {
  const content = document.getElementById('signals-admin-content')
  if (!content) return

  try {
    const res = await api.get('/signals?limit=100')
    const signals = res.success ? res.signals : []

    content.innerHTML = `
      <div style="background:rgba(22,27,34,0.8); border:1px solid rgba(249,115,22,0.08); border-radius:16px; overflow:hidden;">
        <div style="padding:14px 18px; border-bottom:1px solid var(--brand-border);">
          <h3 style="font-size:14px; font-weight:700; color:white;">등록된 시그널 (${signals.length}개)</h3>
        </div>
        ${signals.length === 0 ? `
          <div style="text-align:center; padding:60px; color:#4b5563;">
            <i class="fas fa-signal" style="font-size:36px; display:block; margin-bottom:14px;"></i>
            등록된 시그널이 없습니다. 시그널을 추가해보세요.
          </div>
        ` : `
          <div class="table-wrap">
            <table class="data-table" style="min-width:520px;">
              <thead>
                <tr>
                  <th>종목명</th>
                  <th>시장</th>
                  <th>시그널</th>
                  <th>현재가</th>
                  <th>강도</th>
                  <th>등록일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                ${signals.map(s => `
                  <tr>
                    <td>
                      <div style="font-weight:600; color:white; font-size:13px;">${s.stock_name}</div>
                      <div style="font-size:11px; color:#4b5563;">${s.stock_code}</div>
                    </td>
                    <td><span class="${s.market === 'KOSPI' ? 'badge-kospi' : 'badge-kosdaq'}">${s.market}</span></td>
                    <td><span class="signal-${(s.signal_type||'hold').toLowerCase()}">${s.signal_type}</span></td>
                    <td style="color:white; white-space:nowrap; font-size:13px;">${s.price ? s.price.toLocaleString() + '원' : '-'}</td>
                    <td>
                      <div style="display:flex; align-items:center; gap:5px;">
                        <div class="strength-bar" style="width:50px;">
                          <div class="strength-fill" style="width:${s.strength||50}%; background:${s.signal_type==='BUY'?'#22c55e':s.signal_type==='SELL'?'#ef4444':'#f59e0b'};"></div>
                        </div>
                        <span style="font-size:11px; color:#6b7280;">${s.strength||50}%</span>
                      </div>
                    </td>
                    <td style="color:#6b7280; font-size:12px; white-space:nowrap;">${new Date(s.created_at).toLocaleDateString('ko-KR')}</td>
                    <td>
                      <button onclick="deleteSignal(${s.id})" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); color:#ef4444; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:12px; min-height:34px;">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `
  } catch (err) {
    content.innerHTML = '<div style="color:#ef4444;">데이터 로드 실패</div>'
  }
}

function showAddSignalModal() {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.id = 'signal-modal'
  overlay.innerHTML = `
    <div class="modal-content" style="position:relative;">
      <button onclick="document.getElementById('signal-modal').remove()" style="position:absolute; top:12px; right:14px; background:rgba(255,255,255,0.06); border:none; color:#9ca3af; width:36px; height:36px; border-radius:9px; cursor:pointer; font-size:16px; z-index:1;">✕</button>
      
      <h2 style="font-size:18px; font-weight:700; color:white; margin-bottom:20px; padding-right:40px;">
        <i class="fas fa-plus-circle" style="color:var(--brand-orange); margin-right:8px;"></i>시그널 추가
      </h2>

      <div id="signal-msg" style="display:none; margin-bottom:14px;"></div>

      <form onsubmit="handleAddSignal(event)">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
          <div>
            <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:5px; font-weight:600;">종목코드 *</label>
            <input type="text" id="sig-code" class="form-input" placeholder="005930" required style="padding:11px 12px; font-size:15px;">
          </div>
          <div>
            <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:5px; font-weight:600;">종목명 *</label>
            <input type="text" id="sig-name" class="form-input" placeholder="삼성전자" required style="padding:11px 12px; font-size:15px;">
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
          <div>
            <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:5px; font-weight:600;">시장 *</label>
            <select id="sig-market" class="form-input" style="padding:11px 12px; font-size:15px;">
              <option value="KOSPI">KOSPI</option>
              <option value="KOSDAQ">KOSDAQ</option>
            </select>
          </div>
          <div>
            <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:5px; font-weight:600;">시그널 *</label>
            <select id="sig-type" class="form-input" style="padding:11px 12px; font-size:15px;">
              <option value="BUY">매수 (BUY)</option>
              <option value="SELL">매도 (SELL)</option>
              <option value="HOLD">홀드 (HOLD)</option>
            </select>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:12px;">
          <div>
            <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:5px; font-weight:600;">현재가</label>
            <input type="number" id="sig-price" class="form-input" placeholder="72500" style="padding:11px 12px; font-size:15px;">
          </div>
          <div>
            <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:5px; font-weight:600;">목표가</label>
            <input type="number" id="sig-target" class="form-input" placeholder="85000" style="padding:11px 12px; font-size:15px;">
          </div>
          <div>
            <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:5px; font-weight:600;">손절가</label>
            <input type="number" id="sig-stop" class="form-input" placeholder="65000" style="padding:11px 12px; font-size:15px;">
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:5px; font-weight:600;">시그널 강도 (0-100)</label>
          <input type="range" id="sig-strength" min="0" max="100" value="75" style="width:100%; accent-color:var(--brand-orange);" oninput="document.getElementById('strength-val').textContent=this.value+'%'">
          <div style="text-align:right; font-size:13px; color:var(--brand-orange); font-weight:700;" id="strength-val">75%</div>
        </div>

        <div style="margin-bottom:20px;">
          <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:5px; font-weight:600;">분석 내용</label>
          <textarea id="sig-desc" class="form-input" rows="3" placeholder="시그널 분석 내용을 입력하세요" style="resize:none; font-size:15px;"></textarea>
        </div>

        <div style="display:flex; gap:10px;">
          <button type="submit" class="btn-primary" style="flex:1; padding:13px;" id="add-sig-btn">
            <i class="fas fa-plus" style="margin-right:7px;"></i>시그널 추가
          </button>
          <button type="button" onclick="document.getElementById('signal-modal').remove()" class="btn-secondary" style="flex:1; padding:13px;">취소</button>
        </div>
      </form>
    </div>
  `
  document.body.appendChild(overlay)
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
}

async function handleAddSignal(e) {
  e.preventDefault()
  const btn = document.getElementById('add-sig-btn')
  const msgDiv = document.getElementById('signal-msg')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:7px;"></i>추가 중...'

  try {
    const res = await api.post('/admin/signals', {
      stock_code: document.getElementById('sig-code').value,
      stock_name: document.getElementById('sig-name').value,
      market: document.getElementById('sig-market').value,
      signal_type: document.getElementById('sig-type').value,
      price: parseFloat(document.getElementById('sig-price').value) || null,
      target_price: parseFloat(document.getElementById('sig-target').value) || null,
      stop_loss: parseFloat(document.getElementById('sig-stop').value) || null,
      strength: parseInt(document.getElementById('sig-strength').value),
      description: document.getElementById('sig-desc').value
    })

    if (res.success) {
      showToast('시그널이 추가되었습니다.')
      document.getElementById('signal-modal').remove()
      await loadAdminSignals()
    } else {
      msgDiv.innerHTML = `<div class="alert-error">${res.message}</div>`
      msgDiv.style.display = 'block'
    }
  } catch (err) {
    msgDiv.innerHTML = '<div class="alert-error">오류가 발생했습니다.</div>'
    msgDiv.style.display = 'block'
  }

  btn.disabled = false
  btn.innerHTML = '<i class="fas fa-plus" style="margin-right:7px;"></i>시그널 추가'
}

async function deleteSignal(id) {
  if (!confirm('이 시그널을 삭제하시겠습니까?')) return
  const res = await api.delete(`/admin/signals/${id}`)
  if (res.success) { showToast('시그널이 삭제되었습니다.'); await loadAdminSignals() }
}

// ============================================================
// SETTINGS PAGE (사용자 비밀번호 변경)
// ============================================================
function renderSettings() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div style="margin-bottom:24px;">
      <h1 style="font-size:clamp(20px,5vw,26px); font-weight:800; color:white;">
        <i class="fas fa-cog" style="color:#f97316; margin-right:10px;"></i>계정 설정
      </h1>
      <p style="color:#6b7280; font-size:13px; margin-top:3px;">비밀번호 변경 등 계정 정보를 관리합니다</p>
    </div>

    <!-- 내 정보 카드 -->
    <div style="background:rgba(17,24,34,0.8); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:24px; margin-bottom:20px; max-width:520px;">
      <h2 style="font-size:15px; font-weight:700; color:white; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
        <i class="fas fa-user-circle" style="color:#f97316;"></i> 내 정보
      </h2>
      <div style="display:grid; gap:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:12px; color:#6b7280;">이름</span>
          <span style="font-size:14px; font-weight:600; color:white;">${currentUser?.name || '-'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:12px; color:#6b7280;">아이디</span>
          <span style="font-size:14px; font-weight:600; color:white;">${currentUser?.username || '-'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:12px; color:#6b7280;">이메일</span>
          <span style="font-size:14px; font-weight:600; color:white;">${currentUser?.email || '-'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:12px; color:#6b7280;">권한</span>
          <span style="font-size:13px; font-weight:700; color:#22c55e; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.2); border-radius:6px; padding:2px 10px;">승인됨</span>
        </div>
      </div>
    </div>

    <!-- 비밀번호 변경 카드 -->
    <div style="background:rgba(17,24,34,0.8); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:24px; max-width:520px;">
      <h2 style="font-size:15px; font-weight:700; color:white; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
        <i class="fas fa-lock" style="color:#f97316;"></i> 비밀번호 변경
      </h2>
      <p style="font-size:12px; color:#6b7280; margin-bottom:18px;">변경 후 자동으로 로그아웃되며 새 비밀번호로 재로그인하세요.</p>

      <div id="pw-change-msg" style="display:none; margin-bottom:14px;"></div>

      <form onsubmit="handleChangePassword(event, 'user')" autocomplete="off">
        <div style="margin-bottom:14px;">
          <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">현재 비밀번호 *</label>
          <div style="position:relative;">
            <i class="fas fa-lock" style="position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;"></i>
            <input type="password" id="pw-current" class="form-input" placeholder="현재 비밀번호 입력" style="padding-left:38px;" required autocomplete="current-password">
          </div>
        </div>
        <div style="margin-bottom:14px;">
          <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">새 비밀번호 * (8자 이상)</label>
          <div style="position:relative;">
            <i class="fas fa-key" style="position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;"></i>
            <input type="password" id="pw-new" class="form-input" placeholder="새 비밀번호 (8자 이상)" style="padding-left:38px;" required minlength="8" autocomplete="new-password">
          </div>
          <div id="pw-strength-bar" style="margin-top:6px; display:none;">
            <div style="height:4px; border-radius:4px; background:rgba(255,255,255,0.06); overflow:hidden;">
              <div id="pw-strength-fill" style="height:100%; width:0%; border-radius:4px; transition:all 0.3s;"></div>
            </div>
            <span id="pw-strength-text" style="font-size:11px; color:#6b7280; margin-top:3px; display:block;"></span>
          </div>
        </div>
        <div style="margin-bottom:20px;">
          <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">새 비밀번호 확인 *</label>
          <div style="position:relative;">
            <i class="fas fa-check-circle" style="position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;" id="pw-confirm-icon"></i>
            <input type="password" id="pw-confirm" class="form-input" placeholder="새 비밀번호 재입력" style="padding-left:38px;" required autocomplete="new-password" oninput="checkPasswordMatch()">
          </div>
        </div>
        <button type="submit" id="pw-submit-btn" class="btn-primary" style="width:100%; padding:13px; font-size:14px; font-weight:700;">
          <i class="fas fa-save" style="margin-right:7px;"></i>비밀번호 변경
        </button>
      </form>
    </div>
  `

  // 비밀번호 강도 체크
  const pwNew = document.getElementById('pw-new')
  if (pwNew) {
    pwNew.addEventListener('input', () => {
      const val = pwNew.value
      const bar = document.getElementById('pw-strength-bar')
      const fill = document.getElementById('pw-strength-fill')
      const text = document.getElementById('pw-strength-text')
      if (!val) { bar.style.display = 'none'; return }
      bar.style.display = 'block'
      let score = 0
      if (val.length >= 8) score++
      if (/[A-Z]/.test(val)) score++
      if (/[0-9]/.test(val)) score++
      if (/[^A-Za-z0-9]/.test(val)) score++
      const levels = [
        { pct: '25%', color: '#ef4444', label: '매우 약함' },
        { pct: '50%', color: '#f97316', label: '약함' },
        { pct: '75%', color: '#f59e0b', label: '보통' },
        { pct: '100%', color: '#22c55e', label: '강함' },
      ]
      const lv = levels[score - 1] || levels[0]
      fill.style.width = lv.pct
      fill.style.background = lv.color
      text.textContent = `비밀번호 강도: ${lv.label}`
      text.style.color = lv.color
    })
  }
}

function checkPasswordMatch() {
  const newPw = document.getElementById('pw-new')?.value || ''
  const confirmPw = document.getElementById('pw-confirm')?.value || ''
  const icon = document.getElementById('pw-confirm-icon')
  if (!icon) return
  if (confirmPw.length === 0) {
    icon.style.color = '#4b5563'
  } else if (newPw === confirmPw) {
    icon.style.color = '#22c55e'
  } else {
    icon.style.color = '#ef4444'
  }
}

async function handleChangePassword(e, role) {
  e.preventDefault()
  const btn = document.getElementById('pw-submit-btn')
  const msgDiv = document.getElementById('pw-change-msg')

  const currentPassword = document.getElementById('pw-current')?.value
  const newPassword = document.getElementById('pw-new')?.value
  const confirmPassword = document.getElementById('pw-confirm')?.value

  if (newPassword !== confirmPassword) {
    msgDiv.innerHTML = '<div class="alert-error"><i class="fas fa-exclamation-circle"></i> 새 비밀번호와 확인 비밀번호가 일치하지 않습니다.</div>'
    msgDiv.style.display = 'block'
    return
  }

  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:7px;"></i>변경 중...'
  msgDiv.style.display = 'none'

  try {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword })
    if (res.success) {
      msgDiv.innerHTML = `<div class="alert-success" style="background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); border-radius:8px; padding:12px 16px; color:#22c55e; font-size:13px;"><i class="fas fa-check-circle" style="margin-right:8px;"></i>${res.message}</div>`
      msgDiv.style.display = 'block'
      setTimeout(async () => {
        await api.post('/auth/logout', {})
        localStorage.removeItem('token')
        currentUser = null
        showToast('비밀번호가 변경되었습니다. 다시 로그인해주세요.')
        navigate('login')
      }, 2000)
    } else {
      msgDiv.innerHTML = `<div class="alert-error"><i class="fas fa-exclamation-circle"></i> ${res.message}</div>`
      msgDiv.style.display = 'block'
      btn.disabled = false
      btn.innerHTML = '<i class="fas fa-save" style="margin-right:7px;"></i>비밀번호 변경'
    }
  } catch (err) {
    msgDiv.innerHTML = '<div class="alert-error"><i class="fas fa-exclamation-circle"></i> 오류가 발생했습니다.</div>'
    msgDiv.style.display = 'block'
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-save" style="margin-right:7px;"></i>비밀번호 변경'
  }
}

// ============================================================
// ADMIN SETTINGS PAGE (관리자 비밀번호 변경)
// ============================================================
function renderAdminSettings() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div style="margin-bottom:24px;">
      <h1 style="font-size:clamp(20px,5vw,26px); font-weight:800; color:white;">
        <i class="fas fa-cog" style="color:#f97316; margin-right:10px;"></i>관리자 설정
      </h1>
      <p style="color:#6b7280; font-size:13px; margin-top:3px;">관리자 계정 정보 및 비밀번호를 관리합니다</p>
    </div>

    <!-- 관리자 정보 카드 -->
    <div style="background:rgba(17,24,34,0.8); border:1px solid rgba(249,115,22,0.15); border-radius:16px; padding:24px; margin-bottom:20px; max-width:520px;">
      <h2 style="font-size:15px; font-weight:700; color:white; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
        <i class="fas fa-user-shield" style="color:#f97316;"></i> 관리자 정보
      </h2>
      <div style="display:grid; gap:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(249,115,22,0.04); border-radius:10px; border:1px solid rgba(249,115,22,0.08);">
          <span style="font-size:12px; color:#6b7280;">이름</span>
          <span style="font-size:14px; font-weight:600; color:white;">${currentUser?.name || '-'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(249,115,22,0.04); border-radius:10px; border:1px solid rgba(249,115,22,0.08);">
          <span style="font-size:12px; color:#6b7280;">아이디</span>
          <span style="font-size:14px; font-weight:600; color:white;">${currentUser?.username || '-'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(249,115,22,0.04); border-radius:10px; border:1px solid rgba(249,115,22,0.08);">
          <span style="font-size:12px; color:#6b7280;">이메일</span>
          <span style="font-size:14px; font-weight:600; color:white;">${currentUser?.email || '-'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(249,115,22,0.04); border-radius:10px; border:1px solid rgba(249,115,22,0.08);">
          <span style="font-size:12px; color:#6b7280;">권한</span>
          <span style="font-size:13px; font-weight:700; color:#f97316; background:rgba(249,115,22,0.1); border:1px solid rgba(249,115,22,0.25); border-radius:6px; padding:2px 10px;">
            <i class="fas fa-crown" style="margin-right:4px; font-size:10px;"></i>ADMIN
          </span>
        </div>
      </div>
    </div>

    <!-- 비밀번호 변경 카드 -->
    <div style="background:rgba(17,24,34,0.8); border:1px solid rgba(249,115,22,0.15); border-radius:16px; padding:24px; max-width:520px;">
      <h2 style="font-size:15px; font-weight:700; color:white; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
        <i class="fas fa-lock" style="color:#f97316;"></i> 비밀번호 변경
      </h2>
      <p style="font-size:12px; color:#6b7280; margin-bottom:18px;">변경 후 자동으로 로그아웃되며 새 비밀번호로 재로그인하세요.</p>

      <div id="pw-change-msg" style="display:none; margin-bottom:14px;"></div>

      <form onsubmit="handleChangePassword(event, 'admin')" autocomplete="off">
        <div style="margin-bottom:14px;">
          <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">현재 비밀번호 *</label>
          <div style="position:relative;">
            <i class="fas fa-lock" style="position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;"></i>
            <input type="password" id="pw-current" class="form-input" placeholder="현재 비밀번호 입력" style="padding-left:38px;" required autocomplete="current-password">
          </div>
        </div>
        <div style="margin-bottom:14px;">
          <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">새 비밀번호 * (8자 이상)</label>
          <div style="position:relative;">
            <i class="fas fa-key" style="position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;"></i>
            <input type="password" id="pw-new" class="form-input" placeholder="새 비밀번호 (8자 이상)" style="padding-left:38px;" required minlength="8" autocomplete="new-password">
          </div>
          <div id="pw-strength-bar" style="margin-top:6px; display:none;">
            <div style="height:4px; border-radius:4px; background:rgba(255,255,255,0.06); overflow:hidden;">
              <div id="pw-strength-fill" style="height:100%; width:0%; border-radius:4px; transition:all 0.3s;"></div>
            </div>
            <span id="pw-strength-text" style="font-size:11px; color:#6b7280; margin-top:3px; display:block;"></span>
          </div>
        </div>
        <div style="margin-bottom:20px;">
          <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">새 비밀번호 확인 *</label>
          <div style="position:relative;">
            <i class="fas fa-check-circle" style="position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;" id="pw-confirm-icon"></i>
            <input type="password" id="pw-confirm" class="form-input" placeholder="새 비밀번호 재입력" style="padding-left:38px;" required autocomplete="new-password" oninput="checkPasswordMatch()">
          </div>
        </div>
        <button type="submit" id="pw-submit-btn" class="btn-primary" style="width:100%; padding:13px; font-size:14px; font-weight:700; background:linear-gradient(135deg,#e83a00,#f97316);">
          <i class="fas fa-save" style="margin-right:7px;"></i>관리자 비밀번호 변경
        </button>
      </form>

      <div style="margin-top:20px; padding:14px 16px; background:rgba(249,115,22,0.05); border:1px solid rgba(249,115,22,0.12); border-radius:10px;">
        <p style="font-size:12px; color:#f97316; font-weight:600; margin-bottom:6px;"><i class="fas fa-exclamation-triangle" style="margin-right:6px;"></i>보안 안내</p>
        <ul style="font-size:11px; color:#6b7280; line-height:1.8; padding-left:16px; margin:0;">
          <li>비밀번호는 8자 이상, 영문·숫자·특수문자 조합을 권장합니다.</li>
          <li>변경 후 기존 로그인 세션은 모두 종료됩니다.</li>
          <li>관리자 비밀번호는 정기적으로 변경해주세요.</li>
        </ul>
      </div>
    </div>
  `

  // 비밀번호 강도 체크 (관리자용)
  const pwNew = document.getElementById('pw-new')
  if (pwNew) {
    pwNew.addEventListener('input', () => {
      const val = pwNew.value
      const bar = document.getElementById('pw-strength-bar')
      const fill = document.getElementById('pw-strength-fill')
      const text = document.getElementById('pw-strength-text')
      if (!val) { bar.style.display = 'none'; return }
      bar.style.display = 'block'
      let score = 0
      if (val.length >= 8) score++
      if (/[A-Z]/.test(val)) score++
      if (/[0-9]/.test(val)) score++
      if (/[^A-Za-z0-9]/.test(val)) score++
      const levels = [
        { pct: '25%', color: '#ef4444', label: '매우 약함' },
        { pct: '50%', color: '#f97316', label: '약함' },
        { pct: '75%', color: '#f59e0b', label: '보통' },
        { pct: '100%', color: '#22c55e', label: '강함' },
      ]
      const lv = levels[score - 1] || levels[0]
      fill.style.width = lv.pct
      fill.style.background = lv.color
      text.textContent = `비밀번호 강도: ${lv.label}`
      text.style.color = lv.color
    })
  }
}

// ============================================================
// CRYPTO SIGNAL PAGE
// ============================================================
let cryptoData = []
let cryptoSelectedCoin = null
let cryptoAutoRefreshTimer = null

async function renderCrypto() {
  const container = document.getElementById('page-content')
  if (!container) return

  container.innerHTML = `
    <div style="max-width:1200px; margin:0 auto;">
      <!-- 헤더 -->
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
        <div>
          <h1 style="font-size:clamp(20px,3vw,26px); font-weight:800; color:white; margin:0; display:flex; align-items:center; gap:10px;">
            <span style="background:linear-gradient(135deg,#f7931a,#ffb347); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
              <i class="fab fa-bitcoin" style="-webkit-text-fill-color:#f7931a;"></i>
            </span>
            코인 매매 시그널
          </h1>
          <p style="font-size:13px; color:#6b7280; margin:4px 0 0;">코인마켓캡 시총 상위 10개 코인의 AI 기반 매매 시그널</p>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <div id="crypto-last-updated" style="font-size:11px; color:#4b5563; background:rgba(255,255,255,0.03); padding:6px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
            <i class="fas fa-sync-alt" style="margin-right:5px; color:#f7931a;"></i>로딩 중...
          </div>
          <button onclick="refreshCryptoData()" style="background:linear-gradient(135deg,#f7931a,#f59e0b); border:none; color:white; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px;">
            <i class="fas fa-sync-alt" id="crypto-refresh-icon"></i> 새로고침
          </button>
        </div>
      </div>

      <!-- 시그널 설명 배너 -->
      <div style="background:rgba(247,147,26,0.06); border:1px solid rgba(247,147,26,0.15); border-radius:12px; padding:14px 18px; margin-bottom:22px; display:flex; align-items:flex-start; gap:12px;">
        <i class="fas fa-info-circle" style="color:#f7931a; margin-top:2px; flex-shrink:0;"></i>
        <div style="font-size:12px; color:#9ca3af; line-height:1.7;">
          <b style="color:#e5e7eb;">AI 시그널 분석 방법:</b> RSI(과매수/과매도), MACD(추세 교차), 볼린저밴드(변동성), 가격 추세를 종합 분석합니다.
          각 시간대별로 <span style="color:#22c55e; font-weight:600;">BUY</span> /
          <span style="color:#ef4444; font-weight:600;">SELL</span> /
          <span style="color:#f59e0b; font-weight:600;">HOLD</span> 시그널과 목표가·손절가를 제공합니다.
          <b style="color:#f97316;">⚠ 투자 참고용이며, 실제 투자 결정은 본인 책임입니다.</b>
        </div>
      </div>

      <!-- 코인 목록 (로딩 상태) -->
      <div id="crypto-loading" style="text-align:center; padding:60px 20px; color:#6b7280;">
        <div style="font-size:36px; margin-bottom:16px; animation:spin 1s linear infinite; display:inline-block;">
          <i class="fas fa-circle-notch" style="color:#f7931a;"></i>
        </div>
        <p style="font-size:14px;">코인 데이터 및 시그널 분석 중...</p>
      </div>

      <div id="crypto-content" style="display:none;">
        <!-- 요약 카드 -->
        <div id="crypto-summary-cards" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:14px; margin-bottom:28px;"></div>

        <!-- 코인 카드 그리드 -->
        <div id="crypto-cards-grid" style="display:flex; flex-direction:column; gap:16px;"></div>
      </div>
    </div>
  `

  // CSS 애니메이션
  if (!document.getElementById('crypto-style')) {
    const style = document.createElement('style')
    style.id = 'crypto-style'
    style.textContent = `
      @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes cryptoPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      .crypto-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
      .crypto-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(247,147,26,0.14); }
      .signal-pill-buy  { background:rgba(34,197,94,0.15);  border:1px solid rgba(34,197,94,0.35);  color:#22c55e; }
      .signal-pill-sell { background:rgba(239,68,68,0.15);  border:1px solid rgba(239,68,68,0.35);  color:#ef4444; }
      .signal-pill-hold { background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.35); color:#f59e0b; }
      .crypto-sparkline canvas { max-width:100%; }
      @media (max-width: 600px) {
        .crypto-signal-grid { grid-template-columns: repeat(2,1fr) !important; }
      }
      @media (max-width: 380px) {
        .crypto-signal-grid { grid-template-columns: repeat(1,1fr) !important; }
      }
    `
    document.head.appendChild(style)
  }

  await loadCryptoData()

  // 2분마다 자동 갱신
  if (cryptoAutoRefreshTimer) clearInterval(cryptoAutoRefreshTimer)
  cryptoAutoRefreshTimer = setInterval(() => {
    if (document.getElementById('crypto-content')) loadCryptoData()
    else clearInterval(cryptoAutoRefreshTimer)
  }, 120000)
}

async function loadCryptoData() {
  try {
    const refreshIcon = document.getElementById('crypto-refresh-icon')
    if (refreshIcon) refreshIcon.style.animation = 'spin 1s linear infinite'

    const res = await api.get('/crypto/top10')
    cryptoData = res.coins || []

    document.getElementById('crypto-loading').style.display = 'none'
    document.getElementById('crypto-content').style.display = 'block'

    renderCryptoSummary()
    renderCryptoCards()

    const now = new Date()
    const updEl = document.getElementById('crypto-last-updated')
    if (updEl) {
      const isCached = res.cached
      const cacheAge = res.cacheAge || 0
      if (isCached && cacheAge > 120) {
        updEl.innerHTML = `<i class="fas fa-database" style="margin-right:5px; color:#f59e0b;"></i>캐시(${Math.round(cacheAge/60)}분 전)`
      } else {
        updEl.innerHTML = `<i class="fas fa-check-circle" style="margin-right:5px; color:#22c55e;"></i>${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} 기준`
      }
    }

    if (refreshIcon) refreshIcon.style.animation = ''
  } catch(e) {
    document.getElementById('crypto-loading').innerHTML = `
      <div style="color:#ef4444; padding:40px 20px; text-align:center;">
        <i class="fas fa-exclamation-circle" style="font-size:36px; margin-bottom:12px; display:block;"></i>
        <p style="font-size:14px;">코인 데이터 로드 실패. 잠시 후 다시 시도해주세요.</p>
        <button onclick="loadCryptoData()" style="margin-top:12px; background:#f7931a; border:none; color:white; padding:8px 20px; border-radius:8px; cursor:pointer;">재시도</button>
      </div>`
    document.getElementById('crypto-loading').style.display = 'block'
  }
}

async function refreshCryptoData() {
  document.getElementById('crypto-loading').style.display = 'block'
  document.getElementById('crypto-content').style.display = 'none'
  document.getElementById('crypto-loading').innerHTML = `
    <div style="text-align:center; padding:60px 20px; color:#6b7280;">
      <div style="font-size:36px; margin-bottom:16px; animation:spin 1s linear infinite; display:inline-block;">
        <i class="fas fa-circle-notch" style="color:#f7931a;"></i>
      </div>
      <p style="font-size:14px;">코인 데이터 및 시그널 분석 중...</p>
    </div>`
  await loadCryptoData()
}

function renderCryptoSummary() {
  const container = document.getElementById('crypto-summary-cards')
  if (!container || !cryptoData.length) return

  const totalBuy   = cryptoData.reduce((s, c) => s + c.buyCount, 0)
  const totalSell  = cryptoData.reduce((s, c) => s + c.sellCount, 0)
  const totalHold  = cryptoData.reduce((s, c) => s + c.holdCount, 0)
  const totalSigs  = cryptoData.length * 6
  const dominantBuy  = cryptoData.filter(c => c.overallSignal === 'BUY').length
  const dominantSell = cryptoData.filter(c => c.overallSignal === 'SELL').length
  const dominantHold = cryptoData.filter(c => c.overallSignal === 'HOLD').length
  const marketSentiment = dominantBuy > dominantSell ? '📈 강세' : dominantBuy < dominantSell ? '📉 약세' : '➡️ 중립'
  const sentColor = dominantBuy > dominantSell ? '#22c55e' : dominantBuy < dominantSell ? '#ef4444' : '#f59e0b'
  const btc  = cryptoData.find(c => c.symbol === 'BTC')
  const eth  = cryptoData.find(c => c.symbol === 'ETH')
  const buyPct  = totalSigs ? Math.round(totalBuy  / totalSigs * 100) : 0
  const sellPct = totalSigs ? Math.round(totalSell / totalSigs * 100) : 0
  const holdPct = 100 - buyPct - sellPct

  container.innerHTML = `
    <!-- 시장 심리 -->
    <div style="background:${dominantBuy>dominantSell?'rgba(34,197,94,0.07)':dominantBuy<dominantSell?'rgba(239,68,68,0.07)':'rgba(245,158,11,0.07)'}; border:1px solid ${sentColor}30; border-radius:16px; padding:18px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
        <span style="font-size:10px; color:#6b7280; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;">시장 심리</span>
        <i class="fas fa-brain" style="font-size:13px; color:${sentColor};"></i>
      </div>
      <div style="font-size:20px; font-weight:800; color:${sentColor}; line-height:1.2;">${marketSentiment}</div>
      <div style="font-size:11px; color:#6b7280; margin-top:6px;">매수 ${dominantBuy}코인 · 관망 ${dominantHold}코인 · 매도 ${dominantSell}코인</div>
      <div style="display:flex; gap:3px; margin-top:10px; border-radius:4px; overflow:hidden; height:5px;">
        <div style="flex:${dominantBuy}; background:#22c55e; border-radius:4px 0 0 4px;"></div>
        <div style="flex:${dominantHold}; background:#f59e0b;"></div>
        <div style="flex:${dominantSell}; background:#ef4444; border-radius:0 4px 4px 0;"></div>
      </div>
    </div>
    <!-- 시그널 분포 -->
    <div style="background:rgba(99,102,241,0.07); border:1px solid rgba(99,102,241,0.2); border-radius:16px; padding:18px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
        <span style="font-size:10px; color:#6b7280; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;">시그널 분포</span>
        <i class="fas fa-chart-pie" style="font-size:13px; color:#818cf8;"></i>
      </div>
      <div style="display:flex; align-items:baseline; gap:8px;">
        <span style="font-size:22px; font-weight:800; color:#22c55e;">${totalBuy}</span>
        <span style="font-size:11px; color:#6b7280;">매수</span>
        <span style="font-size:22px; font-weight:800; color:#f59e0b;">${totalHold}</span>
        <span style="font-size:11px; color:#6b7280;">관망</span>
        <span style="font-size:22px; font-weight:800; color:#ef4444;">${totalSell}</span>
        <span style="font-size:11px; color:#6b7280;">매도</span>
      </div>
      <div style="font-size:11px; color:#6b7280; margin-top:6px;">전체 ${totalSigs}개 시그널 기준</div>
      <div style="display:flex; gap:3px; margin-top:10px; border-radius:4px; overflow:hidden; height:5px;">
        <div style="flex:${buyPct}; background:#22c55e;"></div>
        <div style="flex:${holdPct}; background:#f59e0b;"></div>
        <div style="flex:${sellPct}; background:#ef4444;"></div>
      </div>
    </div>
    <!-- BTC -->
    <div style="background:rgba(247,147,26,0.07); border:1px solid rgba(247,147,26,0.2); border-radius:16px; padding:18px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
        <span style="font-size:10px; color:#6b7280; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;">Bitcoin</span>
        <i class="fab fa-bitcoin" style="font-size:15px; color:#f7931a;"></i>
      </div>
      ${btc ? `
        <div style="font-size:20px; font-weight:800; color:white;">${btc.price >= 1000 ? '$' + btc.price.toLocaleString(undefined,{maximumFractionDigits:0}) : '$' + btc.price.toFixed(2)}</div>
        <div style="font-size:13px; font-weight:700; color:${btc.change24h>=0?'#22c55e':'#ef4444'}; margin-top:4px;">
          ${btc.change24h>=0?'▲':'▼'} ${Math.abs(btc.change24h).toFixed(2)}% <span style="font-size:11px; color:#6b7280; font-weight:400;">24h</span>
        </div>
        <div style="margin-top:8px; display:inline-flex; align-items:center; gap:5px; background:${btc.overallSignal==='BUY'?'rgba(34,197,94,0.12)':btc.overallSignal==='SELL'?'rgba(239,68,68,0.12)':'rgba(245,158,11,0.12)'}; border:1px solid ${btc.overallSignal==='BUY'?'rgba(34,197,94,0.3)':btc.overallSignal==='SELL'?'rgba(239,68,68,0.3)':'rgba(245,158,11,0.3)'}; border-radius:8px; padding:4px 10px;">
          <span style="font-size:11px; font-weight:800; color:${btc.overallSignal==='BUY'?'#22c55e':btc.overallSignal==='SELL'?'#ef4444':'#f59e0b'};">${btc.overallSignal==='BUY'?'매수 우세':btc.overallSignal==='SELL'?'매도 우세':'관망 우세'}</span>
        </div>
      ` : '<div style="color:#6b7280; font-size:13px;">로딩 중...</div>'}
    </div>
    <!-- ETH -->
    <div style="background:rgba(130,71,229,0.07); border:1px solid rgba(130,71,229,0.2); border-radius:16px; padding:18px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
        <span style="font-size:10px; color:#6b7280; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;">Ethereum</span>
        <i class="fab fa-ethereum" style="font-size:15px; color:#8247e5;"></i>
      </div>
      ${eth ? `
        <div style="font-size:20px; font-weight:800; color:white;">$${eth.price.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
        <div style="font-size:13px; font-weight:700; color:${eth.change24h>=0?'#22c55e':'#ef4444'}; margin-top:4px;">
          ${eth.change24h>=0?'▲':'▼'} ${Math.abs(eth.change24h).toFixed(2)}% <span style="font-size:11px; color:#6b7280; font-weight:400;">24h</span>
        </div>
        <div style="margin-top:8px; display:inline-flex; align-items:center; gap:5px; background:${eth.overallSignal==='BUY'?'rgba(34,197,94,0.12)':eth.overallSignal==='SELL'?'rgba(239,68,68,0.12)':'rgba(245,158,11,0.12)'}; border:1px solid ${eth.overallSignal==='BUY'?'rgba(34,197,94,0.3)':eth.overallSignal==='SELL'?'rgba(239,68,68,0.3)':'rgba(245,158,11,0.3)'}; border-radius:8px; padding:4px 10px;">
          <span style="font-size:11px; font-weight:800; color:${eth.overallSignal==='BUY'?'#22c55e':eth.overallSignal==='SELL'?'#ef4444':'#f59e0b'};">${eth.overallSignal==='BUY'?'매수 우세':eth.overallSignal==='SELL'?'매도 우세':'관망 우세'}</span>
        </div>
      ` : '<div style="color:#6b7280; font-size:13px;">로딩 중...</div>'}
    </div>
  `
}

function renderCryptoCards() {
  const container = document.getElementById('crypto-cards-grid')
  if (!container || !cryptoData.length) return

  container.innerHTML = cryptoData.map((coin, idx) => renderCoinCard(coin, idx)).join('')

  cryptoData.forEach(coin => {
    drawSparkline(`sparkline-${coin.id}`, coin.sparkline, coin.change24h >= 0)
  })
}

function renderCoinCard(coin, idx) {
  const isUp = coin.change24h >= 0
  const priceColor = isUp ? '#22c55e' : '#ef4444'
  const overallColor = coin.overallSignal === 'BUY' ? '#22c55e' : coin.overallSignal === 'SELL' ? '#ef4444' : '#f59e0b'
  const overallBg = coin.overallSignal === 'BUY' ? 'rgba(34,197,94,0.12)' : coin.overallSignal === 'SELL' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)'
  const overallBorder = coin.overallSignal === 'BUY' ? 'rgba(34,197,94,0.3)' : coin.overallSignal === 'SELL' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'
  const overallLabel = coin.overallSignal === 'BUY' ? '매수' : coin.overallSignal === 'SELL' ? '매도' : '관망'
  const overallIcon = coin.overallSignal === 'BUY' ? 'fa-arrow-trend-up' : coin.overallSignal === 'SELL' ? 'fa-arrow-trend-down' : 'fa-minus'

  const formatPrice = (p) => {
    if (!p && p !== 0) return '-'
    if (p >= 1000) return `$${p.toLocaleString(undefined, {maximumFractionDigits:0})}`
    if (p >= 1) return `$${p.toFixed(2)}`
    if (p >= 0.01) return `$${p.toFixed(4)}`
    return `$${p.toFixed(6)}`
  }

  const formatCap = (n) => {
    if (!n) return '-'
    if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`
    if (n >= 1e9)  return `$${(n/1e9).toFixed(1)}B`
    if (n >= 1e6)  return `$${(n/1e6).toFixed(0)}M`
    return `$${n.toLocaleString()}`
  }

  const range24 = coin.high24h - coin.low24h
  const pos24 = range24 > 0 ? Math.max(0, Math.min(100, ((coin.price - coin.low24h) / range24) * 100)) : 50

  // 시간대별 시그널 카드 (6개) - 모바일 반응형 그리드
  const signalCards = coin.signals.map(sig => {
    const sc   = sig.signal === 'BUY' ? '#22c55e' : sig.signal === 'SELL' ? '#ef4444' : '#f59e0b'
    const bg   = sig.signal === 'BUY' ? 'rgba(34,197,94,0.07)' : sig.signal === 'SELL' ? 'rgba(239,68,68,0.07)' : 'rgba(245,158,11,0.05)'
    const bdr  = sig.signal === 'BUY' ? 'rgba(34,197,94,0.2)' : sig.signal === 'SELL' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)'
    const icon = sig.signal === 'BUY' ? 'fa-arrow-trend-up' : sig.signal === 'SELL' ? 'fa-arrow-trend-down' : 'fa-minus'
    const label = sig.signal === 'BUY' ? '매수' : sig.signal === 'SELL' ? '매도' : '관망'
    const confColor = sig.confidence >= 75 ? '#22c55e' : sig.confidence >= 55 ? '#f59e0b' : '#9ca3af'
    const priceDiff = sig.signal !== 'HOLD' ? ((sig.targetPrice - coin.price) / coin.price * 100) : 0
    const priceDiffStr = priceDiff >= 0 ? `+${priceDiff.toFixed(1)}%` : `${priceDiff.toFixed(1)}%`

    return `
      <div style="background:${bg}; border:1px solid ${bdr}; border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:8px; min-width:0;">
        <!-- 시간 + 시그널 -->
        <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
          <span style="font-size:11px; font-weight:700; color:#9ca3af; white-space:nowrap;">${sig.label}</span>
          <span style="background:${bg}; border:1px solid ${bdr}; color:${sc}; font-size:12px; font-weight:900; padding:3px 10px; border-radius:20px; display:inline-flex; align-items:center; gap:4px; white-space:nowrap; letter-spacing:0.04em;">
            <i class="fas ${icon}" style="font-size:9px;"></i> ${label}
          </span>
        </div>
        <!-- 신뢰도 바 -->
        <div>
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="font-size:10px; color:#6b7280;">신뢰도</span>
            <span style="font-size:10px; color:${confColor}; font-weight:700;">${sig.confidence}%</span>
          </div>
          <div style="height:4px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden;">
            <div style="width:${sig.confidence}%; height:100%; background:${confColor}; border-radius:2px; transition:width 0.5s;"></div>
          </div>
        </div>
        <!-- 목표가 / 손절가 -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
          <div style="background:rgba(34,197,94,0.06); border:1px solid rgba(34,197,94,0.12); border-radius:8px; padding:6px 8px;">
            <div style="font-size:9px; color:#4b5563; margin-bottom:2px; font-weight:600;">목표가</div>
            <div style="font-size:11px; font-weight:700; color:#22c55e;">${formatPrice(sig.targetPrice)}</div>
          </div>
          <div style="background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.12); border-radius:8px; padding:6px 8px;">
            <div style="font-size:9px; color:#4b5563; margin-bottom:2px; font-weight:600;">손절가</div>
            <div style="font-size:11px; font-weight:700; color:#ef4444;">${formatPrice(sig.stopLoss)}</div>
          </div>
        </div>
        <!-- 근거 -->
        <div style="font-size:10px; color:#6b7280; line-height:1.5; min-height:28px;" title="${sig.reason.join(' / ')}">
          ${sig.reason.slice(0,2).join(' · ')}
        </div>
      </div>
    `
  }).join('')

  return `
    <div class="crypto-card" style="background:rgba(16,20,28,0.97); border:1px solid rgba(255,255,255,0.07); border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.35);">

      <!-- ── 코인 헤더 ─────────────────────────── -->
      <div style="padding:18px 20px 16px; background:linear-gradient(135deg,rgba(247,147,26,0.06),transparent); border-bottom:1px solid rgba(255,255,255,0.05);">
        <div style="display:flex; align-items:flex-start; gap:14px; flex-wrap:wrap;">

          <!-- 랭크 + 아이콘 + 이름 -->
          <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:180px;">
            <div style="position:relative; flex-shrink:0;">
              <div style="width:46px; height:46px; border-radius:50%; background:rgba(247,147,26,0.1); border:1.5px solid rgba(247,147,26,0.25); display:flex; align-items:center; justify-content:center; overflow:hidden;">
                <img src="${coin.image}" alt="${coin.symbol}" style="width:38px; height:38px; border-radius:50%;"
                  onerror="this.style.display='none'; this.parentNode.innerHTML='<span style=\\'font-size:15px; font-weight:800; color:#f7931a;\\'>${coin.symbol.slice(0,2)}</span>'">
              </div>
              <div style="position:absolute; bottom:-3px; right:-5px; background:#0f1320; border:1px solid rgba(247,147,26,0.4); border-radius:5px; font-size:9px; font-weight:800; color:#f7931a; padding:0 5px; line-height:17px;">#${coin.rank}</div>
            </div>
            <div>
              <div style="font-size:18px; font-weight:800; color:white; line-height:1.1; letter-spacing:0.02em;">${coin.symbol}</div>
              <div style="font-size:12px; color:#6b7280; margin-top:2px;">${coin.name}</div>
            </div>
          </div>

          <!-- 가격 블록 -->
          <div style="text-align:right; min-width:140px;">
            <div style="font-size:clamp(17px,2.2vw,24px); font-weight:800; color:white; letter-spacing:-0.01em;">${formatPrice(coin.price)}</div>
            <div style="display:flex; align-items:center; justify-content:flex-end; gap:6px; margin-top:4px; flex-wrap:wrap;">
              <span style="font-size:11px; color:${coin.change1h>=0?'#22c55e':'#ef4444'}; font-weight:600; background:${coin.change1h>=0?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)'}; padding:1px 7px; border-radius:4px;">
                1h ${coin.change1h>=0?'+':''}${coin.change1h.toFixed(2)}%
              </span>
              <span style="font-size:13px; font-weight:800; color:${priceColor}; background:${isUp?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)'}; padding:2px 8px; border-radius:5px;">
                ${isUp ? '▲' : '▼'} ${Math.abs(coin.change24h).toFixed(2)}%
              </span>
              <span style="font-size:11px; color:${coin.change7d>=0?'#22c55e':'#ef4444'}; font-weight:600; background:${coin.change7d>=0?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)'}; padding:1px 7px; border-radius:4px;">
                7d ${coin.change7d>=0?'+':''}${coin.change7d.toFixed(1)}%
              </span>
            </div>
          </div>

          <!-- 스파크라인 -->
          <div class="crypto-sparkline" style="width:100px; height:44px; flex-shrink:0; align-self:center;">
            <canvas id="sparkline-${coin.id}" width="100" height="44" style="width:100px; height:44px;"></canvas>
          </div>

          <!-- 시총/거래량 -->
          <div style="text-align:right; min-width:110px;">
            <div style="font-size:10px; color:#4b5563; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:3px;">시가총액</div>
            <div style="font-size:14px; font-weight:700; color:#e5e7eb;">${formatCap(coin.marketCap)}</div>
            <div style="font-size:10px; color:#4b5563; margin-top:3px;">거래량 ${formatCap(coin.volume24h)}</div>
          </div>

          <!-- 종합 시그널 배지 -->
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:90px; align-self:center;">
            <div style="font-size:9px; color:#4b5563; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; margin-bottom:6px;">종합 판단</div>
            <div style="background:${overallBg}; border:2px solid ${overallBorder}; border-radius:12px; padding:10px 16px; text-align:center;">
              <div style="display:flex; align-items:center; gap:6px; justify-content:center; margin-bottom:4px;">
                <i class="fas ${overallIcon}" style="font-size:12px; color:${overallColor};"></i>
                <span style="font-size:16px; font-weight:900; color:${overallColor}; letter-spacing:0.05em;">${overallLabel}</span>
              </div>
              <div style="font-size:10px; color:#6b7280;">
                <span style="color:#22c55e; font-weight:700;">${coin.buyCount}</span>매·
                <span style="color:#f59e0b; font-weight:700;">${coin.holdCount}</span>관·
                <span style="color:#ef4444; font-weight:700;">${coin.sellCount}</span>도
              </div>
            </div>
          </div>
        </div>

        <!-- 24h 가격 레인지 바 -->
        <div style="margin-top:14px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.04);">
          <div style="display:flex; align-items:center; gap:10px; font-size:11px; color:#6b7280;">
            <span style="white-space:nowrap; color:#9ca3af;">저 ${formatPrice(coin.low24h)}</span>
            <div style="flex:1; height:5px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:visible; position:relative;">
              <div style="position:absolute; left:0; top:0; height:100%; width:${pos24}%; background:linear-gradient(90deg,#3b82f6,#f7931a); border-radius:3px;"></div>
              <div style="position:absolute; left:calc(${Math.min(96, pos24)}% - 4px); top:-2px; width:9px; height:9px; background:#f7931a; border-radius:50%; border:2px solid #0f1320; box-shadow:0 0 6px rgba(247,147,26,0.5);"></div>
            </div>
            <span style="white-space:nowrap; color:#9ca3af;">고 ${formatPrice(coin.high24h)}</span>
          </div>
        </div>
      </div>

      <!-- ── 시간대별 시그널 그리드 ──────────────── -->
      <div style="padding:16px 18px 18px;">
        <div style="font-size:11px; color:#4b5563; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
          <i class="fas fa-clock" style="color:#f7931a; font-size:10px;"></i>
          시간대별 AI 매매 시그널
        </div>
        <div class="crypto-signal-grid" style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px;">
          ${signalCards}
        </div>
      </div>
    </div>
  `
}

function drawSparkline(canvasId, prices, isPositive) {
  const canvas = document.getElementById(canvasId)
  if (!canvas || !prices || prices.length < 2) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  ctx.clearRect(0, 0, W, H)

  const min = Math.min(...prices), max = Math.max(...prices)
  const range = max - min || 1
  const pts = prices.map((p, i) => ({
    x: (i / (prices.length - 1)) * W,
    y: H - ((p - min) / range) * (H - 6) - 3,
  }))

  // 그라디언트 영역
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  const c = isPositive ? '34,197,94' : '239,68,68'
  grad.addColorStop(0, `rgba(${c},0.25)`)
  grad.addColorStop(1, `rgba(${c},0)`)

  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) {
    const cp1x = (pts[i-1].x + pts[i].x) / 2
    ctx.bezierCurveTo(cp1x, pts[i-1].y, cp1x, pts[i].y, pts[i].x, pts[i].y)
  }
  ctx.lineTo(W, H)
  ctx.lineTo(0, H)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()

  // 라인
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) {
    const cp1x = (pts[i-1].x + pts[i].x) / 2
    ctx.bezierCurveTo(cp1x, pts[i-1].y, cp1x, pts[i].y, pts[i].x, pts[i].y)
  }
  ctx.strokeStyle = isPositive ? '#22c55e' : '#ef4444'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // 마지막 점
  const last = pts[pts.length - 1]
  ctx.beginPath()
  ctx.arc(last.x, last.y, 3, 0, Math.PI * 2)
  ctx.fillStyle = isPositive ? '#22c55e' : '#ef4444'
  ctx.fill()
}

// ============================================================
// INIT
// ============================================================
async function init() {
  const isLoggedIn = await checkAuth()
  
  if (isLoggedIn && currentUser) {
    if (currentUser.role === 'admin') {
      navigate('admin-dashboard')
    } else {
      navigate('dashboard')
    }
  } else {
    navigate('landing')
  }
}

init()
