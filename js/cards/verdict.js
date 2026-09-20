import { T } from '../theme.js';
import { W, PAD, CW, text, font, spacedText, ornament, textZone } from '../canvas/layout.js';

export default {
  id: 'verdict',
  name: '총평',
  desc: '리뷰 마무리',
  group: '평가',
  accent: '#d99a3a',

  create: () => ({ heading: '총평', line: '', body: '' }),

  fields: [
    { k: 'heading', t: 'text',     label: '소제목', ph: '총평' },
    { k: 'line',    t: 'textarea', label: '한 줄 평', rows: 2, ph: '세일하면 무조건 사라' },
    { k: 'body',    t: 'textarea', label: '본문', rows: 5, ph: '단점 없는 게임은 아니다. 근데 그거 다 감수할 만큼 좋은 구간이 확실히 있다.' }
  ],

  label: c => c.line || c.heading || '총평',

  build(c) {
    const inner = CW - 40;

    // 소제목은 다른 카드와 같은 모양으로 왼쪽 위에 둡니다.
    const HEAD_SIZE = 14;
    const head = text(c.heading, { size: HEAD_SIZE, lh: 24 });

    const line = text(c.line, { size: 32, weight: 800, color: T.accent, maxW: inner, lh: 46, align: 'center' });
    const body = text(c.body, { size: 18, color: T.ink2, maxW: inner, lh: 32, align: 'center' });

    const top = 30;
    const headH = head.empty ? 0 : 24;

    // 자리를 위에서 아래로 한 번에 정해 두고, 그리기와 편집 영역이 같은 값을 씁니다.
    const yLine = top + headH + (headH ? 24 : 0);
    const lineH = Math.max(line.h, line.step);
    const yBody = yLine + lineH + 18;
    const bodyH = body.empty ? 0 : body.h;
    const yOrn  = yBody + bodyH + (body.empty ? 6 : 26);
    const h = yOrn + 30;

    return {
      h,
      zones: [
        textZone('heading', head, PAD, top, { w: 260 }),
        textZone('line', line, PAD + 20, yLine, { w: inner, multiline: true }),
        textZone('body', body, PAD + 20, yBody, { w: inner, multiline: true })
      ],
      paint(ctx) {
        ctx.fillStyle = T.panel;
        ctx.fillRect(0, 0, W, h);

        if (!head.empty) {
          font(ctx, HEAD_SIZE, 700, T.sans);
          ctx.fillStyle = T.accent;
          spacedText(ctx, c.heading, PAD, top + 17, 3, 'left', CW);
        }

        line.paint(ctx, PAD + 20, yLine, { maxW: inner });
        if (!body.empty) body.paint(ctx, PAD + 20, yBody, { maxW: inner });

        ornament(ctx, W / 2, yOrn, 200);
      }
    };
  }
};
