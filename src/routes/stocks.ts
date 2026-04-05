import { Hono } from 'hono'
import { verifyToken } from '../lib/utils'

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

// ─── ka10030: 종목별 등락률 순위 (한 번에 ~100종목 시세 묶음 조회) ─────────────
// 부하 감소: 개별 ka10001 대신 순위 API로 현재가 일괄 조회
async function fetchKiwoomRanking(
  token: string,
  mktTp: string,   // '0'=KOSPI, '10'=KOSDAQ
  page = 1
): Promise<Array<{
  code: string; name: string; market: string;
  price: number; change: number; changeRate: number; volume: number; sector: string
}>> {
  // ka10030: 등락률 순위 — 시장 전체 종목의 현재가+등락을 페이지 단위로 반환
  const result = await kiwoomPost(
    '/api/dostk/rnkinfo',
    'ka10030',
    token,
    {
      mkt_tp:    mktTp,       // 0:KOSPI, 10:KOSDAQ
      stk_cnd:   '0',         // 0:전체
      trde_prica_cnd: '0',    // 거래대금조건 없음
      strt_dt:   '',
      inpt_dt:   '',
    }
  )
  if (!result || result.data.return_code !== 0) return []
  const market = mktTp === '0' ? 'KOSPI' : 'KOSDAQ'
  const list = result.data.flu_rt_rnk_list || result.data.stk_flu_list || []

  return list.map((item: any) => {
    const parseNum = (v: any) => Math.abs(parseInt(String(v || '0').replace(/,/g, ''), 10) || 0)
    const parseFl  = (v: any) => parseFloat(String(v || '0').replace(/,/g, '')) || 0
    return {
      code:       (item.stk_cd || '').trim(),
      name:       (item.stk_nm || '').trim(),
      market,
      price:      parseNum(item.cur_prc),
      change:     parseInt(String(item.pred_pre || '0').replace(/,/g, ''), 10) || 0,
      changeRate: parseFl(item.flu_rt),
      volume:     parseNum(item.trde_qty || item.acc_trde_qty),
      sector:     (item.induty_nm || item.inds_nm || '').trim(),
    }
  }).filter((s: any) => s.code && s.name && s.price > 0)
}

// ─── 시그널 계산 ───────────────────────────────────────────────────────────────
function autoSignal(changeRate: number, volume: number): { signal: string; strength: number } {
  let score = 50
  if      (changeRate >= 8)   score = 95
  else if (changeRate >= 5)   score = 87
  else if (changeRate >= 3)   score = 78
  else if (changeRate >= 1.5) score = 70
  else if (changeRate >= 0.5) score = 62
  else if (changeRate >= 0)   score = 55
  else if (changeRate >= -1)  score = 48
  else if (changeRate >= -2)  score = 40
  else if (changeRate >= -3)  score = 33
  else                         score = 25

  if      (volume > 3_000_000) score = Math.min(100, score + 7)
  else if (volume > 1_000_000) score = Math.min(100, score + 3)

  return {
    signal:   score >= 65 ? 'BUY' : score <= 38 ? 'SELL' : 'HOLD',
    strength: score,
  }
}

