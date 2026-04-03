import { Hono } from 'hono'
import { verifyToken } from '../lib/utils'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  KIWOOM_APP_KEY: string
  KIWOOM_SECRET_KEY: string
}

export const stockRoutes = new Hono<{ Bindings: Bindings }>()

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

stockRoutes.use('/*', userAuth)

// Mock 주식 데이터
function getMockStockData() {
  return [
    { code: '005930', name: '삼성전자', market: 'KOSPI', price: 72500, change: 1200, changeRate: 1.68, volume: 15234567, signal: 'BUY', strength: 82 },
    { code: '000660', name: 'SK하이닉스', market: 'KOSPI', price: 185000, change: -2500, changeRate: -1.33, volume: 3456789, signal: 'HOLD', strength: 55 },
    { code: '373220', name: 'LG에너지솔루션', market: 'KOSPI', price: 385000, change: 8500, changeRate: 2.26, volume: 456789, signal: 'BUY', strength: 76 },
    { code: '005380', name: '현대자동차', market: 'KOSPI', price: 235000, change: 3000, changeRate: 1.29, volume: 789012, signal: 'BUY', strength: 70 },
    { code: '000270', name: '기아', market: 'KOSPI', price: 98000, change: 1500, changeRate: 1.56, volume: 1234567, signal: 'BUY', strength: 73 },
    { code: '035420', name: 'NAVER', market: 'KOSPI', price: 198000, change: -3000, changeRate: -1.49, volume: 345678, signal: 'SELL', strength: 65 },
    { code: '035720', name: '카카오', market: 'KOSPI', price: 42000, change: -500, changeRate: -1.18, volume: 2345678, signal: 'HOLD', strength: 45 },
    { code: '068270', name: '셀트리온', market: 'KOSPI', price: 175000, change: 5000, changeRate: 2.94, volume: 567890, signal: 'BUY', strength: 85 },
    { code: '207940', name: '삼성바이오로직스', market: 'KOSPI', price: 895000, change: 15000, changeRate: 1.70, volume: 123456, signal: 'BUY', strength: 78 },
    { code: '051910', name: 'LG화학', market: 'KOSPI', price: 325000, change: -5000, changeRate: -1.52, volume: 234567, signal: 'SELL', strength: 60 },
    { code: '247540', name: '에코프로비엠', market: 'KOSDAQ', price: 115000, change: 8500, changeRate: 7.97, volume: 3456789, signal: 'BUY', strength: 92 },
    { code: '086520', name: '에코프로', market: 'KOSDAQ', price: 78000, change: 5200, changeRate: 7.14, volume: 5678901, signal: 'BUY', strength: 90 },
    { code: '028300', name: 'HLB', market: 'KOSDAQ', price: 95000, change: 12000, changeRate: 14.46, volume: 8901234, signal: 'BUY', strength: 95 },
    { code: '196170', name: '알테오젠', market: 'KOSDAQ', price: 285000, change: 18000, changeRate: 6.74, volume: 1234567, signal: 'BUY', strength: 88 },
    { code: '022100', name: '포스코DX', market: 'KOSDAQ', price: 42000, change: -1500, changeRate: -3.45, volume: 2345678, signal: 'SELL', strength: 70 },
    { code: '277810', name: '레인보우로보틱스', market: 'KOSDAQ', price: 185000, change: 12000, changeRate: 6.92, volume: 456789, signal: 'BUY', strength: 87 },
    { code: '039030', name: '이오테크닉스', market: 'KOSDAQ', price: 125000, change: 3500, changeRate: 2.88, volume: 345678, signal: 'BUY', strength: 72 },
    { code: '141080', name: '리가켐바이오', market: 'KOSDAQ', price: 68000, change: -2000, changeRate: -2.86, volume: 678901, signal: 'SELL', strength: 58 },
    { code: '328130', name: '루닛', market: 'KOSDAQ', price: 58000, change: 4500, changeRate: 8.41, volume: 2345678, signal: 'BUY', strength: 89 },
    { code: '091990', name: '셀트리온헬스케어', market: 'KOSDAQ', price: 72000, change: 2500, changeRate: 3.60, volume: 1234567, signal: 'BUY', strength: 75 },
  ]
}

// 주식 목록 조회
stockRoutes.get('/', async (c) => {
  try {
    const market = c.req.query('market') || 'ALL'
    let stocks = getMockStockData()
    
    if (market !== 'ALL') {
      stocks = stocks.filter(s => s.market === market)
    }

    // DB에서 시그널 정보 병합
    const { results: dbSignals } = await c.env.DB.prepare(
      "SELECT stock_code, signal_type, strength FROM signals ORDER BY created_at DESC"
    ).all() as any

    const signalMap: Record<string, any> = {}
    for (const sig of dbSignals) {
      if (!signalMap[sig.stock_code]) {
        signalMap[sig.stock_code] = sig
      }
    }

    const enrichedStocks = stocks.map(stock => {
      const dbSignal = signalMap[stock.code]
      if (dbSignal) {
        return { ...stock, signal: dbSignal.signal_type, strength: dbSignal.strength }
      }
      return stock
    })

    return c.json({ success: true, stocks: enrichedStocks })
  } catch (error) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

// KOSPI 주식
stockRoutes.get('/kospi', async (c) => {
  const stocks = getMockStockData().filter(s => s.market === 'KOSPI')
  return c.json({ success: true, stocks })
})

// KOSDAQ 주식
stockRoutes.get('/kosdaq', async (c) => {
  const stocks = getMockStockData().filter(s => s.market === 'KOSDAQ')
  return c.json({ success: true, stocks })
})

// 개별 주식 조회
stockRoutes.get('/:code', async (c) => {
  try {
    const code = c.req.param('code')
    const stocks = getMockStockData()
    const stock = stocks.find(s => s.code === code)
    
    if (!stock) {
      return c.json({ success: false, message: '종목을 찾을 수 없습니다.' }, 404)
    }

    // 차트 데이터 생성 (Mock)
    const chartData = generateMockChartData(stock.price)
    
    return c.json({ success: true, stock, chartData })
  } catch (error) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

function generateMockChartData(currentPrice: number) {
  const data = []
  let price = currentPrice * 0.9
  const now = Date.now()
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000)
    const change = (Math.random() - 0.48) * price * 0.03
    price = Math.max(price + change, currentPrice * 0.7)
    data.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(price * (1 - Math.random() * 0.01)),
      high: Math.round(price * (1 + Math.random() * 0.02)),
      low: Math.round(price * (1 - Math.random() * 0.02)),
      close: Math.round(price),
      volume: Math.round(Math.random() * 5000000 + 1000000)
    })
  }
  return data
}
