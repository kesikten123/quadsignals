import { Hono } from 'hono'
import { verifyToken } from '../lib/utils'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

export const adminRoutes = new Hono<{ Bindings: Bindings }>()

// Admin auth middleware
const adminAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
  }

  const token = authHeader.substring(7)
  const payload = await verifyToken(token, c.env.JWT_SECRET || 'default-secret-key')
  
  if (!payload || payload.role !== 'admin') {
    return c.json({ success: false, message: '관리자 권한이 필요합니다.' }, 403)
  }

  c.set('user', payload)
  await next()
}

adminRoutes.use('/*', adminAuth)

// 전체 회원 목록
adminRoutes.get('/users', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, username, name, phone, email, role, status, created_at, approved_at FROM users ORDER BY created_at DESC'
    ).all()
    return c.json({ success: true, users: results })
  } catch (error) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

// 대기 중인 회원 목록
adminRoutes.get('/users/pending', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, username, name, phone, email, role, status, created_at FROM users WHERE status = 'pending' ORDER BY created_at DESC"
    ).all()
    return c.json({ success: true, users: results })
  } catch (error) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

// 회원 승인
adminRoutes.put('/users/:id/approve', async (c) => {
  try {
    const id = c.req.param('id')
    const admin = c.get('user') as any

    await c.env.DB.prepare(
      "UPDATE users SET status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = ? WHERE id = ?"
    ).bind(admin.userId, id).run()

    return c.json({ success: true, message: '회원이 승인되었습니다.' })
  } catch (error) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

// 회원 거부
adminRoutes.put('/users/:id/reject', async (c) => {
  try {
    const id = c.req.param('id')

    await c.env.DB.prepare(
      "UPDATE users SET status = 'rejected' WHERE id = ?"
    ).bind(id).run()

    return c.json({ success: true, message: '회원이 거부되었습니다.' })
  } catch (error) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

// 회원 삭제
adminRoutes.delete('/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM users WHERE id = ? AND role != ?').bind(id, 'admin').run()
    return c.json({ success: true, message: '회원이 삭제되었습니다.' })
  } catch (error) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

// 통계
adminRoutes.get('/stats', async (c) => {
  try {
    const totalUsers = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").first() as any
    const pendingUsers = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'pending'").first() as any
    const approvedUsers = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'approved' AND role = 'user'").first() as any
    const totalSignals = await c.env.DB.prepare("SELECT COUNT(*) as count FROM signals").first() as any

    return c.json({
      success: true,
      stats: {
        totalUsers: totalUsers?.count || 0,
        pendingUsers: pendingUsers?.count || 0,
        approvedUsers: approvedUsers?.count || 0,
        totalSignals: totalSignals?.count || 0
      }
    })
  } catch (error) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

// 시그널 추가 (관리자)
adminRoutes.post('/signals', async (c) => {
  try {
    const { stock_code, stock_name, market, signal_type, price, target_price, stop_loss, strength, description } = await c.req.json()

    await c.env.DB.prepare(
      'INSERT INTO signals (stock_code, stock_name, market, signal_type, price, target_price, stop_loss, strength, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(stock_code, stock_name, market, signal_type, price, target_price, stop_loss, strength || 75, description || '').run()

    return c.json({ success: true, message: '시그널이 추가되었습니다.' })
  } catch (error) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

// 시그널 삭제 (관리자)
adminRoutes.delete('/signals/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM signals WHERE id = ?').bind(id).run()
    return c.json({ success: true, message: '시그널이 삭제되었습니다.' })
  } catch (error) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})
