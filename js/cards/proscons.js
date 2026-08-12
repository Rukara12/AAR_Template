import { T } from '../theme.js';
import { W, PAD, CW, text, font, textZone } from '../canvas/layout.js';

const GAP = 18;

export default {
  id: 'proscons',
  name: '장단점',
  desc: '좋은 점 / 아쉬운 점',
  group: '정보',
  accent: '#d99a3a',

  create: () => ({
    goodTitle: '좋은 점',
    goods: ['', ''],
    badTitle: '아쉬운 점',
    bads: ['', '']
  }),

  fields: [
    { k: 'goodTitle', t: 'text',    label: '왼쪽 제목', ph: '좋은 점' },
    { k: 'goods',     t: 'strlist', label: '좋은 점', ph: '전투가 손에 착 붙는다', add: '항목 추가' },
    { k: 'badTitle',  t: 'text',    label: '오른쪽 제목', ph: '아쉬운 점' },
    { k: 'bads',      t: 'strlist', label: '아쉬운 점', ph: '후반부 반복 구간이 길다', add: '항목 추가' },
    { k: '', t: 'note', text: '항목은 미리보기에서 눌러 바로 고칠 수 있습니다. 개수를 늘리려면 여기서 추가하세요.' }
  ],

  label: c => `${(c.goods || []).filter(Boolean).length}장점 / ${(c.bads || []).filter(Boolean).length}단점`,

  build(c) {
    const halfW = Math.floor((CW - GAP) / 2);
    const itemW = halfW - 26;
    const goods = (c.goods || []).filter(Boolean);
    const bads  = (c.bads  || []).filter(Boolean);

    const gT = goods.map(s => text(s, { size: 17, maxW: itemW, lh: 27 }));
    const bT = bads.map(s => text(s, { size: 17, maxW: itemW, lh: 27 }));

    const stack = list => list.reduce((a, t) => a + t.h + 14, 0);
    const top = 32;
    const yList = top + 34;
    const colH = Math.max(stack(gT), stack(bT), 40);
    const h = yList + colH + 30;

    const xR = PAD + halfW + GAP;
    const yOf = (list, i) => yList + list.slice(0, i).reduce((a, t) => a + t.h + 14, 0);

    return {
      h,
      zones: [
        textZone('goodTitle', text(c.goodTitle, { size: 15, lh: 24 }), PAD + 24, top, { w: itemW }),
        textZone('badTitle',  text(c.badTitle,  { size: 15, lh: 24 }), xR + 24,  top, { w: itemW }),
        ...gT.map((t, i) => textZone('goods', t, PAD + 26, yOf(gT, i), { w: itemW, index: i })),
        ...bT.map((t, i) => textZone('bads',  t, xR + 26,  yOf(bT, i), { w: itemW, index: i }))
      ],
      paint(ctx) {
        ctx.fillStyle = T.panel;
        ctx.fillRect(0, 0, W, h);

        const col = (title, list, tArr, x, color, mark) => {
          ctx.fillStyle = color;
          ctx.fillRect(x, top, 3, 22);
          font(ctx, 15, 700, T.sans);
          ctx.fillStyle = color;
          ctx.fillText(title || '', x + 12, top + 17);

          tArr.forEach((t, i) => {
            const y = yOf(tArr, i);
            font(ctx, 17, 700, T.serif);
            ctx.fillStyle = color;
            ctx.fillText(mark, x + 2, y + 20);
            t.paint(ctx, x + 26, y);
          });
          if (!tArr.length) {
            font(ctx, 15, 400, T.serif);
            ctx.fillStyle = T.ink3;
            ctx.fillText('항목을 추가하세요', x + 26, yList + 20);
          }
        };

        col(c.goodTitle, c.goods, gT, PAD, T.ok, '+');
        col(c.badTitle,  c.bads,  bT, xR,  T.bad, '−');

        ctx.strokeStyle = T.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.round(PAD + halfW + GAP / 2) + 0.5, top);
        ctx.lineTo(Math.round(PAD + halfW + GAP / 2) + 0.5, h - 30);
        ctx.stroke();
      }
    };
  }
};
