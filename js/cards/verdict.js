import { T } from '../theme.js';
import { W, PAD, CW, text, font, spacedText, ornament, textZone } from '../canvas/layout.js';

export default {
  id: 'verdict',
  name: '총평',
  desc: '리뷰 마무리',
  group: '뼈대',
  accent: '#c8973f',

  create: () => ({ heading: '총평', line: '', body: '', rec: '' }),

  fields: [
    { k: 'heading', t: 'text',     label: '소제목', ph: '총평' },
    { k: 'line',    t: 'textarea', label: '한 줄 평', rows: 2, ph: '세일하면 무조건 사라' },
    { k: 'body',    t: 'textarea', label: '본문', rows: 5, ph: '단점 없는 게임은 아니다. 근데 그거 다 감수할 만큼 좋은 구간이 확실히 있다.' },
    { k: 'rec',     t: 'text',     label: '추천 대상', ph: '혼자 조용히 파고드는 거 좋아하면 추천' }
  ],

  label: c => c.line || c.heading || '총평',

  build(c) {
    const inner = CW - 40;
    const line = text(c.line, { size: 30, weight: 700, color: T.accent, maxW: inner, lh: 48, align: 'center' });
    const body = text(c.body, { size: 18, color: T.ink2, maxW: inner, lh: 32, align: 'center' });
    const rec  = text(c.rec,  { size: 15, color: T.ink3, maxW: inner, lh: 26, align: 'center' });

    const top = 34;
    const headH = c.heading ? 28 : 0;
    const yLine = top + headH + 18;
    const yBody = yLine + Math.max(line.h, 48) + 18;
    const yRec  = yBody + (body.empty ? 0 : body.h + 18);
    const h = yRec + (rec.empty ? 0 : rec.h) + 26 + 34;

    return {
      h,
      zones: [
        textZone('heading', text(c.heading, { size: 13, lh: 22 }), PAD, top, { w: 200 }),
        textZone('line', line, PAD + 20, yLine, { w: inner, multiline: true }),
        textZone('body', body, PAD + 20, yBody, { w: inner, multiline: true }),
        textZone('rec',  rec,  PAD + 20, yRec,  { w: inner })
      ],
      paint(ctx) {
        ctx.fillStyle = T.panel;
        ctx.fillRect(0, 0, W, h);
        ctx.strokeStyle = T.accent2;
        ctx.lineWidth = 1;
        ctx.strokeRect(14.5, 14.5, W - 29, h - 29);

        if (c.heading) {
          font(ctx, 13, 700, T.sans);
          ctx.fillStyle = T.accent;
          spacedText(ctx, c.heading, PAD, top + 13, 3, 'center', CW);
        }
        line.paint(ctx, PAD + 20, yLine, { maxW: inner });
        if (!body.empty) body.paint(ctx, PAD + 20, yBody, { maxW: inner });
        if (!rec.empty)  rec.paint(ctx, PAD + 20, yRec, { maxW: inner });
        ornament(ctx, W / 2, h - 34 - 13, 220);
      }
    };
  }
};
