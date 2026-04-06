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

// ─── KOSPI 전체 풀 ────────────────────────────────────────────────────────
const KOSPI_POOL = [
  { code:'005930', name:'삼성전자',              market:'KOSPI', sector:'반도체',       price:75400,  change:1400,  changeRate:1.89,  volume:18542310 },
  { code:'000660', name:'SK하이닉스',            market:'KOSPI', sector:'반도체',       price:213500, change:4500,  changeRate:2.15,  volume:4123456  },
  { code:'042700', name:'한미반도체',            market:'KOSPI', sector:'반도체장비',   price:98500,  change:2100,  changeRate:2.18,  volume:1876543  },
  { code:'009150', name:'삼성전기',              market:'KOSPI', sector:'전자부품',     price:142000, change:2000,  changeRate:1.43,  volume:456789   },
  { code:'006400', name:'삼성SDI',               market:'KOSPI', sector:'2차전지',      price:247000, change:-3000, changeRate:-1.20, volume:345678   },
  { code:'207940', name:'삼성바이오로직스',      market:'KOSPI', sector:'바이오',       price:972000, change:18000, changeRate:1.89,  volume:98765    },
  { code:'068270', name:'셀트리온',              market:'KOSPI', sector:'바이오',       price:168500, change:4500,  changeRate:2.74,  volume:678901   },
  { code:'128940', name:'한미약품',              market:'KOSPI', sector:'제약',         price:342000, change:7000,  changeRate:2.09,  volume:123456   },
  { code:'000100', name:'유한양행',              market:'KOSPI', sector:'제약',         price:89500,  change:1200,  changeRate:1.36,  volume:234567   },
  { code:'012330', name:'현대모비스',            market:'KOSPI', sector:'자동차부품',   price:246000, change:3500,  changeRate:1.44,  volume:345678   },
  { code:'005380', name:'현대자동차',            market:'KOSPI', sector:'자동차',       price:241000, change:4000,  changeRate:1.69,  volume:923456   },
  { code:'000270', name:'기아',                  market:'KOSPI', sector:'자동차',       price:102500, change:2000,  changeRate:1.99,  volume:1456789  },
  { code:'373220', name:'LG에너지솔루션',        market:'KOSPI', sector:'2차전지',      price:392000, change:9000,  changeRate:2.35,  volume:534567   },
  { code:'051910', name:'LG화학',                market:'KOSPI', sector:'화학/소재',    price:318000, change:-4000, changeRate:-1.24, volume:278901   },
  { code:'096770', name:'SK이노베이션',          market:'KOSPI', sector:'에너지',       price:124500, change:1500,  changeRate:1.22,  volume:456789   },
  { code:'011170', name:'롯데케미칼',            market:'KOSPI', sector:'화학',         price:68400,  change:-800,  changeRate:-1.16, volume:234567   },
  { code:'035420', name:'NAVER',                 market:'KOSPI', sector:'IT/플랫폼',    price:191500, change:-2500, changeRate:-1.29, volume:412345   },
  { code:'035720', name:'카카오',                market:'KOSPI', sector:'IT/플랫폼',    price:38500,  change:-500,  changeRate:-1.28, volume:2345678  },
  { code:'259960', name:'크래프톤',              market:'KOSPI', sector:'게임',         price:253000, change:5500,  changeRate:2.22,  volume:312345   },
  { code:'036570', name:'엔씨소프트',            market:'KOSPI', sector:'게임',         price:176000, change:-2500, changeRate:-1.40, volume:234567   },
  { code:'105560', name:'KB금융',                market:'KOSPI', sector:'금융',         price:89200,  change:1200,  changeRate:1.36,  volume:1234567  },
  { code:'055550', name:'신한지주',              market:'KOSPI', sector:'금융',         price:55800,  change:700,   changeRate:1.27,  volume:987654   },
  { code:'086790', name:'하나금융지주',          market:'KOSPI', sector:'금융',         price:71300,  change:800,   changeRate:1.13,  volume:876543   },
  { code:'316140', name:'우리금융지주',          market:'KOSPI', sector:'금융',         price:16950,  change:200,   changeRate:1.19,  volume:2345678  },
  { code:'032830', name:'삼성생명',              market:'KOSPI', sector:'보험',         price:91300,  change:1100,  changeRate:1.22,  volume:345678   },
  { code:'000810', name:'삼성화재',              market:'KOSPI', sector:'보험',         price:316000, change:5000,  changeRate:1.61,  volume:123456   },
  { code:'323410', name:'카카오뱅크',            market:'KOSPI', sector:'인터넷은행',   price:23800,  change:-300,  changeRate:-1.25, volume:1876543  },
  { code:'377300', name:'카카오페이',            market:'KOSPI', sector:'핀테크',       price:28150,  change:-350,  changeRate:-1.23, volume:1234567  },
  { code:'005490', name:'POSCO홀딩스',           market:'KOSPI', sector:'철강',         price:318500, change:4500,  changeRate:1.43,  volume:345678   },
  { code:'004020', name:'현대제철',              market:'KOSPI', sector:'철강',         price:31250,  change:-350,  changeRate:-1.11, volume:678901   },
  { code:'017670', name:'SK텔레콤',              market:'KOSPI', sector:'통신',         price:55700,  change:600,   changeRate:1.09,  volume:456789   },
  { code:'030200', name:'KT',                    market:'KOSPI', sector:'통신',         price:44150,  change:350,   changeRate:0.80,  volume:567890   },
  { code:'032640', name:'LG유플러스',            market:'KOSPI', sector:'통신',         price:11850,  change:100,   changeRate:0.85,  volume:1234567  },
  { code:'139480', name:'이마트',                market:'KOSPI', sector:'유통',         price:57600,  change:-700,  changeRate:-1.20, volume:123456   },
  { code:'004170', name:'신세계',                market:'KOSPI', sector:'유통',         price:148500, change:-1500, changeRate:-1.00, volume:98765    },
  { code:'069960', name:'현대백화점',            market:'KOSPI', sector:'유통',         price:52800,  change:-500,  changeRate:-0.94, volume:87654    },
  { code:'000880', name:'한화',                  market:'KOSPI', sector:'방산/화학',    price:38400,  change:500,   changeRate:1.32,  volume:234567   },
  { code:'012450', name:'한화에어로스페이스',    market:'KOSPI', sector:'방산',         price:342000, change:12000, changeRate:3.64,  volume:456789   },
  { code:'047810', name:'한국항공우주',          market:'KOSPI', sector:'방산',         price:62800,  change:2000,  changeRate:3.29,  volume:345678   },
  { code:'034020', name:'두산에너빌리티',        market:'KOSPI', sector:'원자력/발전',  price:26350,  change:850,   changeRate:3.33,  volume:2345678  },
  { code:'000720', name:'현대건설',              market:'KOSPI', sector:'건설',         price:38750,  change:250,   changeRate:0.65,  volume:345678   },
  { code:'028050', name:'삼성엔지니어링',        market:'KOSPI', sector:'건설',         price:34250,  change:450,   changeRate:1.33,  volume:456789   },
  { code:'003490', name:'대한항공',              market:'KOSPI', sector:'항공',         price:24050,  change:350,   changeRate:1.48,  volume:1234567  },
  { code:'011200', name:'HMM',                   market:'KOSPI', sector:'해운',         price:15350,  change:250,   changeRate:1.66,  volume:2345678  },
  { code:'033780', name:'KT&G',                  market:'KOSPI', sector:'담배/소비재',  price:108500, change:500,   changeRate:0.46,  volume:345678   },
  { code:'010140', name:'삼성중공업',            market:'KOSPI', sector:'조선',         price:12850,  change:350,   changeRate:2.80,  volume:3456789  },
  { code:'042660', name:'한화오션',              market:'KOSPI', sector:'조선',         price:38200,  change:1200,  changeRate:3.24,  volume:2345678  },
  { code:'009540', name:'HD한국조선해양',        market:'KOSPI', sector:'조선',         price:248000, change:7000,  changeRate:2.91,  volume:456789   },
  { code:'267250', name:'HD현대',               market:'KOSPI', sector:'조선/중공업',  price:82400,  change:2200,  changeRate:2.74,  volume:345678   },
  { code:'009830', name:'한화솔루션',            market:'KOSPI', sector:'태양광',       price:26850,  change:450,   changeRate:1.70,  volume:678901   },
  { code:'000240', name:'한국타이어앤테크놀로지',market:'KOSPI', sector:'타이어',       price:58100,  change:700,   changeRate:1.22,  volume:234567   },
]

