import { T } from '../theme.js';
import { W, PAD, CW, text, ornament } from '../canvas/layout.js';

export default {
  id: 'quote',
  name: '인용 강조',
  desc: '큰 한 줄',
  group: '연출',
  accent: '#b3a894',

  create: () => ({ body: '', by: '' }),

  fields: [
    { k: 'body', t: 'textarea', label: '문장', rows: 3, ph: '겨울은 아무도 편들지 않는다.' },
    { k: 'by',   t: 'text',     label: '출처 · 화자 (비워도 됨)', ph: '— 발루아 가문 격언' }
  ],

  label: c => (c.body || '인용 강조').split('\n')[0],

  build(c) {
    const inner = CW - 60;
    const body = text(c.body, { size: 30, weight: 700, maxW: inner, lh: 50, align: 'center' });
    const by   = text(c.by,   { size: 15, color: T.ink3, maxW: inner, lh: 26, align: 'center' });
    const h = 54 + 24 + body.h + (by.empty ? 0 : by.h + 16) + 24 + 54;

    return {
      h,
      paint(ctx) {
        ctx.fillStyle = T.bg;
        ctx.fillRect(0, 0, W, h);
        let y = 54;
        ornament(ctx, W / 2, y, 200);
        y += 24;
        body.paint(ctx, PAD + 30, y, { maxW: inner, color: T.ink });
        y += body.h;
        if (!by.empty) { by.paint(ctx, PAD + 30, y + 16, { maxW: inner }); y += by.h + 16; }
        ornament(ctx, W / 2, y + 24, 200);
      }
    };
  }
};
