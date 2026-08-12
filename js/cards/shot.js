import { T } from '../theme.js';
import { W, PAD, CW, text, imgOf, isReady, ratioOf, placeholder } from '../canvas/layout.js';

export default {
  id: 'shot',
  name: '자막 스샷',
  desc: '스샷 + 자막',
  group: '이미지',
  accent: '#8fb254',

  create: () => ({ img: null, caption: '', capPos: 'below', align: 'center' }),

  fields: [
    { k: 'img',     t: 'image',    label: '스크린샷' },
    { k: 'caption', t: 'textarea', label: '자막', rows: 3, ph: '척후병이 돌아왔다.' },
    { k: 'capPos',  t: 'select',   label: '자막 위치', opts: [['below', '이미지 아래'], ['over', '이미지 위에 겹치기']] },
    { k: 'align',   t: 'select',   label: '자막 정렬', opts: [['center', '가운데'], ['left', '왼쪽']] },
    { k: '',        t: 'note',     text: '이미지는 가로 850px 에 맞춰 자동으로 줄어듭니다. 원본이 850px 보다 크면 그대로 넣어도 됩니다.' }
  ],

  label: c => c.caption?.split('\n')[0] || '자막 스샷',

  build(c) {
    const im = imgOf(c.img);
    const imgH = Math.round(W * ratioOf(im));
    const cap = text(c.caption, { size: 20, maxW: CW, lh: 34, align: c.align });
    const over = c.capPos === 'over';
    const capBoxH = cap.empty ? 0 : cap.h + 30;
    const h = imgH + (over ? 0 : capBoxH);

    return {
      h,
      paint(ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, h);

        if (isReady(im)) ctx.drawImage(im, 0, 0, W, imgH);
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
