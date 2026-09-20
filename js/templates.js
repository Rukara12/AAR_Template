/**
 * 시작 틀. 새로 시작할 때 어떤 카드를 미리 깔아 둘지 정합니다.
 * cards 는 카드 타입 id 목록입니다. 항목을 더하고 싶으면 여기에 한 덩어리만 추가하세요.
 *
 * 뼈대만 깔아 주는 정도로 짧게 둡니다. 더 넣는 건 팔레트에서 끌어 오면 되니까요.
 */

export const TEMPLATES = [
  {
    id: 'review',
    name: '리뷰 카드',
    desc: '기본 구성',
    cards: ['cover', 'status', 'score', 'proscons', 'verdict']
  },
  {
    id: 'blank',
    name: '빈 카드',
    desc: '처음부터 직접',
    // 기본 구성 밖은 아직 다듬는 중이라 그렇다고 적어 둡니다.
    beta: true,
    cards: []
  }
];

export const templateById = id => TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
