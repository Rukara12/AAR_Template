import { T } from '../theme.js';
import { W, PAD, CW, text, rule, textZone } from '../canvas/layout.js';

export default {
  id: 'text',
  name: '나레이션',
  desc: '본문 글',
  group: '뼈대',
  accent: '#b3a894',

  create: () => ({ heading: '', body: '', align: 'left', size: 20 }),

  fields: [
    { k: 'heading', t: 'text',     label: '소제목 (비워도 됨)', ph: '초반 두 시간' },
    { k: 'body',    t: 'textarea', label: '본문', rows: 9, ph: '처음엔 뭘 해야 할지 몰라서 좀 헤맸다.\n근데 감 잡고 나니까 손을 못 떼겠더라.' },
    { k: 'align',   t: 'select',   label: '정렬', opts: [['left', '왼쪽'], ['center', '가운데']] },
    { k: 'size',    t: 'number',   label: '글자 크기', min: 15, max: 30, step: 1 },
    { k: '',        t: 'note',     text: '한 카드가 너무 길어지면 두 장으로 나누는 편이 읽기 좋습니다.' }
  ],

  label: c => (c.heading || c.body || '나레이션').split('\n')[0],

  build(c) {
    const size = Math.max(15, +c.size || 20);
    const head = text(c.heading, { size: 23, weight: 700, color: T.accent, maxW: CW, lh: 34, align: c.align });
    const body = text(c.body, { size, maxW: CW, lh: Math.round(size * 1.9), align: c.align });

    const top = 34, bot = 34;
    const headH = head.empty ? 0 : head.h + 20;
    const yBody = top + headH;
    const h = top + headH + Math.max(body.h, 30) + bot;

    return {
      h,
      zones: [
        textZone('heading', head, PAD, top),
        textZone('body', body, PAD, yBody, { multiline: true })
      ],
      paint(ctx) {
        ctx.fillStyle = T.bg;
        ctx.fillRect(0, 0, W, h);
        if (!head.empty) {
          head.paint(ctx, PAD, top);
          rule(ctx, PAD, top + head.h + 8, CW, T.line);
        }
        body.paint(ctx, PAD, yBody);
      }
    };
  }
};
