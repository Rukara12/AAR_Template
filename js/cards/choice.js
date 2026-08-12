import { T } from '../theme.js';
import { W, PAD, CW, text, font, spacedText } from '../canvas/layout.js';

export default {
  id: 'choice',
  name: '선택지',
  desc: '댓글 투표 유도',
  group: '독자 참여',
  accent: '#c26a63',

  create: () => ({
    heading: '선택',
    prompt: '',
    options: ['', ''],
    notice: '댓글에 번호를 남겨 주세요'
  }),

  fields: [
    { k: 'heading', t: 'text',     label: '소제목', ph: '선택' },
    { k: 'prompt',  t: 'textarea', label: '상황 문장', rows: 3, ph: '겨울이 오기 전에 결정해야 한다.' },
    { k: 'options', t: 'strlist',  label: '선택지', ph: '성문을 걸어 잠그고 농성한다', add: '선택지 추가' },
    { k: 'notice',  t: 'text',     label: '아래 안내문', ph: '댓글에 번호를 남겨 주세요 · 내일 22시 마감' },
    { k: '', t: 'note', text: '회차 마지막 장에 두는 카드입니다. 마감 시각을 적어 두면 투표가 훨씬 잘 모입니다.' }
  ],

  label: c => (c.prompt || '선택지').split('\n')[0],

  build(c) {
    const opts = (c.options || []).filter(Boolean);
    const optW = CW - 34;
    const prompt = text(c.prompt, { size: 21, maxW: CW, lh: 36 });
    const notice = text(c.notice, { size: 15, color: T.ink3, maxW: CW, lh: 26, align: 'center' });

    const optT = opts.map(o => text(o, { size: 20, maxW: optW, lh: 32 }));
    const optH = optT.map(t => Math.max(52, t.h + 24));

    const top = 32;
    const headH = c.heading ? 30 : 0;
    const promptH = prompt.empty ? 0 : prompt.h + 20;
    const listH = optH.reduce((a, b) => a + b + 9, 0);
    const noticeH = notice.empty ? 0 : notice.h + 20;
    const h = top + headH + promptH + listH + noticeH + 30;

    return {
      h,
      paint(ctx) {
        ctx.fillStyle = T.panel;
        ctx.fillRect(0, 0, W, h);
        ctx.strokeStyle = T.accent2;
        ctx.lineWidth = 1;
        ctx.strokeRect(14.5, 14.5, W - 29, h - 29);

        let y = top;
        if (c.heading) {
          font(ctx, 13, 700, T.sans);
          ctx.fillStyle = T.accent;
          spacedText(ctx, c.heading, PAD, y + 13, 3, 'left', CW);
          y += 30;
        }
        if (!prompt.empty) { prompt.paint(ctx, PAD, y); y += prompt.h + 20; }

        optT.forEach((t, i) => {
          const bh = optH[i];
          ctx.fillStyle = T.panel2;
          ctx.fillRect(PAD, y, CW, bh);
          ctx.fillStyle = T.accent;
          ctx.fillRect(PAD, y, 4, bh);

          font(ctx, 19, 700, T.serif);
          ctx.fillStyle = T.accent;
          ctx.textBaseline = 'middle';
          ctx.fillText(String(i + 1), PAD + 16, y + bh / 2);
          ctx.textBaseline = 'alphabetic';

          t.paint(ctx, PAD + 40, y + (bh - t.h) / 2, { maxW: optW - 12 });
          y += bh + 9;
        });

        if (!notice.empty) notice.paint(ctx, PAD, y + 12);
      }
    };
  }
};
