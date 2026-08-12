import { T } from '../theme.js';
import { W, PAD, CW, imageZone, imgOf, isReady, placeImage, placeholder } from '../canvas/layout.js';
import { RATIO_OPTS, ratioOf } from './ratios.js';

export default {
  id: 'image',
  name: '이미지',
  desc: '스샷만',
  group: '이미지',
  accent: '#8fb254',

  create: () => ({ img: null, imgTf: { s: 1, x: 0, y: 0 }, ratio: 'auto', mode: 'bleed' }),

  fields: [
    { k: 'img',   t: 'image',  label: '이미지', tf: 'imgTf', ratioKey: 'ratio' },
    { k: 'ratio', t: 'select', label: '자를 비율', opts: RATIO_OPTS },
    { k: 'mode',  t: 'select', label: '배치',
      opts: [['bleed', '가장자리까지 꽉 채우기'], ['inset', '여백 두고 테두리']] }
  ],

  label: () => '이미지',

  boxRatio(c) {
    const im = imgOf(c.img);
    const natural = isReady(im) ? im.naturalWidth / im.naturalHeight : 16 / 9;
    return ratioOf(c.ratio, natural);
  },

  build(c) {
    const im = imgOf(c.img);
    const inset = c.mode === 'inset';
    const boxW = inset ? CW : W;
    const imgH = Math.round(boxW / this.boxRatio(c));
    const h = imgH + (inset ? PAD * 2 : 0);
    const ix = inset ? PAD : 0, iy = inset ? PAD : 0;

    return {
      h,
      zones: [imageZone('img', 'imgTf', ix, iy, boxW, imgH)],
      paint(ctx) {
        ctx.fillStyle = inset ? T.bg : '#000';
        ctx.fillRect(0, 0, W, h);
        const x = inset ? PAD : 0;
        const y = inset ? PAD : 0;
        if (isReady(im)) placeImage(ctx, im, x, y, boxW, imgH, c.imgTf);
        else placeholder(ctx, x, y, boxW, imgH, '이미지를 끌어다 놓으세요');
        if (inset) {
          ctx.strokeStyle = T.accent2;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, boxW - 1, imgH - 1);
        }
      }
    };
  }
};
