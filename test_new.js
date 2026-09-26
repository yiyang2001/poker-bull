// Test the new poker bull logic
function parseCard(str) {
  str = str.trim();
  if (str.length === 0) return null;
  const suitChar = str[str.length - 1];
  const suits = ['♠', '♥', '♦', '♣'];
  let suit = '';
  let rankStr = str;
  if (suits.includes(suitChar)) {
    suit = suitChar;
    rankStr = str.slice(0, -1);
  }
  if (rankStr.toLowerCase() === 'as') {
    rankStr = 'A';
    suit = '♠';
  }
  rankStr = rankStr.toUpperCase();
  let value;
  if (rankStr === 'A') value = 1;
  else if (rankStr === 'J' || rankStr === 'Q' || rankStr === 'K') value = 10;
  else if (rankStr === '10') value = 10;
  else {
    const n = parseInt(rankStr, 10);
    if (!isNaN(n) && n >= 2 && n <= 9) value = n;
    else value = 0;
  }
  return {rank: rankStr, suit: suit, value: value, original: str};
}
function getCardValue(card) { return card.value; }
function getPossibleValues(card) {
  if (card.rank === '3') return [3, 6];
  if (card.rank === '6') return [6, 3];
  return [card.value];
}
function threeCardsCanReachTarget(threeCards) {
  const targets = [10, 20, 30];
  const possibleLists = threeCards.map(getPossibleValues);
  function dfs(index, currentSum) {
    if (index === 3) return targets.includes(currentSum);
    for (const v of possibleLists[index]) {
      if (dfs(index + 1, currentSum + v)) return true;
    }
    return false;
  }
  return dfs(0, 0);
}
function findAllValidThreeCardGroups(cards) {
  const results = [];
  const indices = [0,1,2,3,4];
  for (let i = 0; i < 5; i++) {
    for (let j = i+1; j < 5; j++) {
      for (let k = j+1; k < 5; k++) {
        const threeIdx = [i,j,k];
        const threeCards = threeIdx.map(idx => cards[idx]);
        if (threeCardsCanReachTarget(threeCards)) {
          const twoIdx = indices.filter(idx => !threeIdx.includes(idx));
          results.push({three: threeIdx, two: twoIdx});
        }
      }
    }
  }
  return results;
}
function evaluateHandType(cards, threeIdx, twoIdx) {
  const threeCards = threeIdx.map(i => cards[i]);
  const twoCards = twoIdx.map(i => cards[i]);
  function isSpadeAce(card) { return card.rank === 'A' && card.suit === '♠'; }
  function isFace(card) { return card.rank === 'J' || card.rank === 'Q' || card.rank === 'K'; }
  function isAce(card) { return card.rank === 'A'; }
  const isWuZhiGong = cards.every(isFace);
  const isNiuDongGu = (isSpadeAce(twoCards[0]) && isFace(twoCards[1])) ||
                      (isSpadeAce(twoCards[1]) && isFace(twoCards[0]));
  const isShuangAZiBao = twoCards.every(isAce);
  const isZiBao = (getCardValue(twoCards[0]) === getCardValue(twoCards[1])) && !isShuangAZiBao;
  const twoSum = getCardValue(twoCards[0]) + getCardValue(twoCards[1]);
  const isShiDian = (twoSum === 10 || twoSum === 20);
  if (isNiuDongGu) return {type: '牛冬菇', multiplier: 5, desc: '牛冬菇 (5倍)'};
  if (isWuZhiGong) return {type: '五只公', multiplier: 5, desc: '五只公 (5倍)'};
  if (isShuangAZiBao) return {type: '孖宝（双A）', multiplier: 4, desc: '孖宝（双A） (4倍)'};
  if (isZiBao) return {type: '孖宝', multiplier: 3, desc: '孖宝 (3倍)'};
  if (isShiDian) return {type: '十点／牛十', multiplier: 2, desc: '十点／牛十 (2倍)'};
  return {type: '普通牛', multiplier: 1, desc: '普通牛 (1倍)'};
}
function calculateLogic(inputStr) {
  const parts = inputStr.split(',').map(s => s.trim());
  if (parts.length !== 5) return {error: '需要恰好5张牌'};
  const cards = [];
  for (const p of parts) {
    const card = parseCard(p);
    if (!card || card.value === 0) return {error: `无法识别牌面：${p}`};
    cards.push(card);
  }
  const validGroups = findAllValidThreeCardGroups(cards);
  if (validGroups.length === 0) return [{type:'无牛', multiplier:1, desc:'无牛'}];
  const shown = new Set();
  const results = [];
  for (const group of validGroups) {
    const info = evaluateHandType(cards, group.three, group.two);
    if (!shown.has(info.desc)) {
      shown.add(info.desc);
      results.push(info);
    }
  }
  results.sort((a,b) => b.multiplier - a.multiplier);
  return results;
}