// ─── KOSDAQ 전체 풀 ──────────────────────────────────────────────────────
const KOSDAQ_POOL = [
  { code:'028300', name:'HLB',                   market:'KOSDAQ', sector:'바이오',      price:96500,  change:13500, changeRate:16.26, volume:9234567  },
  { code:'196170', name:'알테오젠',              market:'KOSDAQ', sector:'바이오',      price:287000, change:19000, changeRate:7.09,  volume:1345678  },
  { code:'091990', name:'셀트리온헬스케어',      market:'KOSDAQ', sector:'바이오',      price:73500,  change:2500,  changeRate:3.52,  volume:1234567  },
  { code:'141080', name:'리가켐바이오',          market:'KOSDAQ', sector:'바이오',      price:71500,  change:-1500, changeRate:-2.06, volume:678901   },
  { code:'328130', name:'루닛',                  market:'KOSDAQ', sector:'AI의료',      price:61500,  change:5500,  changeRate:9.83,  volume:2456789  },
  { code:'145720', name:'덴티움',                market:'KOSDAQ', sector:'의료기기',    price:71200,  change:1200,  changeRate:1.71,  volume:234567   },
  { code:'214450', name:'파마리서치',            market:'KOSDAQ', sector:'바이오',      price:197000, change:5000,  changeRate:2.60,  volume:123456   },
  { code:'335890', name:'비올',                  market:'KOSDAQ', sector:'의료기기',    price:14950,  change:350,   changeRate:2.40,  volume:876543   },
  { code:'086900', name:'메디톡스',              market:'KOSDAQ', sector:'바이오',      price:142000, change:-2000, changeRate:-1.39, volume:234567   },
  { code:'247540', name:'에코프로비엠',          market:'KOSDAQ', sector:'2차전지소재', price:118000, change:9500,  changeRate:8.76,  volume:3678901  },
  { code:'086520', name:'에코프로',              market:'KOSDAQ', sector:'2차전지소재', price:82500,  change:5800,  changeRate:7.56,  volume:5901234  },
  { code:'357780', name:'솔브레인',              market:'KOSDAQ', sector:'반도체소재',  price:298000, change:5000,  changeRate:1.71,  volume:123456   },
  { code:'066970', name:'엘앤에프',              market:'KOSDAQ', sector:'2차전지소재', price:95200,  change:4200,  changeRate:4.61,  volume:1234567  },
  { code:'039030', name:'이오테크닉스',          market:'KOSDAQ', sector:'반도체장비',  price:128000, change:3500,  changeRate:2.81,  volume:345678   },
  { code:'240810', name:'원익IPS',               market:'KOSDAQ', sector:'반도체장비',  price:38750,  change:950,   changeRate:2.51,  volume:678901   },
  { code:'131970', name:'테크윙',                market:'KOSDAQ', sector:'반도체장비',  price:54800,  change:1800,  changeRate:3.40,  volume:456789   },
  { code:'036930', name:'주성엔지니어링',        market:'KOSDAQ', sector:'반도체장비',  price:27350,  change:650,   changeRate:2.43,  volume:567890   },
  { code:'053800', name:'안랩',                  market:'KOSDAQ', sector:'보안',        price:58400,  change:800,   changeRate:1.39,  volume:123456   },
  { code:'277810', name:'레인보우로보틱스',      market:'KOSDAQ', sector:'로봇',        price:189000, change:13000, changeRate:7.38,  volume:534567   },
  { code:'348370', name:'엔젤로보틱스',          market:'KOSDAQ', sector:'로봇',        price:38200,  change:2200,  changeRate:6.11,  volume:876543   },
  { code:'022100', name:'포스코DX',              market:'KOSDAQ', sector:'IT/AI',       price:43500,  change:-1200, changeRate:-2.69, volume:2456789  },
  { code:'263750', name:'펄어비스',              market:'KOSDAQ', sector:'게임',        price:34800,  change:-500,  changeRate:-1.42, volume:456789   },
  { code:'112040', name:'위메이드',              market:'KOSDAQ', sector:'게임',        price:26150,  change:650,   changeRate:2.55,  volume:876543   },
  { code:'293490', name:'카카오게임즈',          market:'KOSDAQ', sector:'게임',        price:16850,  change:-250,  changeRate:-1.46, volume:1234567  },
  { code:'095660', name:'네오위즈',              market:'KOSDAQ', sector:'게임',        price:20450,  change:350,   changeRate:1.74,  volume:345678   },
  { code:'112610', name:'씨에스윈드',            market:'KOSDAQ', sector:'풍력',        price:42800,  change:800,   changeRate:1.90,  volume:345678   },
  { code:'035900', name:'JYP Ent.',              market:'KOSDAQ', sector:'엔터',        price:62500,  change:1000,  changeRate:1.63,  volume:456789   },
  { code:'041510', name:'SM엔터테인먼트',        market:'KOSDAQ', sector:'엔터',        price:81200,  change:1200,  changeRate:1.50,  volume:345678   },
  { code:'122870', name:'YG엔터테인먼트',        market:'KOSDAQ', sector:'엔터',        price:42800,  change:500,   changeRate:1.18,  volume:234567   },
  { code:'352820', name:'하이브',                market:'KOSDAQ', sector:'엔터',        price:198500, change:3500,  changeRate:1.79,  volume:345678   },
  { code:'039200', name:'오스코텍',              market:'KOSDAQ', sector:'바이오',      price:44500,  change:1500,  changeRate:3.49,  volume:456789   },
  { code:'226950', name:'올릭스',                market:'KOSDAQ', sector:'RNA치료제',   price:31800,  change:1800,  changeRate:6.00,  volume:678901   },
  { code:'241770', name:'메카로',                market:'KOSDAQ', sector:'반도체부품',  price:32150,  change:650,   changeRate:2.06,  volume:345678   },
  { code:'214150', name:'클래시스',              market:'KOSDAQ', sector:'의료기기',    price:43200,  change:800,   changeRate:1.89,  volume:456789   },
  { code:'178320', name:'서진시스템',            market:'KOSDAQ', sector:'전자부품',    price:36500,  change:700,   changeRate:1.95,  volume:345678   },
  { code:'058970', name:'엠씨넥스',              market:'KOSDAQ', sector:'카메라모듈',  price:21350,  change:450,   changeRate:2.15,  volume:678901   },
  { code:'950130', name:'엑스바이오텍',          market:'KOSDAQ', sector:'바이오',      price:12450,  change:450,   changeRate:3.75,  volume:1234567  },
  { code:'950160', name:'코오롱티슈진',          market:'KOSDAQ', sector:'바이오',      price:12800,  change:600,   changeRate:4.92,  volume:2345678  },
  { code:'347740', name:'피에스케이홀딩스',      market:'KOSDAQ', sector:'반도체',      price:34600,  change:800,   changeRate:2.37,  volume:345678   },
  { code:'085370', name:'루트로닉',              market:'KOSDAQ', sector:'레이저장비',  price:34600,  change:800,   changeRate:2.37,  volume:234567   },
  { code:'206640', name:'바디텍메드',            market:'KOSDAQ', sector:'진단키트',    price:12450,  change:250,   changeRate:2.05,  volume:567890   },
  { code:'258610', name:'케이엔에스',            market:'KOSDAQ', sector:'반도체장비',  price:28750,  change:750,   changeRate:2.68,  volume:456789   },
  { code:'033230', name:'인성정보',              market:'KOSDAQ', sector:'IT서비스',    price:8540,   change:160,   changeRate:1.91,  volume:876543   },
  { code:'041960', name:'코미팜',                market:'KOSDAQ', sector:'바이오',      price:15200,  change:400,   changeRate:2.70,  volume:567890   },
  { code:'009420', name:'한올바이오파마',        market:'KOSDAQ', sector:'제약',        price:28600,  change:-400,  changeRate:-1.38, volume:345678   },
  { code:'036540', name:'SCI평가정보',           market:'KOSDAQ', sector:'금융IT',      price:7890,   change:90,    changeRate:1.15,  volume:456789   },
  { code:'094360', name:'칩스앤미디어',          market:'KOSDAQ', sector:'반도체설계',  price:35800,  change:800,   changeRate:2.29,  volume:234567   },
  { code:'950210', name:'에이조스바이오',        market:'KOSDAQ', sector:'바이오',      price:7450,   change:150,   changeRate:2.05,  volume:678901   },
  { code:'336260', name:'씨앤씨인터내셔널',      market:'KOSDAQ', sector:'뷰티',        price:58200,  change:1200,  changeRate:2.11,  volume:234567   },
  { code:'065450', name:'빅텍',                  market:'KOSDAQ', sector:'방산부품',    price:18450,  change:650,   changeRate:3.65,  volume:456789   },
  { code:'060480', name:'에이큐어',              market:'KOSDAQ', sector:'의료기기',    price:9870,   change:170,   changeRate:1.75,  volume:345678   },
]

