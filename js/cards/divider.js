import { T } from '../theme.js';
import { W, PAD, CW, font, spacedText, spacedWidth, rule, text, textZone } from '../canvas/layout.js';

export default {
  id: 'divider',
  name: '장면 전환',
  desc: '— 10시간 뒤 —',
  group: '연출',
  accent: '#867c69',

  create: () => ({ body: '10시간 뒤' }),

  fields: [
    { k: 'body', t: 'text', label: '문구 (비우면 선만 그립니다)', ph: '10시간 뒤' }
  ],

  label: c => c.body || '장면 전환',

  build(c) {
    const h = 84;
    return {
      h,
      zones: [
        textZone('body', text(c.body, { size: 17, color: T.ink3, lh: 30, align: 'center' }), PAD, 27)
      ],
      paint(ctx) {
        ctx.fillStyle = T.bg;
        ctx.fillRect(0, 0, W, h);
        const y = h / 2;
        if (!c.body) {
          rule(ctx, PAD + 120, y, CW - 240, T.line);
          return;
        }
        font(ctx, 17, 400, T.serif);
        const tw = spacedWidth(ctx, c.body, 5);
        const half = (CW - tw) / 2 - 22;
        rule(ctx, PAD, y, Math.max(0, half), T.line);
        rule(ctx, PAD + CW - Math.max(0, half), y, Math.max(0, half), T.line);
        ctx.fillStyle = T.ink3;
        spacedText(ctx, c.body, PAD, y + 6, 5, 'center', CW);
      }
    };
  }
};
