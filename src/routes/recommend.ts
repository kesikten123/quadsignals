import { Hono } from 'hono'
import { verifyToken } from '../lib/utils'

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

// ─── 추천 종목 풀 (점수 포함) ───────────────────────────────────────
const STOCK_POOL = [
  // KOSPI
  { code:'005930', name:'삼성전자',       market:'KOSPI',  sector:'반도체',    price:72500,  change:1200,  changeRate:1.68,  volume:15234567 },
  { code:'000660', name:'SK하이닉스',      market:'KOSPI',  sector:'반도체',    price:185000, change:-2500, changeRate:-1.33, volume:3456789  },
  { code:'373220', name:'LG에너지솔루션',  market:'KOSPI',  sector:'2차전지',   price:385000, change:8500,  changeRate:2.26,  volume:456789   },
  { code:'005380', name:'현대자동차',      market:'KOSPI',  sector:'자동차',    price:235000, change:3000,  changeRate:1.29,  volume:789012   },
  { code:'000270', name:'기아',           market:'KOSPI',  sector:'자동차',    price:98000,  change:1500,  changeRate:1.56,  volume:1234567  },
  { code:'035420', name:'NAVER',          market:'KOSPI',  sector:'IT/플랫폼', price:198000, change:-3000, changeRate:-1.49, volume:345678   },
  { code:'035720', name:'카카오',          market:'KOSPI',  sector:'IT/플랫폼', price:42000,  change:-500,  changeRate:-1.18, volume:2345678  },
  { code:'068270', name:'셀트리온',        market:'KOSPI',  sector:'바이오',    price:175000, change:5000,  changeRate:2.94,  volume:567890   },
  { code:'207940', name:'삼성바이오로직스', market:'KOSPI',  sector:'바이오',    price:895000, change:15000, changeRate:1.70,  volume:123456   },
  { code:'051910', name:'LG화학',          market:'KOSPI',  sector:'화학',      price:325000, change:-5000, changeRate:-1.52, volume:234567   },
  { code:'105560', name:'KB금융',          market:'KOSPI',  sector:'금융',      price:68000,  change:800,   changeRate:1.19,  volume:1234567  },
  { code:'055550', name:'신한지주',        market:'KOSPI',  sector:'금융',      price:45000,  change:500,   changeRate:1.12,  volume:987654   },
  // KOSDAQ
  { code:'247540', name:'에코프로비엠',    market:'KOSDAQ', sector:'2차전지',   price:115000, change:8500,  changeRate:7.97,  volume:3456789  },
  { code:'086520', name:'에코프로',        market:'KOSDAQ', sector:'2차전지',   price:78000,  change:5200,  changeRate:7.14,  volume:5678901  },
  { code:'028300', name:'HLB',            market:'KOSDAQ', sector:'바이오',    price:95000,  change:12000, changeRate:14.46, volume:8901234  },
  { code:'196170', name:'알테오젠',        market:'KOSDAQ', sector:'바이오',    price:285000, change:18000, changeRate:6.74,  volume:1234567  },
  { code:'022100', name:'포스코DX',        market:'KOSDAQ', sector:'IT/AI',     price:42000,  change:-1500, changeRate:-3.45, volume:2345678  },
  { code:'277810', name:'레인보우로보틱스', market:'KOSDAQ', sector:'로봇',      price:185000, change:12000, changeRate:6.92,  volume:456789   },
  { code:'039030', name:'이오테크닉스',    market:'KOSDAQ', sector:'반도체장비', price:125000, change:3500,  changeRate:2.88,  volume:345678   },
  { code:'141080', name:'리가켐바이오',    market:'KOSDAQ', sector:'바이오',    price:68000,  change:-2000, changeRate:-2.86, volume:678901   },
  { code:'328130', name:'루닛',            market:'KOSDAQ', sector:'AI의료',    price:58000,  change:4500,  changeRate:8.41,  volume:2345678  },
  { code:'091990', name:'셀트리온헬스케어', market:'KOSDAQ', sector:'바이오',   price:72000,  change:2500,  changeRate:3.60,  volume:1234567  },
  { code:'259960', name:'크래프톤',        market:'KOSPI',  sector:'게임',      price:245000, change:6000,  changeRate:2.51,  volume:345678   },
  { code:'323410', name:'카카오뱅크',      market:'KOSPI',  sector:'금융',      price:22000,  change:-300,  changeRate:-1.35, volume:2345678  },
]