// ─── 폴백 데이터 (키움 API 오류/미설정 시) ─────────────────────────────────────
const FALLBACK_KOSPI = [
  { code:'005930', name:'삼성전자',         sector:'반도체',      price:75400,  change:1400,  changeRate:1.89,  volume:18542310 },
  { code:'000660', name:'SK하이닉스',       sector:'반도체',      price:213500, change:4500,  changeRate:2.15,  volume:4123456  },
  { code:'042700', name:'한미반도체',       sector:'반도체장비',  price:98500,  change:2100,  changeRate:2.18,  volume:1876543  },
  { code:'009150', name:'삼성전기',         sector:'전자부품',    price:142000, change:2000,  changeRate:1.43,  volume:456789   },
  { code:'006400', name:'삼성SDI',          sector:'2차전지',     price:247000, change:-3000, changeRate:-1.20, volume:345678   },
  { code:'207940', name:'삼성바이오로직스', sector:'바이오',      price:972000, change:18000, changeRate:1.89,  volume:98765    },
  { code:'068270', name:'셀트리온',         sector:'바이오',      price:168500, change:4500,  changeRate:2.74,  volume:678901   },
  { code:'128940', name:'한미약품',         sector:'제약',        price:342000, change:7000,  changeRate:2.09,  volume:123456   },
  { code:'000100', name:'유한양행',         sector:'제약',        price:89500,  change:1200,  changeRate:1.36,  volume:234567   },
  { code:'005380', name:'현대자동차',       sector:'자동차',      price:241000, change:4000,  changeRate:1.69,  volume:923456   },
  { code:'000270', name:'기아',             sector:'자동차',      price:102500, change:2000,  changeRate:1.99,  volume:1456789  },
  { code:'012330', name:'현대모비스',       sector:'자동차부품',  price:246000, change:3500,  changeRate:1.44,  volume:345678   },
  { code:'373220', name:'LG에너지솔루션',   sector:'2차전지',     price:392000, change:9000,  changeRate:2.35,  volume:534567   },
  { code:'051910', name:'LG화학',           sector:'화학/소재',   price:318000, change:-4000, changeRate:-1.24, volume:278901   },
  { code:'096770', name:'SK이노베이션',     sector:'에너지',      price:124500, change:1500,  changeRate:1.22,  volume:456789   },
  { code:'035420', name:'NAVER',            sector:'IT/플랫폼',   price:191500, change:-2500, changeRate:-1.29, volume:412345   },
  { code:'035720', name:'카카오',           sector:'IT/플랫폼',   price:38500,  change:-500,  changeRate:-1.28, volume:2345678  },
  { code:'259960', name:'크래프톤',         sector:'게임',        price:253000, change:5500,  changeRate:2.22,  volume:312345   },
  { code:'105560', name:'KB금융',           sector:'금융',        price:89200,  change:1200,  changeRate:1.36,  volume:1234567  },
  { code:'055550', name:'신한지주',         sector:'금융',        price:55800,  change:700,   changeRate:1.27,  volume:987654   },
  { code:'086790', name:'하나금융지주',     sector:'금융',        price:71300,  change:800,   changeRate:1.13,  volume:876543   },
  { code:'316140', name:'우리금융지주',     sector:'금융',        price:16950,  change:200,   changeRate:1.19,  volume:2345678  },
  { code:'032830', name:'삼성생명',         sector:'보험',        price:91300,  change:1100,  changeRate:1.22,  volume:345678   },
  { code:'000810', name:'삼성화재',         sector:'보험',        price:316000, change:5000,  changeRate:1.61,  volume:123456   },
  { code:'323410', name:'카카오뱅크',       sector:'인터넷은행',  price:23800,  change:-300,  changeRate:-1.25, volume:1876543  },
  { code:'005490', name:'POSCO홀딩스',      sector:'철강',        price:318500, change:4500,  changeRate:1.43,  volume:345678   },
  { code:'017670', name:'SK텔레콤',         sector:'통신',        price:55700,  change:600,   changeRate:1.09,  volume:456789   },
  { code:'030200', name:'KT',               sector:'통신',        price:44150,  change:350,   changeRate:0.80,  volume:567890   },
  { code:'012450', name:'한화에어로스페이스',sector:'방산',        price:342000, change:12000, changeRate:3.64,  volume:456789   },
  { code:'034020', name:'두산에너빌리티',   sector:'원자력/발전', price:26350,  change:850,   changeRate:3.33,  volume:2345678  },
  { code:'009540', name:'HD한국조선해양',   sector:'조선',        price:248000, change:7000,  changeRate:2.91,  volume:456789   },
  { code:'010140', name:'삼성중공업',       sector:'조선',        price:12850,  change:350,   changeRate:2.80,  volume:3456789  },
  { code:'042660', name:'한화오션',         sector:'조선',        price:38200,  change:1200,  changeRate:3.24,  volume:2345678  },
  { code:'267250', name:'HD현대',           sector:'조선/중공업', price:82400,  change:2200,  changeRate:2.74,  volume:345678   },
  { code:'047810', name:'한국항공우주',     sector:'방산',        price:62800,  change:2000,  changeRate:3.29,  volume:345678   },
  { code:'000880', name:'한화',             sector:'방산/화학',   price:38400,  change:500,   changeRate:1.32,  volume:234567   },
  { code:'000720', name:'현대건설',         sector:'건설',        price:38750,  change:250,   changeRate:0.65,  volume:345678   },
  { code:'028050', name:'삼성엔지니어링',   sector:'건설',        price:34250,  change:450,   changeRate:1.33,  volume:456789   },
  { code:'003490', name:'대한항공',         sector:'항공',        price:24050,  change:350,   changeRate:1.48,  volume:1234567  },
  { code:'011200', name:'HMM',              sector:'해운',        price:15350,  change:250,   changeRate:1.66,  volume:2345678  },
  { code:'033780', name:'KT&G',             sector:'담배/소비재', price:108500, change:500,   changeRate:0.46,  volume:345678   },
  { code:'139480', name:'이마트',           sector:'유통',        price:57600,  change:-700,  changeRate:-1.20, volume:123456   },
  { code:'004170', name:'신세계',           sector:'유통',        price:148500, change:-1500, changeRate:-1.00, volume:98765    },
  { code:'032640', name:'LG유플러스',       sector:'통신',        price:11850,  change:100,   changeRate:0.85,  volume:1234567  },
  { code:'011170', name:'롯데케미칼',       sector:'화학',        price:68400,  change:-800,  changeRate:-1.16, volume:234567   },
  { code:'009830', name:'한화솔루션',       sector:'태양광',      price:26850,  change:450,   changeRate:1.70,  volume:678901   },
  { code:'004020', name:'현대제철',         sector:'철강',        price:31250,  change:-350,  changeRate:-1.11, volume:678901   },
  { code:'377300', name:'카카오페이',       sector:'핀테크',      price:28150,  change:-350,  changeRate:-1.23, volume:1234567  },
  { code:'036570', name:'엔씨소프트',       sector:'게임',        price:176000, change:-2500, changeRate:-1.40, volume:234567   },
  { code:'069960', name:'현대백화점',       sector:'유통',        price:52800,  change:-500,  changeRate:-0.94, volume:87654    },
]

