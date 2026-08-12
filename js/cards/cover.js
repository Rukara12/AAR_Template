import { T } from '../theme.js';
import { W, PAD, CW, text, spacedText, spacedWidth, font, ornament,
         imgOf, isReady, coverImage, placeholder } from '../canvas/layout.js';

export default {
  id: 'cover',
  name: '표지',
  desc: '회차 시작',
  group: '뼈대',
  accent: '#c8973f',

  create: () => ({
    label: 'CHAPTER 1',
    title: '',
    meta: '',
    img: null,
    dim: 0.6,
    h: 460
  }),

  fields: [
    { k: 'img',   t: 'image',    label: '배경 이미지' },
    { k: 'dim',   t: 'range',    label: '어둡게', min: 0, max: 0.9, step: 0.05 },
    { k: 'label', t: 'text',     label: '위 라벨', ph: 'CHAPTER 12' },
    { k: 'title', t: 'textarea', label: '제목',    ph: '겨울 성채', rows: 2 },
    { k: 'meta',  t: 'text',     label: '아래 메타', ph: '크루세이더 킹즈 3 · 47일차' },
    { k: 'h',     t: 'number',   label: '카드 높이', min: 200, max: 1200, step: 20 }
  ],

  label: c => c.title || '표지',

  build(c) {
    const h = Math.max(200, +c.h || 460);
    const title = text(c.title, { size: 46, weight: 800, maxW: CW, lh: 62, align: 'center' });
    const meta  = text(c.meta,  { size: 16, color: T.ink2, maxW: CW, lh: 26, align: 'center' });

    return {
      h,
      paint(ctx) {
        const im = imgOf(c.img);
        if (isReady(im)) {
          coverImage(ctx, im, 0, 0, W, h);
          ctx.fillStyle = `rgba(14,11,8,${c.dim})`;
          ctx.fillRect(0, 0, W, h);
        } else {
          ctx.fillStyle = T.panel;
          ctx.fillRect(0, 0, W, h);
          if (c.img === null) placeholder(ctx, PAD, h / 2 - 46, CW, 92, '배경 이미지 (선택)');
        }

        // 안쪽 금색 테두리
        ctx.strokeStyle = T.accent2;
        ctx.lineWidth = 1;
        ctx.strokeRect(18.5, 18.5, W - 37, h - 37);

        const blockH = 22 + 18 + title.h + 22 + (meta.empty ? 0 : meta.h + 8);
        let y = (h - blockH) / 2;

        if (c.label) {
          font(ctx, 14, 600, T.display);
          ctx.fillStyle = T.accent;
          spacedText(ctx, c.label, PAD, y + 14, 5, 'center', CW);
        }
        y += 22 + 18;

        title.paint(ctx, PAD, y, { color: T.ink });
        y += title.h + 8;

        ornament(ctx, W / 2, y + 8, 160);
        y += 22;

        if (!meta.empty) meta.paint(ctx, PAD, y);
      }
    };
  }
};
