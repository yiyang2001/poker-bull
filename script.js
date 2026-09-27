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
  // 否则为普通牛：计算牛值（剩余两张牌点数和取个位）
  const niuValue = twoSum % 10;
  return {type: '普通牛', multiplier: 1, desc: `牛${niuValue} (1倍)`};
}

// 主计算函数
function calculate() {
  // 优先使用极速点选面板的选中牌（如果已选满5张）
  let cards = [];
  let inputStr = '';
  if (typeof window.getGridSelection === 'function') {
    const sel = window.getGridSelection();
    if (Array.isArray(sel) && sel.length === 5) {
      cards = sel.map(s => parseCard(s)).filter(c => c && c.value > 0);
      if (cards.length === 5) {
        // 直接使用网格数据
        // 更新文本框同步
        document.getElementById('cards').value = sel.join(',');
      }
    }
  }
  // 如果网格未满5张，回退到文本输入
  if (cards.length !== 5) {
    const input = document.getElementById("cards").value;
    if (!input.trim()) {
      alert("请输入5张牌！");
      return;
    }
    const parts = input.split(',').map(s => s.trim());
    if (parts.length !== 5) {
      alert("请输入恰好5张牌，用逗号分隔！");
      return;
    }
    cards = [];
    for (const p of parts) {
      const card = parseCard(p);
      if (!card || card.value === 0) {
        alert(`无法识别牌面："${p}"。请使用如 A♠, 2♥, 10♦, J♣, Q♥ 等格式。`);
        return;
      }
      cards.push(card);
    }
  }
  
  // 查找所有有效的三张牌组合
  const validGroups = findAllValidThreeCardGroups(cards);
  
  const resultList = document.getElementById("result");
  resultList.innerHTML = "";
  
  if (validGroups.length === 0) {
    const li = document.createElement("div");
    li.className = "result-item";
    li.innerHTML = '<span class="result-main">无牛</span>';
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
      results.push({ ...handInfo, group });
    }
  }
  
  // 如果没有任何结果（理论上不会发生），显示无牛
  if (results.length === 0) {
    const li = document.createElement("div");
    li.className = "result-item";
    li.innerHTML = '<span class="result-main">无牛</span>';
    resultList.appendChild(li);
    return;
  }
  
  // 按倍数降序排序（相同倍数则保持发现顺序）
  results.sort((a,b) => b.multiplier - a.multiplier);
  
  // 显示结果（简化版 + Info 按钮）
  results.forEach((info) => {
    const div = document.createElement("div");
    div.className = "result-item";
    
    // 主显示：牌型名称 + 倍数
    const mainSpan = document.createElement("span");
    mainSpan.className = "result-main";
    mainSpan.textContent = info.desc;
    
    // Info 按钮
    const infoBtn = document.createElement("button");
    infoBtn.className = "info-btn";
    infoBtn.textContent = "ℹ️";
    infoBtn.setAttribute("aria-label", "详细解释");
    infoBtn.onclick = () => openInfoModal(info, cards);
    
    div.appendChild(mainSpan);
    div.appendChild(infoBtn);
    resultList.appendChild(div);
  });
}

// 打开详细解释弹窗
function openInfoModal(info, cards) {
  const modal = document.getElementById('info-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  
  title.textContent = info.desc;
  
  const group = info.group;
  let html = '';
  
  if (info.desc.includes('五只公')) {
    const allCards = cards.map(c => c.original).join(', ');
    html = `
      <div class="step"><strong>牌型判定：</strong> 所有5张牌均为 J/Q/K</div>
      <div class="step"><strong>全牌：</strong> ${allCards}</div>
      <div class="step"><strong>倍数：</strong> 5倍</div>
    `;
  } else if (group) {
    const threeCards = group.three.map(i => cards[i]);
    const twoCards = group.two.map(i => cards[i]);
    const threeStr = threeCards.map(c => c.original).join(' + ');
    const twoStr = twoCards.map(c => c.original).join(' + ');
    const threeVals = threeCards.map(c => c.value);
    const twoVals = twoCards.map(c => c.value);
    const threeSum = threeVals.reduce((a,b)=>a+b,0);
    const twoSumVal = twoVals.reduce((a,b)=>a+b,0);
    const niuVal = info.desc.includes('牛') ? (parseInt(info.desc.match(/牛(\\d+)/)?.[1]) || twoSumVal % 10) : (twoSumVal % 10);
    const hasConv = threeCards.some(c => c.rank === '3' || c.rank === '6');
    const convNote = hasConv ? '（支持 3↔6 转换）' : '';
    
    html = `
      <div class="step"><strong>三张凑10组合：</strong> ${threeStr} <em>${convNote}</em></div>
      <div class="step"><strong>三张点数和：</strong> ${threeSum} (10/20/30 的倍数)</div>
      <div class="step"><strong>剩余两张：</strong> ${twoStr}</div>
      <div class="step"><strong>两张点数和：</strong> ${twoSumVal}</div>
      <div class="step"><strong>取个位数 (牛值)：</strong> ${niuVal === 0 ? '牛牛 (即 10)' : '牛' + niuVal}</div>
      <div class="step"><strong>最终牌型：</strong> ${info.desc}</div>
    `;
  } else {
    html = '<div class="step">无法解析组合</div>';
  }
  
  body.innerHTML = html;
  modal.classList.add('active');
}

// 关闭弹窗
function closeInfoModal() {
  const modal = document.getElementById('info-modal');
  modal.classList.remove('active');
}

// 点击遮罩关闭
document.addEventListener('click', (e) => {
  const modal = document.getElementById('info-modal');
  if (e.target === modal) {
    modal.classList.remove('active');
  }
});

// 为了向后兼容，保留全局函数名 calculate
window.calculate = calculate;