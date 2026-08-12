import { T } from '../theme.js';
import { W, PAD, CW, text, font, spacedText, rule, textZone, mctx } from '../canvas/layout.js';

const COLS = 4;

export default {
  id: 'status',
  name: '게임 정보',
  desc: '개발사 · 장르 · 가격',
  group: '정보',
  accent: '#d99a3a',

  create: () => ({
    heading: '게임 정보',
    stats: [
      { l: '개발사', v: '' }, { l: '장르', v: '' },
      { l: '플랫폼', v: '' }, { l: '가격', v: '' },
      { l: '플레이 시간', v: '' }, { l: '출시', v: '' }
    ],
    summary: ''
  }),

  fields: [
    { k: 'heading', t: 'text',     label: '소제목', ph: '게임 정보' },
    { k: 'stats',   t: 'pairs',    label: '항목', a: '항목', b: '값', add: '항목 추가' },
    { k: 'summary', t: 'textarea', label: '한 줄 소개', rows: 3,
      ph: '작은 마을 하나 굴려 나가는 경영 시뮬. 생각보다 훨씬 빡세다.' },
    { k: '', t: 'note', text: '리뷰 앞쪽에 한 장 두면 어떤 게임인지 바로 전달됩니다. 연재라면 스탯 요약판으로 써도 됩니다.' }
  ],

  label: c => c.heading || '게임 정보',

  build(c) {
    const stats = (c.stats || []).filter(s => s.l || s.v);
    const rows = Math.ceil(stats.length / COLS);
    const cellW = Math.floor(CW / COLS);
    const rowH = 64;

    // 값이 칸보다 길면 글자를 줄여서 옆 칸을 침범하지 않게 합니다.
    const valSize = stats.map(s => {
      let size = 27;
      while (size > 15) {
        font(mctx, size, 700, T.serif);
        if (mctx.measureText(String(s.v ?? '')).width <= cellW - 12) break;
        size -= 1;
      }
      return size;
    });

    const sum = text(c.summary, { size: 17, color: T.ink2, maxW: CW, lh: 30 });
    const top = 30;
    const headH = c.heading ? 30 : 0;
    const gridH = rows * rowH;
    const sumH = sum.empty ? 0 : sum.h + 22;
    const h = top + headH + gridH + sumH + 30;
    const ySum = top + headH + gridH + 16;

    return {
      h,
      zones: [
        textZone('heading', text(c.heading, { size: 13, lh: 22 }), PAD, top, { w: 260 }),
        // 스탯 한 칸 한 칸도 그 자리에서 고칠 수 있게 합니다.
        ...stats.flatMap((s, i) => {
          const cx = PAD + (i % COLS) * cellW;
          const cy = top + headH + Math.floor(i / COLS) * rowH;
          return [
            textZone('stats', text(s.l, { size: 13, color: T.ink3, lh: 20 }), cx, cy, { w: cellW - 8, index: i, sub: 'l' }),
            textZone('stats', text(s.v, { size: valSize[i], weight: 700, lh: 36 }), cx, cy + 22, { w: cellW - 8, index: i, sub: 'v' })
          ];
        }),
        textZone('summary', sum, PAD, ySum, { multiline: true })
      ],
      paint(ctx) {
        ctx.fillStyle = T.panel;
        ctx.fillRect(0, 0, W, h);
        ctx.strokeStyle = T.accent2;
        ctx.lineWidth = 1;
        ctx.strokeRect(14.5, 14.5, W - 29, h - 29);

        let y = top;
        if (c.heading) {
          font(ctx, 13, 700, T.sans);
          ctx.fillStyle = T.accent;
          spacedText(ctx, c.heading, PAD, y + 13, 3, 'left', CW);
          y += 30;
        }

        stats.forEach((s, i) => {
          const cx = PAD + (i % COLS) * cellW;
          const cy = y + Math.floor(i / COLS) * rowH;
          font(ctx, 13, 400, T.sans);
          ctx.fillStyle = T.ink3;
          ctx.fillText(s.l || '', cx, cy + 16);
          font(ctx, valSize[i], 700, T.serif);
          ctx.fillStyle = T.ink;
          ctx.fillText(s.v || '', cx, cy + 48);
        });
        y += gridH;

        if (!sum.empty) {
          rule(ctx, PAD, y + 2, CW, T.line);
          sum.paint(ctx, PAD, ySum);
        }
      }
    };
  }
};
