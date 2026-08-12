import { T } from '../theme.js';
import { W, PAD, CW, text, font, spacedText, rule } from '../canvas/layout.js';

const COLS = 4;

export default {
  id: 'status',
  name: '상황 요약',
  desc: '스탯 + 줄거리',
  group: '정보',
  accent: '#d99a3a',

  create: () => ({
    heading: '현재 상황',
    stats: [{ l: '병력', v: '340' }, { l: '식량', v: '12일' }, { l: '금고', v: '180' }, { l: '민심', v: '불안' }],
    summary: ''
  }),

  fields: [
    { k: 'heading', t: 'text',     label: '소제목', ph: '현재 상황' },
    { k: 'stats',   t: 'pairs',    label: '스탯', a: '항목', b: '값', add: '스탯 추가' },
    { k: 'summary', t: 'textarea', label: '지난 줄거리', rows: 4,
      ph: '형이 죽고 성을 물려받았으나, 봉신 절반이 계승을 인정하지 않는다.' },
    { k: '', t: 'note', text: '중간에 유입된 독자가 바로 따라올 수 있게 해 주는 카드입니다. 회차 앞쪽에 한 장 두면 좋습니다.' }
  ],

  label: c => c.heading || '상황 요약',

  build(c) {
    const stats = (c.stats || []).filter(s => s.l || s.v);
    const rows = Math.ceil(stats.length / COLS);
    const cellW = Math.floor(CW / COLS);
    const rowH = 64;

    const sum = text(c.summary, { size: 17, color: T.ink2, maxW: CW, lh: 30 });
    const top = 30;
    const headH = c.heading ? 30 : 0;
    const gridH = rows * rowH;
    const sumH = sum.empty ? 0 : sum.h + 22;
    const h = top + headH + gridH + sumH + 30;

    return {
      h,
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
          font(ctx, 27, 700, T.serif);
          ctx.fillStyle = T.ink;
          ctx.fillText(s.v || '', cx, cy + 48);
        });
        y += gridH;

        if (!sum.empty) {
          rule(ctx, PAD, y + 2, CW, T.line);
          sum.paint(ctx, PAD, y + 16);
        }
      }
    };
  }
};