const STOCK_POOL = [...KOSPI_POOL, ...KOSDAQ_POOL]

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

  // ── 기본 점수: 45 (중립 하향 → 기본적으로 보수적)
  let score = 45
  const cr = stock.changeRate

  // ── 등락률 가산/감산
  // 상승 폭 축소: 단순 당일 등락률만으로 높은 점수 방지
  // 하락 페널티 강화: SELL 시그널이 실제로 발생하도록
  if      (cr >= 8)    score += 30   // 급등:  75 → BUY
  else if (cr >= 5)    score += 23   // 강세:  68 → BUY (기존 80 → 68로 하향)
  else if (cr >= 3)    score += 15   // 상승:  60 → HOLD (기존 72 → 60)
  else if (cr >= 1.5)  score += 8    // 소폭:  53 → HOLD
  else if (cr >= 0.5)  score += 3    // 보합+: 48 → HOLD
  else if (cr >= 0)    score += 1    // 보합:  46 → HOLD
  else if (cr >= -1)   score -= 7    // 약보합: 38 → SELL 경계
  else if (cr >= -2)   score -= 15   // 하락:  30 → SELL
  else if (cr >= -3)   score -= 23   // 급락:  22 → SELL
  else                 score -= 33   // 대폭락: 12 → 강한 SELL

  // ── 거래량 보정 (가산 완화, 패널티 유지)
  if      (stock.volume > 3000000)  score += 5   // 대량: +5
  else if (stock.volume > 1000000)  score += 2   // 보통: +2
  else if (stock.volume < 200000)   score -= 5   // 저량: -5

  // ── 점수 범위 제한: 최대 85 (극단적 강도 표시 방지), 최소 5
  score = Math.min(85, Math.max(5, score))

  // ── 시그널 판정
  //  BUY  >= 68: 기존 65 → 68 (BUY 진입 강화, +5%급 상승부터 BUY)
  //  SELL <= 38: 기존 35 → 38 (SELL 범위 소폭 확대)
  //  HOLD: 39~67 구간
  let signal = 'HOLD'
  let reason  = '관망 구간 - 추가 신호 대기'
  if (score >= 68) { signal = 'BUY';  reason = '상승 모멘텀 감지 - 거래량 병행 확인 권장' }
  if (score <= 38) { signal = 'SELL'; reason = '하락 압력 우세 - 손절 라인 점검 권고' }

  // ── 섹터별 사유 보완 (보수적 문구 추가)
  if (stock.sector === '반도체' && score >= 68) reason = 'AI 수요 기반 반도체 업황 개선 기대 (변동성 주의)'
  if (stock.sector === '바이오' && cr >= 5)     reason = '임상·허가 기대감 반영 중 - 결과 발표 전 변동성 유의'
  if (stock.sector === '2차전지소재' && cr >= 5) reason = '전기차 수요 회복 기대 - 단기 급등 후 조정 가능성 확인'
  if (stock.sector === '로봇' && cr >= 5)       reason = 'AI 로봇 테마 강세 - 수급 쏠림 후 되돌림 주의'
  if (stock.sector === '방산' && cr >= 3)       reason = '방산 수출 호조 - 지정학 리스크 완화 시 되돌림 주의'
  if (stock.sector === '조선' && cr >= 3)       reason = 'LNG선 수주 기대 - 수주 확인 전까지 선취매 주의'

  return {
    signal,
    strength:    score,
    reason,
    // 목표가: BUY +10% / SELL -6% (기존 +15%에서 하향 → 현실적 단기 목표)
    targetPrice: Math.round(stock.price * (signal === 'BUY' ? 1.10 : 0.94)),
    // 손절가: BUY -6% / SELL +5% (기존 -8%에서 축소 → 손절 기준 보수화)
    stopLoss:    Math.round(stock.price * (signal === 'BUY' ? 0.94 : 1.05)),
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
