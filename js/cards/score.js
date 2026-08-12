import { T } from '../theme.js';
import { W, PAD, CW, text, font, spacedText, rule, roundRect, textZone } from '../canvas/layout.js';

/* 왼쪽에 항목별 막대, 오른쪽에 총점. 서로 침범하지 않게 폭을 미리 나눠 둡니다. */
const TOTAL_W = 176;
const GAP     = 24;
const ROWS_W  = CW - TOTAL_W - GAP;
const LABEL_W = 128;
const VAL_W   = 44;
const BAR_W   = ROWS_W - LABEL_W - VAL_W - 16;
const ROW_H   = 46;

export default {
  id: 'score',
  name: '평점',
  desc: '항목별 점수',
  group: '정보',
  accent: '#d99a3a',

  create: () => ({
    heading: '평가',
    rows: [{ l: '그래픽', v: '8' }, { l: '사운드', v: '8' }, { l: '조작감', v: '7' }, { l: '재미', v: '9' }],
    max: 10,
    total: '',
    note: ''
  }),

  fields: [
    { k: 'heading', t: 'text',   label: '소제목', ph: '평가' },
    { k: 'rows',    t: 'pairs',  label: '항목별 점수', a: '항목', b: '점수', add: '항목 추가', numeric: true },
    { k: 'max',     t: 'number', label: '만점', min: 1, max: 100, step: 1 },
    { k: 'total',   t: 'text',   label: '총점 (비우면 평균)', ph: '7.8' },
    { k: 'note',    t: 'text',   label: '아래 한 줄', ph: '조작감만 손보면 진짜 물건이다' }
  ],

  label: c => c.heading || '평점',

  build(c) {
    const rows = (c.rows || []).filter(r => r.l);
    const max = Math.max(1, +c.max || 10);
    const avg = rows.length ? rows.reduce((a, r) => a + (+r.v || 0), 0) / rows.length : 0;
    const total = String(c.total || Math.round(avg * 10) / 10);

    const rowT = rows.map(r => text(r.l, { size: 18, color: T.ink2, maxW: LABEL_W - 10, lh: 26 }));
    const valT = rows.map(r => text(String(r.v ?? ''), { size: 17, weight: 700, maxW: VAL_W, lh: 26 }));
    const totalT = text(total, { size: 58, weight: 800, color: T.accent, maxW: TOTAL_W, lh: 70, align: 'center' });
    const note = text(c.note, { size: 15, color: T.ink3, maxW: CW, lh: 26 });

    const top = 32;
    const headH = c.heading ? 30 : 0;
    const bodyH = Math.max(rows.length * ROW_H, 96);
    const noteH = note.empty ? 0 : note.h + 18;
    const h = top + headH + bodyH + noteH + 30;

    const yRows  = top + headH;
    const xBar   = PAD + LABEL_W;
    const xVal   = xBar + BAR_W + 16;
    const xTotal = PAD + ROWS_W + GAP;
    const yTotal = yRows + (bodyH - 88) / 2;

    return {
      h,
      zones: [
        textZone('heading', text(c.heading, { size: 13, lh: 22 }), PAD, top, { w: 240 }),
        ...rowT.map((t, i) => textZone('rows', t, PAD, yRows + i * ROW_H + 10,
                                       { w: LABEL_W - 10, index: i, sub: 'l' })),
        ...valT.map((t, i) => textZone('rows', t, xVal, yRows + i * ROW_H + 10,
                                       { w: VAL_W, index: i, sub: 'v' })),
        textZone('total', totalT, xTotal, yTotal, { w: TOTAL_W }),
        textZone('note', note, PAD, top + headH + bodyH + 8)
      ],
      paint(ctx) {
        ctx.fillStyle = T.panel;
        ctx.fillRect(0, 0, W, h);
        ctx.strokeStyle = T.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(14.5, 14.5, W - 29, h - 29);

        if (c.heading) {
          font(ctx, 13, 700, T.sans);
          ctx.fillStyle = T.accent;
          spacedText(ctx, c.heading, PAD, top + 13, 3, 'left', CW);
        }

        rows.forEach((r, i) => {
          const y = yRows + i * ROW_H;
          const v = Math.max(0, Math.min(max, +r.v || 0));
          rowT[i].paint(ctx, PAD, y + 10);

          const by = y + 21;
          ctx.fillStyle = T.panel2;
          roundRect(ctx, xBar, by, BAR_W, 8, 4);
          ctx.fill();
          ctx.fillStyle = v / max >= 0.75 ? T.ok : v / max >= 0.45 ? T.accent : T.bad;
          roundRect(ctx, xBar, by, Math.max(4, (BAR_W * v) / max), 8, 4);
          ctx.fill();

          valT[i].paint(ctx, xVal, y + 10, { color: T.ink });
        });

        // 총점 — 세로 구분선을 두고 오른쪽에 따로 둡니다.
        ctx.strokeStyle = T.line;
        ctx.beginPath();
        ctx.moveTo(Math.round(xTotal - GAP / 2) + 0.5, yRows + 4);
        ctx.lineTo(Math.round(xTotal - GAP / 2) + 0.5, yRows + bodyH - 4);
        ctx.stroke();

        totalT.paint(ctx, xTotal, yTotal, { maxW: TOTAL_W });
        font(ctx, 15, 400, T.sans);
        ctx.fillStyle = T.ink3;
        const suffix = `／ ${max}`;
        ctx.fillText(suffix, xTotal + (TOTAL_W - ctx.measureText(suffix).width) / 2, yTotal + 88);

        if (!note.empty) {
          rule(ctx, PAD, top + headH + bodyH, CW, T.line);
          note.paint(ctx, PAD, top + headH + bodyH + 8);
        }
      }
    };
  }
};
