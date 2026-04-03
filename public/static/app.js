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
function renderLanding() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div style="min-height:100vh; background: linear-gradient(135deg, #080d14 0%, #0d1117 50%, #080d14 100%); position:relative; overflow:hidden;">
      
      <!-- Animated background particles -->
      <div id="particles" style="position:absolute; inset:0; pointer-events:none; overflow:hidden;"></div>
      
      <!-- Background grid -->
      <div style="position:absolute; inset:0; background-image: linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px); background-size: 50px 50px; pointer-events:none;"></div>
      
      <!-- Glow orbs -->
      <div style="position:absolute; top:-200px; left:-200px; width:600px; height:600px; background:radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%); pointer-events:none;"></div>
      <div style="position:absolute; bottom:-200px; right:-200px; width:600px; height:600px; background:radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%); pointer-events:none;"></div>

      <!-- Navigation -->
      <nav style="position:relative; z-index:10; display:flex; align-items:center; justify-content:space-between; padding:20px 60px; border-bottom:1px solid rgba(249,115,22,0.08);">
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="/static/logo.png" alt="QUAD" style="height:48px;" onerror="this.style.display='none'">
          <div>
            <div style="font-size:22px; font-weight:800; background: linear-gradient(135deg, #e83a00, #f97316, #f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">QUAD</div>
            <div style="font-size:10px; color:#6b7280; letter-spacing:0.2em; margin-top:-2px;">DECISIVE SIGNALS</div>
          </div>
        </div>
        <div style="display:flex; gap:12px;">
          <button onclick="navigate('login')" class="btn-secondary" style="padding:10px 24px; font-size:14px;">로그인</button>
          <button onclick="navigate('register')" class="btn-primary" style="padding:10px 24px; font-size:14px;">무료 가입</button>
        </div>
      </nav>

      <!-- Hero Section -->
      <div style="position:relative; z-index:10; text-align:center; padding: 100px 20px 80px;">
        
        <div style="display:inline-flex; align-items:center; gap:8px; background:rgba(249,115,22,0.1); border:1px solid rgba(249,115,22,0.2); border-radius:20px; padding:8px 20px; margin-bottom:32px;">
          <div style="width:8px; height:8px; background:#22c55e; border-radius:50%; animation: glow 2s ease-in-out infinite;"></div>
          <span style="font-size:13px; color:#f97316; font-weight:600;">실시간 주식 시그널 서비스 운영 중</span>
        </div>

        <h1 style="font-size: clamp(36px, 6vw, 72px); font-weight:900; line-height:1.1; margin-bottom:24px;">
          <span style="color:white;">한국 주식 시장의</span><br>
          <span style="background: linear-gradient(135deg, #e83a00, #f97316, #f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">결정적 시그널</span>
        </h1>

        <p style="font-size: clamp(16px, 2vw, 20px); color:#9ca3af; max-width:600px; margin:0 auto 48px; line-height:1.7;">
          코스피·코스닥 핵심 종목의 매수/매도 시그널을 실시간으로 제공합니다.<br>
          뉴스와 연동된 관련 종목 분석으로 투자 기회를 포착하세요.
        </p>

        <div style="display:flex; gap:16px; justify-content:center; flex-wrap:wrap;">
          <button onclick="navigate('register')" class="btn-primary" style="padding:16px 40px; font-size:16px; border-radius:12px;">
            <i class="fas fa-rocket" style="margin-right:8px;"></i>지금 시작하기
          </button>
          <button onclick="navigate('login')" class="btn-secondary" style="padding:16px 40px; font-size:16px; border-radius:12px;">
            <i class="fas fa-sign-in-alt" style="margin-right:8px;"></i>로그인
          </button>
        </div>
      </div>

      <!-- Stats bar -->
      <div style="position:relative; z-index:10; display:flex; justify-content:center; gap:60px; padding:40px 20px; border-top:1px solid rgba(249,115,22,0.08); border-bottom:1px solid rgba(249,115,22,0.08); background:rgba(8,13,20,0.5); flex-wrap:wrap;">
        ${[
          { num: '200+', label: '분석 종목', icon: 'fas fa-chart-bar' },
          { num: '98.5%', label: '시그널 정확도', icon: 'fas fa-bullseye' },
          { num: '24/7', label: '실시간 모니터링', icon: 'fas fa-satellite-dish' },
          { num: '10K+', label: '활성 회원', icon: 'fas fa-users' },
        ].map(s => `
          <div style="text-align:center;">
            <div style="color:var(--brand-orange); font-size:13px; margin-bottom:8px;"><i class="${s.icon}"></i></div>
            <div style="font-size:32px; font-weight:900; background:linear-gradient(135deg,#f97316,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">${s.num}</div>
            <div style="font-size:13px; color:#6b7280; margin-top:4px;">${s.label}</div>
          </div>
        `).join('')}
      </div>

      <!-- Features Section -->
      <div style="position:relative; z-index:10; padding: 80px 60px; max-width:1200px; margin:0 auto;">
        <h2 style="text-align:center; font-size:36px; font-weight:800; margin-bottom:16px;">
          <span style="color:white;">왜 </span>
          <span style="background:linear-gradient(135deg,#f97316,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">QUAD</span>
          <span style="color:white;">인가?</span>
        </h2>
        <p style="text-align:center; color:#6b7280; margin-bottom:60px; font-size:16px;">전문가 수준의 투자 시그널을 누구나 쉽게</p>
        
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
          ${[
            { icon: '📈', title: '실시간 매수/매도 시그널', desc: '코스피·코스닥 주요 종목의 기술적·기본적 분석을 결합한 고정확도 시그널을 실시간으로 제공합니다.' },
            { icon: '📰', title: '뉴스 종목 연동 분석', desc: '네이버 금융 뉴스와 관련 주식 종목을 자동으로 매핑하여 뉴스의 투자 영향력을 즉시 파악할 수 있습니다.' },
            { icon: '🔒', title: '검증된 회원 전용 서비스', desc: '관리자 승인 시스템으로 신뢰할 수 있는 회원만 이용 가능한 프리미엄 서비스입니다.' },
            { icon: '⚡', title: '시그널 강도 표시', desc: '매수/매도 신호의 강도를 0-100% 수치로 표시하여 투자 결정의 확신도를 한눈에 확인할 수 있습니다.' },
            { icon: '🏆', title: '코스피·코스닥 전문', desc: '한국 주식 시장에 특화된 분석으로 삼성전자부터 코스닥 성장주까지 폭넓은 종목을 다룹니다.' },
            { icon: '📊', title: '전문 대시보드', desc: '직관적인 인터페이스로 시장 전체 현황을 한눈에 파악하고 원하는 종목을 빠르게 확인하세요.' },
          ].map(f => `
            <div class="glass-card" style="padding:28px;">
              <div style="font-size:40px; margin-bottom:16px;">${f.icon}</div>
              <h3 style="font-size:18px; font-weight:700; color:white; margin-bottom:10px;">${f.title}</h3>
              <p style="font-size:14px; color:#6b7280; line-height:1.7;">${f.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- CTA Section -->
      <div style="position:relative; z-index:10; text-align:center; padding: 80px 20px; background: rgba(249,115,22,0.03);">
        <h2 style="font-size:40px; font-weight:900; color:white; margin-bottom:16px;">지금 바로 시작하세요</h2>
        <p style="color:#9ca3af; font-size:16px; margin-bottom:40px;">회원가입 후 관리자 승인을 받으면 모든 서비스를 이용할 수 있습니다.</p>
        <button onclick="navigate('register')" class="btn-primary" style="padding:18px 56px; font-size:18px; border-radius:14px;">
          <i class="fas fa-user-plus" style="margin-right:10px;"></i>무료 회원가입
        </button>
      </div>

      <!-- Footer -->
      <footer style="position:relative; z-index:10; padding:40px 60px; border-top:1px solid rgba(249,115,22,0.08); text-align:center;">
        <div style="display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:16px;">
          <img src="/static/logo.png" alt="QUAD" style="height:32px;" onerror="this.style.display='none'">
          <span style="font-weight:700; font-size:16px; background:linear-gradient(135deg,#f97316,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">QUAD DECISIVE SIGNALS</span>
        </div>
        <p style="color:#374151; font-size:13px;">© 2024 QUAD Decisive Signals. 본 서비스는 투자 참고용이며, 투자 결정에 대한 책임은 투자자 본인에게 있습니다.</p>
      </footer>
    </div>
  `
  
  // Create particles
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
    <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, #080d14, #0d1117); position:relative; overflow:hidden; padding:20px;">
      
      <!-- Background effects -->
      <div style="position:absolute; inset:0; background-image:linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px); background-size:50px 50px;"></div>
      <div style="position:absolute; top:-200px; left:-200px; width:500px; height:500px; background:radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%);"></div>
      
      <div style="position:relative; z-index:10; width:100%; max-width:440px;">
        
        <!-- Logo -->
        <div style="text-align:center; margin-bottom:40px;">
          <img src="/static/logo.png" alt="QUAD" style="height:72px; margin-bottom:16px;" onerror="this.style.display='none'">
          <h1 style="font-size:28px; font-weight:900; background:linear-gradient(135deg,#e83a00,#f97316,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">QUAD</h1>
          <p style="color:#6b7280; font-size:12px; letter-spacing:0.2em; margin-top:4px;">DECISIVE SIGNALS</p>
        </div>

        <!-- Card -->
        <div style="background:rgba(22,27,34,0.9); border:1px solid rgba(249,115,22,0.15); border-radius:20px; padding:40px; backdrop-filter:blur(20px);">
          <h2 style="font-size:22px; font-weight:700; color:white; margin-bottom:8px;">로그인</h2>
          <p style="color:#6b7280; font-size:14px; margin-bottom:28px;">서비스를 이용하려면 로그인이 필요합니다</p>

          <div id="login-error" style="display:none;" class="alert-error" style="margin-bottom:16px;"></div>

          <form onsubmit="handleLogin(event)">
            <div style="margin-bottom:20px;">
              <label style="display:block; font-size:13px; font-weight:600; color:#9ca3af; margin-bottom:8px;">아이디</label>
              <div style="position:relative;">
                <i class="fas fa-user" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:14px;"></i>
                <input type="text" id="login-username" class="form-input" placeholder="아이디를 입력하세요" style="padding-left:40px;" required>
              </div>
            </div>
            
            <div style="margin-bottom:28px;">
              <label style="display:block; font-size:13px; font-weight:600; color:#9ca3af; margin-bottom:8px;">비밀번호</label>
              <div style="position:relative;">
                <i class="fas fa-lock" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:14px;"></i>
                <input type="password" id="login-password" class="form-input" placeholder="비밀번호를 입력하세요" style="padding-left:40px;" required>
              </div>
            </div>

            <button type="submit" class="btn-primary" style="width:100%; padding:14px; font-size:16px; border-radius:12px;" id="login-btn">
              <i class="fas fa-sign-in-alt" style="margin-right:8px;"></i>로그인
            </button>
          </form>

          <div class="divider" style="margin:24px 0;"></div>
          
          <p style="text-align:center; color:#6b7280; font-size:14px;">
            계정이 없으신가요?
            <button onclick="navigate('register')" style="background:none; border:none; color:var(--brand-orange); font-weight:600; cursor:pointer; font-size:14px;">회원가입</button>
          </p>

          <div style="margin-top:16px; padding:14px; background:rgba(249,115,22,0.05); border-radius:10px; border:1px solid rgba(249,115,22,0.1);">
            <p style="font-size:12px; color:#6b7280; text-align:center;">
              <i class="fas fa-info-circle" style="color:var(--brand-orange); margin-right:6px;"></i>
              회원가입 후 관리자 승인이 필요합니다
            </p>
          </div>
        </div>

        <p style="text-align:center; margin-top:24px;">
          <button onclick="navigate('landing')" style="background:none; border:none; color:#4b5563; font-size:13px; cursor:pointer;">
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
    <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, #080d14, #0d1117); position:relative; overflow:hidden; padding:20px;">
      
      <div style="position:absolute; inset:0; background-image:linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px); background-size:50px 50px;"></div>
      
      <div style="position:relative; z-index:10; width:100%; max-width:480px;">
        
        <div style="text-align:center; margin-bottom:32px;">
          <img src="/static/logo.png" alt="QUAD" style="height:60px; margin-bottom:12px;" onerror="this.style.display='none'">
          <h1 style="font-size:24px; font-weight:900; background:linear-gradient(135deg,#e83a00,#f97316,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">QUAD</h1>
          <p style="color:#6b7280; font-size:11px; letter-spacing:0.2em;">DECISIVE SIGNALS</p>
        </div>

        <div style="background:rgba(22,27,34,0.9); border:1px solid rgba(249,115,22,0.15); border-radius:20px; padding:36px; backdrop-filter:blur(20px);">
          <h2 style="font-size:22px; font-weight:700; color:white; margin-bottom:8px;">회원가입</h2>
          <p style="color:#6b7280; font-size:13px; margin-bottom:24px;">아래 정보를 입력하면 관리자 승인 후 이용 가능합니다</p>

          <div id="register-msg" style="display:none; margin-bottom:16px;"></div>

          <form onsubmit="handleRegister(event)">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
              <div>
                <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">아이디 *</label>
                <div style="position:relative;">
                  <i class="fas fa-user" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;"></i>
                  <input type="text" id="reg-username" class="form-input" placeholder="아이디" style="padding-left:36px; padding-top:10px; padding-bottom:10px;" required>
                </div>
              </div>
              <div>
                <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">이름 *</label>
                <div style="position:relative;">
                  <i class="fas fa-id-card" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;"></i>
                  <input type="text" id="reg-name" class="form-input" placeholder="실명" style="padding-left:36px; padding-top:10px; padding-bottom:10px;" required>
                </div>
              </div>
            </div>

            <div style="margin-bottom:16px;">
              <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">이메일 *</label>
              <div style="position:relative;">
                <i class="fas fa-envelope" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;"></i>
                <input type="email" id="reg-email" class="form-input" placeholder="이메일 주소" style="padding-left:40px;" required>
              </div>
            </div>

            <div style="margin-bottom:16px;">
              <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">전화번호 *</label>
              <div style="position:relative;">
                <i class="fas fa-phone" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;"></i>
                <input type="tel" id="reg-phone" class="form-input" placeholder="010-0000-0000" style="padding-left:40px;" required>
              </div>
            </div>

            <div style="margin-bottom:16px;">
              <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">비밀번호 * (8자 이상)</label>
              <div style="position:relative;">
                <i class="fas fa-lock" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;"></i>
                <input type="password" id="reg-password" class="form-input" placeholder="비밀번호 (8자 이상)" style="padding-left:40px;" required minlength="8">
              </div>
            </div>

            <div style="margin-bottom:24px;">
              <label style="display:block; font-size:12px; font-weight:600; color:#9ca3af; margin-bottom:6px;">비밀번호 확인 *</label>
              <div style="position:relative;">
                <i class="fas fa-lock" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#4b5563; font-size:13px;"></i>
                <input type="password" id="reg-confirm" class="form-input" placeholder="비밀번호 재입력" style="padding-left:40px;" required>
              </div>
            </div>

            <button type="submit" class="btn-primary" style="width:100%; padding:14px; font-size:15px; border-radius:12px;" id="reg-btn">
              <i class="fas fa-user-plus" style="margin-right:8px;"></i>회원가입 신청
            </button>
          </form>

          <div class="divider" style="margin:20px 0;"></div>
          
          <p style="text-align:center; color:#6b7280; font-size:13px;">
            이미 계정이 있으신가요?
            <button onclick="navigate('login')" style="background:none; border:none; color:var(--brand-orange); font-weight:600; cursor:pointer; font-size:13px;">로그인</button>
          </p>
        </div>

        <p style="text-align:center; margin-top:20px;">
          <button onclick="navigate('landing')" style="background:none; border:none; color:#4b5563; font-size:13px; cursor:pointer;">
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
  // navbar=64px, ticker=36px => sidebar/main top = 100px
  app.innerHTML = `
    <!-- Navbar (fixed, z=1000) -->
    <nav style="
      position:fixed; top:0; left:0; right:0; height:64px; z-index:1000;
      background:rgba(8,13,20,0.97); backdrop-filter:blur(20px);
      border-bottom:1px solid rgba(249,115,22,0.12);
      display:flex; align-items:center; justify-content:space-between; padding:0 20px;
    ">
      <div style="display:flex; align-items:center; gap:10px;">
        <button onclick="toggleSidebar()" style="background:none; border:none; color:#9ca3af; cursor:pointer; font-size:18px; padding:6px 10px; border-radius:8px; transition:background 0.2s;"
          onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='none'">
          <i class="fas fa-bars"></i>
        </button>
        <img src="/static/logo.png" alt="QUAD" style="height:38px;" onerror="this.style.display='none'">
        <div style="line-height:1;">
          <div style="font-weight:800; font-size:17px; background:linear-gradient(135deg,#f97316,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">QUAD</div>
          <div style="font-size:9px; color:#4b5563; letter-spacing:0.15em; margin-top:1px;">DECISIVE SIGNALS</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:14px;">
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:7px; height:7px; background:#22c55e; border-radius:50%; box-shadow:0 0 6px #22c55e;"></div>
          <span style="font-size:11px; color:#22c55e; font-weight:700; letter-spacing:0.05em;">LIVE</span>
        </div>
        <div style="width:1px; height:22px; background:rgba(255,255,255,0.06);"></div>
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:34px; height:34px; background:linear-gradient(135deg,#e83a00,#f59e0b); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; color:white; flex-shrink:0;">
            ${(currentUser?.name?.[0] || 'U').toUpperCase()}
          </div>
          <div style="line-height:1.3;">
            <div style="font-size:13px; font-weight:600; color:white;">${currentUser?.name || '사용자'}</div>
            <div style="font-size:10px; color:#4b5563;">일반 회원</div>
          </div>
        </div>
        <button onclick="handleLogout()" title="로그아웃"
          style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); color:#ef4444; padding:7px 14px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; transition:all 0.2s;"
          onmouseover="this.style.background='rgba(239,68,68,0.18)'" onmouseout="this.style.background='rgba(239,68,68,0.08)'">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </nav>

    <!-- Ticker Tape (fixed, z=999, top=64px) -->
    <div style="
      position:fixed; top:64px; left:0; right:0; z-index:999;
      background:rgba(8,13,20,0.95); border-bottom:1px solid rgba(249,115,22,0.08);
      overflow:hidden; white-space:nowrap; height:34px; display:flex; align-items:center;
    ">
      <div style="display:inline-block; animation:ticker 40s linear infinite; padding-left:100%;">
        <span style="font-size:12px; color:#9ca3af;">
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

    <!-- Sidebar (fixed, top=98px, z=100) -->
    <aside id="sidebar" style="
      position:fixed; top:98px; left:0; bottom:0; width:240px; z-index:100;
      background:rgba(10,14,20,0.98); border-right:1px solid rgba(249,115,22,0.08);
      overflow-y:auto; padding:12px 0; transition:transform 0.3s ease;
    ">
      <div style="padding:0 16px 12px; margin-bottom:4px;">
        <p style="font-size:10px; font-weight:700; color:#374151; letter-spacing:0.12em; text-transform:uppercase;">메인 메뉴</p>
      </div>
      ${[
        { id: 'dashboard', icon: 'fas fa-tachometer-alt', label: '대시보드', badge: '' },
        { id: 'signals',   icon: 'fas fa-signal',         label: '주가 시그널', badge: '' },
        { id: 'kospi',     icon: 'fas fa-chart-line',     label: 'KOSPI', badge: '' },
        { id: 'kosdaq',    icon: 'fas fa-chart-bar',      label: 'KOSDAQ', badge: '' },
        { id: 'news',      icon: 'fas fa-newspaper',      label: '뉴스 & 종목 추천', badge: 'LIVE' },
      ].map(item => `
        <div class="sidebar-item ${page === item.id ? 'active' : ''}" onclick="navigate('${item.id}')"
          style="${item.id === 'news' ? 'border-left: 2px solid rgba(249,115,22,0.4);' : ''}">
          <i class="${item.icon}" style="width:16px; text-align:center; font-size:14px;"></i>
          <span style="font-size:14px; flex:1;">${item.label}</span>
          ${item.badge ? `<span style="font-size:9px; font-weight:800; color:#22c55e; background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.25); border-radius:4px; padding:1px 5px; letter-spacing:0.05em;">${item.badge}</span>` : ''}
        </div>
      `).join('')}

      <div style="margin: 16px 16px 0; padding-top:16px; border-top:1px solid rgba(255,255,255,0.04);">
        <p style="font-size:10px; font-weight:700; color:#374151; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px;">계정</p>
      </div>
      <div class="sidebar-item" onclick="handleLogout()">
        <i class="fas fa-sign-out-alt" style="width:16px; text-align:center; font-size:14px; color:#ef4444;"></i>
        <span style="font-size:14px; color:#ef4444;">로그아웃</span>
      </div>
    </aside>

    <!-- Main Content (margin-left=240px, margin-top=98px) -->
    <main id="main-content" style="
      margin-left:240px; margin-top:98px;
      padding:28px 28px 40px;
      min-height:calc(100vh - 98px);
      box-sizing:border-box;
    ">
      <div id="page-content"></div>
    </main>
  `

  // Render page content
  if (page === 'dashboard') renderDashboard()
  else if (page === 'signals') renderSignals()
  else if (page === 'kospi') renderMarket('KOSPI')
  else if (page === 'kosdaq') renderMarket('KOSDAQ')
  else if (page === 'news') renderNews()
  else renderDashboard()
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar')
  const main = document.getElementById('main-content')
  if (!sidebar) return
  const isHidden = sidebar.style.transform === 'translateX(-100%)'
  sidebar.style.transform = isHidden ? 'translateX(0)' : 'translateX(-100%)'
}

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
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:28px;">
      <div>
        <h1 style="font-size:26px; font-weight:800; color:white;">대시보드</h1>
        <p style="color:#6b7280; font-size:14px; margin-top:4px;">주식 시그널 현황을 한눈에 확인하세요</p>
      </div>
      <div style="font-size:13px; color:#4b5563;"><i class="fas fa-clock" style="margin-right:6px;"></i>${new Date().toLocaleString('ko-KR')}</div>
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

    document.getElementById('dashboard-content').innerHTML = `
      <!-- Stats Row -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:28px;">
        ${[
          { label: '매수 시그널', value: summary.buyCount + (stocks.filter(s=>s.signal==='BUY').length), icon: 'fas fa-arrow-up', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { label: '매도 시그널', value: summary.sellCount + (stocks.filter(s=>s.signal==='SELL').length), icon: 'fas fa-arrow-down', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { label: '분석 종목', value: stocks.length, icon: 'fas fa-chart-pie', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
          { label: '시그널 정확도', value: '98.5%', icon: 'fas fa-bullseye', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        ].map(stat => `
          <div class="stat-card">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
              <span style="font-size:13px; color:#6b7280; font-weight:500;">${stat.label}</span>
              <div style="width:40px; height:40px; background:${stat.bg}; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                <i class="${stat.icon}" style="color:${stat.color}; font-size:16px;"></i>
              </div>
            </div>
            <div style="font-size:32px; font-weight:800; color:${stat.color};">${stat.value}</div>
          </div>
        `).join('')}
      </div>

      <!-- Two columns -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:28px;">
        
        <!-- Strong Buy Signals -->
        <div style="background:rgba(22,27,34,0.8); border:1px solid rgba(34,197,94,0.15); border-radius:16px; padding:20px;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
            <div style="width:10px; height:10px; background:#22c55e; border-radius:50%; box-shadow:0 0 10px #22c55e;"></div>
            <h3 style="font-size:15px; font-weight:700; color:white;">강력 매수 종목</h3>
          </div>
          ${stocks.filter(s => s.signal === 'BUY').slice(0, 5).map(s => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="${s.market === 'KOSPI' ? 'badge-kospi' : 'badge-kosdaq'}">${s.market}</span>
                <div>
                  <div style="font-size:14px; font-weight:600; color:white;">${s.name}</div>
                  <div style="font-size:12px; color:#6b7280;">${s.code}</div>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:14px; font-weight:700; color:#22c55e;">${(s.price||0).toLocaleString()}원</div>
                <div style="font-size:12px; color:${(s.changeRate||0) >= 0 ? '#ef4444' : '#3b82f6'};">${(s.changeRate||0) >= 0 ? '+' : ''}${(s.changeRate||0).toFixed(2)}%</div>
              </div>
            </div>
          `).join('')}
          ${stocks.filter(s => s.signal === 'BUY').length === 0 ? '<div style="text-align:center; color:#4b5563; padding:20px;">시그널 데이터 없음</div>' : ''}
        </div>

        <!-- Strong Sell Signals -->
        <div style="background:rgba(22,27,34,0.8); border:1px solid rgba(239,68,68,0.15); border-radius:16px; padding:20px;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
            <div style="width:10px; height:10px; background:#ef4444; border-radius:50%; box-shadow:0 0 10px #ef4444;"></div>
            <h3 style="font-size:15px; font-weight:700; color:white;">주의 종목</h3>
          </div>
          ${stocks.filter(s => s.signal === 'SELL').slice(0, 5).map(s => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="${s.market === 'KOSPI' ? 'badge-kospi' : 'badge-kosdaq'}">${s.market}</span>
                <div>
                  <div style="font-size:14px; font-weight:600; color:white;">${s.name}</div>
                  <div style="font-size:12px; color:#6b7280;">${s.code}</div>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:14px; font-weight:700; color:#ef4444;">${(s.price||0).toLocaleString()}원</div>
                <div style="font-size:12px; color:${(s.changeRate||0) >= 0 ? '#ef4444' : '#3b82f6'};">${(s.changeRate||0) >= 0 ? '+' : ''}${(s.changeRate||0).toFixed(2)}%</div>
              </div>
            </div>
          `).join('')}
          ${stocks.filter(s => s.signal === 'SELL').length === 0 ? '<div style="text-align:center; color:#4b5563; padding:20px;">시그널 데이터 없음</div>' : ''}
        </div>
      </div>

      <!-- All Stocks Table -->
      <div style="background:rgba(22,27,34,0.8); border:1px solid rgba(249,115,22,0.08); border-radius:16px; overflow:hidden;">
        <div style="padding:20px 24px; border-bottom:1px solid var(--brand-border); display:flex; align-items:center; justify-content:space-between;">
          <h3 style="font-size:16px; font-weight:700; color:white;">주요 종목 시그널</h3>
          <button onclick="navigate('signals')" style="background:rgba(249,115,22,0.1); border:1px solid rgba(249,115,22,0.2); color:var(--brand-orange); padding:6px 16px; border-radius:8px; font-size:13px; cursor:pointer; font-weight:600;">전체보기</button>
        </div>
        <div style="overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>종목명</th>
                <th>시장</th>
                <th>현재가</th>
                <th>등락률</th>
                <th>시그널</th>
                <th>강도</th>
                <th>거래량</th>
              </tr>
            </thead>
            <tbody>
              ${stocks.slice(0, 10).map(s => `
                <tr>
                  <td>
                    <div style="font-weight:600; color:white; font-size:14px;">${s.name}</div>
                    <div style="font-size:12px; color:#4b5563;">${s.code}</div>
                  </td>
                  <td><span class="${s.market === 'KOSPI' ? 'badge-kospi' : 'badge-kosdaq'}">${s.market}</span></td>
                  <td style="font-weight:700; color:white;">${(s.price||0).toLocaleString()}원</td>
                  <td class="${(s.changeRate||0) >= 0 ? 'price-up' : 'price-down'}" style="font-weight:600;">
                    ${(s.changeRate||0) >= 0 ? '▲' : '▼'} ${Math.abs(s.changeRate||0).toFixed(2)}%
                  </td>
                  <td><span class="signal-${(s.signal||'HOLD').toLowerCase()}">${s.signal||'HOLD'}</span></td>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <div class="strength-bar" style="width:80px;">
                        <div class="strength-fill" style="width:${s.strength||50}%; background:${(s.signal==='BUY') ? '#22c55e' : (s.signal==='SELL') ? '#ef4444' : '#f59e0b'};"></div>
                      </div>
                      <span style="font-size:12px; color:#6b7280;">${s.strength||50}%</span>
                    </div>
                  </td>
                  <td style="color:#6b7280; font-size:13px;">${(s.volume||0).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 빠른 이동 배너 -->
      <div onclick="navigate('news')" style="
        margin-top:20px; padding:18px 24px; border-radius:16px; cursor:pointer;
        background:linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(245,158,11,0.05) 100%);
        border:1px solid rgba(249,115,22,0.2);
        display:flex; align-items:center; justify-content:space-between;
        transition:all 0.3s ease;
      "
      onmouseover="this.style.borderColor='rgba(249,115,22,0.4)'; this.style.background='linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(245,158,11,0.08) 100%)'"
      onmouseout="this.style.borderColor='rgba(249,115,22,0.2)'; this.style.background='linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(245,158,11,0.05) 100%)'">
        <div style="display:flex; align-items:center; gap:14px;">
          <div style="width:46px; height:46px; background:var(--brand-gradient); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">
            📰
          </div>
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:3px;">
              <span style="font-size:16px; font-weight:700; color:white;">실시간 뉴스 & 종목 추천</span>
              <span style="font-size:10px; font-weight:800; color:#22c55e; background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.25); border-radius:4px; padding:2px 6px;">● LIVE</span>
            </div>
            <p style="font-size:13px; color:#6b7280;">최신 금융 뉴스와 관련 종목 시그널 · 매수 추천 TOP5 · 섹터 강도 분석을 실시간으로 확인하세요</p>
          </div>
        </div>
        <div style="color:var(--brand-orange); font-size:20px; flex-shrink:0;">
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
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:28px;">
      <div>
        <h1 style="font-size:26px; font-weight:800; color:white;">주가 시그널</h1>
        <p style="color:#6b7280; font-size:14px; margin-top:4px;">KOSPI·KOSDAQ 전 종목 매수/매도 시그널</p>
      </div>
    </div>

    <!-- Filters -->
    <div style="display:flex; gap:12px; margin-bottom:24px; flex-wrap:wrap; align-items:center;">
      <div style="display:flex; gap:8px;">
        <button class="tab-btn active" id="tab-all" onclick="filterSignals('ALL', 'ALL')">전체</button>
        <button class="tab-btn" id="tab-kospi" onclick="filterSignals('KOSPI', 'ALL')">KOSPI</button>
        <button class="tab-btn" id="tab-kosdaq" onclick="filterSignals('KOSDAQ', 'ALL')">KOSDAQ</button>
      </div>
      <div style="width:1px; height:32px; background:var(--brand-border);"></div>
      <div style="display:flex; gap:8px;">
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
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; margin-bottom:24px;">
        <div style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); border-radius:14px; padding:20px; text-align:center;">
          <div style="font-size:32px; font-weight:800; color:#22c55e;">${stocks.filter(s=>s.signal==='BUY').length}</div>
          <div style="font-size:13px; color:#6b7280; margin-top:4px;">매수 시그널</div>
        </div>
        <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:14px; padding:20px; text-align:center;">
          <div style="font-size:32px; font-weight:800; color:#ef4444;">${stocks.filter(s=>s.signal==='SELL').length}</div>
          <div style="font-size:13px; color:#6b7280; margin-top:4px;">매도 시그널</div>
        </div>
        <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:14px; padding:20px; text-align:center;">
          <div style="font-size:32px; font-weight:800; color:#f59e0b;">${stocks.filter(s=>s.signal==='HOLD').length}</div>
          <div style="font-size:13px; color:#6b7280; margin-top:4px;">홀드 종목</div>
        </div>
      </div>

      <!-- Stocks Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:16px;">
        ${stocks.map(s => `
          <div class="glass-card" style="padding:20px; cursor:pointer;" onclick="showStockDetail('${s.code}', '${s.name}')">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
              <div>
                <div style="font-size:15px; font-weight:700; color:white;">${s.name}</div>
                <div style="font-size:12px; color:#4b5563; margin-top:2px;">${s.code}</div>
              </div>
              <span class="signal-${(s.signal||'HOLD').toLowerCase()}">${s.signal||'HOLD'}</span>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
              <div>
                <div style="font-size:22px; font-weight:800; color:white;">${(s.price||0).toLocaleString()}<span style="font-size:13px; color:#6b7280; font-weight:400;">원</span></div>
                <div style="font-size:13px; class="${(s.changeRate||0) >= 0 ? 'price-up' : 'price-down'}; margin-top:2px; color:${(s.changeRate||0) >= 0 ? '#ef4444' : '#3b82f6'}; font-weight:600;">
                  ${(s.changeRate||0) >= 0 ? '▲' : '▼'} ${Math.abs(s.changeRate||0).toFixed(2)}% (${(s.change||0) >= 0 ? '+' : ''}${(s.change||0).toLocaleString()})
                </div>
              </div>
              <span class="${s.market === 'KOSPI' ? 'badge-kospi' : 'badge-kosdaq'}">${s.market}</span>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span style="font-size:12px; color:#6b7280;">시그널 강도</span>
                <span style="font-size:12px; font-weight:700; color:${(s.signal==='BUY') ? '#22c55e' : (s.signal==='SELL') ? '#ef4444' : '#f59e0b'};">${s.strength||50}%</span>
              </div>
              <div class="strength-bar">
                <div class="strength-fill" style="width:${s.strength||50}%; background:${(s.signal==='BUY') ? 'linear-gradient(90deg,#16a34a,#22c55e)' : (s.signal==='SELL') ? 'linear-gradient(90deg,#b91c1c,#ef4444)' : 'linear-gradient(90deg,#b45309,#f59e0b)'};"></div>
              </div>
            </div>

            <div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.04);">
              <span style="font-size:11px; color:#374151;"><i class="fas fa-exchange-alt" style="margin-right:4px;"></i>거래량 ${(s.volume||0).toLocaleString()}</span>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${stocks.length === 0 ? '<div style="text-align:center; color:#4b5563; padding:60px; font-size:16px;"><i class="fas fa-inbox" style="font-size:40px; display:block; margin-bottom:16px;"></i>해당 조건의 시그널이 없습니다</div>' : ''}
    `
  } catch (err) {
    content.innerHTML = '<div style="color:#ef4444; padding:20px;">데이터 로드 실패</div>'
  }
}

// ============================================================
// MARKET PAGE (KOSPI / KOSDAQ)
// ============================================================
async function renderMarket(market) {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div style="margin-bottom:28px;">
      <h1 style="font-size:26px; font-weight:800; color:white;">${market} 시장</h1>
      <p style="color:#6b7280; font-size:14px; margin-top:4px;">${market === 'KOSPI' ? '코스피' : '코스닥'} 상장 종목 시그널 분석</p>
    </div>
    <div id="market-content">
      <div style="display:flex; justify-content:center; padding:60px;"><div class="spinner"></div></div>
    </div>
  `

  try {
    const res = await api.get(`/stocks/${market.toLowerCase()}`)
    const stocks = res.success ? res.stocks : []

    document.getElementById('market-content').innerHTML = `
      <!-- Market Overview -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:28px;">
        ${[
          { label: '전체 종목', value: stocks.length, color: '#f97316' },
          { label: '매수 시그널', value: stocks.filter(s=>s.signal==='BUY').length, color: '#22c55e' },
          { label: '매도 시그널', value: stocks.filter(s=>s.signal==='SELL').length, color: '#ef4444' },
          { label: '평균 강도', value: Math.round(stocks.reduce((a,s)=>a+(s.strength||50),0)/stocks.length||0) + '%', color: '#f59e0b' },
        ].map(stat => `
          <div class="stat-card" style="text-align:center;">
            <div style="font-size:36px; font-weight:900; color:${stat.color}; margin-bottom:8px;">${stat.value}</div>
            <div style="font-size:13px; color:#6b7280;">${stat.label}</div>
          </div>
        `).join('')}
      </div>

      <!-- Table -->
      <div style="background:rgba(22,27,34,0.8); border:1px solid rgba(249,115,22,0.08); border-radius:16px; overflow:hidden;">
        <div style="padding:20px 24px; border-bottom:1px solid var(--brand-border);">
          <h3 style="font-size:16px; font-weight:700; color:white;">${market} 종목 시그널 현황</h3>
        </div>
        <div style="overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>종목명</th>
                <th>현재가</th>
                <th>등락</th>
                <th>등락률</th>
                <th>시그널</th>
                <th>시그널 강도</th>
                <th>거래량</th>
              </tr>
            </thead>
            <tbody>
              ${stocks.map(s => `
                <tr onclick="showStockDetail('${s.code}', '${s.name}')" style="cursor:pointer;">
                  <td>
                    <div style="font-weight:600; color:white;">${s.name}</div>
                    <div style="font-size:11px; color:#4b5563;">${s.code}</div>
                  </td>
                  <td style="font-weight:700; color:white;">${(s.price||0).toLocaleString()}</td>
                  <td style="color:${(s.change||0) >= 0 ? '#ef4444' : '#3b82f6'}; font-weight:600;">
                    ${(s.change||0) >= 0 ? '+' : ''}${(s.change||0).toLocaleString()}
                  </td>
                  <td style="color:${(s.changeRate||0) >= 0 ? '#ef4444' : '#3b82f6'}; font-weight:700;">
                    ${(s.changeRate||0) >= 0 ? '▲' : '▼'} ${Math.abs(s.changeRate||0).toFixed(2)}%
                  </td>
                  <td><span class="signal-${(s.signal||'HOLD').toLowerCase()}">${s.signal||'HOLD'}</span></td>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <div class="strength-bar" style="width:100px;">
                        <div class="strength-fill" style="width:${s.strength||50}%; background:${s.signal==='BUY'?'#22c55e':s.signal==='SELL'?'#ef4444':'#f59e0b'};"></div>
                      </div>
                      <span style="font-size:12px; color:#9ca3af; min-width:30px;">${s.strength||50}%</span>
                    </div>
                  </td>
                  <td style="color:#6b7280; font-size:13px;">${(s.volume||0).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  } catch (err) {
    document.getElementById('market-content').innerHTML = '<div style="color:#ef4444; padding:20px;">데이터 로드 실패</div>'
  }
}

// ============================================================
// NEWS & RECOMMEND PAGE  (실시간 자동 갱신)
// ============================================================

let newsRefreshTimer = null   // 자동 갱신 타이머
let newsCountdown   = 30      // 카운트다운 초

async function renderNews() {
  const content = document.getElementById('page-content')
  if (!content) return

  // 이전 타이머 정리
  if (newsRefreshTimer) { clearInterval(newsRefreshTimer); newsRefreshTimer = null }

  content.innerHTML = `
    <!-- 헤더 -->
    <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:14px;">
      <div>
        <h1 style="font-size:26px; font-weight:800; color:white; display:flex; align-items:center; gap:10px;">
          <i class="fas fa-newspaper" style="color:var(--brand-orange);"></i>
          실시간 뉴스 &amp; 종목 추천
        </h1>
        <p style="color:#6b7280; font-size:13px; margin-top:6px;">
          최신 금융 뉴스와 뉴스 기반 관련 종목 추천을 실시간으로 제공합니다
        </p>
      </div>
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <!-- 검색 -->
        <div style="display:flex; gap:8px;">
          <input type="text" id="news-search"
            class="form-input"
            placeholder="종목·키워드 검색"
            style="width:190px; padding:9px 14px; font-size:13px;"
            onkeydown="if(event.key==='Enter') searchNews()">
          <button onclick="searchNews()" class="btn-primary" style="padding:9px 16px; font-size:13px; border-radius:8px;">
            <i class="fas fa-search"></i>
          </button>
        </div>
        <!-- 자동갱신 표시 -->
        <div style="display:flex; align-items:center; gap:8px; background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); border-radius:20px; padding:6px 14px;">
          <div id="live-dot" style="width:7px; height:7px; background:#22c55e; border-radius:50%; box-shadow:0 0 6px #22c55e; animation: glow 2s ease-in-out infinite;"></div>
          <span style="font-size:12px; color:#22c55e; font-weight:700;">LIVE</span>
          <span style="font-size:11px; color:#4b5563;" id="refresh-countdown">30초 후 갱신</span>
        </div>
        <button onclick="manualRefreshNews()" style="background:rgba(249,115,22,0.1); border:1px solid rgba(249,115,22,0.2); color:var(--brand-orange); padding:8px 14px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600;">
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>
    </div>

    <!-- 마지막 갱신 시각 -->
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:20px;">
      <i class="fas fa-clock" style="color:#4b5563; font-size:12px;"></i>
      <span style="font-size:12px; color:#4b5563;" id="last-updated">갱신 중...</span>
    </div>

    <!-- 2단 레이아웃: 좌(뉴스 목록) + 우(추천 패널) -->
    <div style="display:grid; grid-template-columns:1fr 340px; gap:20px; align-items:start;">

      <!-- 좌: 뉴스 목록 -->
      <div>
        <!-- 카테고리 탭 -->
        <div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap;">
          <button class="tab-btn active" id="ntab-all"    onclick="switchNewsTab('all',    '주식 코스피 코스닥')">전체</button>
          <button class="tab-btn"        id="ntab-kospi"  onclick="switchNewsTab('kospi',  'KOSPI 코스피')">KOSPI</button>
          <button class="tab-btn"        id="ntab-kosdaq" onclick="switchNewsTab('kosdaq', 'KOSDAQ 코스닥')">KOSDAQ</button>
          <button class="tab-btn"        id="ntab-bio"    onclick="switchNewsTab('bio',    '바이오 제약 임상')">바이오</button>
          <button class="tab-btn"        id="ntab-semi"   onclick="switchNewsTab('semi',   '반도체 AI 시스템반도체')">반도체·AI</button>
          <button class="tab-btn"        id="ntab-bat"    onclick="switchNewsTab('bat',    '2차전지 배터리 전기차')">2차전지</button>
          <button class="tab-btn"        id="ntab-robot"  onclick="switchNewsTab('robot',  '로봇 AI로봇')">로봇</button>
        </div>
        <div id="news-list">
          <div style="display:flex; justify-content:center; padding:60px;"><div class="spinner"></div></div>
        </div>
      </div>

      <!-- 우: 추천 사이드패널 -->
      <div style="position:sticky; top:20px;">
        <!-- 상단 추천 -->
        <div style="background:rgba(22,27,34,0.9); border:1px solid rgba(249,115,22,0.15); border-radius:16px; overflow:hidden; margin-bottom:16px;">
          <div style="padding:16px 18px; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:8px; height:8px; background:var(--brand-orange); border-radius:50%; box-shadow:0 0 8px var(--brand-orange);"></div>
              <span style="font-size:14px; font-weight:700; color:white;">TODAY 매수 추천 TOP 5</span>
            </div>
            <span style="font-size:11px; color:#4b5563;">강도순</span>
          </div>
          <div id="rec-buy-list">
            <div style="display:flex; justify-content:center; padding:30px;"><div class="spinner" style="width:28px; height:28px; border-width:2px;"></div></div>
          </div>
        </div>

        <!-- 섹터 히트맵 -->
        <div style="background:rgba(22,27,34,0.9); border:1px solid rgba(249,115,22,0.1); border-radius:16px; overflow:hidden; margin-bottom:16px;">
          <div style="padding:14px 18px; border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="font-size:13px; font-weight:700; color:white;"><i class="fas fa-fire" style="color:var(--brand-orange); margin-right:6px;"></i>섹터 강도</span>
          </div>
          <div id="sector-list" style="padding:12px 14px;">
            <div style="display:flex; justify-content:center; padding:20px;"><div class="spinner" style="width:24px; height:24px; border-width:2px;"></div></div>
          </div>
        </div>

        <!-- 주의 종목 -->
        <div style="background:rgba(22,27,34,0.9); border:1px solid rgba(239,68,68,0.12); border-radius:16px; overflow:hidden;">
          <div style="padding:14px 18px; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; align-items:center; gap:8px;">
            <div style="width:8px; height:8px; background:#ef4444; border-radius:50%; box-shadow:0 0 8px #ef4444;"></div>
            <span style="font-size:13px; font-weight:700; color:white;">주의 종목</span>
          </div>
          <div id="rec-sell-list">
            <div style="display:flex; justify-content:center; padding:20px;"><div class="spinner" style="width:24px; height:24px; border-width:2px;"></div></div>
          </div>
        </div>
      </div>
    </div>
  `

  // 초기 데이터 로드 (병렬)
  await Promise.all([
    loadNewsList('주식 코스피 코스닥'),
    loadRecommendPanel()
  ])

  // 카운트다운 + 자동 갱신
  newsCountdown = 30
  newsRefreshTimer = setInterval(async () => {
    newsCountdown--
    const el = document.getElementById('refresh-countdown')
    if (el) el.textContent = `${newsCountdown}초 후 갱신`

    if (newsCountdown <= 0) {
      newsCountdown = 30
      const query = window._currentNewsQuery || '주식 코스피 코스닥'
      await Promise.all([
        loadNewsList(query, true),   // true = silent (스피너 없이)
        loadRecommendPanel(true)
      ])
      const lu = document.getElementById('last-updated')
      if (lu) lu.textContent = `마지막 갱신: ${new Date().toLocaleTimeString('ko-KR')}`
    }
  }, 1000)
}

window._currentNewsQuery = '주식 코스피 코스닥'
window._currentNewsTab   = 'all'

async function switchNewsTab(tab, query) {
  // 탭 활성화
  ;['all','kospi','kosdaq','bio','semi','bat','robot'].forEach(t => {
    const el = document.getElementById(`ntab-${t}`)
    if (el) el.classList.toggle('active', t === tab)
  })
  window._currentNewsTab   = tab
  window._currentNewsQuery = query
  await loadNewsList(query)
}

async function searchNews() {
  const q = (document.getElementById('news-search')?.value || '').trim()
  if (!q) return
  window._currentNewsQuery = q
  // 탭 모두 비활성
  ;['all','kospi','kosdaq','bio','semi','bat','robot'].forEach(t => {
    const el = document.getElementById(`ntab-${t}`)
    if (el) el.classList.remove('active')
  })
  await loadNewsList(q)
}

async function manualRefreshNews() {
  newsCountdown = 30
  const el = document.getElementById('refresh-countdown')
  if (el) el.textContent = '30초 후 갱신'
  const query = window._currentNewsQuery || '주식 코스피 코스닥'
  await Promise.all([
    loadNewsList(query),
    loadRecommendPanel()
  ])
}

// 뉴스 목록 로드
async function loadNewsList(query = '주식 코스피 코스닥', silent = false) {
  const list = document.getElementById('news-list')
  if (!list) return

  if (!silent) {
    list.innerHTML = '<div style="display:flex; justify-content:center; padding:60px;"><div class="spinner"></div></div>'
  }

  try {
    const res = await api.get(`/news?query=${encodeURIComponent(query)}&display=20`)
    const news   = res.success ? res.news : []
    const isMock = res.isMock

    // 뉴스에 등장하는 종목 코드 수집
    const allCodes = [...new Set(news.flatMap(n => (n.relatedStocks || []).map(s => s.code)))]

    // 관련 종목 시그널 병렬 조회
    let stockSigMap = {}
    if (allCodes.length > 0) {
      try {
        const sigRes = await api.get(`/recommend/news-stocks?codes=${allCodes.join(',')}`)
        if (sigRes.success) {
          for (const s of sigRes.stocks) stockSigMap[s.code] = s
        }
      } catch(_) {}
    }

    list.innerHTML = `
      ${isMock ? `
        <div style="background:rgba(245,158,11,0.07); border:1px solid rgba(245,158,11,0.18); border-radius:10px; padding:11px 16px; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
          <i class="fas fa-satellite-dish" style="color:#f59e0b; font-size:13px;"></i>
          <span style="font-size:12px; color:#d97706;">네이버 뉴스 API 미설정 — 샘플 뉴스 데이터 표시 중</span>
        </div>
      ` : ''}

      <div style="display:flex; flex-direction:column; gap:12px;">
        ${news.map((n, idx) => {
          const stocks = n.relatedStocks || []
          const enrichedStocks = stocks.map(s => stockSigMap[s.code] ? { ...s, ...stockSigMap[s.code] } : s)

          return `
          <div class="news-card" style="padding:18px 20px; animation:fadeInUp 0.4s ease both; animation-delay:${idx * 0.04}s;"
            onclick="openNewsLink('${n.link}')">

            <!-- 제목 + 시각 -->
            <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:8px;">
              <h3 style="font-size:14px; font-weight:700; color:white; line-height:1.5; flex:1;">${n.title}</h3>
              <span style="font-size:11px; color:#374151; white-space:nowrap; margin-top:2px; flex-shrink:0;">
                <i class="fas fa-clock" style="margin-right:3px;"></i>${formatDate(n.pubDate)}
              </span>
            </div>

            <!-- 본문 요약 -->
            <p style="font-size:12px; color:#6b7280; line-height:1.6; margin-bottom:12px;
              display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
              ${n.description || ''}
            </p>

            <!-- 관련 종목 + 시그널 -->
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
              <div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${enrichedStocks.length > 0 ? enrichedStocks.map(s => {
                  const sig    = s.signal || 'HOLD'
                  const sigCol = sig === 'BUY' ? '#22c55e' : sig === 'SELL' ? '#ef4444' : '#f59e0b'
                  const sigBg  = sig === 'BUY' ? 'rgba(34,197,94,0.08)' : sig === 'SELL' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)'
                  const sigBd  = sig === 'BUY' ? 'rgba(34,197,94,0.2)' : sig === 'SELL' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'
                  const crCol  = (s.changeRate||0) >= 0 ? '#ef4444' : '#3b82f6'
                  return `
                    <div onclick="event.stopPropagation(); showStockDetail('${s.code}','${s.name}')"
                      style="display:flex; align-items:center; gap:5px;
                        background:${sigBg}; border:1px solid ${sigBd};
                        border-radius:20px; padding:4px 10px; cursor:pointer; transition:all 0.2s;"
                      onmouseover="this.style.opacity='0.75'" onmouseout="this.style.opacity='1'">
                      <span style="font-size:9px; font-weight:700; color:${s.market==='KOSPI'?'#60a5fa':'#c084fc'}; border:1px solid ${s.market==='KOSPI'?'rgba(96,165,250,0.3)':'rgba(192,132,252,0.3)'}; border-radius:3px; padding:1px 4px;">${s.market||''}</span>
                      <span style="font-size:12px; font-weight:700; color:white;">${s.name}</span>
                      ${s.changeRate !== undefined ? `<span style="font-size:11px; color:${crCol}; font-weight:600;">${(s.changeRate||0)>=0?'▲':'▼'}${Math.abs(s.changeRate||0).toFixed(1)}%</span>` : ''}
                      <span style="font-size:10px; font-weight:700; color:${sigCol}; background:${sigBg}; padding:1px 5px; border-radius:4px;">${sig}</span>
                    </div>
                  `
                }).join('') : `<span style="font-size:11px; color:#374151;"><i class="fas fa-tag" style="margin-right:3px;"></i>관련 종목 없음</span>`}
              </div>
              <span style="font-size:11px; color:var(--brand-orange); white-space:nowrap;">
                <i class="fas fa-external-link-alt" style="margin-right:3px;"></i>원문
              </span>
            </div>
          </div>
          `
        }).join('')}
      </div>

      ${news.length === 0 ? `
        <div style="text-align:center; color:#4b5563; padding:60px;">
          <i class="fas fa-newspaper" style="font-size:40px; display:block; margin-bottom:16px; color:#374151;"></i>
          뉴스를 불러올 수 없습니다
        </div>
      ` : ''}
    `

    // 갱신 시각 업데이트
    const lu = document.getElementById('last-updated')
    if (lu) lu.textContent = `마지막 갱신: ${new Date().toLocaleTimeString('ko-KR')}`

  } catch (err) {
    list.innerHTML = '<div style="color:#ef4444; padding:20px; text-align:center;">뉴스 로드 실패 — 잠시 후 자동 재시도합니다</div>'
  }
}

// 우측 추천 패널 로드
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
  if (!silent) el.innerHTML = '<div style="display:flex; justify-content:center; padding:30px;"><div class="spinner" style="width:28px; height:28px; border-width:2px;"></div></div>'

  try {
    const res = await api.get('/recommend/top?type=BUY&limit=5')
    const stocks = res.success ? res.stocks : []

    el.innerHTML = `
      <div style="padding:8px 6px;">
        ${stocks.map((s, i) => `
          <div onclick="showStockDetail('${s.code}','${s.name}')"
            style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; cursor:pointer; transition:background 0.2s; margin-bottom:2px;"
            onmouseover="this.style.background='rgba(249,115,22,0.06)'" onmouseout="this.style.background='transparent'">
            <!-- 순위 -->
            <div style="width:22px; height:22px; border-radius:50%; background:${i===0?'var(--brand-gradient)':i===1?'rgba(249,115,22,0.3)':i===2?'rgba(249,115,22,0.15)':'rgba(255,255,255,0.05)'}; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; color:${i<3?'white':'#4b5563'}; flex-shrink:0;">${i+1}</div>
            <!-- 종목 정보 -->
            <div style="flex:1; min-width:0;">
              <div style="display:flex; align-items:center; gap:5px; margin-bottom:2px;">
                <span style="font-size:13px; font-weight:700; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.name}</span>
                <span style="font-size:9px; font-weight:700; color:${s.market==='KOSPI'?'#60a5fa':'#c084fc'}; border:1px solid ${s.market==='KOSPI'?'rgba(96,165,250,0.3)':'rgba(192,132,252,0.3)'}; border-radius:3px; padding:1px 4px; flex-shrink:0;">${s.market}</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:11px; color:#9ca3af;">${(s.price||0).toLocaleString()}원</span>
                <span style="font-size:11px; color:${(s.changeRate||0)>=0?'#ef4444':'#3b82f6'}; font-weight:600;">${(s.changeRate||0)>=0?'▲':'▼'}${Math.abs(s.changeRate||0).toFixed(1)}%</span>
              </div>
            </div>
            <!-- 강도 바 -->
            <div style="text-align:right; flex-shrink:0;">
              <div style="font-size:13px; font-weight:800; color:#22c55e;">${s.strength}%</div>
              <div style="width:48px; height:4px; background:#1f2937; border-radius:2px; margin-top:3px;">
                <div style="width:${s.strength}%; height:100%; border-radius:2px; background:linear-gradient(90deg,#16a34a,#22c55e);"></div>
              </div>
            </div>
          </div>
        `).join('')}
        ${stocks.length === 0 ? '<div style="text-align:center; color:#4b5563; padding:20px; font-size:13px;">추천 종목 없음</div>' : ''}
      </div>
    `
  } catch(_) {}
}

async function loadSectorPanel(silent = false) {
  const el = document.getElementById('sector-list')
  if (!el) return
  if (!silent) el.innerHTML = '<div style="display:flex; justify-content:center; padding:20px;"><div class="spinner" style="width:24px; height:24px; border-width:2px;"></div></div>'

  try {
    const res = await api.get('/recommend/sectors')
    const sectors = res.success ? res.sectors : []

    el.innerHTML = sectors.slice(0, 6).map(sec => {
      const pct  = sec.avgStrength
      const col  = pct >= 65 ? '#22c55e' : pct <= 40 ? '#ef4444' : '#f59e0b'
      const bg   = pct >= 65 ? 'rgba(34,197,94,0.08)' : pct <= 40 ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)'
      return `
        <div style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <div style="display:flex; align-items:center; gap:6px;">
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
  if (!silent) el.innerHTML = '<div style="display:flex; justify-content:center; padding:20px;"><div class="spinner" style="width:24px; height:24px; border-width:2px;"></div></div>'

  try {
    const res = await api.get('/recommend/top?type=SELL&limit=4')
    const stocks = res.success ? res.stocks : []

    el.innerHTML = `
      <div style="padding:6px 6px 10px;">
        ${stocks.map(s => `
          <div onclick="showStockDetail('${s.code}','${s.name}')"
            style="display:flex; align-items:center; justify-content:space-between; padding:9px 12px; border-radius:8px; cursor:pointer; transition:background 0.2s;"
            onmouseover="this.style.background='rgba(239,68,68,0.06)'" onmouseout="this.style.background='transparent'">
            <div>
              <div style="font-size:13px; font-weight:600; color:white;">${s.name}
                <span style="font-size:9px; color:${s.market==='KOSPI'?'#60a5fa':'#c084fc'}; margin-left:4px;">${s.market}</span>
              </div>
              <div style="font-size:11px; color:#3b82f6; margin-top:1px;">▼ ${Math.abs(s.changeRate||0).toFixed(1)}%</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:12px; font-weight:700; color:#ef4444;">SELL</div>
              <div style="font-size:11px; color:#6b7280;">${s.strength}%</div>
            </div>
          </div>
        `).join('')}
        ${stocks.length === 0 ? '<div style="text-align:center; color:#4b5563; padding:16px; font-size:12px;">주의 종목 없음</div>' : ''}
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
    if (diff < 60000)     return '방금 전'
    if (diff < 3600000)   return Math.floor(diff / 60000)   + '분 전'
    if (diff < 86400000)  return Math.floor(diff / 3600000) + '시간 전'
    return d.toLocaleDateString('ko-KR', { month:'numeric', day:'numeric' })
  } catch { return '' }
}


// ============================================================
// STOCK DETAIL MODAL
// ============================================================
async function showStockDetail(code, name) {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.id = 'stock-modal'
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:680px; position:relative;">
      <button onclick="document.getElementById('stock-modal').remove()" style="position:absolute; top:16px; right:16px; background:rgba(255,255,255,0.05); border:none; color:#9ca3af; width:32px; height:32px; border-radius:8px; cursor:pointer; font-size:16px;">✕</button>
      
      <div style="display:flex; align-items:center; justify-content:center; padding:40px;">
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
        <button onclick="document.getElementById('stock-modal').remove()" style="position:absolute; top:16px; right:16px; background:rgba(255,255,255,0.05); border:none; color:#9ca3af; width:32px; height:32px; border-radius:8px; cursor:pointer;">✕</button>
        <p style="color:#ef4444; padding:20px;">종목 정보를 불러올 수 없습니다.</p>
      `
      return
    }

    overlay.querySelector('.modal-content').innerHTML = `
      <button onclick="document.getElementById('stock-modal').remove()" style="position:absolute; top:16px; right:16px; background:rgba(255,255,255,0.05); border:none; color:#9ca3af; width:32px; height:32px; border-radius:8px; cursor:pointer; font-size:16px; z-index:1;">✕</button>
      
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px;">
        <div style="width:48px; height:48px; background:var(--brand-gradient); border-radius:12px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px;">
          ${stock.name[0]}
        </div>
        <div>
          <h2 style="font-size:22px; font-weight:800; color:white;">${stock.name}</h2>
          <div style="display:flex; gap:8px; align-items:center; margin-top:4px;">
            <span class="${stock.market === 'KOSPI' ? 'badge-kospi' : 'badge-kosdaq'}">${stock.market}</span>
            <span style="font-size:13px; color:#4b5563;">${stock.code}</span>
          </div>
        </div>
        <div style="margin-left:auto; text-align:right;">
          <span class="signal-${(stock.signal||'HOLD').toLowerCase()}" style="font-size:14px; padding:6px 16px;">${stock.signal||'HOLD'}</span>
        </div>
      </div>

      <!-- Price Info -->
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; margin-bottom:24px;">
        <div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:16px; text-align:center;">
          <div style="font-size:11px; color:#6b7280; margin-bottom:6px;">현재가</div>
          <div style="font-size:24px; font-weight:800; color:white;">${(stock.price||0).toLocaleString()}</div>
          <div style="font-size:12px; color:${(stock.changeRate||0)>=0?'#ef4444':'#3b82f6'}; margin-top:4px; font-weight:600;">${(stock.changeRate||0)>=0?'▲':'▼'} ${Math.abs(stock.changeRate||0).toFixed(2)}%</div>
        </div>
        <div style="background:rgba(34,197,94,0.08); border-radius:12px; padding:16px; text-align:center; border:1px solid rgba(34,197,94,0.1);">
          <div style="font-size:11px; color:#6b7280; margin-bottom:6px;">시그널 강도</div>
          <div style="font-size:24px; font-weight:800; color:${stock.signal==='BUY'?'#22c55e':stock.signal==='SELL'?'#ef4444':'#f59e0b'};">${stock.strength||50}%</div>
        </div>
        <div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:16px; text-align:center;">
          <div style="font-size:11px; color:#6b7280; margin-bottom:6px;">거래량</div>
          <div style="font-size:18px; font-weight:700; color:white;">${(stock.volume||0).toLocaleString()}</div>
        </div>
      </div>

      <!-- Mini Chart -->
      <div style="margin-bottom:20px;">
        <h4 style="font-size:14px; font-weight:600; color:#9ca3af; margin-bottom:12px;">30일 주가 차트 (모의)</h4>
        <div class="chart-container" style="height:200px;">
          <canvas id="stock-chart"></canvas>
        </div>
      </div>

      <!-- Strength Bar -->
      <div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:16px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <span style="font-size:13px; color:#9ca3af; font-weight:600;">시그널 강도</span>
          <span style="font-size:13px; color:${stock.signal==='BUY'?'#22c55e':stock.signal==='SELL'?'#ef4444':'#f59e0b'}; font-weight:700;">${stock.strength||50}/100</span>
        </div>
        <div class="strength-bar" style="height:10px;">
          <div class="strength-fill" style="width:${stock.strength||50}%; background:${stock.signal==='BUY'?'linear-gradient(90deg,#16a34a,#22c55e)':stock.signal==='SELL'?'linear-gradient(90deg,#b91c1c,#ef4444)':'linear-gradient(90deg,#b45309,#f59e0b)'};"></div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:11px; color:#374151;">
          <span>매도 강함</span>
          <span>중립</span>
          <span>매수 강함</span>
        </div>
      </div>
    `

    // Render chart
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
                ticks: { color: '#4b5563', font: { size: 10 }, maxTicksLimit: 8 }
              },
              y: { 
                grid: { color: 'rgba(255,255,255,0.03)' },
                ticks: { color: '#4b5563', font: { size: 10 }, callback: v => v.toLocaleString() }
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
      position:fixed; top:0; left:0; right:0; height:64px; z-index:1000;
      background:rgba(8,13,20,0.97); backdrop-filter:blur(20px);
      border-bottom:1px solid rgba(249,115,22,0.15);
      display:flex; align-items:center; justify-content:space-between; padding:0 20px;
    ">
      <div style="display:flex; align-items:center; gap:10px;">
        <button onclick="toggleSidebar()" style="background:none; border:none; color:#9ca3af; cursor:pointer; font-size:18px; padding:6px 10px; border-radius:8px; transition:background 0.2s;"
          onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='none'">
          <i class="fas fa-bars"></i>
        </button>
        <img src="/static/logo.png" alt="QUAD" style="height:38px;" onerror="this.style.display='none'">
        <div style="line-height:1;">
          <div style="font-weight:800; font-size:17px; background:linear-gradient(135deg,#f97316,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">QUAD</div>
          <div style="font-size:9px; color:#4b5563; letter-spacing:0.15em; margin-top:1px;">ADMIN PANEL</div>
        </div>
        <span style="background:linear-gradient(135deg,#e83a00,#f59e0b); color:white; padding:3px 10px; border-radius:6px; font-size:11px; font-weight:700; letter-spacing:0.05em;">ADMIN</span>
      </div>
      <div style="display:flex; align-items:center; gap:14px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:34px; height:34px; background:linear-gradient(135deg,#e83a00,#f59e0b); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; color:white; flex-shrink:0;">A</div>
          <div style="line-height:1.3;">
            <div style="font-size:13px; font-weight:600; color:white;">${currentUser?.name || '관리자'}</div>
            <div style="font-size:10px; color:#f97316; font-weight:600;">Administrator</div>
          </div>
        </div>
        <button onclick="handleLogout()" title="로그아웃"
          style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); color:#ef4444; padding:7px 14px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; transition:all 0.2s;"
          onmouseover="this.style.background='rgba(239,68,68,0.18)'" onmouseout="this.style.background='rgba(239,68,68,0.08)'">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </nav>

    <!-- Sidebar (fixed, top=64px, no ticker for admin) -->
    <aside id="sidebar" style="
      position:fixed; top:64px; left:0; bottom:0; width:240px; z-index:100;
      background:rgba(10,14,20,0.98); border-right:1px solid rgba(249,115,22,0.1);
      overflow-y:auto; padding:16px 0; transition:transform 0.3s ease;
    ">
      <div style="padding:0 16px 12px; margin-bottom:4px;">
        <p style="font-size:10px; font-weight:700; color:#374151; letter-spacing:0.12em; text-transform:uppercase;">관리자 메뉴</p>
      </div>
      ${[
        { id: 'admin-dashboard', icon: 'fas fa-tachometer-alt', label: '관리 대시보드' },
        { id: 'admin-pending',   icon: 'fas fa-user-clock',     label: '승인 대기' },
        { id: 'admin-users',     icon: 'fas fa-users',          label: '전체 회원' },
        { id: 'admin-signals',   icon: 'fas fa-signal',         label: '시그널 관리' },
      ].map(item => `
        <div class="sidebar-item ${page === item.id ? 'active' : ''}" onclick="navigate('${item.id}')">
          <i class="${item.icon}" style="width:16px; text-align:center; font-size:14px;"></i>
          <span style="font-size:14px;">${item.label}</span>
        </div>
      `).join('')}

      <div style="margin:16px 16px 0; padding-top:16px; border-top:1px solid rgba(255,255,255,0.04);">
        <p style="font-size:10px; font-weight:700; color:#374151; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px;">서비스</p>
      </div>
      <div class="sidebar-item" onclick="navigate('dashboard')">
        <i class="fas fa-chart-line" style="width:16px; text-align:center; font-size:14px;"></i>
        <span style="font-size:14px;">사용자 뷰</span>
      </div>
      <div class="sidebar-item" onclick="handleLogout()">
        <i class="fas fa-sign-out-alt" style="width:16px; text-align:center; font-size:14px; color:#ef4444;"></i>
        <span style="font-size:14px; color:#ef4444;">로그아웃</span>
      </div>
    </aside>

    <!-- Main Content (margin-left=240px, margin-top=64px for admin) -->
    <main id="main-content" style="
      margin-left:240px; margin-top:64px;
      padding:28px 28px 40px;
      min-height:calc(100vh - 64px);
      box-sizing:border-box;
    ">
      <div id="page-content"></div>
    </main>
  `

  if (page === 'admin-dashboard') renderAdminDashboard()
  else if (page === 'admin-pending') renderAdminPending()
  else if (page === 'admin-users') renderAdminUsers()
  else if (page === 'admin-signals') renderAdminSignals()
  else renderAdminDashboard()
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
async function renderAdminDashboard() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div style="margin-bottom:28px;">
      <h1 style="font-size:26px; font-weight:800; color:white;">관리자 대시보드</h1>
      <p style="color:#6b7280; font-size:14px; margin-top:4px;">회원 및 시그널 현황을 관리합니다</p>
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
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:28px;">
        ${[
          { label: '전체 회원', value: stats.totalUsers || 0, icon: 'fas fa-users', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
          { label: '승인 대기', value: stats.pendingUsers || 0, icon: 'fas fa-user-clock', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', urgent: (stats.pendingUsers||0) > 0 },
          { label: '승인된 회원', value: stats.approvedUsers || 0, icon: 'fas fa-user-check', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { label: '등록 시그널', value: stats.totalSignals || 0, icon: 'fas fa-signal', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
        ].map(stat => `
          <div class="stat-card" style="${stat.urgent ? 'border-color:rgba(245,158,11,0.4); animation: glow 2s ease-in-out infinite;' : ''}">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
              <span style="font-size:13px; color:#6b7280;">${stat.label}</span>
              <div style="width:40px; height:40px; background:${stat.bg}; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                <i class="${stat.icon}" style="color:${stat.color};"></i>
              </div>
            </div>
            <div style="font-size:36px; font-weight:900; color:${stat.color};">${stat.value}</div>
            ${stat.urgent ? '<div style="font-size:12px; color:#f59e0b; margin-top:4px; font-weight:600;"><i class="fas fa-exclamation-circle" style="margin-right:4px;"></i>승인이 필요합니다</div>' : ''}
          </div>
        `).join('')}
      </div>

      <!-- Pending Users -->
      ${pendingUsers.length > 0 ? `
        <div style="background:rgba(22,27,34,0.8); border:1px solid rgba(245,158,11,0.2); border-radius:16px; overflow:hidden; margin-bottom:24px;">
          <div style="padding:20px 24px; border-bottom:1px solid var(--brand-border); display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:8px; height:8px; background:#f59e0b; border-radius:50%; animation: glow 2s ease-in-out infinite;"></div>
              <h3 style="font-size:15px; font-weight:700; color:white;">승인 대기 회원 (${pendingUsers.length}명)</h3>
            </div>
            <button onclick="navigate('admin-pending')" style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); color:#f59e0b; padding:6px 16px; border-radius:8px; font-size:13px; cursor:pointer; font-weight:600;">전체보기</button>
          </div>
          <div style="overflow-x:auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>아이디</th>
                  <th>이메일</th>
                  <th>전화번호</th>
                  <th>가입일</th>
                  <th>처리</th>
                </tr>
              </thead>
              <tbody>
                ${pendingUsers.slice(0, 5).map(u => `
                  <tr>
                    <td style="font-weight:600; color:white;">${u.name}</td>
                    <td style="color:#9ca3af;">${u.username}</td>
                    <td style="color:#9ca3af;">${u.email}</td>
                    <td style="color:#9ca3af;">${u.phone}</td>
                    <td style="color:#6b7280; font-size:13px;">${new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button onclick="approveUser(${u.id})" style="background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.2); color:#22c55e; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600;">
                          <i class="fas fa-check" style="margin-right:4px;"></i>승인
                        </button>
                        <button onclick="rejectUser(${u.id})" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); color:#ef4444; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600;">
                          <i class="fas fa-times" style="margin-right:4px;"></i>거부
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : `
        <div style="background:rgba(34,197,94,0.05); border:1px solid rgba(34,197,94,0.15); border-radius:16px; padding:32px; text-align:center; margin-bottom:24px;">
          <i class="fas fa-check-circle" style="font-size:40px; color:#22c55e; display:block; margin-bottom:12px;"></i>
          <div style="font-size:16px; font-weight:600; color:#22c55e;">모든 가입 신청이 처리되었습니다</div>
          <div style="font-size:13px; color:#6b7280; margin-top:6px;">새로운 가입 신청이 없습니다</div>
        </div>
      `}

      <!-- Quick Actions -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
        ${[
          { label: '승인 대기 관리', icon: 'fas fa-user-clock', page: 'admin-pending', color: '#f59e0b' },
          { label: '전체 회원 관리', icon: 'fas fa-users', page: 'admin-users', color: '#f97316' },
          { label: '시그널 관리', icon: 'fas fa-signal', page: 'admin-signals', color: '#3b82f6' },
        ].map(a => `
          <div onclick="navigate('${a.page}')" class="glass-card" style="padding:24px; text-align:center; cursor:pointer;">
            <i class="${a.icon}" style="font-size:28px; color:${a.color}; display:block; margin-bottom:12px;"></i>
            <div style="font-size:14px; font-weight:600; color:white;">${a.label}</div>
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
    <div style="margin-bottom:28px;">
      <h1 style="font-size:26px; font-weight:800; color:white;">승인 대기 회원</h1>
      <p style="color:#6b7280; font-size:14px; margin-top:4px;">가입 신청한 회원을 승인하거나 거부합니다</p>
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
        <div style="text-align:center; padding:80px;">
          <i class="fas fa-check-circle" style="font-size:60px; color:#22c55e; display:block; margin-bottom:20px;"></i>
          <h3 style="font-size:20px; font-weight:700; color:white; margin-bottom:8px;">대기 중인 신청이 없습니다</h3>
          <p style="color:#6b7280;">모든 가입 신청이 처리되었습니다.</p>
        </div>
      `
      return
    }

    content.innerHTML = `
      <div style="display:grid; gap:16px;">
        ${users.map(u => `
          <div class="glass-card" style="padding:24px;">
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
              <div style="display:flex; align-items:center; gap:16px;">
                <div style="width:52px; height:52px; background:rgba(249,115,22,0.1); border:2px solid rgba(249,115,22,0.2); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:700; color:var(--brand-orange);">
                  ${u.name[0]}
                </div>
                <div>
                  <div style="font-size:16px; font-weight:700; color:white;">${u.name}</div>
                  <div style="font-size:13px; color:#6b7280; margin-top:2px;">@${u.username}</div>
                </div>
              </div>
              
              <div style="display:flex; gap:20px; flex-wrap:wrap;">
                <div>
                  <div style="font-size:11px; color:#4b5563; margin-bottom:2px;">이메일</div>
                  <div style="font-size:14px; color:#9ca3af;">${u.email}</div>
                </div>
                <div>
                  <div style="font-size:11px; color:#4b5563; margin-bottom:2px;">전화번호</div>
                  <div style="font-size:14px; color:#9ca3af;">${u.phone}</div>
                </div>
                <div>
                  <div style="font-size:11px; color:#4b5563; margin-bottom:2px;">가입일</div>
                  <div style="font-size:14px; color:#9ca3af;">${new Date(u.created_at).toLocaleDateString('ko-KR')}</div>
                </div>
              </div>
              
              <div style="display:flex; gap:10px;">
                <button onclick="approveUser(${u.id})" class="btn-primary" style="padding:10px 20px; font-size:14px; border-radius:10px;">
                  <i class="fas fa-check" style="margin-right:6px;"></i>승인
                </button>
                <button onclick="rejectUser(${u.id})" class="btn-secondary" style="padding:10px 20px; font-size:14px; border-radius:10px; border-color:rgba(239,68,68,0.5); color:#ef4444;">
                  <i class="fas fa-times" style="margin-right:6px;"></i>거부
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `
  } catch (err) {
    content.innerHTML = '<div style="color:#ef4444;">데이터 로드 실패</div>'
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
async function renderAdminUsers() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div style="margin-bottom:28px;">
      <h1 style="font-size:26px; font-weight:800; color:white;">전체 회원 관리</h1>
      <p style="color:#6b7280; font-size:14px; margin-top:4px;">가입된 모든 회원을 관리합니다</p>
    </div>
    <div id="users-content">
      <div style="display:flex; justify-content:center; padding:60px;"><div class="spinner"></div></div>
    </div>
  `

  try {
    const res = await api.get('/admin/users')
    const users = res.success ? res.users : []

    document.getElementById('users-content').innerHTML = `
      <div style="background:rgba(22,27,34,0.8); border:1px solid rgba(249,115,22,0.08); border-radius:16px; overflow:hidden;">
        <div style="padding:20px 24px; border-bottom:1px solid var(--brand-border);">
          <h3 style="font-size:15px; font-weight:700; color:white;">전체 회원 목록 (${users.length}명)</h3>
        </div>
        <div style="overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>아이디</th>
                <th>이메일</th>
                <th>전화번호</th>
                <th>상태</th>
                <th>역할</th>
                <th>가입일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td style="font-weight:600; color:white;">${u.name}</td>
                  <td style="color:#9ca3af;">@${u.username}</td>
                  <td style="color:#9ca3af;">${u.email}</td>
                  <td style="color:#9ca3af;">${u.phone}</td>
                  <td>
                    <span style="
                      padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600;
                      ${u.status === 'approved' ? 'background:rgba(34,197,94,0.1); color:#22c55e; border:1px solid rgba(34,197,94,0.2);' : 
                        u.status === 'pending' ? 'background:rgba(245,158,11,0.1); color:#f59e0b; border:1px solid rgba(245,158,11,0.2);' :
                        'background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.2);'}
                    ">
                      ${u.status === 'approved' ? '승인됨' : u.status === 'pending' ? '대기중' : '거부됨'}
                    </span>
                  </td>
                  <td>
                    ${u.role === 'admin' ? '<span class="admin-badge">관리자</span>' : '<span style="color:#6b7280; font-size:13px;">일반</span>'}
                  </td>
                  <td style="color:#6b7280; font-size:13px;">${new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      ${u.status === 'pending' ? `
                        <button onclick="approveUserFromList(${u.id})" style="background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.2); color:#22c55e; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:12px;">승인</button>
                        <button onclick="rejectUserFromList(${u.id})" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); color:#ef4444; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:12px;">거부</button>
                      ` : ''}
                      ${u.role !== 'admin' ? `
                        <button onclick="deleteUser(${u.id})" style="background:rgba(239,68,68,0.05); border:1px solid rgba(239,68,68,0.1); color:#374151; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:12px;">삭제</button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  } catch (err) {
    document.getElementById('users-content').innerHTML = '<div style="color:#ef4444;">데이터 로드 실패</div>'
  }
}

async function approveUserFromList(id) {
  const res = await api.put(`/admin/users/${id}/approve`)
  if (res.success) { showToast('승인되었습니다.'); await renderAdminUsers() }
}

async function rejectUserFromList(id) {
  if (!confirm('정말 거부하시겠습니까?')) return
  const res = await api.put(`/admin/users/${id}/reject`)
  if (res.success) { showToast('거부되었습니다.'); await renderAdminUsers() }
}

async function deleteUser(id) {
  if (!confirm('정말 이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
  const res = await api.delete(`/admin/users/${id}`)
  if (res.success) { showToast('삭제되었습니다.'); await renderAdminUsers() }
}

// ============================================================
// ADMIN SIGNALS
// ============================================================
async function renderAdminSignals() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:28px;">
      <div>
        <h1 style="font-size:26px; font-weight:800; color:white;">시그널 관리</h1>
        <p style="color:#6b7280; font-size:14px; margin-top:4px;">주가 시그널을 추가하고 관리합니다</p>
      </div>
      <button onclick="showAddSignalModal()" class="btn-primary" style="padding:12px 24px;">
        <i class="fas fa-plus" style="margin-right:8px;"></i>시그널 추가
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
        <div style="padding:20px 24px; border-bottom:1px solid var(--brand-border);">
          <h3 style="font-size:15px; font-weight:700; color:white;">등록된 시그널 (${signals.length}개)</h3>
        </div>
        ${signals.length === 0 ? `
          <div style="text-align:center; padding:60px; color:#4b5563;">
            <i class="fas fa-signal" style="font-size:40px; display:block; margin-bottom:16px;"></i>
            등록된 시그널이 없습니다. 시그널을 추가해보세요.
          </div>
        ` : `
          <div style="overflow-x:auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>종목명</th>
                  <th>시장</th>
                  <th>시그널</th>
                  <th>현재가</th>
                  <th>목표가</th>
                  <th>강도</th>
                  <th>등록일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                ${signals.map(s => `
                  <tr>
                    <td>
                      <div style="font-weight:600; color:white;">${s.stock_name}</div>
                      <div style="font-size:12px; color:#4b5563;">${s.stock_code}</div>
                    </td>
                    <td><span class="${s.market === 'KOSPI' ? 'badge-kospi' : 'badge-kosdaq'}">${s.market}</span></td>
                    <td><span class="signal-${(s.signal_type||'hold').toLowerCase()}">${s.signal_type}</span></td>
                    <td style="color:white;">${s.price ? s.price.toLocaleString() + '원' : '-'}</td>
                    <td style="color:#22c55e;">${s.target_price ? s.target_price.toLocaleString() + '원' : '-'}</td>
                    <td>
                      <div style="display:flex; align-items:center; gap:6px;">
                        <div class="strength-bar" style="width:60px;">
                          <div class="strength-fill" style="width:${s.strength||50}%; background:${s.signal_type==='BUY'?'#22c55e':s.signal_type==='SELL'?'#ef4444':'#f59e0b'};"></div>
                        </div>
                        <span style="font-size:12px; color:#6b7280;">${s.strength||50}%</span>
                      </div>
                    </td>
                    <td style="color:#6b7280; font-size:13px;">${new Date(s.created_at).toLocaleDateString('ko-KR')}</td>
                    <td>
                      <button onclick="deleteSignal(${s.id})" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); color:#ef4444; padding:5px 12px; border-radius:6px; cursor:pointer; font-size:12px;">
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
    <div class="modal-content">
      <h2 style="font-size:20px; font-weight:700; color:white; margin-bottom:24px;">
        <i class="fas fa-plus-circle" style="color:var(--brand-orange); margin-right:10px;"></i>시그널 추가
      </h2>

      <div id="signal-msg" style="display:none; margin-bottom:16px;"></div>

      <form onsubmit="handleAddSignal(event)">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
          <div>
            <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:6px; font-weight:600;">종목코드 *</label>
            <input type="text" id="sig-code" class="form-input" placeholder="005930" required style="padding:10px 12px;">
          </div>
          <div>
            <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:6px; font-weight:600;">종목명 *</label>
            <input type="text" id="sig-name" class="form-input" placeholder="삼성전자" required style="padding:10px 12px;">
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
          <div>
            <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:6px; font-weight:600;">시장 *</label>
            <select id="sig-market" class="form-input" style="padding:10px 12px;">
              <option value="KOSPI">KOSPI</option>
              <option value="KOSDAQ">KOSDAQ</option>
            </select>
          </div>
          <div>
            <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:6px; font-weight:600;">시그널 *</label>
            <select id="sig-type" class="form-input" style="padding:10px 12px;">
              <option value="BUY">매수 (BUY)</option>
              <option value="SELL">매도 (SELL)</option>
              <option value="HOLD">홀드 (HOLD)</option>
            </select>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:16px;">
          <div>
            <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:6px; font-weight:600;">현재가</label>
            <input type="number" id="sig-price" class="form-input" placeholder="72500" style="padding:10px 12px;">
          </div>
          <div>
            <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:6px; font-weight:600;">목표가</label>
            <input type="number" id="sig-target" class="form-input" placeholder="85000" style="padding:10px 12px;">
          </div>
          <div>
            <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:6px; font-weight:600;">손절가</label>
            <input type="number" id="sig-stop" class="form-input" placeholder="65000" style="padding:10px 12px;">
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:6px; font-weight:600;">시그널 강도 (0-100)</label>
          <input type="range" id="sig-strength" min="0" max="100" value="75" style="width:100%; accent-color:var(--brand-orange);" oninput="document.getElementById('strength-val').textContent=this.value+'%'">
          <div style="text-align:right; font-size:13px; color:var(--brand-orange); font-weight:700;" id="strength-val">75%</div>
        </div>

        <div style="margin-bottom:24px;">
          <label style="display:block; font-size:12px; color:#9ca3af; margin-bottom:6px; font-weight:600;">분석 내용</label>
          <textarea id="sig-desc" class="form-input" rows="3" placeholder="시그널 분석 내용을 입력하세요" style="resize:none;"></textarea>
        </div>

        <div style="display:flex; gap:12px;">
          <button type="submit" class="btn-primary" style="flex:1; padding:12px;" id="add-sig-btn">
            <i class="fas fa-plus" style="margin-right:8px;"></i>시그널 추가
          </button>
          <button type="button" onclick="document.getElementById('signal-modal').remove()" class="btn-secondary" style="flex:1; padding:12px;">취소</button>
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
  btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>추가 중...'

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
  btn.innerHTML = '<i class="fas fa-plus" style="margin-right:8px;"></i>시그널 추가'
}

async function deleteSignal(id) {
  if (!confirm('이 시그널을 삭제하시겠습니까?')) return
  const res = await api.delete(`/admin/signals/${id}`)
  if (res.success) { showToast('시그널이 삭제되었습니다.'); await loadAdminSignals() }
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
