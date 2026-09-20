import { T } from '../theme.js';
import { W, PAD, CW, FRAME, FW, text, textZone, imageZone,
         imgOf, isReady, placeImage, placeholder, imageEdge } from '../canvas/layout.js';
import { RATIO_OPTS, ratioOf } from './ratios.js';

const SLOTS = [1, 2, 3, 4, 5, 6];
const GAP = 10;

const blankTf = () => ({ s: 1, x: 0, y: 0 });

export default {
  id: 'grid',
  name: '스샷 묶음',
  desc: '여러 장 격자로',
  group: '본문',
  accent: '#8fb254',

  create: () => {
    const o = { cols: '2', ratio: '1.7778', caption: '' };
    for (const i of SLOTS) { o[`img${i}`] = null; o[`tf${i}`] = blankTf(); }
    return o;
  },

  fields: [
    { k: 'cols',  t: 'select', label: '한 줄에', opts: [['2', '2장'], ['3', '3장']] },
    { k: 'ratio', t: 'select', label: '자를 비율', opts: RATIO_OPTS.filter(o => o[0] !== 'auto') },
    ...SLOTS.map(i => ({ k: `img${i}`, t: 'image', label: `${i}번 이미지`, tf: `tf${i}`, ratioKey: 'ratio' })),
    { k: 'caption', t: 'textarea', label: '자막', rows: 2, ph: '분위기 하나는 진짜 잘 뽑았다' }
  ],

  label: c => `스샷 ${SLOTS.filter(i => c[`img${i}`]).length}장`,

  /** 칸 하나의 가로세로 비율 (조절 상자가 이 값을 씁니다) */
  boxRatio(c) { return ratioOf(c.ratio, 16 / 9); },

  build(c) {
    const used = SLOTS.filter(i => c[`img${i}`]);
    const list = used.length ? used : [1, 2];        // 아직 비었으면 자리만 두 칸 보여 줍니다
    const cols = Math.max(2, Math.min(3, +c.cols || 2));
    const cellW = Math.floor((FW - GAP * (cols - 1)) / cols);
    const cellH = Math.round(cellW / this.boxRatio(c));
    const rows = Math.ceil(list.length / cols);

    const cap = text(c.caption, { size: 18, color: T.ink2, maxW: CW, lh: 30, align: 'center' });
    const gridH = rows * cellH + (rows - 1) * GAP;
    const h = FRAME + gridH + (cap.empty ? 0 : cap.h + 20) + FRAME;

    const posOf = k => ({
      x: FRAME + (k % cols) * (cellW + GAP),
      y: FRAME + Math.floor(k / cols) * (cellH + GAP)
    });

    return {
      h,
      zones: [
        ...list.map((slot, k) => {
          const p = posOf(k);
          return imageZone(`img${slot}`, `tf${slot}`, p.x, p.y, cellW, cellH);
        }),
        textZone('caption', cap, PAD, FRAME + gridH + 16, { multiline: true })
      ],
      paint(ctx) {
        ctx.fillStyle = T.bg;
        ctx.fillRect(0, 0, W, h);

        list.forEach((slot, k) => {
          const p = posOf(k);
          const im = imgOf(c[`img${slot}`]);
          ctx.fillStyle = '#000';
          ctx.fillRect(p.x, p.y, cellW, cellH);
          if (isReady(im)) placeImage(ctx, im, p.x, p.y, cellW, cellH, c[`tf${slot}`]);
          else placeholder(ctx, p.x, p.y, cellW, cellH, `${slot}번`);
          imageEdge(ctx, p.x, p.y, cellW, cellH);
        });

        if (!cap.empty) cap.paint(ctx, PAD, FRAME + gridH + 16);
      }
    };
  }
};
