/**
 * 스팀 상점 주소만 넣으면 게임 정보를 받아 옵니다.
 *
 * ── 왜 이렇게 나뉘어 있나
 * 상점 API(store.steampowered.com)는 CORS 를 막아 두어 브라우저에서 못 부릅니다.
 * 대신 api.steamcmd.net 은 CORS 를 열어 두어서 그냥 부를 수 있습니다.
 * (Steam 의 앱 메타데이터를 그대로 넘겨 주는 곳입니다)
 *
 *   1단계  api.steamcmd.net      — 아무 설정 없이 항상 됩니다
 *          개발자 · 배급사 · 출시일 · 장르 · 전체 평가 · 메타크리틱 · 한국어 지원
 *
 *   2단계  상점 API + 프록시     — 프록시를 켰을 때만
 *          가격(원화·할인율) · 최근 평가 · 한국어 평가
 *
 * 2단계가 필요한 값들은 지역·언어마다 달라서 상점 API 에만 있습니다.
 * 프록시는 남의 공짜 서버라 느리거나 멈출 수 있어서, 안 되면 1단계 결과만 돌려줍니다.
 */
import { parseSteamText } from './steamtext.js';

/** 스팀 장르 번호 → 이름. (상점 페이지에 적히는 그 장르입니다) */
const GENRES = {
  1: '액션', 2: '전략', 3: 'RPG', 4: '캐주얼', 9: '레이싱', 18: '스포츠',
  23: '인디', 25: '어드벤처', 28: '시뮬레이션', 29: '대규모 멀티플레이어',
  37: '무료 플레이', 50: '애니메이션 및 모델링', 51: '오디오 제작', 52: '체험판',
  53: '디자인 및 일러스트레이션', 54: '교육', 55: '사진 편집', 56: '소프트웨어 교육',
  57: '유틸리티', 58: '비디오 제작', 59: '웹 퍼블리싱', 70: '앞서 해보기',
  71: '대화형 영화', 72: '게임 개발', 73: '폭력적', 74: '잔인함',
  81: '다큐멘터리', 84: '튜토리얼'
};

/** 평가 점수(1~9) → 상점에 적히는 말 */
const VERDICT = {
  1: '압도적으로 부정적', 2: '매우 부정적', 3: '부정적', 4: '대체로 부정적',
  5: '복합적', 6: '대체로 긍정적', 7: '긍정적', 8: '매우 긍정적', 9: '압도적으로 긍정적'
};

/** 프록시 후보. 앞엣것이 안 되면 다음 것으로 넘어갑니다. */
const PROXIES = [
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://r.jina.ai/${u}`
];

const STEAMCMD = 'https://api.steamcmd.net/v1/info/';
const STORE = 'https://store.steampowered.com';

/** 상점 주소나 앱 번호에서 번호만 뽑습니다. */
export function appIdFrom(text) {
  const s = String(text || '').trim();
  const m = s.match(/\/app\/(\d+)/);
  if (m) return m[1];
  return /^\d{3,}$/.test(s) ? s : null;
}

