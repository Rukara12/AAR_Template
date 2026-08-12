import { T } from '../theme.js';
import { W, PAD, CW, imgOf, isReady, ratioOf, placeholder } from '../canvas/layout.js';

export default {
  id: 'image',
  name: '이미지',
  desc: '스샷만',
  group: '이미지',
  accent: '#8fb254',

  create: () => ({ img: null, mode: 'bleed' }),

  fields: [
    { k: 'img',  t: 'image',  label: '이미지' },
    { k: 'mode', t: 'select', label: '배치',
      opts: [['bleed', '가장자리까지 꽉 채우기'], ['inset', '여백 두고 테두리']] }
  ],

  label: () => '이미지',

  build(c) {
    const im = imgOf(c.img);
    const inset = c.mode === 'inset';
    const boxW = inset ? CW : W;
    const imgH = Math.round(boxW * ratioOf(im));
    const h = imgH + (inset ? PAD * 2 : 0);

    return {
      h,
      paint(ctx) {
        ctx.fillStyle = inset ? T.bg : '#000';
        ctx.fillRect(0, 0, W, h);
        const x = inset ? PAD : 0;
        const y = inset ? PAD : 0;
        if (isReady(im)) ctx.drawImage(im, x, y, boxW, imgH);
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
