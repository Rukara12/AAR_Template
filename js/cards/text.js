import { T } from '../theme.js';
import { W, PAD, CW, text, rule } from '../canvas/layout.js';

export default {
  id: 'text',
  name: '나레이션',
  desc: '본문 글',
  group: '뼈대',
  accent: '#b3a894',

  create: () => ({ heading: '', body: '', align: 'left', size: 20 }),

  fields: [
    { k: 'heading', t: 'text',     label: '소제목 (비워도 됨)', ph: '동쪽 능선' },
    { k: 'body',    t: 'textarea', label: '본문', rows: 9, ph: '척후병이 돌아왔다.\n동쪽 능선에 깃발이 서 있었다고 한다.' },
    { k: 'align',   t: 'select',   label: '정렬', opts: [['left', '왼쪽'], ['center', '가운데']] },
    { k: 'size',    t: 'number',   label: '글자 크기', min: 15, max: 30, step: 1 },
    { k: '',        t: 'note',     text: '본문이 길면 그대로 카드가 길어집니다. 한 카드가 너무 길어지면 나레이션을 두 장으로 나누는 편이 읽기 좋습니다.' }
  ],

  label: c => (c.heading || c.body || '나레이션').split('\n')[0],

  build(c) {
    const size = Math.max(15, +c.size || 20);
    const head = text(c.heading, { size: 23, weight: 700, color: T.accent, maxW: CW, lh: 34, align: c.align });
    const body = text(c.body, { size, maxW: CW, lh: Math.round(size * 1.9), align: c.align });

    const top = 34, bot = 34;
    const headH = head.empty ? 0 : head.h + 20;
    const h = top + headH + Math.max(body.h, 30) + bot;

    return {
      h,
      paint(ctx) {
        ctx.fillStyle = T.bg;
        ctx.fillRect(0, 0, W, h);
        let y = top;
        if (!head.empty) {
          head.paint(ctx, PAD, y);
          y += head.h + 8;
          rule(ctx, PAD, y, CW, T.line);
          y += 12;
        }
        body.paint(ctx, PAD, y);
      }
    };
  }
};
