import { T } from '../theme.js';
import { W, PAD, CW, text, ornament, textZone } from '../canvas/layout.js';

export default {
  id: 'quote',
  name: '인용 강조',
  desc: '큰 한 줄',
  group: '곁들이기',
  accent: '#9a9186',

  create: () => ({ body: '', by: '' }),

  fields: [
    { k: 'body', t: 'textarea', label: '문장', rows: 3, ph: '여기서 이야기의 방향이 바뀐다' },
    { k: 'by',   t: 'text',     label: '출처 · 화자', ph: '— 3장' }
  ],

  label: c => (c.body || '인용 강조').split('\n')[0],

  build(c) {
    const inner = CW - 60;
    const body = text(c.body, { size: 30, weight: 700, maxW: inner, lh: 50, align: 'center' });
    const by   = text(c.by,   { size: 15, color: T.ink3, maxW: inner, lh: 26, align: 'center' });
    const yBody = 78;
    const yBy = yBody + body.h + 16;
    const h = 54 + 24 + body.h + (by.empty ? 0 : by.h + 16) + 24 + 54;

    return {
      h,
      zones: [
        textZone('body', body, PAD + 30, yBody, { w: inner, multiline: true }),
        textZone('by', by, PAD + 30, yBy, { w: inner })
      ],
      paint(ctx) {
        ctx.fillStyle = T.bg;
        ctx.fillRect(0, 0, W, h);
        ornament(ctx, W / 2, 54, 200);
        body.paint(ctx, PAD + 30, yBody, { maxW: inner, color: T.ink });
        if (!by.empty) by.paint(ctx, PAD + 30, yBy, { maxW: inner });
        ornament(ctx, W / 2, h - 54, 200);
      }
    };
  }
};
