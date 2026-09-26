// 牛牛牌型计算器 - 更新以匹配马来西亚牌牛规则
// 包含3↔6转换，花色敏感的牛冬菇，以及新的牌型优先级

// 解析单张牌字符串，返回 {rank, suit, value, original}
// 例如: "A♠" -> {rank:"A", suit:"♠", value:1, original:"A♠"}
//      "10♥" -> {rank:"10", suit:"♥", value:10, original:"10♥"}
//      "As" -> {rank:"A", suit:"♠", value:1, original:"As"}  // 向后兼容
function parseCard(str) {
  str = str.trim();
  if (str.length === 0) return null;
  // 检查最后一个字符是否为花色符号
  const suitChar = str[str.length - 1];
  const suits = ['♠', '♥', '♦', '♣'];
  let suit = '';
  let rankStr = str;
  if (suits.includes(suitChar)) {
    suit = suitChar;
    rankStr = str.slice(0, -1);
  }
  // 也接受 "As" 代表黑桃A（向后兼容）
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
    else value = 0; // 未知牌面视为0点（将导致无牛）
  }
  return {rank: rankStr, suit: suit, value: value, original: str};
}

// 获取牌的点数（不考虑花色）
function getCardValue(card) {
  return card.value;
}

// 检查一张牌是否为3或6（可转换）
function isConvertible(card) {
  return card.rank === '3' || card.rank === '6';
}

// 获取牌的可能点数值（考虑3↔6转换）
function getPossibleValues(card) {
  if (card.rank === '3') return [3, 6];
  if (card.rank === '6') return [6, 3];
  return [card.value];
}

// 判断给定的三张牌是否可以通过3↔6转换使得点数和为10、20或30
function threeCardsCanReachTarget(threeCards) {
  const targets = [10, 20, 30];
  const possibleLists = threeCards.map(getPossibleValues);
  // 递归生成所有组合
  function dfs(index, currentSum) {
    if (index === 3) {
      return targets.includes(currentSum);
    }
    for (const v of possibleLists[index]) {
      if (dfs(index + 1, currentSum + v)) return true;
    }
    return false;
  }
  return dfs(0, 0);
}

// 找到所有有效的三张牌组合（索引），返回数组，每元素为 {threeIndices, twoIndices}
function findAllValidThreeCardGroups(cards) {
  const results = [];
  const indices = [0,1,2,3,4];
  // 生成所有三张牌的组合
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

// 根据剩余两张牌和全牌判断牌型
function evaluateHandType(cards, threeIdx, twoIdx) {
  const threeCards = threeIdx.map(i => cards[i]);
  const twoCards = twoIdx.map(i => cards[i]);
  
  // 辅助：判断是否为黑桃A
  function isSpadeAce(card) {
    return card.rank === 'A' && card.suit === '♠';
  }
  
  // 辅助：判断是否为J/Q/K
  function isFace(card) {
    return card.rank === 'J' || card.rank === 'Q' || card.rank === 'K';
  }
  
  // 辅助：判断是否为Ace（任何花色）
  function isAce(card) {
    return card.rank === 'A';
  }
  
  // 五只公：五张牌都是J/Q/K
  const isWuZhiGong = cards.every(isFace);
  
  // 牛冬菇：剩余两张牌为♠A + J/K/Q（任意顺序）
  const isNiuDongGu = (
    (isSpadeAce(twoCards[0]) && isFace(twoCards[1])) ||
    (isSpadeAce(twoCards[1]) && isFace(twoCards[0]))
  );
  
  // 孖宝（双A）：剩余两张牌都是A
  const isShuangAZiBao = twoCards.every(isAce);
  
  // 孖宝：剩余两张牌点数相同（不包括已经是双A的情况）
  const isZiBao = (getCardValue(twoCards[0]) === getCardValue(twoCards[1])) && !isShuangAZiBao;
  
  // 十点／牛十：剩余两张牌点数和为10或20
  const twoSum = getCardValue(twoCards[0]) + getCardValue(twoCards[1]);
  const isShiDian = (twoSum === 10 || twoSum === 20);
  
  // 普通牛：有效的三张牌组合但不符合以上特殊牌型
  // 无牛：在调用此函数前已确认存在有效三张牌组合
  
  // 按优先级返回牌型
  if (isNiuDongGu) return {type: '牛冬菇', multiplier: 5, desc: '牛冬菇 (5倍)'};
  if (isWuZhiGong) return {type: '五只公', multiplier: 5, desc: '五只公 (5倍)'};
  if (isShuangAZiBao) return {type: '孖宝（双A）', multiplier: 4, desc: '孖宝（双A） (4倍)'};
  if (isZiBao) return {type: '孖宝', multiplier: 3, desc: '孖宝 (3倍)'};
  if (isShiDian) return {type: '十点／牛十', multiplier: 2, desc: '十点／牛十 (2倍)'};
  // 否则为普通牛
  return {type: '普通牛', multiplier: 1, desc: '普通牛 (1倍)'};
}

// 主计算函数
function calculate() {
  const input = document.getElementById("cards").value;
  if (!input.trim()) {
    alert("请输入5张牌！");
    return;
  }
  
  // 分割并解析牌
  const parts = input.split(',').map(s => s.trim());
  if (parts.length !== 5) {
    alert("请输入恰好5张牌，用逗号分隔！");
    return;
  }
  
  const cards = [];
  for (const p of parts) {
    const card = parseCard(p);
    if (!card || card.value === 0) {
      alert(`无法识别牌面："${p}"。请使用如 A♠, 2♥, 10♦, J♣, Q♥ 等格式。`);
      return;
    }
    cards.push(card);
  }
  
  // 查找所有有效的三张牌组合
  const validGroups = findAllValidThreeCardGroups(cards);
  
  const resultList = document.getElementById("result");
  resultList.innerHTML = "";
  
  if (validGroups.length === 0) {
    const li = document.createElement("li");
    li.textContent = "无牛";
    resultList.appendChild(li);
    return;
  }
  
  // 为了避免重复显示相同的牌型，我们使用集合来跟踪已显示的描述
  const shown = new Set();
  const results = [];
  
  for (const group of validGroups) {
    const handInfo = evaluateHandType(cards, group.three, group.two);
    const key = handInfo.desc;
    if (!shown.has(key)) {
      shown.add(key);
      results.push(handInfo);
    }
  }
  
  // 如果没有任何结果（理论上不会发生），显示无牛
  if (results.length === 0) {
    const li = document.createElement("li");
    li.textContent = "无牛";
    resultList.appendChild(li);
    return;
  }
  
  // 按倍数降序排序（相同倍数则保持发现顺序）
  results.sort((a,b) => b.multiplier - a.multiplier);
  
  // 显示结果
  results.forEach(info => {
    const li = document.createElement("li");
    li.textContent = info.desc;
    resultList.appendChild(li);
  });
}

// 为了向后兼容，保留全局函数名 calculate
window.calculate = calculate;