/**
 * 스팀 상점 페이지에서 끌어 복사한 글을 읽어서 항목으로 나눕니다.
 *
 * 상점 API(JSON)는 CORS 를 막아 두어 브라우저에서 못 부릅니다.
 * 하지만 필요한 정보는 전부 페이지에 글로 적혀 있으니, 긁어서 붙여넣으면 그만입니다.
 * 서버도 프록시도 필요 없습니다.
 *
 * 실제 상점 페이지에서 복사되는 모양 (한국어):
 *
 *   개발자:
 *   Team Cherry
 *   출시일:
 *   2017년 2월 25일
 *   장르: 액션, 어드벤처, 인디
 *   최근 평가:
 *   압도적으로 긍정적
 *   (4,361)
 *   - 지난 30일 동안의 사용자 평가 4,361개 중 96%가 긍정적입니다.
 *   한국어 평가:
 *   압도적으로 긍정적
 *   (11,762)
 *   ₩ 16,500
 *
 * 값이 라벨과 같은 줄에 있어도(«개발자: Team Cherry») 똑같이 읽습니다.
 */

/** 라벨 → 카드 항목 이름. 한국어 페이지와 영어 페이지를 같이 봅니다. */
const LABELS = [
  { key: '개발자',      pats: ['개발자', 'Developer'] },
  { key: '배급사',      pats: ['배급사', 'Publisher'] },
  { key: '출시일',      pats: ['출시일', '출시 예정일', 'Release Date'] },
  { key: '장르',        pats: ['장르', 'Genre'] },
  { key: '제목',        pats: ['제목', 'Title'] },
  { key: '최근 평가',   pats: ['최근 평가', 'Recent Reviews'], rating: true },
  { key: '모든 평가',   pats: ['모든 평가', '전체 평가', 'All Reviews'], rating: true },
  { key: '한국어 평가', pats: ['한국어 평가', '한국어 리뷰'], rating: true }
];

/** 평가 등급 이름. 값이 라벨 없이 딸려 올 때 알아보려고 씁니다. */
const VERDICTS = [
  '압도적으로 긍정적', '매우 긍정적', '대체로 긍정적', '긍정적',
  '복합적', '대체로 부정적', '부정적', '매우 부정적', '압도적으로 부정적',
  '평가가 부족함', '평가 없음'
];

const clean = s => String(s ?? '').replace(/\s+/g, ' ').trim();

/** 여러 줄 글을 빈 줄 없는 줄 목록으로 만듭니다. */
function toLines(raw) {
  return String(raw ?? '')
    .split(/\r?\n/)
    .map(clean)
    .filter(Boolean);
}

/** 이 줄이 어떤 라벨로 시작하는지 봅니다. @returns { def, rest } 또는 null */
function labelAt(line) {
  for (const def of LABELS) {
    for (const p of def.pats) {
      // «개발자:» «개발자 :» «Developer:» 모두 받습니다.
      const re = new RegExp(`^${p}\\s*[:：]\\s*(.*)$`, 'i');
      const m = line.match(re);
      if (m) return { def, rest: clean(m[1]) };
    }
  }
  return null;
}

/** 평가 줄에서 «등급 (개수)» 를 뽑습니다. */
function verdictOf(line) {
  const v = VERDICTS.find(x => line.includes(x));
  if (v) return v;
  // 영어 페이지 대비. "Overwhelmingly Positive" 처럼 Positive/Negative/Mixed 로 끝납니다.
  const m = line.match(/^[A-Za-z ]*(Positive|Negative|Mixed)$/);
  return m ? clean(line) : null;
}

const countOf = line => (line.match(/\(([\d,]+)\)/) || [])[1] || null;

/** "… 4,361개 중 96%가 긍정적입니다." / "96% of the 4,361 user reviews …" */
function percentOf(line) {
  const m = line.match(/(\d{1,3})\s*%/);
  return m ? m[1] : null;
}

/**
 * 평가 한 덩어리를 읽습니다. 라벨 다음 몇 줄에 등급·개수·비율이 흩어져 있습니다.
 * @returns 보기 좋게 합친 글. 예: "압도적으로 긍정적 (96%, 4,361)"
 */