function calcSignal(stock: any, dbSignals: any[]): { signal: string; strength: number; reason: string; targetPrice: number; stopLoss: number } {
  // DB에 등록된 시그널 우선 사용
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

  // 자동 계산 (모멘텀 + 거래량 기반)
  let score = 50
  const cr = stock.changeRate

  if (cr >= 5)       score += 30
  else if (cr >= 3)  score += 20
  else if (cr >= 1)  score += 10
  else if (cr <= -5) score -= 30
  else if (cr <= -3) score -= 20
  else if (cr <= -1) score -= 10

  if (stock.volume > 3000000) score += 10
  else if (stock.volume < 500000) score -= 5

  score = Math.min(100, Math.max(5, score))

  let signal = 'HOLD'
  let reason  = '관망 구간 - 추가 신호 대기'
  if (score >= 65) { signal = 'BUY';  reason = '모멘텀 상승 + 거래량 증가 확인' }
  if (score <= 35) { signal = 'SELL'; reason = '하락 추세 - 손절 라인 점검 필요' }

  return {
    signal,
    strength:    score,
    reason,
    targetPrice: Math.round(stock.price * (signal === 'BUY' ? 1.15 : 0.95)),
    stopLoss:    Math.round(stock.price * (signal === 'BUY' ? 0.92 : 1.05)),
  }
}

// ─── 추천 종목 Top 10 ────────────────────────────────────────────────
recommendRoutes.get('/top', async (c) => {
  try {
    const market = c.req.query('market') || 'ALL'
    const type   = c.req.query('type')   || 'BUY'   // BUY | SELL | ALL
    const limit  = Math.min(parseInt(c.req.query('limit') || '10'), 20)

    const { results: dbSignals } = await c.env.DB.prepare(
      'SELECT * FROM signals ORDER BY created_at DESC'
    ).all() as any

    let pool = STOCK_POOL
    if (market !== 'ALL') pool = pool.filter(s => s.market === market)

    const enriched = pool.map(stock => {
      const sig = calcSignal(stock, dbSignals)
      return { ...stock, ...sig }
    })

    let filtered = enriched
    if (type !== 'ALL') filtered = enriched.filter(s => s.signal === type)

    // 강도 내림차순
    filtered.sort((a, b) => b.strength - a.strength)

    return c.json({ success: true, stocks: filtered.slice(0, limit) })
  } catch (err) {
    console.error(err)
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

// ─── 섹터별 추천 ──────────────────────────────────────────────────────
recommendRoutes.get('/sectors', async (c) => {
  try {
    const { results: dbSignals } = await c.env.DB.prepare(
      'SELECT * FROM signals ORDER BY created_at DESC'
    ).all() as any

    const enriched = STOCK_POOL.map(stock => {
      const sig = calcSignal(stock, dbSignals)
      return { ...stock, ...sig }
    })

    const sectorMap: Record<string, any[]> = {}
    for (const s of enriched) {
      if (!sectorMap[s.sector]) sectorMap[s.sector] = []
      sectorMap[s.sector].push(s)
    }

    // 섹터별 최고 강도 종목 1개씩
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

// ─── 뉴스 기반 연관 종목 시그널 포함 조회 ────────────────────────────
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
      const sig = calcSignal(stock, dbSignals)
      return { ...stock, ...sig }
    }).filter(Boolean)

    return c.json({ success: true, stocks: result })
  } catch (err) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})
