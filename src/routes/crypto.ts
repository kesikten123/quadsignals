import { Hono } from 'hono'
import { verifyToken } from '../lib/utils'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  STOCK_CACHE: KVNamespace
}

export const cryptoRoutes = new Hono<{ Bindings: Bindings }>()

// ─── 인증 미들웨어 ────────────────────────────────────────────────────────────
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

cryptoRoutes.use('/*', userAuth)

// ─── CoinGecko API 헤더 ───────────────────────────────────────────────────────
const CG_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
}

// ─── 기술적 지표 계산 유틸리티 ─────────────────────────────────────────────────

// RSI(14) 계산
function calcRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50
  let gains = 0, losses = 0
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1]
    if (diff > 0) gains += diff
    else losses += Math.abs(diff)
  }
  const avgGain = gains / period
  const avgLoss = losses / period
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

// EMA 계산
function calcEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return prices.map(() => prices[prices.length - 1])
  const k = 2 / (period + 1)
  const emas: number[] = []
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period
  emas.push(ema)
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k)
    emas.push(ema)
  }
  return emas
}

// MACD 계산
function calcMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 }
  const ema12 = calcEMA(prices, 12)
  const ema26 = calcEMA(prices, 26)
  const macdLine: number[] = []
  const offset = prices.length - ema26.length
  for (let i = 0; i < ema26.length; i++) {
    macdLine.push(ema12[i + offset] - ema26[i])
  }
  const signalLine = calcEMA(macdLine, 9)
  const lastMACD = macdLine[macdLine.length - 1]
  const lastSignal = signalLine[signalLine.length - 1]
  return { macd: lastMACD, signal: lastSignal, histogram: lastMACD - lastSignal }
}

// 볼린저밴드 계산
function calcBollingerBands(prices: number[], period = 20): { upper: number; middle: number; lower: number; position: number } {
  if (prices.length < period) {
    const p = prices[prices.length - 1]
    return { upper: p * 1.02, middle: p, lower: p * 0.98, position: 0.5 }
  }
  const slice = prices.slice(-period)
  const mean = slice.reduce((a, b) => a + b, 0) / period
  const variance = slice.reduce((acc, p) => acc + (p - mean) ** 2, 0) / period
  const std = Math.sqrt(variance)
  const upper = mean + 2 * std
  const lower = mean - 2 * std
  const current = prices[prices.length - 1]
  const position = std > 0 ? (current - lower) / (upper - lower) : 0.5
  return { upper, middle: mean, lower, position: Math.max(0, Math.min(1, position)) }
}

// 가격 추세 기울기
function calcTrend(prices: number[], lookback = 14): number {
  if (prices.length < lookback) return 0
  const recent = prices.slice(-lookback)
  const first = recent[0], last = recent[recent.length - 1]
  return ((last - first) / first) * 100
}

// 거래량 변화율
function calcVolumeRatio(volumes: number[], period = 14): number {
  if (volumes.length < period + 1) return 1
  const recent = volumes.slice(-period)
  const avg = recent.reduce((a, b) => a + b, 0) / period
  const latest = volumes[volumes.length - 1]
  return avg > 0 ? latest / avg : 1
}

