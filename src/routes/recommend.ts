import { Hono } from 'hono'
import { verifyToken } from '../lib/utils'
import { KOSPI_POOL, KOSDAQ_POOL, ALL_STOCK_POOL } from '../data/stockPool'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

export const recommendRoutes = new Hono<{ Bindings: Bindings }>()

const userAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
  const token = authHeader.substring(7)
  const payload = await verifyToken(token, c.env.JWT_SECRET || 'default-secret-key')
  if (!payload) return c.json({ success: false, message: '유효하지 않은 토큰입니다.' }, 401)
  c.set('user', payload)
  await next()
}

recommendRoutes.use('/*', userAuth)

const STOCK_POOL = ALL_STOCK_POOL

// 자동 시그널 계산
function calcSignal(stock: any, dbSignals: any[]): { signal: string; strength: number; reason: string; targetPrice: number; stopLoss: number } {
  const dbSig = dbSignals.find((s: any) => s.stock_code === stock.code)
  if (dbSig) {
    return {
      signal:      dbSig.signal_type,
      strength:    dbSig.strength,
      reason:      dbSig.description || '관리자 등록 시그널',
      targetPrice: dbSig.target_price || Math.round(stock.price * 1.15),
      stopLoss:    dbSig.stop_loss    || Math.round(stock.price * 0.92),
    }
  }

  // ── 기본 점수: 50 (완전 중립, 보수적 출발)
  let score = 50
  const cr = stock.changeRate

  // ── 등락률 가산/감산
  // BUY: +5% 이상 (score>=65) / SELL: -1.5% 이하 (score<=38)
  // 최대 80으로 제한해 극단적 강도 표시 방지
  if      (cr >= 10)   score += 28   // 급등:  78 → BUY
  else if (cr >= 7)    score += 22   // 강세:  72 → BUY
  else if (cr >= 5)    score += 16   // 상승:  66 → BUY
  else if (cr >= 3)    score += 10   // 완만:  60 → HOLD
  else if (cr >= 1.5)  score += 5    // 소폭:  55 → HOLD
  else if (cr >= 0.5)  score += 2    // 보합+: 52 → HOLD
  else if (cr >= 0)    score += 0    // 보합:  50 → HOLD
  else if (cr >= -1)   score -= 5    // 약보합: 45 → HOLD
  else if (cr >= -2)   score -= 12   // 하락:  38 → SELL 경계
  else if (cr >= -3)   score -= 20   // 급락:  30 → SELL
  else if (cr >= -5)   score -= 28   // 대폭락: 22 → SELL
  else                 score -= 35   // 극폭락: 15 → 강한 SELL

  // ── 거래량 보정 (±3 이하로 최소화, 등락률 영향 유지)
  if      (stock.volume > 5000000)  score += 3   // 초대량: +3
  else if (stock.volume > 2000000)  score += 2   // 대량:   +2
  else if (stock.volume > 1000000)  score += 1   // 보통:   +1
  else if (stock.volume < 100000)   score -= 3   // 극소량: -3
  else if (stock.volume < 300000)   score -= 1   // 소량:   -1

  // ── 점수 범위 제한: 최대 80 (극단적 강도 억제), 최소 5
  score = Math.min(80, Math.max(5, score))

  // ── 시그널 판정
  //  BUY  >= 65 (+5%급 상승 + 거래량 동반 시)
  //  SELL <= 38 (-1.5% 이하 하락)
  //  HOLD: 39~64 구간 (소폭 등락·관망)
  let signal = 'HOLD'
  let reason  = '관망 구간 - 방향성 확인 후 대응 권장'
  if (score >= 65) { signal = 'BUY';  reason = '상승 모멘텀 포착 - 거래량과 섹터 흐름 함께 확인' }
  if (score <= 38) { signal = 'SELL'; reason = '하락 추세 진입 - 손절 기준 재점검 권고' }

  // ── 섹터별 구체적 사유 (균형잡힌 표현)
  if ((stock.sector === '반도체' || stock.sector === '반도체소재' || stock.sector === '반도체장비') && score >= 65)
    reason = 'AI·HBM 수요 확대 수혜 기대 - 재고 사이클 변동에 유의'
  if ((stock.sector === '바이오' || stock.sector === 'AI의료') && cr >= 5)
    reason = '임상 진전 또는 허가 기대감 유입 - 결과 발표 전후 변동성 관리 필요'
  if ((stock.sector === '2차전지' || stock.sector === '2차전지소재') && cr >= 5)
    reason = '전기차 수요 반등 기대 - 리튬·니켈 가격 방향과 연동 확인'
  if ((stock.sector === '로봇') && cr >= 5)
    reason = 'AI 로봇 수주 기대 테마 강세 - 실적 뒷받침 여부 확인 권장'
  if ((stock.sector === '방산') && cr >= 3)
    reason = '수출 계약 기대 및 지정학 리스크 반영 - 계약 확정 전 과매수 주의'
  if ((stock.sector === '조선') && cr >= 3)
    reason = 'LNG·친환경 선박 수주 모멘텀 - 환율·후판 가격 영향 점검'
  if ((stock.sector === 'RNA치료제' || stock.sector === '의료기기') && cr >= 5)
    reason = '첨단 의료 기술 테마 강세 - 수익화 일정과 임상 단계 확인 필요'

  return {
    signal,
    strength:    score,
    reason,
    // 목표가: BUY +8% / 그외 -5% (현실적 단기 목표, 너무 낙관적이지 않게)
    targetPrice: Math.round(stock.price * (signal === 'BUY' ? 1.08 : 0.95)),
    // 손절가: BUY -5% / SELL +4% (리스크 관리 기준 현실화)
    stopLoss:    Math.round(stock.price * (signal === 'BUY' ? 0.95 : 1.04)),
  }
}

