import { T } from '../theme.js';
import { W, PAD, CW, text, font, spacedText, rule, textZone, mctx } from '../canvas/layout.js';

/* 스팀 상점 정보 상자처럼 «항목  값» 을 한 줄에 놓고 두 단으로 나눕니다. */
const COLS = 2;
const COL_GAP = 28;
const CELL_W = Math.floor((CW - COL_GAP) / COLS);
const LABEL_W = 104;
const ROW_H = 42;

export default {
  id: 'status',
  name: '게임 정보',
  desc: '개발사 · 장르 · 가격',
  group: '시작',
  accent: '#c8973f',

  create: () => ({
    heading: '게임 정보',
    stats: [
      { l: '개발자', v: '' },      // 스팀 상점 정보 상자
      { l: '장르', v: '' },        // 직접 작성
      { l: '출시일', v: '' },      // 스팀 상점 정보 상자
      { l: '가격', v: '' },        // 최대 할인가 기준
      { l: '최근 평가', v: '' },   // 스팀 상점 정보 상자
      { l: '한국어 평가', v: '' }  // 스팀 상점 정보 상자
    ],
    summary: ''
  }),

  fields: [
    { k: '', t: 'fetch', label: '스팀 상점 주소',
      ph: 'store.steampowered.com/app/… 또는 앱 번호',
      note: '표지 사진·제목까지 같이 채웁니다.' },
    { k: 'heading', t: 'text',     label: '소제목', ph: '게임 정보' },
    { k: 'stats',   t: 'pairs',    label: '항목', a: '항목', b: '값', add: '항목 추가' },
    { k: 'summary', t: 'textarea', label: '한 줄 소개', rows: 3,
      ph: '작은 마을 하나 굴려 나가는 경영 시뮬. 생각보다 훨씬 빡세다.' }
  ],

  label: c => c.heading || '게임 정보',

  build(c) {
    const stats = (c.stats || []).filter(s => s.l || s.v);
    const rows = Math.ceil(stats.length / COLS);
    const valW = CELL_W - LABEL_W;

    // 값이 칸보다 길면 글자를 줄여서 옆 단을 침범하지 않게 합니다.
    const valSize = stats.map(s => {
      let size = 19;
      while (size > 12) {
        font(mctx, size, 700, T.serif);
        if (mctx.measureText(String(s.v ?? '')).width <= valW - 8) break;
        size -= 1;
      }
      return size;
    });

    const sum = text(c.summary, { size: 17, color: T.ink2, maxW: CW, lh: 30 });
    const top = 30;
    const headH = c.heading ? 30 : 0;
    const gridH = rows * ROW_H;
    const sumH = sum.empty ? 0 : sum.h + 22;
    const h = top + headH + gridH + sumH + 30;

    const yGrid = top + headH;
    const ySum = yGrid + gridH + 16;

    // 왼쪽 단부터 세로로 채웁니다. (스팀 정보 상자를 두 줄로 쪼갠 모양)
    const posOf = i => ({
      x: PAD + Math.floor(i / rows) * (CELL_W + COL_GAP),
      y: yGrid + (i % rows) * ROW_H
    });

    return {
      h,
      zones: [
        textZone('heading', text(c.heading, { size: 13, lh: 22 }), PAD, top, { w: 260 }),
        ...stats.flatMap((s, i) => {
          const p = posOf(i);
          return [
            textZone('stats', text(s.l, { size: 15, color: T.ink3, lh: 24 }),
                     p.x, p.y + 8, { w: LABEL_W - 8, index: i, sub: 'l' }),
            textZone('stats', text(s.v, { size: valSize[i], weight: 700, lh: 26 }),
                     p.x + LABEL_W, p.y + 6, { w: valW, index: i, sub: 'v' })
          ];
        }),
        textZone('summary', sum, PAD, ySum, { multiline: true })
      ],
      paint(ctx) {
        ctx.fillStyle = T.panel;
        ctx.fillRect(0, 0, W, h);

        if (c.heading) {
          font(ctx, 13, 700, T.sans);
          ctx.fillStyle = T.accent;
          spacedText(ctx, c.heading, PAD, top + 13, 3, 'left', CW);
        }

        stats.forEach((s, i) => {
          const p = posOf(i);

          // 행 사이 옅은 선. 표처럼 읽히게 해 줍니다.
          if (i % rows < rows - 1) rule(ctx, p.x, p.y + ROW_H - 1, CELL_W, T.line);

          font(ctx, 15, 400, T.sans);
          ctx.fillStyle = T.ink3;
          ctx.fillText(s.l || '', p.x, p.y + 26);

          font(ctx, valSize[i], 700, T.serif);
          ctx.fillStyle = T.ink;
          ctx.fillText(s.v || '', p.x + LABEL_W, p.y + 27);
        });

        if (!sum.empty) {
          rule(ctx, PAD, yGrid + gridH + 2, CW, T.line);
          sum.paint(ctx, PAD, ySum);
        }
      }
    };
  }
};
