import { T } from '../theme.js';
import { W, PAD, CW, FRAME, FW, text, textZone, imageZone,
         imgOf, isReady, placeImage, placeholder, imageEdge } from '../canvas/layout.js';
import { RATIO_OPTS, ratioOf } from './ratios.js';

export default {
  id: 'shot',
  name: '자막 스샷',
  desc: '스샷 + 자막',
  group: '본문',
  accent: '#8fb254',

  create: () => ({
    img: null, imgTf: { s: 1, x: 0, y: 0 }, ratio: 'auto',
    caption: '', capPos: 'below', align: 'center'
  }),

  fields: [
    { k: 'img', t: 'image', label: '스크린샷', tf: 'imgTf', ratioKey: 'ratio' },
    { k: 'ratio', t: 'select', label: '자를 비율', opts: RATIO_OPTS },
    { k: 'caption', t: 'textarea', label: '자막', rows: 3, ph: '초반 튜토리얼 구간' },
    { k: 'capPos',  t: 'select',   label: '자막 위치', opts: [['below', '사진 아래'], ['over', '사진 위에 겹치기']] },
    { k: 'align',   t: 'select',   label: '자막 정렬', opts: [['center', '가운데'], ['left', '왼쪽']] }
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
    const imgH = Math.round(FW / this.boxRatio(c));
    const over = c.capPos === 'over';

    const capW = over ? FW - 32 : CW;
    const cap = text(c.caption, { size: 20, maxW: capW, lh: 34, align: c.align });
    const capH = cap.empty ? 0 : cap.h;

    // 사진은 카드 가장자리에서 FRAME 만큼 떨어뜨립니다. 모든 이미지 카드가 같은 값을 씁니다.
    const h = FRAME + imgH + (over || cap.empty ? 0 : capH + 22) + FRAME;

    const yCap = over
      ? FRAME + imgH - capH - 20
      : FRAME + imgH + 18;
    const xCap = over ? FRAME + 16 : PAD;

    return {
      h,
      zones: [
        imageZone('img', 'imgTf', FRAME, FRAME, FW, imgH),
        textZone('caption', cap, xCap, yCap, { w: capW, multiline: true })
      ],
      paint(ctx) {
        ctx.fillStyle = T.bg;
        ctx.fillRect(0, 0, W, h);

        if (isReady(im)) placeImage(ctx, im, FRAME, FRAME, FW, imgH, c.imgTf);
        else placeholder(ctx, FRAME, FRAME, FW, imgH, '스크린샷을 끌어다 놓으세요');

        if (over && !cap.empty) {
          // 겹친 자막이 읽히도록 사진 아래쪽만 어둡게 깔아 줍니다.
          const top = yCap - 26;
          ctx.save();
          ctx.beginPath();
          ctx.rect(FRAME, FRAME, FW, imgH);
          ctx.clip();
          const g = ctx.createLinearGradient(0, top - 30, 0, FRAME + imgH);
          g.addColorStop(0, 'rgba(0,0,0,0)');
          g.addColorStop(1, 'rgba(0,0,0,0.86)');
          ctx.fillStyle = g;
          ctx.fillRect(FRAME, top - 30, FW, FRAME + imgH - top + 30);
          ctx.shadowColor = 'rgba(0,0,0,.9)';
          ctx.shadowBlur = 6;
          cap.paint(ctx, xCap, yCap, { color: '#fff', maxW: capW });
          ctx.restore();
        }

        imageEdge(ctx, FRAME, FRAME, FW, imgH);

        if (!over && !cap.empty) cap.paint(ctx, xCap, yCap, { maxW: capW });
      }
    };
  }
};
