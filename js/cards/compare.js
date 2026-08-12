import { T } from '../theme.js';
import { W, PAD, text, imgOf, isReady, ratioOf, containImage, placeholder } from '../canvas/layout.js';

const GAP = 14;

export default {
  id: 'compare',
  name: '좌우 비교',
  desc: '전 / 후 2장',
  group: '이미지',
  accent: '#8fb254',

  create: () => ({ imgA: null, imgB: null, capA: '전', capB: '후', heading: '' }),

  fields: [
    { k: 'heading', t: 'text',  label: '소제목 (비워도 됨)', ph: '성벽 보수 결과' },
    { k: 'imgA',    t: 'image', label: '왼쪽 이미지' },
    { k: 'capA',    t: 'text',  label: '왼쪽 설명', ph: '전' },
    { k: 'imgB',    t: 'image', label: '오른쪽 이미지' },
    { k: 'capB',    t: 'text',  label: '오른쪽 설명', ph: '후' }
  ],

  label: c => c.heading || `${c.capA || '전'} / ${c.capB || '후'}`,

  build(c) {
    const halfW = Math.floor((W - PAD * 2 - GAP) / 2);
    const imA = imgOf(c.imgA), imB = imgOf(c.imgB);
    const boxH = Math.round(halfW * Math.max(ratioOf(imA), ratioOf(imB)));

    const head = text(c.heading, { size: 21, weight: 700, color: T.accent, lh: 32, align: 'center' });
    const capA = text(c.capA, { size: 15, color: T.ink2, maxW: halfW, lh: 24, align: 'center' });
    const capB = text(c.capB, { size: 15, color: T.ink2, maxW: halfW, lh: 24, align: 'center' });
    const capH = Math.max(capA.h, capB.h);

    const top = 30;
    const headH = head.empty ? 0 : head.h + 16;
    const h = top + headH + boxH + (capH ? capH + 10 : 0) + 30;

    return {
      h,
      paint(ctx) {
        ctx.fillStyle = T.bg;
        ctx.fillRect(0, 0, W, h);
        let y = top;
        if (!head.empty) { head.paint(ctx, PAD, y, { maxW: W - PAD * 2 }); y += head.h + 16; }

        const draw = (im, x, ph) => {
          ctx.fillStyle = '#000';
          ctx.fillRect(x, y, halfW, boxH);
          if (isReady(im)) containImage(ctx, im, x, y, halfW, boxH);
          else placeholder(ctx, x, y, halfW, boxH, ph);
          ctx.strokeStyle = T.line;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, halfW - 1, boxH - 1);
        };
        draw(imA, PAD, '왼쪽');
        draw(imB, PAD + halfW + GAP, '오른쪽');

        if (capH) {
          capA.paint(ctx, PAD, y + boxH + 10);
          capB.paint(ctx, PAD + halfW + GAP, y + boxH + 10);
        }
      }
    };
  }
};
