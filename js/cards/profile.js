import { T } from '../theme.js';
import { W, PAD, text, font, spacedText, roundRect, rule,
         imgOf, isReady, coverImage, placeholder } from '../canvas/layout.js';

const PW = 172;
const PH = 210;
const GAP = 24;

export default {
  id: 'profile',
  name: '인물 소개',
  desc: '등장인물 카드',
  group: '인물',
  accent: '#7fa6d0',

  create: () => ({ portrait: null, name: '', role: '', traits: ['', ''], body: '' }),

  fields: [
    { k: 'portrait', t: 'image',    label: '초상화' },
    { k: 'name',     t: 'text',     label: '이름', ph: '리안느 드 발루아' },
    { k: 'role',     t: 'text',     label: '직함', ph: '성주 대리 · 24세' },
    { k: 'traits',   t: 'strlist',  label: '특성 (태그)', ph: '냉정함', add: '특성 추가' },
    { k: 'body',     t: 'textarea', label: '소개 글', rows: 5 }
  ],

  label: c => c.name || '인물 소개',

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

    return {
      h,
      paint(ctx) {
        ctx.fillStyle = T.panel;
        ctx.fillRect(0, 0, W, h);
        ctx.fillStyle = T.accent;
        ctx.fillRect(0, 0, 4, h);

        const px = PAD, py = 34, tx = PAD + PW + GAP;
        const im = imgOf(c.portrait);
        ctx.fillStyle = '#14110d';
        ctx.fillRect(px, py, PW, PH);
        if (isReady(im)) coverImage(ctx, im, px, py, PW, PH);
        else placeholder(ctx, px, py, PW, PH, '초상화');
        ctx.strokeStyle = T.accent2;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, PW - 2, PH - 2);

        let y = 34;
        if (!nameT.empty) { nameT.paint(ctx, tx, y); y += nameT.h; }
        if (!roleT.empty) { roleT.paint(ctx, tx, y + 4); y += roleT.h + 4; }

        if (traits.length) {
          y += 8;
          font(ctx, 14, 400, T.sans);
          let cx = tx;
          for (const tr of traits) {
            const tw = ctx.measureText(tr).width + 22;
            if (cx + tw > tx + textW) break;
            ctx.fillStyle = T.panel2;
            roundRect(ctx, cx, y, tw, 26, 13);
            ctx.fill();
            ctx.strokeStyle = T.accent2;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = T.accent;
            ctx.textBaseline = 'middle';
            ctx.fillText(tr, cx + 11, y + 14);
            ctx.textBaseline = 'alphabetic';
            cx += tw + 7;
          }
          y += 28;
        }

        if (!bodyT.empty) {
          y += 14;
          rule(ctx, tx, y - 7, textW, T.line);
          bodyT.paint(ctx, tx, y);
        }
      }
    };
  }
};