const FALLBACK_KOSDAQ = [
  { code:'028300', name:'HLB',                  sector:'바이오',      price:96500,  change:13500, changeRate:16.26, volume:9234567  },
  { code:'196170', name:'알테오젠',             sector:'바이오',      price:287000, change:19000, changeRate:7.09,  volume:1345678  },
  { code:'091990', name:'셀트리온헬스케어',     sector:'바이오',      price:73500,  change:2500,  changeRate:3.52,  volume:1234567  },
  { code:'141080', name:'리가켐바이오',         sector:'바이오',      price:71500,  change:-1500, changeRate:-2.06, volume:678901   },
  { code:'328130', name:'루닛',                 sector:'AI의료',      price:61500,  change:5500,  changeRate:9.83,  volume:2456789  },
  { code:'214450', name:'파마리서치',           sector:'바이오',      price:197000, change:5000,  changeRate:2.60,  volume:123456   },
  { code:'145720', name:'덴티움',               sector:'의료기기',    price:71200,  change:1200,  changeRate:1.71,  volume:234567   },
  { code:'335890', name:'비올',                 sector:'의료기기',    price:14950,  change:350,   changeRate:2.40,  volume:876543   },
  { code:'086900', name:'메디톡스',             sector:'바이오',      price:142000, change:-2000, changeRate:-1.39, volume:234567   },
  { code:'247540', name:'에코프로비엠',         sector:'2차전지소재', price:118000, change:9500,  changeRate:8.76,  volume:3678901  },
  { code:'086520', name:'에코프로',             sector:'2차전지소재', price:82500,  change:5800,  changeRate:7.56,  volume:5901234  },
  { code:'357780', name:'솔브레인',             sector:'반도체소재',  price:298000, change:5000,  changeRate:1.71,  volume:123456   },
  { code:'039030', name:'이오테크닉스',         sector:'반도체장비',  price:128000, change:3500,  changeRate:2.81,  volume:345678   },
  { code:'240810', name:'원익IPS',              sector:'반도체장비',  price:38750,  change:950,   changeRate:2.51,  volume:678901   },
  { code:'131970', name:'테크윙',               sector:'반도체장비',  price:54800,  change:1800,  changeRate:3.40,  volume:456789   },
  { code:'036930', name:'주성엔지니어링',       sector:'반도체장비',  price:27350,  change:650,   changeRate:2.43,  volume:567890   },
  { code:'277810', name:'레인보우로보틱스',     sector:'로봇',        price:189000, change:13000, changeRate:7.38,  volume:534567   },
  { code:'348370', name:'엔젤로보틱스',         sector:'로봇',        price:38200,  change:2200,  changeRate:6.11,  volume:876543   },
  { code:'403360', name:'로보티즈',             sector:'로봇',        price:34500,  change:1500,  changeRate:4.55,  volume:456789   },
  { code:'022100', name:'포스코DX',             sector:'IT/AI',       price:43500,  change:-1200, changeRate:-2.69, volume:2456789  },
  { code:'263750', name:'펄어비스',             sector:'게임',        price:34800,  change:-500,  changeRate:-1.42, volume:456789   },
  { code:'112040', name:'위메이드',             sector:'게임/블록체인',price:26150, change:650,   changeRate:2.55,  volume:876543   },
  { code:'293490', name:'카카오게임즈',         sector:'게임',        price:16850,  change:-250,  changeRate:-1.46, volume:1234567  },
  { code:'095660', name:'네오위즈',             sector:'게임',        price:20450,  change:350,   changeRate:1.74,  volume:345678   },
  { code:'035900', name:'JYP Ent.',             sector:'엔터',        price:62500,  change:1000,  changeRate:1.63,  volume:456789   },
  { code:'041510', name:'SM엔터테인먼트',       sector:'엔터',        price:81200,  change:1200,  changeRate:1.50,  volume:345678   },
  { code:'122870', name:'YG엔터테인먼트',       sector:'엔터',        price:42800,  change:500,   changeRate:1.18,  volume:234567   },
  { code:'352820', name:'하이브',               sector:'엔터',        price:198500, change:3500,  changeRate:1.79,  volume:345678   },
  { code:'066970', name:'엘앤에프',             sector:'2차전지소재', price:95200,  change:4200,  changeRate:4.61,  volume:1234567  },
  { code:'112610', name:'씨에스윈드',           sector:'풍력',        price:42800,  change:800,   changeRate:1.90,  volume:345678   },
  { code:'053800', name:'안랩',                 sector:'보안',        price:58400,  change:800,   changeRate:1.39,  volume:123456   },
  { code:'178320', name:'서진시스템',           sector:'전자부품',    price:36500,  change:700,   changeRate:1.95,  volume:345678   },
  { code:'085370', name:'루트로닉',             sector:'레이저장비',  price:34600,  change:800,   changeRate:2.37,  volume:234567   },
  { code:'226950', name:'올릭스',               sector:'RNA치료제',   price:31800,  change:1800,  changeRate:6.00,  volume:678901   },
  { code:'039200', name:'오스코텍',             sector:'바이오',      price:44500,  change:1500,  changeRate:3.49,  volume:456789   },
  { code:'950160', name:'코오롱티슈진',         sector:'바이오',      price:12800,  change:600,   changeRate:4.92,  volume:2345678  },
  { code:'214150', name:'클래시스',             sector:'의료기기',    price:43200,  change:800,   changeRate:1.89,  volume:456789   },
  { code:'336370', name:'솔브레인홀딩스',       sector:'반도체소재',  price:54200,  change:800,   changeRate:1.50,  volume:98765    },
  { code:'347740', name:'피에스케이홀딩스',     sector:'반도체',      price:34600,  change:800,   changeRate:2.37,  volume:345678   },
  { code:'241770', name:'메카로',               sector:'반도체부품',  price:32150,  change:650,   changeRate:2.06,  volume:345678   },
  { code:'058970', name:'엠씨넥스',             sector:'카메라모듈',  price:21350,  change:450,   changeRate:2.15,  volume:678901   },
  { code:'025320', name:'시노펙스',             sector:'필터',        price:8470,   change:130,   changeRate:1.56,  volume:2345678  },
  { code:'206640', name:'바디텍메드',           sector:'진단키트',    price:12450,  change:250,   changeRate:2.05,  volume:567890   },
]

