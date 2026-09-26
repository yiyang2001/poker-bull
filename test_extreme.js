const fs = require('fs');
const script = fs.readFileSync(__dirname + '/script.js', 'utf8');
eval(script);

// function to get best hand type string as earlier
function getBestHandType(cards) {
  const cardsInput = cards.join(',');
  const cardsArr = cardsInput.split(',').map((c) => c.trim().toUpperCase());
  if (cardsArr.length !== 5) return null;
  const allCombos = getPossibleCombinations(cardsArr);
  const validCombos = allCombos
    .map((combo) => analyzeCombo(combo))
    .filter((combo) => combo !== null);
  if (validCombos.length === 0) return '无牛';
  const typeOrder = ["wuhuaniu", "niudonggu", "mabao", "niuniu", "niuX"];
  validCombos.sort((a, b) => {
    const aTypeIndex = typeOrder.indexOf(a.type);
    const bTypeIndex = typeOrder.indexOf(b.type);
    if (aTypeIndex !== bTypeIndex) {
      return aTypeIndex - bTypeIndex;
    }
    return b.niuValue - a.niuValue;
  });
  const best = validCombos[0];
  switch (best.type) {
    case 'wuhuaniu': return '五花牛 (5倍)';
    case 'niudonggu': return `牛冬菇 (3倍) 剩余牌: ${best.twoCards.join(',')}`;
    case 'mabao': return `牛孖 (2倍) 牛${best.niuValue} [${best.threeCards.join(',')} + ${best.twoCards.join(',')}]`;
    case 'niuniu': return '牛牛 (1倍)';
    case 'niuX': return `牛${best.niuValue} [${best.threeCards.join(',')} + ${best.twoCards.join(',')}]`;
    default: return '未知';
  }
}

console.log('Testing joker cases:');
// Joker representations: we'll use '小王' and '大王' as strings
const hands = [
  ['小王', '大王', 'J', 'Q', 'K'],
  ['小王', 'A', 'J', 'Q', 'K'],
  ['大王', 'A', 'J', 'Q', 'K'],
  ['小王', '小王', 'A', 'A', 'K'],
  ['大王', '大王', '10', '10', '10'],
  ['小王', '2', '3', '5', 'K'], // sum? 
];
hands.forEach(hand => {
  console.log(`${hand.join(',')} => ${getBestHandType(hand)}`);
});

// Test 牛冬菇 detection with proper input (no suit)
console.log('\nTesting 牛冬菇 detection (expecting detection when Ace and face present):');
const testDH = [
  ['A', 'J', 'Q', 'K', '2'], // Ace + face cards
  ['A', 'A', 'J', 'Q', 'K'],
  ['A', '10', '10', '10', '10'],
];
testDH.forEach(hand => {
  console.log(`${hand.join(',')} => ${getBestHandType(hand)}`);
});

// Test 五花牛
console.log('\nTesting 五花牛:');
console.log(['J','Q','K','J','Q'].join(',') + ' => ' + getBestHandType(['J','Q','K','J','Q']));
console.log(['J','J','J','J','J'].join(',') + ' => ' + getBestHandType(['J','J','J','J','J']));

// Test 牛孖 (pair)
console.log('\nTesting 牛孖:');
console.log(['5','5','3','7','9'].join(',') + ' => ' + getBestHandType(['5','5','3','7','9'])); // pair of 5s
console.log(['10','10','2','3','5'].join(',') + ' => ' + getBestHandType(['10','10','2','3','5']));

// Test 牛牛 (three sum to multiple of 10)
console.log('\nTesting 牛牛:');
console.log(['A','2','3','4','5'].join(',') + ' => ' + getBestHandType(['A','2','3','4','5'])); // 1+4+5=10
console.log(['10','10','10','2','3'].join(',') + ' => ' + getBestHandType(['10','10','10','2','3'])); // three 10s sum 30

// Test 牛X
console.log('\nTesting 牛X:');
console.log(['A','2','3','4','6'].join(',') + ' => ' + getBestHandType(['A','2','3','4','6'])); // 1+4+5? actually need three sum multiple of 10: 1+3+6=10? 1+3+6=10 yes remaining 2+4=6 => 牛6
console.log(['2','3','5','8','K'].join(',') + ' => ' + getBestHandType(['2','3','5','8','K'])); // 2+3+5=10 remaining 8+K=18 => 牛8