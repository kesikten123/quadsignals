import { Hono } from 'hono'
import { verifyToken } from '../lib/utils'
import { KOSPI_POOL, KOSDAQ_POOL, ALL_STOCK_POOL } from '../data/stockPool'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  KIWOOM_APP_KEY: string
  KIWOOM_SECRET_KEY: string
  STOCK_CACHE: KVNamespace   // 토큰·종목 캐시용 KV (선택적)
}

export const stockRoutes = new Hono<{ Bindings: Bindings }>()

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

stockRoutes.use('/*', userAuth)

// ─── 키움 REST API 설정 ────────────────────────────────────────────────────────
const KIWOOM_BASE = 'https://api.kiwoom.com'

// 키움 접근토큰 발급 (au10001)
async function getKiwoomToken(appKey: string, secretKey: string): Promise<string | null> {
  try {
    const res = await fetch(`${KIWOOM_BASE}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: appKey,
        secretkey: secretKey,
      }),
    })
    if (!res.ok) return null
    const data: any = await res.json()
    if (data.return_code !== 0) return null
    return data.token as string
  } catch {
    return null
  }
}

// 키움 API 공통 POST 호출
async function kiwoomPost(
  endpoint: string,
  apiId: string,
  token: string,
  body: Record<string, any>,
  contYn = 'N',
  nextKey = ''
): Promise<{ data: any; contYn: string; nextKey: string } | null> {
  try {
    const res = await fetch(`${KIWOOM_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'authorization': `Bearer ${token}`,
        'api-id': apiId,
        'cont-yn': contYn,
        'next-key': nextKey,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    const data: any = await res.json()
    const rContYn  = res.headers.get('cont-yn')  || 'N'
    const rNextKey = res.headers.get('next-key') || ''
    return { data, contYn: rContYn, nextKey: rNextKey }
  } catch {
    return null
  }
}

// ─── ka10099: 종목정보 리스트 (전체 종목 코드·이름) ───────────────────────────
// mkt_tp: 0=코스피, 10=코스닥
async function fetchKiwoomStockList(
  token: string,
  mktTp: string   // '0'=KOSPI, '10'=KOSDAQ
): Promise<Array<{ code: string; name: string; market: string }>> {
  const market = mktTp === '0' ? 'KOSPI' : 'KOSDAQ'
  const allItems: Array<{ code: string; name: string; market: string }> = []

  let contYn = 'N'
  let nextKey = ''
  let page = 0
  const MAX_PAGES = 30  // 안전 한도 (최대 ~3000종목 수용)

  do {
    const result = await kiwoomPost(
      '/api/dostk/stkinfo',
      'ka10099',
      token,
      { mkt_tp: mktTp },
      contYn,
      nextKey
    )

    if (!result || result.data.return_code !== 0) break

    // ka10099 응답: stk_list 배열 [ { stk_cd, stk_nm, ... } ]
    const list = result.data.stk_list || result.data.stk_info_list || []
    for (const item of list) {
      const code = (item.stk_cd || item.stk_code || '').trim()
      const name = (item.stk_nm || item.stk_name || '').trim()
      if (code && name) {
        allItems.push({ code, name, market })
      }
    }

    contYn  = result.contYn
    nextKey = result.nextKey
    page++
  } while (contYn === 'Y' && nextKey && page < MAX_PAGES)

  return allItems
}

// ─── ka10001: 주식기본정보 (현재가, 등락률, 거래량, 섹터) ──────────────────────
async function fetchKiwoomStockInfo(
  token: string,
  stkCd: string
): Promise<{
  price: number; change: number; changeRate: number; volume: number; sector: string
} | null> {
  const result = await kiwoomPost(
    '/api/dostk/stkinfo',
    'ka10001',
    token,
    { stk_cd: stkCd }
  )
  if (!result || result.data.return_code !== 0) return null
  const d = result.data

  // 키움 숫자필드: 앞에 +/- 부호, 절대값 변환
  const parseNum = (v: string | number) => {
    if (v === undefined || v === null) return 0
    const s = String(v).replace(/,/g, '')
    return parseInt(s, 10) || 0
  }
  const parseFloat2 = (v: string | number) => {
    if (v === undefined || v === null) return 0
    const s = String(v).replace(/,/g, '')
    return parseFloat(s) || 0
  }

  const price      = Math.abs(parseNum(d.cur_prc))
  const change     = parseNum(d.pred_pre)
  const changeRate = parseFloat2(d.flu_rt)
  const volume     = Math.abs(parseNum(d.trde_qty))
  const sector     = (d.induty_nm || d.inds_nm || d.upjong_nm || '').trim()

  return { price, change, changeRate, volume, sector }
}

// ─── ka10027: 전일대비등락률상위 (현재가+등락+거래량 일괄 조회) ──────────────────
// URL: /api/dostk/rkinfo  api-id: ka10027
// mrkt_tp: 001=코스피, 101=코스닥  sort_tp: 1=상승률
async function fetchKiwoomRanking(
  token: string,
  mktTp: string    // '001'=KOSPI, '101'=KOSDAQ
): Promise<Array<{
  code: string; name: string; market: string;
  price: number; change: number; changeRate: number; volume: number; sector: string
}>> {
  const market = mktTp === '001' ? 'KOSPI' : 'KOSDAQ'
  const allItems: any[] = []

  // 상승/하락/보합 3회 호출로 전 종목 커버
  const sortTypes = ['1', '3', '5']  // 1:상승률, 3:하락률, 5:보합
  for (const sortTp of sortTypes) {
    let contYn = 'N', nextKey = '', page = 0
    do {
      const result = await kiwoomPost(
        '/api/dostk/rkinfo',
        'ka10027',
        token,
        {
          mrkt_tp:       mktTp,
          sort_tp:       sortTp,
          trde_qty_cnd:  '0000',   // 전체 거래량
          stk_cnd:       '0',      // 전체 종목
          crd_cnd:       '0',
          updown_incls:  '1',      // 상하한 포함
          pric_cnd:      '0',      // 전체 가격
          trde_prica_cnd:'0',
          stex_tp:       '1',      // KRX
        },
        contYn,
        nextKey
      )
      if (!result || result.data.return_code !== 0) break
      const list = result.data.pred_pre_flu_rt_upper || []
      for (const item of list) {
        const parseNum = (v: any) => Math.abs(parseInt(String(v || '0').replace(/,/g, ''), 10) || 0)
        const parseFl  = (v: any) => parseFloat(String(v || '0').replace(/,/g, '')) || 0
        const code = (item.stk_cd || '').trim()
        const name = (item.stk_nm || '').trim()
        const price = parseNum(item.cur_prc)
        if (code && name && price > 0) {
          allItems.push({
            code, name, market,
            price,
            change:     parseInt(String(item.pred_pre || '0').replace(/,/g, ''), 10) || 0,
            changeRate: parseFl(item.flu_rt),
            volume:     parseNum(item.now_trde_qty || item.trde_qty),
            sector:     '',
          })
        }
      }
      contYn  = result.contYn
      nextKey = result.nextKey
      page++
    } while (contYn === 'Y' && nextKey && page < 20)
  }

  // 종목코드 기준 중복 제거
  const seen = new Set<string>()
  return allItems.filter(s => {
    if (seen.has(s.code)) return false
    seen.add(s.code)
    return true
  })
}

// ─── ka10023: 거래량급증 순위 조회 ────────────────────────────────────────────
async function fetchKiwoomVolumeRising(
  token: string,
  mktTp: string    // '000'=전체, '001'=코스피, '101'=코스닥
): Promise<Array<{
  code: string; name: string; market: string;
  price: number; change: number; changeRate: number;
  prevVolume: number; curVolume: number; risingRate: number
}>> {
  const allItems: any[] = []
  let contYn = 'N', nextKey = '', page = 0
  do {
    const result = await kiwoomPost(
      '/api/dostk/rkinfo',
      'ka10023',
      token,
      {
        mrkt_tp:     mktTp,
        sort_tp:     '2',    // 2:급증률
        tm_tp:       '2',    // 2:전일 대비
        trde_qty_tp: '5',    // 5:5천주 이상
        tm:          '',
        stk_cnd:     '0',
        pric_tp:     '0',
        stex_tp:     '1',
      },
      contYn,
      nextKey
    )
    if (!result || result.data.return_code !== 0) break
    const list = result.data.trde_qty_sdnin || []
    for (const item of list) {
      const parseNum = (v: any) => Math.abs(parseInt(String(v || '0').replace(/,/g, ''), 10) || 0)
      const parseFl  = (v: any) => parseFloat(String(v || '0').replace(/,/g, '')) || 0
      const code = (item.stk_cd || '').trim()
      const name = (item.stk_nm || '').trim()
      const price = parseNum(item.cur_prc)
      if (code && name && price > 0) {
        const mkt = mktTp === '001' ? 'KOSPI' : mktTp === '101' ? 'KOSDAQ' : 'ALL'
        allItems.push({
          code, name,
          market: mkt,
          price,
          change:     parseInt(String(item.pred_pre || '0').replace(/,/g, ''), 10) || 0,
          changeRate: parseFl(item.flu_rt),
          prevVolume: parseNum(item.prev_trde_qty),
          curVolume:  parseNum(item.now_trde_qty),
          risingRate: parseFl(item.sdnin_rt),
        })
      }
    }
    contYn  = result.contYn
    nextKey = result.nextKey
    page++
  } while (contYn === 'Y' && nextKey && page < 10)
  return allItems
}

// ─── ka10081: 주식 일봉차트 조회 ─────────────────────────────────────────────
async function fetchKiwoomDayChart(
  token: string,
  stkCd: string,
  baseDt: string   // YYYYMMDD
): Promise<Array<{
  date: string; open: number; high: number; low: number; close: number; volume: number
}>> {
  const allItems: any[] = []
  let contYn = 'N', nextKey = '', page = 0
  do {
    const result = await kiwoomPost(
      '/api/dostk/chart',
      'ka10081',
      token,
      { stk_cd: stkCd, base_dt: baseDt, upd_stkpc_tp: '1' },
      contYn,
      nextKey
    )
    if (!result || result.data.return_code !== 0) break
    const list = result.data.stk_dt_pole_chart_qry || []
    for (const item of list) {
      const parseNum = (v: any) => Math.abs(parseInt(String(v || '0').replace(/,/g, ''), 10) || 0)
      allItems.push({
        date:   (item.dt || '').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
        open:   parseNum(item.open_pric),
        high:   parseNum(item.high_pric),
        low:    parseNum(item.low_pric),
        close:  parseNum(item.cur_prc),
        volume: parseNum(item.trde_qty),
      })
    }
    contYn  = result.contYn
    nextKey = result.nextKey
    page++
  } while (contYn === 'Y' && nextKey && page < 5)  // 최대 ~250일(5페이지)
  return allItems
}

// ─── 시그널 계산 (recommend.ts 와 동일 기준) ────────────────────────────────
// BUY >= 65 / SELL <= 38 / 최대 80 / 기본 50
// (+5% 이상 BUY, -1.5% 이하 SELL, 소폭 등락은 HOLD)
function autoSignal(changeRate: number, volume: number): { signal: string; strength: number } {
  let score = 50

  if      (changeRate >= 10)   score += 28   // 78 → BUY
  else if (changeRate >= 7)    score += 22   // 72 → BUY
  else if (changeRate >= 5)    score += 16   // 66 → BUY
  else if (changeRate >= 3)    score += 10   // 60 → HOLD
  else if (changeRate >= 1.5)  score += 5    // 55 → HOLD
  else if (changeRate >= 0.5)  score += 2    // 52 → HOLD
  else if (changeRate >= 0)    score += 0    // 50 → HOLD
  else if (changeRate >= -1)   score -= 5    // 45 → HOLD
  else if (changeRate >= -2)   score -= 12   // 38 → SELL 경계
  else if (changeRate >= -3)   score -= 20   // 30 → SELL
  else if (changeRate >= -5)   score -= 28   // 22 → SELL
  else                         score -= 35   // 15 → 강한 SELL

  // 거래량 보정 (±3 이하로 최소화)
  if      (volume > 5_000_000) score += 3
  else if (volume > 2_000_000) score += 2
  else if (volume > 1_000_000) score += 1
  else if (volume < 100_000)   score -= 3
  else if (volume < 300_000)   score -= 1

  score = Math.min(80, Math.max(5, score))

  return {
    signal:   score >= 65 ? 'BUY' : score <= 38 ? 'SELL' : 'HOLD',
    strength: score,
  }
}


// ─── 섹터 정보 보강: 풀백 데이터의 섹터를 키움 데이터에 적용 ──────────────────
function enrichSector(stocks: any[]): any[] {
  const sectorMap: Record<string, string> = {}
  for (const s of ALL_STOCK_POOL) {
    if (s.sector) sectorMap[s.code] = s.sector
  }
  return stocks.map(s => ({
    ...s,
    sector: s.sector || sectorMap[s.code] || '기타',
  }))
}

// ─── 키움 API로 전체 종목 시세 조회 (등락률 순위 기반 전체 조회) ─────────────────
// 전략: ① ka10027 (등락률 순위, 상승/하락/보합 병렬) → ② ka10099+ka10001 (전체 리스트+시세)
//        → ③ fallback pool (417종목)
async function fetchAllStocksFromKiwoom(
  appKey: string,
  secretKey: string,
  market: 'KOSPI' | 'KOSDAQ' | 'ALL'
): Promise<{ stocks: any[]; source: string }> {
  if (!appKey || !secretKey) {
    return { stocks: getFallbackData(market), source: 'fallback' }
  }

  const token = await getKiwoomToken(appKey, secretKey)
  if (!token) {
    return { stocks: getFallbackData(market), source: 'fallback' }
  }

  const allStocks: any[] = []
  // ka10027 mrkt_tp: 001=코스피, 101=코스닥
  const markets: Array<{ mktTp: string; listTp: string; label: 'KOSPI' | 'KOSDAQ' }> =
    market === 'KOSPI'  ? [{ mktTp: '001', listTp: '0',  label: 'KOSPI'  }] :
    market === 'KOSDAQ' ? [{ mktTp: '101', listTp: '10', label: 'KOSDAQ' }] :
    [
      { mktTp: '001', listTp: '0',  label: 'KOSPI'  },
      { mktTp: '101', listTp: '10', label: 'KOSDAQ' },
    ]

  for (const { mktTp, listTp, label } of markets) {
    let items: any[] = []

    // ① ka10027 등락률상위 (상승/하락/보합/거래량상위 4방향 병렬)
    const [risingItems, fallingItems, stableItems] = await Promise.all([
      fetchKiwoomRankingBySortTp(token, mktTp, '1'),   // 상승률
      fetchKiwoomRankingBySortTp(token, mktTp, '3'),   // 하락률
      fetchKiwoomRankingBySortTp(token, mktTp, '5'),   // 보합(거래량 기준)
    ])

    // 중복 제거 병합
    const seenCodes = new Set<string>()
    for (const arr of [risingItems, fallingItems, stableItems]) {
      for (const s of arr) {
        if (!seenCodes.has(s.code)) {
          seenCodes.add(s.code)
          items.push({ ...s, market: label })
        }
      }
    }

    // ② ka10027 부족하면 (100종목 미만) ka10099 전체 리스트 + ka10001 시세로 보완
    if (items.length < 100) {
      const stockList = await fetchKiwoomStockList(token, listTp)
      // 아직 가져오지 못한 종목만 추가
      const newCodes = stockList.filter(s => !seenCodes.has(s.code))
      // 최대 500종목 시세 병렬 조회 (50개씩 배치)
      const BATCH = 50
      for (let i = 0; i < Math.min(newCodes.length, 500); i += BATCH) {
        const batch = newCodes.slice(i, i + BATCH)
        const results = await Promise.allSettled(
          batch.map(s => fetchKiwoomStockInfo(token, s.code))
        )
        for (let j = 0; j < batch.length; j++) {
          const r = results[j]
          const info = r.status === 'fulfilled' ? r.value : null
          if (info && info.price > 0) {
            seenCodes.add(batch[j].code)
            items.push({ ...batch[j], ...info, market: label })
          }
        }
      }
    }

    // ③ 그래도 없으면 폴백 pool 데이터 사용
    if (items.length === 0) {
      items = getFallbackData(label).map(s => ({ ...s }))
    } else {
      // 키움 데이터에 섹터 없는 종목은 pool에서 보강
      items = enrichSector(items)
    }

    allStocks.push(...items)
  }

  const source = allStocks.length > 500 ? 'kiwoom'
               : allStocks.length > 50  ? 'kiwoom_partial'
               : 'fallback'

  return { stocks: allStocks, source }
}

// ka10027 단일 sortTp 조회 헬퍼
async function fetchKiwoomRankingBySortTp(
  token: string,
  mktTp: string,
  sortTp: string
): Promise<any[]> {
  const items: any[] = []
  let contYn = 'N', nextKey = '', page = 0
  do {
    const result = await kiwoomPost(
      '/api/dostk/rkinfo', 'ka10027', token,
      {
        mrkt_tp:        mktTp,
        sort_tp:        sortTp,
        trde_qty_cnd:   '0000',
        stk_cnd:        '0',
        crd_cnd:        '0',
        updown_incls:   '1',
        pric_cnd:       '0',
        trde_prica_cnd: '0',
        stex_tp:        '1',
      },
      contYn, nextKey
    )
    if (!result || result.data.return_code !== 0) break
    const list = result.data.pred_pre_flu_rt_upper || []
    for (const item of list) {
      const parseNum = (v: any) => Math.abs(parseInt(String(v || '0').replace(/,/g, ''), 10) || 0)
      const parseFl  = (v: any) => parseFloat(String(v || '0').replace(/,/g, '')) || 0
      const code = (item.stk_cd || '').trim()
      const name = (item.stk_nm || '').trim()
      const price = parseNum(item.cur_prc)
      if (code && name && price > 0) {
        items.push({
          code, name,
          price,
          change:     parseInt(String(item.pred_pre || '0').replace(/,/g, ''), 10) || 0,
          changeRate: parseFl(item.flu_rt),
          volume:     parseNum(item.now_trde_qty || item.trde_qty),
          sector:     '',
        })
      }
    }
    contYn  = result.contYn
    nextKey = result.nextKey
    page++
  } while (contYn === 'Y' && nextKey && page < 25)
  return items
}

function getFallbackData(market: 'KOSPI' | 'KOSDAQ' | 'ALL'): any[] {
  if (market === 'KOSPI')  return KOSPI_POOL
  if (market === 'KOSDAQ') return KOSDAQ_POOL
  return ALL_STOCK_POOL
}

// ─── 공통 종목 보강 (시그널 + DB 시그널 병합) ───────────────────────────────────
async function enrichWithSignals(stocks: any[], db: D1Database) {
  try {
    const { results: dbSignals } = await db.prepare(
      'SELECT stock_code, signal_type, strength FROM signals ORDER BY created_at DESC'
    ).all() as any
    const signalMap: Record<string, any> = {}
    for (const sig of dbSignals) {
      if (!signalMap[sig.stock_code]) signalMap[sig.stock_code] = sig
    }
    return stocks.map(stock => {
      const auto = autoSignal(stock.changeRate || 0, stock.volume || 0)
      const db_  = signalMap[stock.code]
      return {
        ...stock,
        signal:   db_ ? db_.signal_type : auto.signal,
        strength: db_ ? db_.strength    : auto.strength,
        sector:   stock.sector || '',
      }
    })
  } catch {
    return stocks.map(s => ({ ...s, ...autoSignal(s.changeRate || 0, s.volume || 0) }))
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════════════════════════

// 주식 목록 조회 (KOSPI + KOSDAQ 합산, 키움 API 우선)
stockRoutes.get('/', async (c) => {
  try {
    const market = c.req.query('market') || 'ALL'
    const limit  = parseInt(c.req.query('limit') || '500')

    const { stocks: raw, source } = await fetchAllStocksFromKiwoom(
      c.env.KIWOOM_APP_KEY,
      c.env.KIWOOM_SECRET_KEY,
      market as 'KOSPI' | 'KOSDAQ' | 'ALL'
    )

    const enriched = await enrichWithSignals(raw, c.env.DB)
    const sorted   = enriched.sort((a, b) => (b.volume || 0) - (a.volume || 0))

    return c.json({
      success: true,
      stocks:  sorted.slice(0, limit),
      total:   sorted.length,
      source,
    })
  } catch (error) {
    console.error('Stock list error:', error)
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

// KOSPI 전체
stockRoutes.get('/kospi', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '1000')
    const { stocks: raw, source } = await fetchAllStocksFromKiwoom(
      c.env.KIWOOM_APP_KEY, c.env.KIWOOM_SECRET_KEY, 'KOSPI'
    )
    const enriched = await enrichWithSignals(raw, c.env.DB)
    const sorted   = enriched.sort((a, b) => (b.volume || 0) - (a.volume || 0))
    return c.json({ success: true, stocks: sorted.slice(0, limit), total: sorted.length, source })
  } catch (e) {
    return c.json({ success: false, message: '오류' }, 500)
  }
})

// KOSDAQ 전체
stockRoutes.get('/kosdaq', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '1000')
    const { stocks: raw, source } = await fetchAllStocksFromKiwoom(
      c.env.KIWOOM_APP_KEY, c.env.KIWOOM_SECRET_KEY, 'KOSDAQ'
    )
    const enriched = await enrichWithSignals(raw, c.env.DB)
    const sorted   = enriched.sort((a, b) => (b.volume || 0) - (a.volume || 0))
    return c.json({ success: true, stocks: sorted.slice(0, limit), total: sorted.length, source })
  } catch (e) {
    return c.json({ success: false, message: '오류' }, 500)
  }
})

// ─── 거래량 급증 종목 (ka10023) ─────────────────────────────────────────────
stockRoutes.get('/rising', async (c) => {
  try {
    const market = c.req.query('market') || 'ALL'
    const limit  = Math.min(parseInt(c.req.query('limit') || '30'), 100)
    const mktTp  = market === 'KOSPI' ? '001' : market === 'KOSDAQ' ? '101' : '000'

    if (c.env.KIWOOM_APP_KEY && c.env.KIWOOM_SECRET_KEY) {
      const token = await getKiwoomToken(c.env.KIWOOM_APP_KEY, c.env.KIWOOM_SECRET_KEY)
      if (token) {
        const items = await fetchKiwoomVolumeRising(token, mktTp)
        if (items.length > 0) {
          return c.json({
            success: true,
            stocks:  items.slice(0, limit),
            total:   items.length,
            source:  'kiwoom',
          })
        }
      }
    }
    // 폴백: 기존 데이터에서 거래량 상위 반환
    const fallback = getFallbackData(market as any)
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, limit)
      .map(s => ({ ...s, prevVolume: 0, curVolume: s.volume, risingRate: 0 }))
    return c.json({ success: true, stocks: fallback, total: fallback.length, source: 'fallback' })
  } catch (err) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

// 개별 종목 조회 (키움 ka10001 + ka10081 일봉차트)
stockRoutes.get('/:code', async (c) => {
  try {
    const code = c.req.param('code')
    let stock: any = null
    let chartData: any[] = []

    if (c.env.KIWOOM_APP_KEY && c.env.KIWOOM_SECRET_KEY) {
      const token = await getKiwoomToken(c.env.KIWOOM_APP_KEY, c.env.KIWOOM_SECRET_KEY)
      if (token) {
        // ① 기본정보 (ka10001)
        const info = await fetchKiwoomStockInfo(token, code)
        if (info && info.price > 0) {
          const fallbackItem = [...FALLBACK_KOSPI, ...FALLBACK_KOSDAQ].find(s => s.code === code)
          stock = {
            code,
            name:   fallbackItem?.name || code,
            market: fallbackItem ? (FALLBACK_KOSPI.some(s => s.code === code) ? 'KOSPI' : 'KOSDAQ') : 'KOSPI',
            ...info,
          }
        }
        // ② 일봉차트 (ka10081) - 오늘 기준 60 거래일
        const today = new Date()
        const baseDt = today.toISOString().slice(0,10).replace(/-/g, '')
        const rawChart = await fetchKiwoomDayChart(token, code, baseDt)
        if (rawChart.length > 0) {
          chartData = rawChart.slice(0, 60).reverse()  // 날짜 오름차순
        }
      }
    }

    if (!stock) {
      const all = getFallbackData('ALL')
      stock = all.find(s => s.code === code)
    }
    if (!stock) {
      return c.json({ success: false, message: '종목을 찾을 수 없습니다.' }, 404)
    }

    // 차트 폴백 (키움 실패 시)
    if (chartData.length === 0) {
      chartData = generateMockChartData(stock.price)
    }

    const sig = autoSignal(stock.changeRate || 0, stock.volume || 0)
    return c.json({
      success: true,
      stock: { ...stock, ...sig },
      chartData,
      chartSource: chartData.length > 0 && (stock.price > 0) ? 'kiwoom' : 'mock',
    })
  } catch (error) {
    return c.json({ success: false, message: '오류가 발생했습니다.' }, 500)
  }
})

function generateMockChartData(currentPrice: number) {
  const data = []
  let price = currentPrice * 0.9
  const now = Date.now()
  for (let i = 30; i >= 0; i--) {
    const date   = new Date(now - i * 24 * 60 * 60 * 1000)
    const change = (Math.random() - 0.47) * price * 0.025
    price = Math.max(price + change, currentPrice * 0.7)
    data.push({
      date:   date.toISOString().split('T')[0],
      open:   Math.round(price * (1 - Math.random() * 0.008)),
      high:   Math.round(price * (1 + Math.random() * 0.015)),
      low:    Math.round(price * (1 - Math.random() * 0.015)),
      close:  Math.round(price),
      volume: Math.round(Math.random() * 5_000_000 + 500_000),
    })
  }
  return data
}