// ─── 키움 API로 전체 종목 시세 조회 (등락률 순위 기반 전체 조회) ─────────────────
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
  const markets: Array<{ mktTp: string; label: 'KOSPI' | 'KOSDAQ' }> =
    market === 'KOSPI'  ? [{ mktTp: '0',  label: 'KOSPI'  }] :
    market === 'KOSDAQ' ? [{ mktTp: '10', label: 'KOSDAQ' }] :
    [{ mktTp: '0', label: 'KOSPI' }, { mktTp: '10', label: 'KOSDAQ' }]

  for (const { mktTp, label } of markets) {
    // ① 먼저 ka10030 등락률순위로 전체 종목 한 번에 조회 시도
    let items = await fetchKiwoomRanking(token, mktTp)

    // ② ka10030 실패 시 ka10099 종목 리스트 + ka10001 시세로 폴백
    if (items.length === 0) {
      const stockList = await fetchKiwoomStockList(token, mktTp)
      // 상위 200종목만 개별 시세 조회 (API 부하 제한)
      const top200 = stockList.slice(0, 200)
      const infoResults = await Promise.allSettled(
        top200.map(s => fetchKiwoomStockInfo(token, s.code))
      )
      for (let i = 0; i < top200.length; i++) {
        const r = infoResults[i]
        const info = r.status === 'fulfilled' ? r.value : null
        if (info && info.price > 0) {
          items.push({ ...top200[i], ...info, market: label })
        }
      }
    }

    // ③ 그래도 없으면 폴백
    if (items.length === 0) {
      items = getFallbackData(label).map(s => ({ ...s }))
    }

    allStocks.push(...items)
  }

  return { stocks: allStocks, source: allStocks.length > 100 ? 'kiwoom' : 'kiwoom_partial' }
}

