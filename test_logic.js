const fs = require('fs');
// Load script.js content and eval it to get functions in global scope
const script = fs.readFileSync(__dirname + '/script.js', 'utf8');
// We'll wrap the script in a function to avoid polluting global, but we need to expose calculate etc.
// Instead, we can eval and then copy needed functions.
eval(script);

// Now we have functions: calculate, getPossibleCombinations, analyzeCombo, getCardValue, isWuHuaNiu, isNiuDongGu, isMabao
// We'll create a wrapper that given an array of 5 card strings returns the best hand type string as displayed.
function getBestHandType(cards) {
  // Simulate the calculate function but return the type string (not DOM)
  const cardsInput = cards.join(',');
  const cardsArr = cardsInput.split(',').map((c) => c.trim().toUpperCase());
  if (cardsArr.length !== 5) return null;
  const allCombos = getPossibleCombinations(cardsArr);
  const validCombos = allCombos
    .map((combo) => analyzeCombo(combo))
    .filter((combo) => combo !== null);
  if (validCombos.length === 0) return '无牛';
  // Sort as in calculate
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

// Test cases
const testCases = [
  // Standard cases
  {cards: ['A', '2', '3', '4', '5'], expectedContains: '无牛'}, // sum of any three? 1+2+3=6, not multiple of 10
  {cards: ['10', '10', '10', '10', '10'], expectedContains: '四炸? actually five 10s not possible'}, // only four tens in deck
  {cards: ['J', 'Q', 'K', 'J', 'Q'], expectedContains: '五花牛'}, // all face cards
  {cards: ['A♠', 'J', 'Q', 'K', '2'], expectedContains: '牛冬菇'}, // spade A and face card
  {cards: ['5', '5', '3', '7', '0'], expectedContains: '牛孖'}, // pair of 5s? Actually 0 not a card; ignore
  // Edge cases where first three not the winning trio
  // We'll generate some manually
];

// Let's instead brute force a few random hands and compare with flawed logic later.
// First, let's just run a few known hands from internet.
console.log('Testing known hands:');
testCases.forEach(({cards, expectedContains}) => {
  const res = getBestHandType(cards);
  console.log(`${cards.join(',')} => ${res}`);
  if (expectedContains && !res.includes(expectedContains)) {
    console.log(`  MISMATCH: expected to contain ${expectedContains}`);
  }
});

// Now generate all combinations of a small subset to find discrepancies with naive logic.
// We'll implement naive logic similar to test.py: only checks first three cards.
function naiveHandType(hand) {
  // hand is array of strings like 'A♠'
  const card_points = {'A':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':10,'Q':10,'K':10};
  const points = hand.map(c => card_points[c.substring(0, c.length-1)]); // assumes suit char
  // Check five flower bull
  if (hand.every(c => ['J','Q','K'].includes(c.substring(0, c.length-1)))) return '五花牛（5倍）';
  // Check牛冬菇
  const spadeA = hand.some(c => c.startsWith('A♠'));
  const hasJQK = hand.some(c => ['J','Q','K'].includes(c.substring(0, c.length-1)));
  if (spadeA && hasJQK) return '牛冬菇（3倍）';
  // Check孖宝 using last two cards (as in test.py)
  const lastTwoPoints = [points[3], points[4]];
  if (lastTwoPoints[0] === lastTwoPoints[1]) return '孖宝（2倍）';
  // Check牛牛 etc using first three as three cards
  const threeSum = points[0] + points[1] + points[2];
  if (threeSum % 10 === 0) return '牛牛';
  return '无牛';
}

// Now test random hands from a limited deck (maybe just single suit to reduce combos)
const singleSuit = ['A♠','2♠','3♠','4♠','5♠','6♠','7♠','8♠','9♠','10♠','J♠','Q♠','K♠'];
function combos(arr, k) {
  const result = [];
  function generate(start, current) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      generate(i+1, current);
      current.pop();
    }
  }
  generate(0, []);
  return result;
}
const hands = combos(singleSuit, 5);
console.log(`Testing ${hands.length} hands from single suit spades...`);
let mismatchCount = 0;
for (const hand of hands) {
  const correct = getBestHandType(hand);
  const naive = naiveHandType(hand);
  // We need to map naive output to comparable format; but we can just check if naive says something that is not correct.
  // Simpler: if naive != '无牛' and correct == '无牛' => false positive; or naive == '无牛' and correct != '无牛' => false negative.
  const naiveIsNoBull = naive === '无牛';
  const correctIsNoBull = correct === '无牛';
  if (naiveIsNoBull !== correctIsNoBull) {
    mismatchCount++;
    if (mismatchCount <= 5) {
      console.log(`Mismatch: hand ${hand.join(',')} correct:${correct} naive:${naive}`);
    }
  }
}
console.log(`Total mismatches: ${mismatchCount} out of ${hands.length}`);