import { T } from '../theme.js';
import { W, PAD, text, font, imgOf, isReady, coverImage, placeholder } from '../canvas/layout.js';

const PW = 128;   // 초상화 폭
const PH = 156;   // 초상화 높이
const GAP = 20;

export default {
  id: 'dialogue',
  name: '초상화 대사',
  desc: '인물 + 대사',
  group: '인물',
  accent: '#7fa6d0',

  create: () => ({ portrait: null, name: '', role: '', body: '', side: 'left', quoted: true }),

  fields: [
    { k: 'portrait', t: 'image',    label: '초상화 (게임에서 잘라 넣으면 됩니다)' },
    { k: 'name',     t: 'text',     label: '이름', ph: '리안느 드 발루아' },
    { k: 'role',     t: 'text',     label: '직함 · 설명', ph: '성주 대리' },
    { k: 'body',     t: 'textarea', label: '대사', rows: 5, ph: '눈이 그치기 전엔 아무도 이 산을 못 넘습니다.' },
    { k: 'side',     t: 'select',   label: '초상화 위치', opts: [['left', '왼쪽'], ['right', '오른쪽']] },
    { k: 'quoted',   t: 'toggle',   label: '「 」 낫표 자동으로 붙이기' }
  ],

  label: c => c.name ? `${c.name} — ${(c.body || '').split('\n')[0]}` : '초상화 대사',

  build(c) {
    const textW = W - PAD * 2 - PW - GAP;
    const body = c.quoted && c.body ? `「${c.body}」` : c.body;

    const nameT = text(c.name, { size: 21, weight: 700, color: T.accent, maxW: textW, lh: 30 });
    const roleT = text(c.role, { size: 14, color: T.ink3, maxW: textW, lh: 22 });
    const bodyT = text(body,   { size: 20, maxW: textW, lh: 36 });

    const headH = (nameT.empty ? 0 : nameT.h) + (roleT.empty ? 0 : roleT.h + 2);
    const textH = headH + (headH ? 12 : 0) + bodyT.h;
    const h = 30 + Math.max(PH, textH) + 30;

    return {
      h,
      paint(ctx) {
        ctx.fillStyle = T.panel;
        ctx.fillRect(0, 0, W, h);

        const right = c.side === 'right';
        const px = right ? W - PAD - PW : PAD;
        const tx = right ? PAD : PAD + PW + GAP;
        const py = 30;

        const im = imgOf(c.portrait);
        ctx.fillStyle = '#14110d';
        ctx.fillRect(px, py, PW, PH);
        if (isReady(im)) coverImage(ctx, im, px, py, PW, PH);
        else placeholder(ctx, px, py, PW, PH, '초상화');
        ctx.strokeStyle = T.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, PW - 2, PH - 2);

        let y = 30 + Math.max(0, (Math.max(PH, textH) - textH) / 2);
        if (!nameT.empty) { nameT.paint(ctx, tx, y); y += nameT.h; }
        if (!roleT.empty) { roleT.paint(ctx, tx, y + 2); y += roleT.h + 2; }
        if (headH) y += 12;
        bodyT.paint(ctx, tx, y);
      }
    };
  }
};