// ─── 추천 종목 Top N ─────────────────────────────────────────────────────
recommendRoutes.get('/top', async (c) => {
  try {
    const market = c.req.query('market') || 'ALL'
    const type   = c.req.query('type')   || 'BUY'
    const limit  = Math.min(parseInt(c.req.query('limit') || '10'), 30)

    const { results: dbSignals } = await c.env.DB.prepare(
      'SELECT * FROM signals ORDER BY created_at DESC'
    ).all() as any

    let pool = STOCK_POOL
    if (market !== 'ALL') pool = pool.filter(s => s.market === market)

    const enriched = pool.map(stock => ({ ...stock, ...calcSignal(stock, dbSignals) }))
    let filtered = type === 'ALL' ? enriched : enriched.filter(s => s.signal === type)

    filtered.sort((a, b) => b.strength - a.strength)
    return c.json({ success: true, stocks: filtered.slice(0, limit), total: filtered.length })
  } catch (err) {
    console.error(err)
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

// ─── 섹터별 강도 ─────────────────────────────────────────────────────────
recommendRoutes.get('/sectors', async (c) => {
  try {
    const { results: dbSignals } = await c.env.DB.prepare(
      'SELECT * FROM signals ORDER BY created_at DESC'
    ).all() as any

    const enriched = STOCK_POOL.map(stock => ({ ...stock, ...calcSignal(stock, dbSignals) }))

    const sectorMap: Record<string, any[]> = {}
    for (const s of enriched) {
      if (!sectorMap[s.sector]) sectorMap[s.sector] = []
      sectorMap[s.sector].push(s)
    }

    const sectors = Object.entries(sectorMap).map(([sector, stocks]) => {
      stocks.sort((a, b) => b.strength - a.strength)
      const avg = Math.round(stocks.reduce((acc, s) => acc + s.strength, 0) / stocks.length)
      return { sector, topStock: stocks[0], avgStrength: avg, count: stocks.length }
    }).sort((a, b) => b.avgStrength - a.avgStrength)

    return c.json({ success: true, sectors })
  } catch (err) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

// ─── 뉴스 기반 연관 종목 시그널 ─────────────────────────────────────────
recommendRoutes.get('/news-stocks', async (c) => {
  try {
    const codes = (c.req.query('codes') || '').split(',').filter(Boolean)
    if (codes.length === 0) return c.json({ success: true, stocks: [] })

    const { results: dbSignals } = await c.env.DB.prepare(
      'SELECT * FROM signals ORDER BY created_at DESC'
    ).all() as any

    const result = codes.map(code => {
      const stock = STOCK_POOL.find(s => s.code === code)
      if (!stock) return null
      return { ...stock, ...calcSignal(stock, dbSignals) }
    }).filter(Boolean)

    return c.json({ success: true, stocks: result })
  } catch (err) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})
