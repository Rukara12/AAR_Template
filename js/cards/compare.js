import { T } from '../theme.js';
import { W, PAD, text, textZone, imageZone, imgOf, isReady,
         ratioOf as sizeRatio, placeImage, placeholder } from '../canvas/layout.js';
import { RATIO_OPTS, ratioOf } from './ratios.js';

const GAP = 14;

export default {
  id: 'compare',
  name: '좌우 비교',
  desc: '전 / 후 2장',
  group: '이미지',
  accent: '#8fb254',

  create: () => ({
    heading: '',
    imgA: null, tfA: { s: 1, x: 0, y: 0 }, capA: '전',
    imgB: null, tfB: { s: 1, x: 0, y: 0 }, capB: '후',
    ratio: 'auto'
  }),

  fields: [
    { k: 'heading', t: 'text',  label: '소제목 (비워도 됨)', ph: '옵션 최저 / 최고' },
    { k: 'imgA',    t: 'image', label: '왼쪽 이미지', tf: 'tfA', ratioKey: 'ratio' },
    { k: 'capA',    t: 'text',  label: '왼쪽 설명', ph: '전' },
    { k: 'imgB',    t: 'image', label: '오른쪽 이미지', tf: 'tfB', ratioKey: 'ratio' },
    { k: 'capB',    t: 'text',  label: '오른쪽 설명', ph: '후' },
    { k: 'ratio',   t: 'select', label: '두 상자의 비율', opts: RATIO_OPTS },
    { k: '', t: 'note', text: '두 이미지를 같은 상자에 맞춰 자릅니다. 미리보기에서 각각 끌어 위치를 맞추면 비교가 훨씬 잘 보입니다.' }
  ],

  label: c => c.heading || `${c.capA || '전'} / ${c.capB || '후'}`,

  boxRatio(c) {
    const a = imgOf(c.imgA), b = imgOf(c.imgB);
    const natural = 1 / Math.max(sizeRatio(a), sizeRatio(b));   // 둘 중 더 세로로 긴 쪽 기준
    return ratioOf(c.ratio, natural);
  },

  build(c) {
    const halfW = Math.floor((W - PAD * 2 - GAP) / 2);
    const boxH = Math.round(halfW / this.boxRatio(c));
    const imA = imgOf(c.imgA), imB = imgOf(c.imgB);

    const head = text(c.heading, { size: 21, weight: 700, color: T.accent, lh: 32, align: 'center' });
    const capA = text(c.capA, { size: 15, color: T.ink2, maxW: halfW, lh: 24, align: 'center' });
    const capB = text(c.capB, { size: 15, color: T.ink2, maxW: halfW, lh: 24, align: 'center' });
    const capH = Math.max(capA.h, capB.h);

    const top = 30;
    const headH = head.empty ? 0 : head.h + 16;
    const y = top + headH;                 // 이미지 상자 윗변
    const xB = PAD + halfW + GAP;
    const h = y + boxH + (capH ? capH + 10 : 0) + 30;

    return {
      h,
      zones: [
        textZone('heading', head, PAD, top, { w: W - PAD * 2 }),
        imageZone('imgA', 'tfA', PAD, y, halfW, boxH),
        imageZone('imgB', 'tfB', xB, y, halfW, boxH),
        textZone('capA', capA, PAD, y + boxH + 10, { w: halfW }),
        textZone('capB', capB, xB,  y + boxH + 10, { w: halfW })
      ],
      paint(ctx) {
        ctx.fillStyle = T.bg;
        ctx.fillRect(0, 0, W, h);
        if (!head.empty) head.paint(ctx, PAD, top, { maxW: W - PAD * 2 });

        const draw = (im, tf, x, ph) => {
          ctx.fillStyle = '#000';
          ctx.fillRect(x, y, halfW, boxH);
          if (isReady(im)) placeImage(ctx, im, x, y, halfW, boxH, tf);
          else placeholder(ctx, x, y, halfW, boxH, ph);
          ctx.strokeStyle = T.line;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, halfW - 1, boxH - 1);
        };
        draw(imA, c.tfA, PAD, '왼쪽');
        draw(imB, c.tfB, xB, '오른쪽');

        if (capH) {
          capA.paint(ctx, PAD, y + boxH + 10);
          capB.paint(ctx, xB, y + boxH + 10);
        }
      }
    };
  }
};
