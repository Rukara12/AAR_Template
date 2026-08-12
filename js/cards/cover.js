import { T } from '../theme.js';
import { W, PAD, CW, text, spacedText, font, ornament, textZone, imageZone,
         imgOf, isReady, placeImage, placeholder } from '../canvas/layout.js';

export default {
  id: 'cover',
  name: '표지',
  desc: '첫 장',
  group: '뼈대',
  accent: '#c8973f',

  create: () => ({
    label: 'REVIEW',
    title: '',
    meta: '',
    img: null,
    imgTf: { s: 1, x: 0, y: 0 },
    dim: 0.6,
    h: 460
  }),

  fields: [
    { k: 'img',   t: 'image',    label: '배경 이미지', tf: 'imgTf', aspect: c => W / Math.max(200, +c.h || 460) },
    { k: 'dim',   t: 'range',    label: '어둡게', min: 0, max: 0.9, step: 0.05 },
    { k: 'label', t: 'text',     label: '위 라벨', ph: 'REVIEW' },
    { k: 'title', t: 'textarea', label: '제목',    ph: '게임 이름', rows: 2 },
    { k: 'meta',  t: 'text',     label: '아래 메타', ph: 'PC · 액션 로그라이크 · 20시간 플레이' },
    { k: 'h',     t: 'number',   label: '카드 높이', min: 200, max: 1200, step: 20 }
  ],

  label: c => c.title || '표지',

  build(c) {
    const h = Math.max(200, +c.h || 460);
    const title = text(c.title, { size: 46, weight: 800, maxW: CW, lh: 62, align: 'center' });
    const meta  = text(c.meta,  { size: 16, color: T.ink2, maxW: CW, lh: 26, align: 'center' });

    // 가운데 정렬이라 위치를 먼저 정해 두고, 그리기와 편집 영역이 같은 값을 씁니다.
    const blockH = 40 + Math.max(title.h, 62) + 22 + (meta.empty ? 0 : meta.h + 8);
    const top = (h - blockH) / 2;
    const yLabel = top;
    const yTitle = top + 40;
    const yOrn   = yTitle + Math.max(title.h, 62) + 8;
    const yMeta  = yOrn + 22;

    return {
      h,
      zones: [
        imageZone('img', 'imgTf', 0, 0, W, h),
        textZone('label', text(c.label, { size: 14, maxW: CW, lh: 22, align: 'center' }), PAD, yLabel),
        textZone('title', title, PAD, yTitle),
        textZone('meta',  meta,  PAD, yMeta)
      ],
      paint(ctx) {
        const im = imgOf(c.img);
        if (isReady(im)) {
          placeImage(ctx, im, 0, 0, W, h, c.imgTf);
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

        if (c.label) {
          font(ctx, 14, 600, T.display);
          ctx.fillStyle = T.accent;
          spacedText(ctx, c.label, PAD, yLabel + 22, 5, 'center', CW);
        }
        title.paint(ctx, PAD, yTitle, { color: T.ink });
        ornament(ctx, W / 2, yOrn + 8, 160);
        if (!meta.empty) meta.paint(ctx, PAD, yMeta);
      }
    };
  }
};
