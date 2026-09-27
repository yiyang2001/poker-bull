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
    
    const group = info.group;
    const twoStr = (group && cards) ? group.two.map(i => cards[i].original).join(', ') : '';
    const threeStr = (group && cards) ? group.three.map(i => cards[i].original).join(', ') : '';
    
    const descSpan = document.createElement("span");
    descSpan.className = "result-desc";
    descSpan.textContent = info.desc;
    
    const cardsCol = document.createElement("div");
    cardsCol.className = "cards-col";
    const top = document.createElement("div");
    top.className = "cards-two";
    top.textContent = twoStr;
    const bot = document.createElement("div");
    bot.className = "cards-three";
    bot.textContent = threeStr;
    cardsCol.appendChild(top);
    cardsCol.appendChild(bot);
    
    // Info 按钮
    const infoBtn = document.createElement("button");
    infoBtn.className = "info-btn";
    infoBtn.textContent = "ℹ️";
    infoBtn.setAttribute("aria-label", "详细解释");
    infoBtn.onclick = () => openInfoModal(info, cards);
    
    div.appendChild(descSpan);
    div.appendChild(cardsCol);
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
      <div class="mc-grid">
        <div class="mc-block full">
          <div class="mc-label">五只公</div>
          <div class="mc-cards">${allCards}</div>
          <div class="mc-badge">5倍 · 全部 J/Q/K</div>
        </div>
      </div>
      <div class="mc-footer">${info.desc}</div>
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
      <div class="mc-grid">
        <div class="mc-block">
          <div class="mc-label">三张凑10</div>
          <div class="mc-cards">${threeStr} ${convNote ? '<span class="mc-tag">3↔6</span>' : ''}</div>
          <div class="mc-badge">和 = ${threeSum}</div>
        </div>
        <div class="mc-block">
          <div class="mc-label">剩余两张</div>
          <div class="mc-cards">${twoStr}</div>
          <div class="mc-badge">和 = ${twoSumVal} → ${niuVal === 0 ? '牛牛' : '牛' + niuVal}</div>
        </div>
      </div>
      <div class="mc-footer">${info.desc}${convNote ? ' · ' + convNote.trim() : ''}</div>
    `;
  } else {
    html = '<div class="step">无法解析组合</div>';
  }
  
  body.innerHTML = html;
  modal.classList.add('open');
}

// 关闭弹窗
function closeInfoModal() {
  const modal = document.getElementById('info-modal');
  modal.classList.remove('open');
}

// 点击遮罩关闭
document.addEventListener('click', (e) => {
  const modal = document.getElementById('info-modal');
  if (e.target === modal) {
    modal.classList.remove('open');
  }
});

// 为了向后兼容，保留全局函数名 calculate
window.calculate = calculate;
/* 21点助手 */
function switchTab(mode) {
  document.getElementById('bull-panel').classList.toggle('hidden', mode !== 'bull');
  document.getElementById('blackjack-panel').classList.toggle('hidden', mode !== '21');
  document.getElementById('tab-bull').classList.toggle('active', mode === 'bull');
  document.getElementById('tab-bull').setAttribute('aria-selected', mode === 'bull');
  document.getElementById('tab-21').classList.toggle('active', mode === '21');
  document.getElementById('tab-21').setAttribute('aria-selected', mode === '21');
}

function parseCardValue(s) {
  s = s.trim();
  var rank = s.replace(/[\s\W]/g, '').toUpperCase();
  rank = rank.replace(/SPADE|HEART|DIAMOND|CLUB/gi, '');
  rank = rank.replace(/[^A-Z0-9]/g, '');
  if (rank === 'A') return 11;
  if (['J','Q','K'].indexOf(rank) !== -1) return 10;
  var n = parseInt(rank, 10);
  return isNaN(n) ? 0 : n;
}

function calculateBlackjack() {
  var input = document.getElementById('bj-cards').value;
  if (!input.trim()) { document.getElementById('bj-result').innerHTML = '<div style="color:#c62828">请输入手牌</div>'; return; }
  var parts = input.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
  var cardObjs = [];
  for (var i=0; i<parts.length; i++) {
    var s = parts[i];
    var rank = s.replace(/[\\s\\W]/g, '').toUpperCase();
    rank = rank.replace(/SPADE|HEART|DIAMOND|CLUB/gi, '');
    rank = rank.replace(/[^A-Z0-9]/g, '');
    if (['A','2','3','4','5','6','7','8','9','10','J','Q','K'].indexOf(rank) === -1) continue;
    var val = (rank === 'A') ? 11 : (['J','Q','K'].indexOf(rank) !== -1 ? 10 : (parseInt(rank,10) || 0));
    cardObjs.push({rank: rank, val: val, original: s.trim()});
  }
  if (cardObjs.length === 0) { document.getElementById('bj-result').innerHTML = '<div style="color:#c62828">无法识别牌值</div>'; return; }
  var n = cardObjs.length;
  var aceCount = cardObjs.filter(function(c){ return c.rank === 'A'; }).length;
  function computeBest(objArr) {
    var baseVals = objArr.map(function(c){ return (c.rank === 'A') ? 11 : c.val; });
    if (objArr.length >= 4) {
      var aceC = objArr.filter(function(c){ return c.rank === 'A'; }).length;
      return {sum: baseVals.reduce(function(a,b){ return a+b; }, 0) - aceC*10, rule: 'A固定为1'};
    } else if (objArr.length === 3) {
      var s11 = baseVals.reduce(function(a,b){ return a+b; }, 0);
      var aceC3 = objArr.filter(function(c){ return c.rank === 'A'; }).length;
      var s1 = s11 - aceC3*10;
      if (s11 <= 21 && s1 <= 21) return {sum: Math.max(s11, s1), rule: 'A可变为11或1'};
      else if (s11 <= 21) return {sum: s11, rule: 'A=11'};
      else if (s1 <= 21) return {sum: s1, rule: 'A=1'};
      else return {sum: Math.min(s11, s1), rule: 'A可变为11或1（均爆点）'};
    } else if (objArr.length === 2) {
      var s11 = baseVals.reduce(function(a,b){ return a+b; }, 0);
      var aceC2 = objArr.filter(function(c){ return c.rank === 'A'; }).length;
      var s10 = s11 - (aceC2 > 0 ? 1 : 0);
      if (aceC2 === 0) return {sum: s11, rule: '无A'};
      if (s11 <= 21 && s10 <= 21) return {sum: Math.max(s11, s10), rule: 'A可变为11或10'};
      else if (s11 <= 21) return {sum: s11, rule: 'A=11'};
      else if (s10 <= 21) return {sum: s10, rule: 'A=10'};
      else return {sum: Math.min(s11, s10), rule: 'A可变为11或10（均爆点）'};
    }
    return {sum: 0, rule: '无'};
  }
  var bestInfo = computeBest(cardObjs);
  var sum = bestInfo.sum;
  var aRule = bestInfo.rule;
  var twoAces = aceCount === 2;
  var isFiveCards = n === 5;
  var isFiveDragon = isFiveCards && sum <= 21;
  var isFiveBust = isFiveCards && sum > 21;
  var isFiveDragon21 = isFiveCards && sum === 21;
  var mult = 1;
  var label = '';
  if (twoAces) { mult = 3; label = '双A特殊 · 3倍'; }
  else if (isFiveDragon21) { mult = 5; label = '五龙21点 · 顶级5倍'; }
  else if (isFiveDragon) { mult = 3; label = '五龙 · 3倍'; }
  else if (isFiveBust) { mult = 3; label = '五张爆点 · 惩罚3倍'; }
  else { label = '常规'; }
  var deckSize = 52;
  var drawn = n;
  var remainingDeck = Math.max(0, deckSize - drawn);
  var countDrawn = {2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,10:0,11:0};
  for (var j=0; j<cardObjs.length; j++) {
    var c = cardObjs[j];
    if (c.rank === 'A') countDrawn[11]++;
    else if (['J','Q','K'].indexOf(c.rank) !== -1) countDrawn[10]++;
    else countDrawn[c.rank === '10' ? 10 : parseInt(c.rank,10)]++;
  }
  var categories = {2:{label:'2',count:4},3:{label:'3',count:4},4:{label:'4',count:4},5:{label:'5',count:4},6:{label:'6',count:4},7:{label:'7',count:4},8:{label:'8',count:4},9:{label:'9',count:4},10:{label:'10 / JQK',count:16},11:{label:'A',count:4}};
  var bustProb = 0;
  var probTable = '';
  for (var k in categories) {
    if (!categories.hasOwnProperty(k)) continue;
    var info = categories[k];
    var rem = Math.max(0, info.count - (countDrawn[k] || 0));
    var p = (remainingDeck > 0) ? (rem / remainingDeck) : 0;
    var cardVal = parseInt(k, 10);
    var finalSum = sum + cardVal;
    if (cardObjs.length === 2 && aceCount > 0) {
      // Approximate soft A handling for next draw
      if (cardVal === 11 && sum <= 11) finalSum = sum + 11; // A=11
      else if (cardVal === 11 && sum > 11) finalSum = sum + 10; // A as 10 if 11 would bust
    } else if (cardObjs.length >= 3 && aceCount > 0) {
      if (cardVal === 11) finalSum = sum + 10; // 3+ cards A treated as 10 for simplicity in prob
    }
    var isBust = finalSum > 21;
    if (isBust) bustProb += p;
    probTable += '<div class="prob-row"><span class="prob-label">' + info.label + '</span><span class="prob-val">' + (p*100).toFixed(1) + '%</span><span class="prob-tag ' + (isBust ? 'tag-bust' : 'tag-safe') + '">' + (isBust ? '爆牌' : '安全') + '</span></div>';
  }
  var pct = (bustProb * 100).toFixed(1);
  var resultHTML = '<div style="font-size:0.95rem;line-height:1.6;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;"><strong>当前总分：<span style="font-size:1.25rem;color:' + (sum > 21 ? '#c62828' : '#111827') + '">' + sum + '</span></strong><span style="font-weight:700;color:' + (mult > 1 ? '#c62828' : '#111827') + '">' + mult + '倍 · ' + label + '</span></div><div style="font-size:0.8rem;color:#555;margin-bottom:0.35rem;"><strong>A 规则：</strong> ' + aRule + '</div><div style="font-size:0.8rem;color:#555;margin-bottom:0.35rem;"><strong>手牌数：</strong> ' + n + ' 张</div><div style="font-size:0.85rem;color:#555;margin-bottom:0.5rem;"><strong>爆牌概率（下一张）：</strong> <span style="font-weight:700;color:' + (parseFloat(pct) > 50 ? '#c62828' : '#2e7d32') + '">' + pct + '%</span></div>';
  if (sum === 15) {
    resultHTML += '<div style="font-size:0.8rem;padding:0.35rem;background:#fff8e1;border-radius:0.5rem;border-left:3px solid #f59e0b;"><strong>15分节点建议：</strong> 撤退保底（安全），补牌爆牌风险约 <strong>' + pct + '%</strong>。建议：若无把握，优先撤退。</div>';
  } else if (sum === 16) {
    resultHTML += '<div style="font-size:0.8rem;padding:0.35rem;background:#fff8e1;border-radius:0.5rem;border-left:3px solid #f59e0b;"><strong>16分节点建议：</strong> 已达起步线，爆牌风险约 <strong>' + pct + '%</strong>。建议：优先停牌保本；追求收益时谨慎补牌。</div>';
  } else if (sum > 21) {
    resultHTML += '<div style="font-size:0.8rem;padding:0.35rem;background:#ffebee;border-radius:0.5rem;border-left:3px solid #c62828;"><strong>已爆点：</strong> 当前总分超过 21。若为 5 张牌，适用爆点惩罚规则（' + mult + '倍）。</div>';
  } else if (n === 5 && sum === 21) {
    resultHTML += '<div style="font-size:0.8rem;padding:0.35rem;background:#e8f5e9;border-radius:0.5rem;border-left:3px solid #2e7d32;"><strong>顶级牌型：</strong> 五龙21点（' + mult + '倍）！</div>';
  } else if (n === 5 && sum <= 21) {
    resultHTML += '<div style="font-size:0.8rem;padding:0.35rem;background:#e8f5e9;border-radius:0.5rem;border-left:3px solid #2e7d32;"><strong>五龙达成：</strong> 5 张未爆点（' + mult + '倍）。</div>';
  }
  if (twoAces) {
    resultHTML += '<div style="font-size:0.8rem;padding:0.35rem;background:#e3f2fd;border-radius:0.5rem;border-left:3px solid #2196f3;margin-top:0.35rem;"><strong>特殊牌型：</strong> 双 A（' + mult + '倍）！</div>';
  }
  resultHTML += '</div>';
  document.getElementById('bj-result').innerHTML = resultHTML;
  window._21probTable = probTable;
  window._21sum = sum;
  window._21pct = pct;
  window._21mult = mult;
  window._21label = label;
}

function open21Info() {
  var body = document.getElementById('modal-body');
  var title = document.getElementById('modal-title');
  title.textContent = '21点 — 抽牌概率详情';
  var tbl = window._21probTable || '<div>请先计算</div>';
  body.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;font-size:0.85rem;">' + tbl + '</div>';
  if (window._21label) {
    body.innerHTML += '<div style="margin-top:0.75rem;padding-top:0.5rem;border-top:1px solid var(--border);font-weight:700;font-size:1rem;color:var(--text-main);">' + window._21label + ' · 当前 ' + window._21sum + ' 分 · 爆牌风险 ' + window._21pct + '%</div>';
  }
  document.getElementById('info-modal').classList.add('open');
}

window.switchTab = switchTab;
window.calculateBlackjack = calculateBlackjack;
window.open21Info = open21Info;
