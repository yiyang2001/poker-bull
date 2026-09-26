function calculate() {
  const cardsInput = document.getElementById("cards").value;
  const cards = cardsInput.split(",").map((c) => c.trim().toUpperCase());
  const resultList = document.getElementById("result");
  resultList.innerHTML = "";

  if (cards.length !== 5) {
    alert("请输入5张牌！");
    return;
  }

  // 生成所有可能的三张+两张组合
  const allCombos = getPossibleCombinations(cards);

  // 分析所有有效组合
  const validCombos = allCombos
    .map((combo) => analyzeCombo(combo))
    .filter((combo) => combo !== null);

  // 如果没有有效组合
  if (validCombos.length === 0) {
    resultList.innerHTML = "<li>无牛</li>";
    return;
  }

  // 排序规则：类型优先级 > 牛值
  validCombos.sort((a, b) => {
    const typeOrder = ["wuhuaniu", "niudonggu", "mabao", "niuniu", "niuX"];
    const aTypeIndex = typeOrder.indexOf(a.type);
    const bTypeIndex = typeOrder.indexOf(b.type);

    // 类型优先级比较
    if (aTypeIndex !== bTypeIndex) {
      return aTypeIndex - bTypeIndex; // 升序排列（index越小优先级越高）
    }

    // 同类型时比较牛值（越大越好）
    return b.niuValue - a.niuValue;
  });

  // 显示结果
  validCombos.forEach((combo) => {
    const li = document.createElement("li");
    let displayText = "";

    switch (combo.type) {
      case "wuhuaniu":
        displayText = "🐮 五花牛 (5倍)";
        break;
      case "niudonggu":
        displayText = `🍄 牛冬菇 (3倍) 剩余牌: ${combo.twoCards.join(",")}`;
        break;
      case "mabao":
        displayText = `🐟 牛孖 (2倍) 牛${
          combo.niuValue
        } [${combo.threeCards.join(",")} + ${combo.twoCards.join(",")}]`;
        break;
      case "niuniu":
        displayText = "🐮 牛牛 (1倍)";
        break;
      case "niuX":
        displayText = `🐮 牛${combo.niuValue} [${combo.threeCards.join(
          ","
        )} + ${combo.twoCards.join(",")}]`;
        break;
    }

    li.innerHTML = displayText;
    resultList.appendChild(li);
  });
}

/* 生成所有三张+两张的组合 */
function getPossibleCombinations(cards) {
  const combos = [];
  const n = cards.length;

  // 遍历所有可能的三张组合
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        const three = [cards[i], cards[j], cards[k]];
        const two = cards.filter((_, idx) => ![i, j, k].includes(idx));
        combos.push({ three, two });
      }
    }
  }
  return combos;
}

/* 分析组合类型 */
function analyzeCombo(combo) {
  // 计算三张牌总和
  const threeSum = combo.three.reduce(
    (sum, card) => sum + getCardValue(card),
    0
  );

  // 1. 检查是否无牛
  if (threeSum % 10 !== 0) return null;

  // 2. 检查五花牛（需要先检查，因为它包含5张牌）
  if (isWuHuaNiu([...combo.three, ...combo.two])) {
    return {
      type: "wuhuaniu",
      multiplier: 5,
      threeCards: combo.three,
      twoCards: combo.two,
    };
  }

  // 3. 检查牛冬菇（需要两张牌）
  if (isNiuDongGu(combo.two)) {
    return {
      type: "niudonggu",
      multiplier: 3,
      threeCards: combo.three,
      twoCards: combo.two,
      niuValue: 0, // 牛冬菇不需要计算牛值
    };
  }

  // 4. 计算牛值
  const twoSum = combo.two.reduce((sum, card) => sum + getCardValue(card), 0);
  const niuValue = twoSum % 10;

  // 5. 检查孖宝（对子）
  if (isMabao(combo.two)) {
    return {
      type: "mabao",
      multiplier: 2,
      threeCards: combo.three,
      twoCards: combo.two,
      niuValue,
    };
  }

  // 6. 普通牛型
  return {
    type: niuValue === 0 ? "niuniu" : "niuX",
    multiplier: 1,
    threeCards: combo.three,
    twoCards: combo.two,
    niuValue,
  };
}

/* 工具函数 */
function getCardValue(card) {
  if (card === "A") return 1;
  if (["J", "Q", "K"].includes(card)) return 10;
  return parseInt(card) || 0; // 处理数字牌
}

function isWuHuaNiu(cards) {
  return cards.every((c) => ["J", "Q", "K"].includes(c));
}

function isNiuDongGu(twoCards) {
  // 需要黑桃A + J/Q/K（这里简化处理，假设输入格式为 As 代表黑桃A）
  const hasBlackA = twoCards.some((c) => c === "As"); // 假设输入用 As 表示黑桃A
  const hasFaceCard = twoCards.some((c) => ["J", "Q", "K"].includes(c));
  return hasBlackA && hasFaceCard && twoCards.length === 2;
}

function isMabao(twoCards) {
  // 两张牌点数相同（注意：J/Q/K 都算10点）
  const values = twoCards.map((c) => getCardValue(c));
  return values[0] === values[1];
}
