import { T } from '../theme.js';
import { W, PAD, CW, text, ornament } from '../canvas/layout.js';

export default {
  id: 'outro',
  name: '다음 화 예고',
  desc: '회차 마무리',
  group: '뼈대',
  accent: '#c8973f',

  create: () => ({ body: '다음 화에서 계속', sub: '' }),

  fields: [
    { k: 'body', t: 'text',     label: '큰 글씨', ph: '다음 화에서 계속' },
    { k: 'sub',  t: 'textarea', label: '작은 글씨', rows: 3, ph: '다음 화는 이번 주 토요일에 올립니다.' }
  ],

  label: c => c.body || '다음 화 예고',

  build(c) {
    const body = text(c.body, { size: 26, weight: 700, color: T.accent, maxW: CW, lh: 42, align: 'center' });
    const sub  = text(c.sub,  { size: 16, color: T.ink3, maxW: CW, lh: 28, align: 'center' });
    const h = 44 + body.h + (sub.empty ? 0 : sub.h + 12) + 22 + 44;

    return {
      h,
      paint(ctx) {
        ctx.fillStyle = T.bg;
        ctx.fillRect(0, 0, W, h);
        let y = 44;
        body.paint(ctx, PAD, y);
        y += body.h;
        if (!sub.empty) { sub.paint(ctx, PAD, y + 12); y += sub.h + 12; }
        ornament(ctx, W / 2, y + 22, 240);
      }
    };
  }
};
