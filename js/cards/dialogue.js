import { T } from '../theme.js';
import { W, PAD, text, textZone, imageZone, imgOf, isReady, placeImage, placeholder } from '../canvas/layout.js';

const PW = 128;   // 초상화 폭
const PH = 156;   // 초상화 높이
const GAP = 20;

export default {
  id: 'dialogue',
  name: '캐릭터 대사',
  desc: '캐릭터 + 대사',
  group: '캐릭터',
  accent: '#7fa6d0',

  create: () => ({
    portrait: null, portraitTf: { s: 1, x: 0, y: 0 },
    name: '', role: '', body: '', side: 'left', quoted: true
  }),

  fields: [
    { k: 'portrait', t: 'image', label: '캐릭터 이미지',
      tf: 'portraitTf', aspect: PW / PH },
    { k: 'name',     t: 'text',     label: '이름', ph: '캐릭터 이름' },
    { k: 'role',     t: 'text',     label: '직함 · 설명', ph: '주인공' },
    { k: 'body',     t: 'textarea', label: '대사', rows: 5, ph: '이 대사 하나 때문에 캐릭터가 좋아졌다' },
    { k: 'side',     t: 'select',   label: '이미지 위치', opts: [['left', '왼쪽'], ['right', '오른쪽']] },
    { k: 'quoted',   t: 'toggle',   label: '「 」 낫표 자동으로 붙이기' }
  ],

  label: c => c.name ? `${c.name} — ${(c.body || '').split('\n')[0]}` : '캐릭터 대사',

  build(c) {
    const textW = W - PAD * 2 - PW - GAP;
    const body = c.quoted && c.body ? `「${c.body}」` : c.body;

    const nameT = text(c.name, { size: 21, weight: 700, color: T.accent, maxW: textW, lh: 30 });
    const roleT = text(c.role, { size: 14, color: T.ink3, maxW: textW, lh: 22 });
    const bodyT = text(body,   { size: 20, maxW: textW, lh: 36 });

    const headH = (nameT.empty ? 0 : nameT.h) + (roleT.empty ? 0 : roleT.h + 2);
    const textH = headH + (headH ? 12 : 0) + bodyT.h;
    const h = 30 + Math.max(PH, textH) + 30;

    const right = c.side === 'right';
    const px = right ? W - PAD - PW : PAD;
    const tx = right ? PAD : PAD + PW + GAP;
    const py = 30;

    const yName = 30 + Math.max(0, (Math.max(PH, textH) - textH) / 2);
    const yRole = yName + (nameT.empty ? 0 : nameT.h) + 2;
    const yBody = yName + headH + (headH ? 12 : 0);

    return {
      h,
      zones: [
        imageZone('portrait', 'portraitTf', px, py, PW, PH),
        textZone('name', nameT, tx, yName, { w: textW }),
        textZone('role', roleT, tx, yRole, { w: textW }),
        textZone('body', bodyT, tx, yBody, { w: textW, multiline: true, strip: c.quoted ? '「」' : '' })
      ],
      paint(ctx) {
        ctx.fillStyle = T.panel;
        ctx.fillRect(0, 0, W, h);

        const im = imgOf(c.portrait);
        ctx.fillStyle = '#14110d';
        ctx.fillRect(px, py, PW, PH);
        if (isReady(im)) placeImage(ctx, im, px, py, PW, PH, c.portraitTf);
        else placeholder(ctx, px, py, PW, PH, '캐릭터');
        ctx.strokeStyle = T.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, PW - 2, PH - 2);

        if (!nameT.empty) nameT.paint(ctx, tx, yName);
        if (!roleT.empty) roleT.paint(ctx, tx, yRole);
        bodyT.paint(ctx, tx, yBody);
      }
    };
  }
};
