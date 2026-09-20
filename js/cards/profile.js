import { T } from '../theme.js';
import { W, PAD, text, font, roundRect, rule, textZone, imageZone,
         imgOf, isReady, placeImage, placeholder, imageEdge } from '../canvas/layout.js';

const PW = 172;
const PH = 210;
const GAP = 24;

export default {
  id: 'profile',
  name: '캐릭터 소개',
  desc: '등장인물 한 장',
  group: '캐릭터',
  accent: '#7fa6d0',

  create: () => ({
    portrait: null, portraitTf: { s: 1, x: 0, y: 0 },
    name: '', role: '', traits: ['', ''], body: ''
  }),

  fields: [
    { k: 'portrait', t: 'image', label: '캐릭터 이미지', tf: 'portraitTf', aspect: PW / PH },
    { k: 'name',     t: 'text',     label: '이름', ph: '캐릭터 이름' },
    { k: 'role',     t: 'text',     label: '직함', ph: '주인공' },
    { k: 'traits',   t: 'strlist',  label: '특성', ph: '동료', add: '특성 추가' },
    { k: 'body',     t: 'textarea', label: '소개 글', rows: 5, ph: '초반에는 비중이 적지만 후반에 역할이 커진다.' }
  ],

  label: c => c.name || '캐릭터 소개',

  build(c) {
    const textW = W - PAD * 2 - PW - GAP;
    const traits = (c.traits || []).filter(Boolean);

    const nameT = text(c.name, { size: 28, weight: 800, maxW: textW, lh: 40 });
    const roleT = text(c.role, { size: 15, color: T.accent, maxW: textW, lh: 24 });
    const bodyT = text(c.body, { size: 18, color: T.ink2, maxW: textW, lh: 32 });

    const chipH = traits.length ? 36 : 0;
    const textH = (nameT.empty ? 0 : nameT.h) + (roleT.empty ? 0 : roleT.h + 4)
                + chipH + (bodyT.empty ? 0 : bodyT.h + 14);
    const h = 34 + Math.max(PH, textH) + 34;

    const px = PAD, py = 34, tx = PAD + PW + GAP;
    const yName = 34;
    const yRole = yName + (nameT.empty ? 0 : nameT.h) + 4;
    const yChip = yRole + (roleT.empty ? 0 : roleT.h) + 8;
    const yBody = yChip + chipH + 14;

    return {
      h,
      zones: [
        imageZone('portrait', 'portraitTf', px, py, PW, PH),
        textZone('name', nameT, tx, yName, { w: textW }),
        textZone('role', roleT, tx, yRole, { w: textW }),
        textZone('body', bodyT, tx, yBody, { w: textW, multiline: true })
      ],
      paint(ctx) {
        ctx.fillStyle = T.panel;
        ctx.fillRect(0, 0, W, h);
        ctx.fillStyle = T.accent;
        ctx.fillRect(0, 0, 4, h);

        const im = imgOf(c.portrait);
        ctx.fillStyle = '#14110d';
        ctx.fillRect(px, py, PW, PH);
        if (isReady(im)) placeImage(ctx, im, px, py, PW, PH, c.portraitTf);
        else placeholder(ctx, px, py, PW, PH, '캐릭터');
        imageEdge(ctx, px, py, PW, PH);

        if (!nameT.empty) nameT.paint(ctx, tx, yName);
        if (!roleT.empty) roleT.paint(ctx, tx, yRole);

        if (traits.length) {
          font(ctx, 14, 400, T.sans);
          let cx = tx;
          for (const tr of traits) {
            const tw = ctx.measureText(tr).width + 22;
            if (cx + tw > tx + textW) break;
            ctx.fillStyle = T.panel2;
            roundRect(ctx, cx, yChip, tw, 26, 13);
            ctx.fill();
            ctx.strokeStyle = T.accent2;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = T.accent;
            ctx.textBaseline = 'middle';
            ctx.fillText(tr, cx + 11, yChip + 14);
            ctx.textBaseline = 'alphabetic';
            cx += tw + 7;
          }
        }

        if (!bodyT.empty) {
          rule(ctx, tx, yBody - 7, textW, T.line);
          bodyT.paint(ctx, tx, yBody);
        }
      }
    };
  }
};