// ─── 시간 프레임별 시그널 생성 ──────────────────────────────────────────────────
// 시간대별 가중치와 지표 민감도를 다르게 적용
function generateTimeframeSignals(
  sparkline: number[],           // 168시간(7일) 가격 데이터
  currentPrice: number,
  change1h: number,
  change24h: number,
  change7d: number,
  volume24h: number,
  volumeAvg?: number
): Array<{
  timeframe: string
  label: string
  signal: 'BUY' | 'SELL' | 'HOLD'
  confidence: number             // 0-100 신뢰도
  reason: string[]
  targetPrice: number
  stopLoss: number
  score: number                  // -100 ~ +100
}> {
  const prices = sparkline.length > 0 ? sparkline : [currentPrice]

  // 지표 계산
  const rsi = calcRSI(prices)
  const macd = calcMACD(prices)
  const bb = calcBollingerBands(prices)
  const trend7d = calcTrend(prices, Math.min(168, prices.length))
  const trend24h = calcTrend(prices, Math.min(24, prices.length))
  const trend1h = change1h

  // 볼륨 비율 (sparkline에 볼륨 없으면 1 사용)
  const volRatio = 1.0  // CoinGecko sparkline은 가격만 제공

  // 기본 점수 계산 (공통 기반)
  let baseScore = 0

  // RSI 기여 (-30 ~ +30)
  if (rsi < 25)       baseScore += 30   // 극도 과매도 → 강한 매수
  else if (rsi < 35)  baseScore += 20
  else if (rsi < 45)  baseScore += 10
  else if (rsi > 80)  baseScore -= 30   // 극도 과매수 → 강한 매도
  else if (rsi > 70)  baseScore -= 20
  else if (rsi > 60)  baseScore -= 8

  // MACD 기여 (-20 ~ +20)
  if (macd.histogram > 0 && macd.macd > 0)      baseScore += 20  // 상승 교차
  else if (macd.histogram > 0)                    baseScore += 12
  else if (macd.histogram < 0 && macd.macd < 0)  baseScore -= 20 // 하락 교차
  else if (macd.histogram < 0)                    baseScore -= 12

  // 볼린저밴드 기여 (-15 ~ +15)
  if (bb.position < 0.1)       baseScore += 15  // 하단 돌파 → 반등 기대
  else if (bb.position < 0.25) baseScore += 8
  else if (bb.position > 0.9)  baseScore -= 15  // 상단 돌파 → 조정 기대
  else if (bb.position > 0.75) baseScore -= 8

  // 7일 추세 기여 (-20 ~ +20)
  if (trend7d > 15)       baseScore += 20
  else if (trend7d > 7)   baseScore += 12
  else if (trend7d > 3)   baseScore += 6
  else if (trend7d < -15) baseScore -= 20
  else if (trend7d < -7)  baseScore -= 12
  else if (trend7d < -3)  baseScore -= 6

  // 24h 변화율 기여 (-15 ~ +15)
  if (change24h > 8)       baseScore += 15
  else if (change24h > 4)  baseScore += 8
  else if (change24h > 1)  baseScore += 3
  else if (change24h < -8) baseScore -= 15
  else if (change24h < -4) baseScore -= 8
  else if (change24h < -1) baseScore -= 3

  // 시간프레임 정의 (분 단위)
  const timeframes = [
    { id: '30m',  label: '30분 후',  minutes: 30,  momentumW: 0.45, trendW: 0.20, meanRevW: 0.35 },
    { id: '1h',   label: '1시간 후', minutes: 60,  momentumW: 0.40, trendW: 0.25, meanRevW: 0.35 },
    { id: '3h',   label: '3시간 후', minutes: 180, momentumW: 0.30, trendW: 0.35, meanRevW: 0.35 },
    { id: '6h',   label: '6시간 후', minutes: 360, momentumW: 0.25, trendW: 0.45, meanRevW: 0.30 },
    { id: '12h',  label: '12시간 후',minutes: 720, momentumW: 0.20, trendW: 0.50, meanRevW: 0.30 },
    { id: '24h',  label: '24시간 후',minutes: 1440,momentumW: 0.15, trendW: 0.60, meanRevW: 0.25 },
  ]

  return timeframes.map(tf => {
    let score = baseScore

    // 단기(30분~1시간): 모멘텀(1h 변화율) 비중 높음
    const momentumBonus = change1h * tf.momentumW * 5
    score += Math.max(-20, Math.min(20, momentumBonus))

    // 중기(3~6시간): 24h 추세 비중 높음
    const trendBonus = change24h * tf.trendW * 2
    score += Math.max(-15, Math.min(15, trendBonus))

    // 장기(12~24시간): 7d 추세 비중
    const ltBonus = trend7d * tf.momentumW * 0.5
    score += Math.max(-10, Math.min(10, ltBonus))

    // 시그널 조건 - 시간대마다 임계값 다르게
    // 단기일수록 신중하게 (임계값 높음), 장기일수록 더 적극적
    const buyThreshold  = tf.minutes <= 60 ? 25 : tf.minutes <= 360 ? 20 : 15
    const sellThreshold = tf.minutes <= 60 ? -25 : tf.minutes <= 360 ? -20 : -15

    const signal: 'BUY' | 'SELL' | 'HOLD' =
      score >= buyThreshold  ? 'BUY'  :
      score <= sellThreshold ? 'SELL' : 'HOLD'

    // 신뢰도 (점수 크기 → 신뢰도, 30~95%)
    const absScore = Math.abs(score)
    const confidence = Math.round(30 + Math.min(65, absScore * 1.1))

    // 목표가 / 손절가 계산
    const volatility = Math.abs(change24h) / 100 || 0.02
    const horizon = tf.minutes / 1440  // 일 단위 환산
    const targetMult = 1 + volatility * Math.sqrt(horizon) * (signal === 'BUY' ? 1.5 : -0.5)
    const stopMult   = 1 - volatility * Math.sqrt(horizon) * (signal === 'BUY' ? 0.8 : -1.2)

    const targetPrice = signal === 'BUY'  ? currentPrice * targetMult
                      : signal === 'SELL' ? currentPrice * (2 - targetMult)
                      : currentPrice * (1 + volatility * horizon * 0.5)

    const stopLoss = signal === 'BUY'  ? currentPrice * stopMult
                   : signal === 'SELL' ? currentPrice * (2 - stopMult)
                   : currentPrice * (1 - volatility * horizon)

    // 시그널 이유 생성
    const reasons: string[] = []
    if (rsi < 35) reasons.push(`RSI ${rsi.toFixed(0)} 과매도`)
    else if (rsi > 65) reasons.push(`RSI ${rsi.toFixed(0)} 과매수`)
    else reasons.push(`RSI ${rsi.toFixed(0)} 중립`)

    if (macd.histogram > 0) reasons.push('MACD 상승 교차')
    else reasons.push('MACD 하락 압력')

    if (bb.position < 0.25) reasons.push('볼린저 하단 근접')
    else if (bb.position > 0.75) reasons.push('볼린저 상단 근접')

    if (change1h > 1) reasons.push(`1h +${change1h.toFixed(1)}% 상승세`)
    else if (change1h < -1) reasons.push(`1h ${change1h.toFixed(1)}% 하락세`)

    if (change24h > 3) reasons.push(`24h +${change24h.toFixed(1)}% 강세`)
    else if (change24h < -3) reasons.push(`24h ${change24h.toFixed(1)}% 약세`)

    return {
      timeframe: tf.id,
      label: tf.label,
      signal,
      confidence,
      reason: reasons.slice(0, 4),
      targetPrice: Math.round(targetPrice * 100) / 100,
      stopLoss:    Math.round(stopLoss * 100) / 100,
      score: Math.round(Math.max(-100, Math.min(100, score))),
    }
  })
}