/** 잘못 만든 주소 하나가 전체를 막지 않도록 시간 제한을 둡니다. */
async function getText(url, ms = 9000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function parseJSON(t) {
  if (!t) return null;
  // 프록시가 앞뒤에 뭘 붙여 보낼 때가 있어서 중괄호 안쪽만 떼어 읽습니다.
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  try { return JSON.parse(a >= 0 ? t.slice(a, b + 1) : t); } catch { return null; }
}

const getJSON = async (url, ms) => parseJSON(await getText(url, ms));

/** 프록시를 차례로 시도합니다. */
async function viaProxy(url) {
  for (const make of PROXIES) {
    const t = await getText(make(url));
    if (t) return t;
  }
  return null;
}

/* ── 1단계: api.steamcmd.net ─────────────────────────────── */

const nameOf = (assoc, type) =>
  Object.values(assoc || {}).filter(a => a.type === type).map(a => a.name);

function formatDate(unix) {
  if (!unix) return null;
  const d = new Date(+unix * 1000);
  if (Number.isNaN(d.getTime())) return null;
  // 상점 페이지도 보는 사람 시간대로 적히므로 그대로 맞춥니다.
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

async function fromSteamCmd(appid) {
  const j = await getJSON(`${STEAMCMD}${appid}`);
  const c = j?.data?.[appid]?.common;
  if (!c) return null;

  const genres = Object.values(c.genres || {})
    .map(n => GENRES[+n])
    .filter(Boolean);

  const score = +c.review_score || 0;
  const pct = c.review_percentage;
  const verdict = VERDICT[score];

  return {
    이름: c.name || null,
    개발자: nameOf(c.associations, 'developer').join(', ') || null,
    배급사: nameOf(c.associations, 'publisher').join(', ') || null,
    출시일: formatDate(c.steam_release_date),
    장르: genres.join(', ') || null,
    전체평가: verdict ? (pct ? `${verdict} (${pct}%)` : verdict) : null,
    메타크리틱: c.metacritic_score ? `${c.metacritic_score} / 100` : null,
    한국어: c.languages?.koreana ? '지원' : '미지원',
    플랫폼: (c.oslist || '').split(',').filter(Boolean).join(', ') || null
  };
}

/* ── 2단계: 상점 API (프록시 필요) ───────────────────────── */

function priceOf(p) {
  if (!p) return null;
  const now = p.final_formatted?.replace(/\s+/g, '') || null;
  if (!now) return null;
  return p.discount_percent > 0 ? `${now} (-${p.discount_percent}%)` : now;
}

function ratingOf(summary) {
  if (!summary?.review_score_desc) return null;
  const total = summary.total_reviews || 0;
  if (!total) return summary.review_score_desc;
  const pct = Math.round((summary.total_positive / total) * 100);
  return `${summary.review_score_desc} (${pct}%, ${total.toLocaleString('ko-KR')})`;
}

/**
 * 상점 페이지를 통째로 받아서 사람이 보는 글 그대로 읽습니다.
 * 최근 평가(지난 30일)는 페이지에만 적혀 있어서 API 로는 못 가져옵니다.
 * 나이 확인이 걸린 게임은 확인 화면이 대신 와서 아무것도 안 나옵니다. 그때는 API 로 넘어갑니다.
 */
function fromStorePage(html) {
  if (!html || !/<html/i.test(html)) return {};
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const grab = sel => [...doc.querySelectorAll(sel)]
    .map(e => e.textContent.replace(/[ \t]+/g, ' '))
    .join('\n');

  // 붙여넣기로 읽을 때와 똑같은 규칙을 씁니다. (js/io/steamtext.js)
  const text = [
    grab('#genresAndManufacturer'),
    grab('.user_reviews'),
    grab('.game_area_purchase_game:first-of-type')
  ].filter(Boolean).join('\n');

  // 출시일·장르는 페이지에 보이는 그대로가 맞아서 여기서 가져갑니다.

  return parseSteamText(text);
}

/**
 * 셋을 한꺼번에 부릅니다. 차례로 부르면 나이 확인이 걸린 게임에서 30초를 넘겼습니다.
 * 프록시 한 번이 느려도 전체는 가장 느린 하나만큼만 걸립니다.
 *
 * 출시일과 장르는 여기서 안 씁니다. 상점 API 가 다른 시간대로 하루 어긋난 날짜를 주는데,
 * api.steamcmd.net 쪽이 보는 사람 시간대로 맞아떨어집니다.
 */
async function fromStore(appid) {
  const [pageHtml, detailRaw, koRaw] = await Promise.all([
    viaProxy(`${STORE}/app/${appid}/?l=koreana&cc=kr`),
    viaProxy(`${STORE}/api/appdetails?appids=${appid}&cc=kr&l=korean`),
    viaProxy(`${STORE}/appreviews/${appid}?json=1&language=koreana&purchase_type=all&num_per_page=0&l=koreana`)
  ]);

  const api = {};
  const d = parseJSON(detailRaw)?.[appid]?.data;
  if (d) {
    api.가격 = d.is_free ? '무료' : priceOf(d.price_overview);
    if (d.short_description) api.소개 = d.short_description;
  }
  const rating = ratingOf(parseJSON(koRaw)?.query_summary);
  if (rating) api['한국어 평가'] = rating;

  // 페이지 쪽이 상점에 보이는 그대로라 우선입니다.
  // 나이 확인이 걸린 게임은 확인 화면이 와서 여기가 비고, 위의 API 값만 남습니다.
  const page = fromStorePage(pageHtml);
  /* 페이지 안에 출시일이 두 군데 적혀 있고 서로 하루 다릅니다.
     사람이 보는 오른쪽 정보 상자 쪽이 맞는데, 그 값이 api.steamcmd.net 과 같아서
     여기서는 날짜를 안 가져옵니다. */
  delete page.출시일;

  const out = { ...api };
  for (const [k, v] of Object.entries(page)) if (v) out[k] = v;
  return out;
}

/**
 * 게임 정보를 받아 옵니다.
 * @param appid 앱 번호
 * @param useProxy 프록시를 거쳐 가격·한국어 평가까지 받을지
 * @returns { values, partial } — partial 이면 프록시 쪽이 실패한 것입니다.
 */
export async function fetchGameInfo(appid, { useProxy = true } = {}) {
  const base = await fromSteamCmd(appid);
  if (!base) return null;

  if (!useProxy) return { values: base, partial: false };

  const extra = await fromStore(appid).catch(() => null);
  const got = extra && Object.values(extra).some(Boolean);

  return {
    values: { ...base, ...(extra || {}) },
    partial: !got   // 프록시가 안 됐으면 가격·한국어 평가가 비어 있습니다
  };
}

/**
 * 받아 온 값을 카드의 stats 목록에 얹습니다.
 * 카드에 있는 항목만 채우고, 이미 적어 둔 값은 건드리지 않습니다.
 */
export function fillStats(stats, values, { overwrite = false } = {}) {
  const next = (stats || []).map(s => ({ ...s }));
  const filled = [];
  const skipped = [];
  const norm = s => String(s ?? '').replace(/\s+/g, ' ').trim();

  /* 카드 항목 이름 → 어느 값을 쓸지. 앞엣것부터 찾아서 있는 것을 씁니다.
     최근 평가(지난 30일)는 상점 페이지에만 있으니, 못 받았으면 전체 평가로 대신합니다. */
  const ALIAS = {
    '최근 평가': ['최근 평가', '모든 평가', '전체평가'],
    '평가': ['모든 평가', '전체평가'],
    '한 줄 소개': ['소개']
  };

  for (const row of next) {
    const label = norm(row.l);
    const keys = ALIAS[label] || [label];
    const value = keys.map(k => values[k]).find(Boolean);
    if (!value) continue;
    if (row.v && !overwrite) { skipped.push(label); continue; }
    if (row.v === value) continue;
    row.v = value;
    filled.push(label);
  }
  return { stats: next, filled, skipped };
}
