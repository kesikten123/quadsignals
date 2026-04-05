import { Hono } from 'hono'
import { generateId, hashPassword, verifyPassword, generateToken, verifyToken } from '../lib/utils'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

export const authRoutes = new Hono<{ Bindings: Bindings }>()

// 회원가입
authRoutes.post('/register', async (c) => {
  try {
    const { username, password, name, phone, email } = await c.req.json()

    if (!username || !password || !name || !phone || !email) {
      return c.json({ success: false, message: '모든 필드를 입력해주세요.' }, 400)
    }

    if (password.length < 8) {
      return c.json({ success: false, message: '비밀번호는 8자 이상이어야 합니다.' }, 400)
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return c.json({ success: false, message: '올바른 이메일 형식이 아닙니다.' }, 400)
    }

    // 중복 확인
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    ).bind(username, email).first()

    if (existing) {
      return c.json({ success: false, message: '이미 사용 중인 아이디 또는 이메일입니다.' }, 409)
    }

    const passwordHash = await hashPassword(password)

    await c.env.DB.prepare(
      'INSERT INTO users (username, password_hash, name, phone, email, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(username, passwordHash, name, phone, email, 'user', 'pending').run()

    return c.json({ success: true, message: '회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.' })
  } catch (error) {
    console.error('Register error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// 로그인
authRoutes.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json()

    if (!username || !password) {
      return c.json({ success: false, message: '아이디와 비밀번호를 입력해주세요.' }, 400)
    }

    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).bind(username).first() as any

    if (!user) {
      return c.json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 401)
    }

    if (user.status === 'pending') {
      return c.json({ success: false, message: '관리자 승인 대기 중입니다. 승인 후 로그인 가능합니다.' }, 403)
    }

    if (user.status === 'rejected') {
      return c.json({ success: false, message: '가입이 거부되었습니다. 관리자에게 문의하세요.' }, 403)
    }

    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return c.json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 401)
    }

    const token = await generateToken({ 
      userId: user.id, 
      username: user.username, 
      role: user.role 
    }, c.env.JWT_SECRET || 'default-secret-key')

    const sessionId = generateId()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await c.env.DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionId, user.id, expiresAt).run()

    return c.json({ 
      success: true, 
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// 토큰 검증
authRoutes.get('/verify', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token, c.env.JWT_SECRET || 'default-secret-key')
    
    if (!payload) {
      return c.json({ success: false, message: '유효하지 않은 토큰입니다.' }, 401)
    }

    const user = await c.env.DB.prepare(
      'SELECT id, username, name, email, role, status FROM users WHERE id = ?'
    ).bind(payload.userId).first() as any

    if (!user || user.status !== 'approved') {
      return c.json({ success: false, message: '접근 권한이 없습니다.' }, 403)
    }

    return c.json({ success: true, user })
  } catch (error) {
    return c.json({ success: false, message: '인증 오류' }, 401)
  }
})

// 계정 초기화 (1회용 - 프로덕션 초기 설정용)
authRoutes.get('/reset-accounts', async (c) => {
  try {
    const adminHash = await hashPassword('Admin1234!')
    const testHash = await hashPassword('Test1234!')

    // admin 비밀번호 업데이트
    await c.env.DB.prepare(
      `UPDATE users SET password_hash = ?, role = 'admin', status = 'approved' WHERE username = 'admin'`
    ).bind(adminHash).run()

    // testuser 생성 또는 업데이트
    const existing = await c.env.DB.prepare(`SELECT id FROM users WHERE username = 'testuser'`).first()
    if (!existing) {
      await c.env.DB.prepare(
        `INSERT INTO users (username, password_hash, name, phone, email, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind('testuser', testHash, '테스트유저', '010-1234-5678', 'test@test.com', 'user', 'approved').run()
    } else {
      await c.env.DB.prepare(
        `UPDATE users SET password_hash = ?, status = 'approved' WHERE username = 'testuser'`
      ).bind(testHash).run()
    }

    return c.json({ 
      success: true, 
      message: '계정 초기화 완료',
      accounts: [
        { username: 'admin', password: 'Admin1234!', role: 'admin' },
        { username: 'testuser', password: 'Test1234!', role: 'user' }
      ]
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// 비밀번호 변경 (본인 인증 후)
authRoutes.post('/change-password', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token, c.env.JWT_SECRET || 'default-secret-key')
    if (!payload) {
      return c.json({ success: false, message: '유효하지 않은 토큰입니다.' }, 401)
    }

    const { currentPassword, newPassword, confirmPassword } = await c.req.json()

    if (!currentPassword || !newPassword || !confirmPassword) {
      return c.json({ success: false, message: '모든 필드를 입력해주세요.' }, 400)
    }

    if (newPassword.length < 8) {
      return c.json({ success: false, message: '새 비밀번호는 8자 이상이어야 합니다.' }, 400)
    }

    if (newPassword !== confirmPassword) {
      return c.json({ success: false, message: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.' }, 400)
    }

    const user = await c.env.DB.prepare(
      'SELECT id, username, password_hash, status FROM users WHERE id = ?'
    ).bind(payload.userId).first() as any

    if (!user || user.status !== 'approved') {
      return c.json({ success: false, message: '접근 권한이 없습니다.' }, 403)
    }

    const isValid = await verifyPassword(currentPassword, user.password_hash)
    if (!isValid) {
      return c.json({ success: false, message: '현재 비밀번호가 올바르지 않습니다.' }, 401)
    }

    if (currentPassword === newPassword) {
      return c.json({ success: false, message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.' }, 400)
    }

    const newHash = await hashPassword(newPassword)
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(newHash, payload.userId).run()

    // 기존 세션 모두 삭제 (재로그인 필요)
    await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(payload.userId).run()

    return c.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.' })
  } catch (error) {
    console.error('Change password error:', error)
    return c.json({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

// 로그아웃
authRoutes.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const payload = await verifyToken(token, c.env.JWT_SECRET || 'default-secret-key')
      if (payload) {
        await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(payload.userId).run()
      }
    }
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: true })
  }
})
