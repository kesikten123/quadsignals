import { Hono } from 'hono'
import { verifyToken } from '../lib/utils'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

export const signalRoutes = new Hono<{ Bindings: Bindings }>()

// User auth middleware
const userAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
  }
  const token = authHeader.substring(7)
  const payload = await verifyToken(token, c.env.JWT_SECRET || 'default-secret-key')
  if (!payload) {
    return c.json({ success: false, message: '유효하지 않은 토큰입니다.' }, 401)
  }
  c.set('user', payload)
  await next()
}

signalRoutes.use('/*', userAuth)

// 전체 시그널 목록
signalRoutes.get('', async (c) => {
  try {
    const market = c.req.query('market') || 'ALL'
    const type = c.req.query('type') || 'ALL'
    const limit = parseInt(c.req.query('limit') || '50')

    let query = 'SELECT * FROM signals'
    const params: any[] = []
    const conditions: string[] = []

    if (market !== 'ALL') {
      conditions.push('market = ?')
      params.push(market)
    }
    if (type !== 'ALL') {
      conditions.push('signal_type = ?')
      params.push(type)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY created_at DESC LIMIT ?'
    params.push(limit)

    const { results } = await c.env.DB.prepare(query).bind(...params).all()

    return c.json({ success: true, signals: results })
  } catch (error) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

// 최신 시그널 요약 (대시보드용)
signalRoutes.get('/summary', async (c) => {
  try {
    const buySignals = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM signals WHERE signal_type = 'BUY' AND created_at > datetime('now', '-7 days')"
    ).first() as any
    
    const sellSignals = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM signals WHERE signal_type = 'SELL' AND created_at > datetime('now', '-7 days')"
    ).first() as any

    const strongBuys = await c.env.DB.prepare(
      "SELECT * FROM signals WHERE signal_type = 'BUY' AND strength >= 80 ORDER BY strength DESC, created_at DESC LIMIT 5"
    ).all()

    const strongSells = await c.env.DB.prepare(
      "SELECT * FROM signals WHERE signal_type = 'SELL' AND strength >= 80 ORDER BY strength DESC, created_at DESC LIMIT 5"
    ).all()

    return c.json({
      success: true,
      summary: {
        buyCount: buySignals?.count || 0,
        sellCount: sellSignals?.count || 0,
        strongBuys: strongBuys.results,
        strongSells: strongSells.results
      }
    })
  } catch (error) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

// KOSPI 시그널
signalRoutes.get('/kospi', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM signals WHERE market = 'KOSPI' ORDER BY created_at DESC LIMIT 30"
    ).all()
    return c.json({ success: true, signals: results })
  } catch (error) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

// KOSDAQ 시그널
signalRoutes.get('/kosdaq', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM signals WHERE market = 'KOSDAQ' ORDER BY created_at DESC LIMIT 30"
    ).all()
    return c.json({ success: true, signals: results })
  } catch (error) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})
