import { T } from '../theme.js';
import { W, PAD, CW, text, font, rule, textZone, mctx } from '../canvas/layout.js';

export default {
  id: 'section',
  name: '섹션 제목',
  desc: '1. 전투',
  group: '본문',
  accent: '#8fb254',

  create: () => ({ no: '1', title: '', sub: '' }),

  fields: [
    { k: 'no',    t: 'text', label: '번호', ph: '1' },
    { k: 'title', t: 'text', label: '제목', ph: '전투' },
    { k: 'sub',   t: 'text', label: '한 줄 설명', ph: '핵심 시스템' }
  ],

  label: c => [c.no, c.title].filter(Boolean).join('. ') || '섹션 제목',

  build(c) {
    const no = String(c.no ?? '');
    font(mctx, 54, 800, T.serif);
    const noW = no ? mctx.measureText(no).width + 20 : 0;

    const textW = CW - noW;
    const title = text(c.title, { size: 34, weight: 800, maxW: textW, lh: 46 });
    const sub   = text(c.sub,   { size: 16, color: T.ink3, maxW: textW, lh: 26 });

    const top = 34;
    const blockH = title.h + (sub.empty ? 0 : sub.h + 6);
    const h = top + Math.max(blockH, 54) + 18 + 26;

    const x = PAD + noW;
    const yTitle = top;
    const ySub = top + title.h + 6;

    return {
      h,
      zones: [
        textZone('no', text(no, { size: 30, weight: 800, lh: 40 }), PAD, top + 6, { w: Math.max(noW, 30) }),
        textZone('title', title, x, yTitle, { w: textW }),
        textZone('sub', sub, x, ySub, { w: textW })
      ],
      paint(ctx) {
        ctx.fillStyle = T.bg;
        ctx.fillRect(0, 0, W, h);

        if (no) {
          font(ctx, 54, 800, T.serif);
          ctx.fillStyle = T.accent2;
          ctx.fillText(no, PAD, top + 48);
        }
        title.paint(ctx, x, yTitle);
        if (!sub.empty) sub.paint(ctx, x, ySub);

        rule(ctx, PAD, h - 26, CW, T.accent2, 2);
      }
    };
  }
};