// Test cases
console.log('=== Testing new logic ===');
// 1. 牛冬菇 example: 7,2,A,A♠,K (note we need suit after rank)
console.log('Test 1: 7,2,A,A♠,K');
const res1 = calculateLogic('7,2,A,A♠,K');
if (res1.error) console.log('Error:', res1.error);
else console.log(res1.map(r => r.desc));
// Expect 牛冬菇 5倍
// 2. 五只公: J,Q,K,J,Q
console.log('\nTest 2: J,Q,K,J,Q');
const res2 = calculateLogic('J,Q,K,J,Q');
if (res2.error) console.log('Error:', res2.error);
else console.log(res2.map(r => r.desc));
// Expect 五只公 5倍
// 3. 孖宝（双A）: 3,6,8,A,A (with 3↔6)
console.log('\nTest 3: 3,6,8,A,A');
const res3 = calculateLogic('3,6,8,A,A');
if (res3.error) console.log('Error:', res3.error);
else console.log(res3.map(r => r.desc));
// Expect 孖宝（双A） 4倍
// 4. 孖宝: 7,3,K,5,5
console.log('\nTest 4: 7,3,K,5,5');
const res4 = calculateLogic('7,3,K,5,5');
if (res4.error) console.log('Error:', res4.error);
else console.log(res4.map(r => r.desc));
// Expect 孖宝 3倍
// 5. 十点／牛十: 7,3,K,6,4
console.log('\nTest 5: 7,3,K,6,4');
const res5 = calculateLogic('7,3,K,6,4');
if (res5.error) console.log('Error:', res5.error);
else console.log(res5.map(r => r.desc));
// Expect 十点／牛十 2倍
// 6. 普通牛: A,2,3,4,5 (should be 牛5? Actually with 3↔6? Let's compute: three cards sum to 10? A+4+5=10, remaining 2+3=5 => 牛5)
console.log('\nTest 6: A,2,3,4,5');
const res6 = calculateLogic('A,2,3,4,5');
if (res6.error) console.log('Error:', res6.error);
else console.log(res6.map(r => r.desc));
// Expect 普通牛 1倍 (牛5)
// 7. 无牛: 2,3,5,7,9 (no three sum to 10/20/30 even with conversion?)
console.log('\nTest 7: 2,3,5,7,9');
const res7 = calculateLogic('2,3,5,7,9');
if (res7.error) console.log('Error:', res7.error);
else console.log(res7.map(r => r.desc));
// Expect 无牛
// 8. Test 3↔6 conversion: 3,6,8,A,A already done.
// 9. Test牛冬菇 with wrong ace: A,2,3,A♠,K (should not be牛冬菇 because we have A♠ and A? Actually we have A♠ and A, remaining two are A and K? Wait we have five cards: 2,3,A,A♠,K. Three cards sum? We'll test.)
console.log('\nTest 8: 2,3,A,A♠,K (should be? three cards maybe 2+3+K=15 not 10/20/30; maybe 2+3+A=6; 2+A+K=13; 3+A+K=14; none with conversion? 3 can be 6: 2+6+K=18; 2+6+A=9; 6+6+K=22; etc. Likely 无牛)');
const res8 = calculateLogic('2,3,A,A♠,K');
if (res8.error) console.log('Error:', res8.error);
else console.log(res8.map(r => r.desc));
// Additional test: 牛冬菇 with 10/20/30 sum using conversion
console.log('\nTest 9: 4,6,10,A♠,K (three cards 4+6+10=20, remaining A♠+K => 牛冬菇)');
const res9 = calculateLogic('4,6,10,A♠,K');
if (res9.error) console.log('Error:', res9.error);
else console.log(res9.map(r => r.desc));
// Test 牛冬菇 with 3 conversion: 3,7,10,A♠,K (3->6 gives 6+7+10=23 not; 3+7+10=20? 3+7+10=20 actually 3+7+10=20, yes no conversion needed) 
console.log('\nTest 10: 3,7,10,A♠,K (3+7+10=20)');
const res10 = calculateLogic('3,7,10,A♠,K');
if (res10.error) console.log('Error:', res10.error);
else console.log(res10.map(r => r.desc));
// Test 五只公 with suits mixed
console.log('\nTest 11: J♥,Q♦,K♣,J♠,K♥');
const res11 = calculateLogic('J♥,Q♦,K♣,J♠,K♥');
if (res11.error) console.log('Error:', res11.error);
else console.log(res11.map(r => r.desc));
// Test 孖宝（双A） with suits
console.log('\nTest 12: A♥,A♣,5,6,9 (need three sum 10/20/30: 5+6+9=20, remaining A,A => 双A孖宝)');
const res12 = calculateLogic('A♥,A♣,5,6,9');
if (res12.error) console.log('Error:', res12.error);
else console.log(res12.map(r => r.desc));