// ─── Top 10 코인 목록 조회 (CoinGecko) ─────────────────────────────────────────
async function fetchTop10Coins(kv?: KVNamespace): Promise<{ data: any[]; cached: boolean; cacheAge: number }> {
  const cacheKey = 'crypto_top10'
  const FRESH_TTL  = 120        // 2분: 신선한 캐시
  const STALE_TTL  = 3600       // 1시간: 429 시 stale-while-revalidate 허용

  // KV 캐시 확인
  let cachedEntry: any = null
  if (kv) {
    try {
      cachedEntry = await kv.get(cacheKey, 'json') as any
    } catch {}
  }

  const now = Date.now()
  const cacheAge = cachedEntry?.ts ? Math.round((now - cachedEntry.ts) / 1000) : 9999

  // 신선한 캐시가 있으면 즉시 반환
  if (cachedEntry?.data && cacheAge < FRESH_TTL) {
    return { data: cachedEntry.data, cached: true, cacheAge }
  }

  // CoinGecko 호출
  try {
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d'
    const res = await fetch(url, { headers: CG_HEADERS })

    if (res.status === 429) {
      // Rate limit → stale 캐시 사용 (최대 1시간)
      if (cachedEntry?.data && cacheAge < STALE_TTL) {
        console.warn(`CoinGecko 429 - stale 캐시 사용 (${cacheAge}초 경과)`)
        return { data: cachedEntry.data, cached: true, cacheAge }
      }
      throw new Error('CoinGecko API rate limit (429) - 캐시 없음')
    }

    if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`)
    const data: any[] = await res.json()

    // 캐시 저장
    if (kv && data.length > 0) {
      try {
        await kv.put(cacheKey, JSON.stringify({ data, ts: now }), { expirationTtl: STALE_TTL * 2 })
      } catch {}
    }
    return { data, cached: false, cacheAge: 0 }

  } catch (err: any) {
    // 네트워크 오류 등 → stale 캐시 fallback
    if (cachedEntry?.data && cacheAge < STALE_TTL) {
      console.warn(`CoinGecko 오류 - stale 캐시 사용: ${err.message}`)
      return { data: cachedEntry.data, cached: true, cacheAge }
    }
    throw err
  }
}

// ─── GET /api/crypto/top10 - 코인 시그널 ─────────────────────────────────────
cryptoRoutes.get('/top10', async (c) => {
  try {
    const { data: coins, cached, cacheAge } = await fetchTop10Coins(c.env.STOCK_CACHE)

    const result = coins.map((coin: any, idx: number) => {
      const currentPrice  = coin.current_price || 0
      const change1h  = coin.price_change_percentage_1h_in_currency  || 0
      const change24h = coin.price_change_percentage_24h_in_currency || coin.price_change_percentage_24h || 0
      const change7d  = coin.price_change_percentage_7d_in_currency  || 0
      const sparkline = coin.sparkline_in_7d?.price || []
      const volume24h = coin.total_volume || 0

      const signals = generateTimeframeSignals(
        sparkline, currentPrice, change1h, change24h, change7d, volume24h
      )

      const buyCount  = signals.filter(s => s.signal === 'BUY').length
      const sellCount = signals.filter(s => s.signal === 'SELL').length
      const overallSignal = buyCount >= 4 ? 'BUY' : sellCount >= 4 ? 'SELL' : 'HOLD'

      return {
        rank: idx + 1,
        id:             coin.id,
        symbol:         coin.symbol.toUpperCase(),
        name:           coin.name,
        image:          coin.image,
        price:          currentPrice,
        marketCap:      coin.market_cap || 0,
        volume24h,
        change1h,
        change24h,
        change7d,
        high24h:        coin.high_24h || currentPrice,
        low24h:         coin.low_24h  || currentPrice,
        ath:            coin.ath || currentPrice,
        athChangePercent: coin.ath_change_percentage || 0,
        sparkline:      sparkline.slice(-48),  // 최근 48시간만 전송 (용량 절감)
        signals,
        overallSignal,
        buyCount,
        sellCount,
        holdCount: 6 - buyCount - sellCount,
        lastUpdated: new Date().toISOString(),
      }
    })

    // 스테이블코인 제외 후 반환 (USDT, USDC, DAI 등)
    const stablecoins = ['USDT','USDC','DAI','BUSD','TUSD','USDP','USDD','FRAX']
    const filtered = result.filter(c => !stablecoins.includes(c.symbol))

    return c.json({
      success: true,
      coins: filtered,
      total: filtered.length,
      source: cached ? `coingecko_cache(${cacheAge}s)` : 'coingecko',
      cached,
      cacheAge,
      updatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Crypto top10 error:', error)
    return c.json({ success: false, message: `코인 데이터 조회 실패: ${error.message}` }, 500)
  }
})

// ─── GET /api/crypto/detail/:id - 개별 코인 상세 + 차트 ─────────────────────
cryptoRoutes.get('/detail/:id', async (c) => {
  try {
    const id = c.req.param('id')

    // OHLCV 30일 데이터
    const ohlcvUrl = `https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=30`
    const ohlcvRes = await fetch(ohlcvUrl, { headers: CG_HEADERS })
    if (!ohlcvRes.ok) {
      return c.json({ success: false, message: 'OHLCV 조회 실패' }, 500)
    }
    const ohlcv: number[][] = await ohlcvRes.json()

    const chartData = ohlcv.map(([ts, o, h, l, close]) => ({
      date:   new Date(ts).toISOString().split('T')[0],
      open:   o, high: h, low: l, close,
      volume: 0,
    }))

    return c.json({ success: true, chartData })
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500)
  }
})