function getFallbackData(market: 'KOSPI' | 'KOSDAQ' | 'ALL'): any[] {
  if (market === 'KOSPI')  return FALLBACK_KOSPI
  if (market === 'KOSDAQ') return FALLBACK_KOSDAQ
  return [...FALLBACK_KOSPI, ...FALLBACK_KOSDAQ]
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

// 개별 종목 조회 (키움 ka10001)
stockRoutes.get('/:code', async (c) => {
  try {
    const code = c.req.param('code')
    let stock: any = null

    if (c.env.KIWOOM_APP_KEY && c.env.KIWOOM_SECRET_KEY) {
      const token = await getKiwoomToken(c.env.KIWOOM_APP_KEY, c.env.KIWOOM_SECRET_KEY)
      if (token) {
        const info = await fetchKiwoomStockInfo(token, code)
        if (info && info.price > 0) {
          // 종목명은 폴백 목록에서 찾거나 코드 사용
          const fallbackItem = [...FALLBACK_KOSPI, ...FALLBACK_KOSDAQ].find(s => s.code === code)
          stock = {
            code,
            name:   fallbackItem?.name || code,
            market: fallbackItem ? (FALLBACK_KOSPI.some(s => s.code === code) ? 'KOSPI' : 'KOSDAQ') : 'KOSPI',
            ...info,
          }
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

    const sig = autoSignal(stock.changeRate || 0, stock.volume || 0)
    return c.json({
      success: true,
      stock: { ...stock, ...sig },
      chartData: generateMockChartData(stock.price),
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