function readRating(lines, i, first) {
  let verdict = first ? verdictOf(first) : null;
  let count = first ? countOf(first) : null;
  let pct = null;

  // 라벨 아래 네 줄까지만 봅니다. 그 뒤는 다음 항목입니다.
  for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
    const line = lines[j];
    if (labelAt(line)) break;
    if (!verdict) verdict = verdictOf(line);
    if (!count) count = countOf(line);
    if (!pct && /%/.test(line)) pct = percentOf(line);
  }

  if (!verdict) return null;
  const paren = [pct && `${pct}%`, count].filter(Boolean).join(', ');
  return paren ? `${verdict} (${paren})` : verdict;
}

/**
 * 가격. 할인 중이면 «-20%» 다음에 정가와 할인가가 잇달아 나옵니다.
 * 마지막 값이 실제로 낼 돈입니다.
 */
function readPrice(lines) {
  const moneyRe = /(?:₩|원|\$|US\$|€|£)\s?[\d,]+(?:\.\d{2})?|[\d,]+\s?원/;
  const idx = [];
  lines.forEach((line, i) => { if (moneyRe.test(line)) idx.push(i); });

  const free = lines.find(l => /^(무료 플레이|무료|Free To Play|Free)$/i.test(l));
  if (!idx.length) return free ? '무료' : null;

  // 첫 가격 앞뒤로 할인율이 있는지 봅니다.
  const first = idx[0];
  const around = lines.slice(Math.max(0, first - 3), first + 3);
  const off = (around.map(l => l.match(/^-\s?(\d{1,3})\s?%$/)).find(Boolean) || [])[1];

  // 할인 중이면 붙어 있는 가격 중 마지막(=할인가)을 씁니다.
  let last = first;
  while (idx.includes(last + 1)) last++;
  const price = clean((lines[last].match(moneyRe) || [])[0]).replace(/\s+/g, '');

  return off ? `${price} (-${off}%)` : price;
}

/**
 * 붙여넣은 글에서 항목을 뽑습니다.
 * @returns { '개발자': '…', '출시일': '…', … } 못 찾은 항목은 아예 안 담습니다.
 */
export function parseSteamText(raw) {
  const lines = toLines(raw);
  const out = {};

  for (let i = 0; i < lines.length; i++) {
    const hit = labelAt(lines[i]);
    if (!hit) continue;
    const { def, rest } = hit;

    if (def.rating) {
      const v = readRating(lines, i, rest);
      if (v && !out[def.key]) out[def.key] = v;
      continue;
    }

    // 값이 같은 줄에 없으면 바로 아래 줄이 값입니다.
    let value = rest;
    if (!value) {
      const next = lines[i + 1];
      if (next && !labelAt(next)) value = next;
    }
    if (value && !out[def.key]) out[def.key] = value;
  }

  const price = readPrice(lines);
  if (price) out['가격'] = price;

  // 최근 평가가 없는 게임(평가 수가 적으면 안 나옵니다)은 모든 평가로 대신합니다.
  if (!out['최근 평가'] && out['모든 평가']) out['최근 평가'] = out['모든 평가'];

  return out;
}

/**
 * 뽑은 항목을 카드의 stats 목록에 얹습니다.
 * 이미 적어 둔 값은 건드리지 않습니다. (덮어쓰면 고쳐 둔 게 날아갑니다)
 * @returns { stats, filled, skipped }
 */
export function mergeStats(stats, found, { overwrite = false } = {}) {
  const next = (stats || []).map(s => ({ ...s }));
  const filled = [];
  const skipped = [];

  for (const [key, value] of Object.entries(found)) {
    const row = next.find(s => clean(s.l) === key);
    if (!row) continue;                        // 카드에 없는 항목은 넣지 않습니다
    if (row.v && !overwrite) { skipped.push(key); continue; }
    if (row.v === value) continue;
    row.v = value;
    filled.push(key);
  }
  return { stats: next, filled, skipped };
}

/** 제목처럼 stats 밖으로 가는 값 */
export const titleFrom = found => found['제목'] || null;
