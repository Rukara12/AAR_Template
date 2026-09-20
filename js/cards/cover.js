import { T } from '../theme.js';
import { W, FRAME, text, textZone, imageZone,
         imgOf, isReady, placeImage, placeholder } from '../canvas/layout.js';

/**
 * 스팀 상점 페이지에서 가져온 헤더 이미지를 얹는 표지.
 * 게임 제목을 적으면 왼쪽 위에 얹히고, 비우면 사진만 나옵니다.
 *
 * 스팀 캡슐 규격 (가로 ÷ 세로). 헤더는 920×430 으로 올리고 460×215 로 그려지는데,
 * 둘의 비율이 같아서 어느 쪽을 받아 오든 그대로 맞습니다.
 */
const CAPSULES = [
  ['2.1395', '헤더 · 920 × 430'],
  ['1.7450', '메인 캡슐 · 616 × 353'],
  ['3.0968', '와이드 히어로 · 3840 × 1240'],
  ['0.8348', '세로 캡슐 · 374 × 448'],
  ['0.6667', '라이브러리 · 600 × 900'],
  ['auto',   '원본 비율 그대로']
];

/**
 * 규격마다 스팀 CDN 파일이 여럿입니다. 큰 것부터 적어 두고 없으면 다음 것으로 내려갑니다.
 * (실제 해상도를 확인해 정리한 목록입니다)
 */
const SOURCES = {
  '2.1395': ['header_2x.jpg', 'header.jpg'],                     // 920×430 → 460×215
  '1.7450': ['capsule_616x353.jpg'],                             // 616×353
  '3.0968': ['library_hero_2x.jpg', 'library_hero.jpg'],         // 3840×1240 → 1920×620
  '0.8348': ['hero_capsule_2x.jpg', 'hero_capsule.jpg'],         // 374×448
  '0.6667': ['library_600x900_2x.jpg', 'library_600x900.jpg'],   // 600×900 → 300×450
  auto:     ['header_2x.jpg', 'header.jpg']
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, +v || 0));

export default {
  id: 'cover',
  name: '표지',
  desc: '스팀 헤더 이미지',
  group: '시작',
  accent: '#c8973f',

  create: () => ({
    img: null,
    imgTf: { s: 1, x: 0, y: 0 },
    title: '',
    steam: '',
    ratio: '2.1395',
    pad: FRAME,   // 카드 가장자리와 테두리 사이 (다른 이미지 카드와 같은 값)
    gap: 0,       // 테두리와 사진 사이 (액자처럼 띄우고 싶을 때)
    border: 1
  }),

  fields: [
    { k: 'steam', t: 'steam', label: '스팀 상점 주소',
      ph: 'store.steampowered.com/app/… 또는 앱 번호',
      target: 'img', tf: 'imgTf',
      sources: c => SOURCES[c.ratio] || SOURCES.auto,
      note: '아래 스팀 규격에서 고른 것을, 있는 것 중 가장 큰 파일로 받아옵니다. 게임 정보 카드가 있으면 그 항목도 같이 채웁니다.' },
    { k: 'img',   t: 'image', label: '헤더 이미지', tf: 'imgTf', ratioKey: 'ratio' },
    { k: 'title', t: 'text',  label: '게임 제목 (비우면 안 나옵니다)', ph: '게임 이름' },
    { k: '', t: 'fold', label: '자세한 설정', fields: [
      { k: 'ratio',  t: 'select', label: '스팀 규격', opts: CAPSULES },
      { k: 'pad',    t: 'number', label: '바깥 여백', min: 0, max: 100, step: 2 },
      { k: 'gap',    t: 'number', label: '테두리 안쪽 여백', min: 0, max: 60, step: 2 },
      { k: 'border', t: 'number', label: '테두리 두께 (0이면 없음)', min: 0, max: 6, step: 1 },
      { k: '', t: 'note', text: '헤더는 원본이 920px 라 2배 이상으로 내보내면 늘어나 조금 물러집니다. 또렷하게 뽑고 싶으면 와이드 히어로(3840×1240)를 쓰세요.' }
    ] }
  ],

  label: c => c.title || '표지',

  /** 사진이 들어갈 상자의 가로세로 비율 */
  boxRatio(c) {
    const n = parseFloat(c.ratio);
    if (Number.isFinite(n) && n > 0) return n;
    const im = imgOf(c.img);
    return isReady(im) ? im.naturalWidth / im.naturalHeight : 2.1395;
  },

  build(c) {
    const pad = clamp(c.pad ?? FRAME, 0, 100);
    const bw  = Math.round(clamp(c.border ?? 1, 0, 6));
    const gap = clamp(c.gap ?? 0, 0, 60);

    const inner = bw + gap;
    const frameW = Math.max(60, W - pad * 2);
    const imgW = Math.max(40, frameW - inner * 2);
    const imgH = Math.max(40, Math.round(imgW / this.boxRatio(c)));
    const frameH = imgH + inner * 2;

    // 제목은 카드 왼쪽 위. 비어 있으면 자리를 차지하지 않습니다.
    const title = text(c.title, { size: 40, weight: 800, maxW: frameW, lh: 52 });
    const titleH = title.empty ? 0 : title.h + 18;

    const h = pad + titleH + frameH + pad;
    const fx = pad, fy = pad + titleH;
    const ix = fx + inner, iy = fy + inner;

    return {
      h,
      zones: [
        textZone('title', title, pad, pad, { w: frameW }),
        imageZone('img', 'imgTf', ix, iy, imgW, imgH)
      ],
      paint(ctx) {
        ctx.fillStyle = T.bg;
        ctx.fillRect(0, 0, W, h);

        if (!title.empty) title.paint(ctx, pad, pad);

        // 테두리 안쪽 여백이 있으면 그 자리를 옅은 바탕으로 채웁니다.
        if (gap > 0) {
          ctx.fillStyle = T.panel;
          ctx.fillRect(fx, fy, frameW, frameH);
        }

        const im = imgOf(c.img);
        if (isReady(im)) placeImage(ctx, im, ix, iy, imgW, imgH, c.imgTf);
        else placeholder(ctx, ix, iy, imgW, imgH, '눌러서 스팀 헤더 이미지 넣기');

        if (bw > 0) {
          ctx.strokeStyle = T.accent2;
          ctx.lineWidth = bw;
          ctx.strokeRect(fx + bw / 2, fy + bw / 2, frameW - bw, frameH - bw);
        }
      }
    };
  }
};
