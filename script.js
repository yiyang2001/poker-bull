
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
