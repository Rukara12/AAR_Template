import { T } from '../theme.js';
import { W, PAD, CW, text, font, spacedText, rule } from '../canvas/layout.js';

export default {
  id: 'result',
  name: '투표 결과',
  desc: '지난 화 개표',
  group: '독자 참여',
  accent: '#c26a63',

  create: () => ({
    heading: '지난 화 투표 결과',
    rows: [{ l: '', v: '0' }, { l: '', v: '0' }],
    note: ''
  }),

  fields: [
    { k: 'heading', t: 'text',     label: '소제목', ph: '지난 화 투표 결과' },
    { k: 'rows',    t: 'pairs',    label: '개표', a: '선택지', b: '표', add: '항목 추가', numeric: true },
    { k: 'note',    t: 'textarea', label: '아래 한 줄', rows: 2, ph: '총 87표 · 2번이 채택되었습니다.' },
    { k: '', t: 'note', text: '가장 많이 받은 항목이 자동으로 강조됩니다.' }
  ],

  label: c => c.heading || '투표 결과',

  build(c) {
    const rows = (c.rows || []).filter(r => r.l);
    const max = Math.max(1, ...rows.map(r => +r.v || 0));
    const total = rows.reduce((a, r) => a + (+r.v || 0), 0);

    const labelW = CW - 96;
    const rowT = rows.map(r => text(r.l, { size: 18, maxW: labelW, lh: 28 }));
    const rowH = rowT.map(t => t.h + 30);

    const note = text(c.note, { size: 15, color: T.ink3, maxW: CW, lh: 26 });
    const top = 32;
    const headH = c.heading ? 32 : 0;
    const listH = rowH.reduce((a, b) => a + b + 10, 0);
    const noteH = note.empty ? 0 : note.h + 20;
    const h = top + headH + listH + noteH + 30;

    return {
      h,
      paint(ctx) {
        ctx.fillStyle = T.panel;
        ctx.fillRect(0, 0, W, h);

        let y = top;
        if (c.heading) {
          font(ctx, 13, 700, T.sans);
          ctx.fillStyle = T.accent;
          spacedText(ctx, c.heading, PAD, y + 13, 3, 'left', CW);
          y += 22;
          rule(ctx, PAD, y, CW, T.line);
          y += 10;
        }

        rowT.forEach((t, i) => {
          const r = rows[i];
          const v = +r.v || 0;
          const win = v === max && max > 0;
          const bh = rowH[i];
          const barW = Math.round((CW * v) / max);

          ctx.fillStyle = win ? 'rgba(200,151,63,.17)' : T.panel2;
          ctx.fillRect(PAD, y, Math.max(barW, 3), bh);
          ctx.strokeStyle = T.line;
          ctx.lineWidth = 1;
          ctx.strokeRect(PAD + 0.5, y + 0.5, CW - 1, bh - 1);
          if (win) { ctx.fillStyle = T.accent; ctx.fillRect(PAD, y, 4, bh); }

          t.paint(ctx, PAD + 16, y + (bh - t.h) / 2, { color: win ? T.ink : T.ink2 });

          font(ctx, 19, 700, T.serif);
          ctx.fillStyle = win ? T.accent : T.ink3;
          const pct = total ? Math.round((v / total) * 100) : 0;
          const s = `${v}표 · ${pct}%`;
          ctx.fillText(s, PAD + CW - 16 - ctx.measureText(s).width, y + bh / 2 + 7);

          y += bh + 10;
        });

        if (!note.empty) note.paint(ctx, PAD, y + 10);
      }
    };
  }
};
