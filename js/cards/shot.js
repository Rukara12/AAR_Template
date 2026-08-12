import { T } from '../theme.js';
import { W, PAD, CW, text, textZone, imageZone, imgOf, isReady, placeImage, placeholder } from '../canvas/layout.js';
import { RATIO_OPTS, ratioOf } from './ratios.js';

export default {
  id: 'shot',
  name: '자막 스샷',
  desc: '스샷 + 자막',
  group: '이미지',
  accent: '#8fb254',

  create: () => ({
    img: null, imgTf: { s: 1, x: 0, y: 0 }, ratio: 'auto',
    caption: '', capPos: 'below', align: 'center'
  }),

  fields: [
    { k: 'img', t: 'image', label: '스크린샷', tf: 'imgTf', ratioKey: 'ratio' },
    { k: 'ratio', t: 'select', label: '자를 비율', opts: RATIO_OPTS },
    { k: 'caption', t: 'textarea', label: '자막', rows: 3, ph: '여기서부터 진짜 재밌어진다' },
    { k: 'capPos',  t: 'select',   label: '자막 위치', opts: [['below', '이미지 아래'], ['over', '이미지 위에 겹치기']] },
    { k: 'align',   t: 'select',   label: '자막 정렬', opts: [['center', '가운데'], ['left', '왼쪽']] },
    { k: '', t: 'note', text: '가운데 미리보기에서 바로 끌어 옮기고 Alt+휠로 확대할 수 있습니다. 자막도 눌러서 그 자리에서 고칩니다.' }
  ],

  label: c => c.caption?.split('\n')[0] || '자막 스샷',

  /** 이 카드가 이미지를 그리는 상자의 가로세로 비율 */
  boxRatio(c) {
    const im = imgOf(c.img);
    const natural = isReady(im) ? im.naturalWidth / im.naturalHeight : 16 / 9;
    return ratioOf(c.ratio, natural);
  },

  build(c) {
    const im = imgOf(c.img);
    const imgH = Math.round(W / this.boxRatio(c));
    const cap = text(c.caption, { size: 20, maxW: CW, lh: 34, align: c.align });
    const over = c.capPos === 'over';
    const capBoxH = cap.empty ? 0 : cap.h + 30;
    const h = imgH + (over ? 0 : capBoxH);
    const yCap = over ? imgH - Math.max(capBoxH, 50) + 15 : imgH + 15;

    return {
      h,
      zones: [
        imageZone('img', 'imgTf', 0, 0, W, imgH),
        textZone('caption', cap, PAD, yCap, { multiline: true, bg: over ? 'rgba(0,0,0,.86)' : T.bg })
      ],
      paint(ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, h);

        if (isReady(im)) placeImage(ctx, im, 0, 0, W, imgH, c.imgTf);
        else placeholder(ctx, 0, 0, W, imgH, '스크린샷을 끌어다 놓으세요');

        if (cap.empty) return;

        if (over) {
          const y = imgH - capBoxH;
          const g = ctx.createLinearGradient(0, y - 40, 0, imgH);
          g.addColorStop(0, 'rgba(0,0,0,0)');
          g.addColorStop(1, 'rgba(0,0,0,0.86)');
          ctx.fillStyle = g;
          ctx.fillRect(0, y - 40, W, capBoxH + 40);
          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,.9)';
          ctx.shadowBlur = 6;
          cap.paint(ctx, PAD, y + 15, { color: '#fff' });
          ctx.restore();
        } else {
          ctx.fillStyle = T.bg;
          ctx.fillRect(0, imgH, W, capBoxH);
          cap.paint(ctx, PAD, imgH + 15);
        }
      }
    };
  }
};
