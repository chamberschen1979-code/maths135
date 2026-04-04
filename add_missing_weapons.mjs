import fs from 'fs';

const strategyLib = JSON.parse(fs.readFileSync('./src/data/strategy_lib.json', 'utf8'));
const weaponDetails = JSON.parse(fs.readFileSync('./src/data/weapon_details.json', 'utf8'));

const missingWeapons = [
  'S-TRIG-05', 'S-VEC-02', 'S-VEC-03', 'S-VEC-06',
  'S-SEQ-03', 'S-SEQ-06', 'S-SEQ-07',
  'S-TRI-05', 'S-TRI-06', 'S-TRI-07', 'S-TRI-08', 'S-TRI-09', 'S-TRI-10'
];

const categoryMap = {
  'S-TRIG': 'S-TRIG',
  'S-VEC': 'S-VEC',
  'S-SEQ': 'S-SEQ',
  'S-TRI': 'S-TRI'
};

function convertToStrategyLibFormat(weaponId, details) {
  return {
    id: weaponId,
    name: details.name || weaponId,
    rank: details.difficulty === 'L4' ? 'advanced' : (details.difficulty === 'L3' ? 'intermediate' : 'basic'),
    logic_flow: details.coreLogic,
    description: details.coreLogic,
    learnContent: {
      coreLogic: details.coreLogic,
      scenarios: details.scenarios || [],
      pitfalls: details.pitfalls || [],
      exampleQuestion: details.example?.question || '',
      exampleSolution: details.example?.solution || ''
    },
    trigger_keywords: details.trigger_keywords || [],
    linked_motifs: []
  };
}

// 找到或创建分类
function findOrCreateCategory(categoryId, categoryName) {
  let category = strategyLib.categories.find(c => c.id === categoryId);
  if (!category) {
    category = {
      id: categoryId,
      name: categoryName,
      weapons: []
    };
    strategyLib.categories.push(category);
  }
  return category;
}

// 添加缺失的武器
for (const weaponId of missingWeapons) {
  const details = weaponDetails[weaponId];
  if (!details) {
    console.log(`❌ ${weaponId}: 在 weapon_details.json 中未找到`);
    continue;
  }
  
  const categoryId = weaponId.split('-').slice(0, 2).join('-');
  const categoryNames = {
    'S-TRIG': '三角函数思维',
    'S-VEC': '平面向量思维',
    'S-SEQ': '数列思维',
    'S-TRI': '解三角形思维'
  };
  
  const category = findOrCreateCategory(categoryId, categoryNames[categoryId]);
  
  // 检查武器是否已存在
  if (category.weapons.find(w => w.id === weaponId)) {
    console.log(`✓ ${weaponId}: 已存在`);
    continue;
  }
  
  // 添加武器
  const newWeapon = convertToStrategyLibFormat(weaponId, details);
  category.weapons.push(newWeapon);
  console.log(`✅ ${weaponId}: 已添加到 ${categoryId}`);
}

// 写回文件
fs.writeFileSync('./src/data/strategy_lib.json', JSON.stringify(strategyLib, null, 2), 'utf8');
console.log('\n完成！');
