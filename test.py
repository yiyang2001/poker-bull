import itertools

# 定义牌面值
card_values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
card_suits = ['♠', '♥', '♦', '♣']

# 创建52张牌
deck = [f'{value}{suit}' for value in card_values for suit in card_suits]

# 牌面点数映射
card_points = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10
}

# 生成所有5张牌的组合
combinations = list(itertools.combinations(deck, 5))

def calculate_hand_type(hand):
    """计算一手牌的类型"""
    
    # 计算牌点数
    points = [card_points[card[:-1]] for card in hand]  # 取牌面的点数
    remaining_cards = [card for card in hand]  # 剩余两张牌
    
    # 1. 判断是否为五花牛（所有牌都是JQK）
    if all(card[:-1] in ['J', 'Q', 'K'] for card in hand):
        return "五花牛（5倍）"
    
    # 2. 判断是否为牛冬菇（A♠ 和 J/Q/K）
    spade_a = any(card[:-1] == 'A' and card[-1] == '♠' for card in hand)
    jqk = any(card[:-1] in ['J', 'Q', 'K'] for card in hand)
    if spade_a and jqk:
        return "牛冬菇（3倍）"
    
    # 3. 分析剩余2张牌是否为孖宝（对子）
    remaining_points = [card_points[card[:-1]] for card in remaining_cards[-2:]]
    if remaining_points[0] == remaining_points[1]:
        return "孖宝（2倍）"
    
    # 4. 判断是否为牛牛，牛9, 牛8...
    three_cards = points[:3]
    two_cards = points[3:]
    sum_three = sum(three_cards)
    
    # 5. 如果能组成10的倍数为牛牛
    if sum_three % 10 == 0:
        return f"牛牛"
    
    # 如果不是牛牛
    return "无牛"

# 遍历每个组合并计算结果
result = []
for hand in combinations:
    hand_type = calculate_hand_type(hand)
    result.append((hand, hand_type))

# 打印前几个结果
for hand, hand_type in result[:10000000000]:  # 只打印前10个组合
    print(f"牌组：{hand} -> 类型：{hand_type}")
