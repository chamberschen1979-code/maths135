import fs from 'fs';

const m05Path = './src/data/M05.json';
const seedsPath = './src/data/M05_seeds.json';

const m05 = JSON.parse(fs.readFileSync(m05Path, 'utf-8'));
const seeds = JSON.parse(fs.readFileSync(seedsPath, 'utf-8'));

console.log('=== M05 种子题合并脚本 ===\n');
console.log(`M05.json 当前题目数: ${countQuestions(m05)}`);
console.log(`M05_seeds.json 种子题数: ${countQuestions(seeds)}\n`);

// 1. 提取种子题
const seedQuestions = extractSeedQuestions(seeds);
console.log(`提取到 ${seedQuestions.length} 道种子题\n`);

// 2. 将种子题插入到每个变例的 original_pool 开头
let insertedCount = 0;
for (const spec of m05.specialties) {
  for (const variation of spec.variations) {
    const varId = variation.var_id;
    const seedsForVar = seedQuestions.filter(q => q.varId === varId);
    
    if (seedsForVar.length > 0) {
      // 按难度排序：L2 -> L3 -> L4
      seedsForVar.sort((a, b) => {
        const order = { 'L2': 1, 'L3': 2, 'L4': 3 };
        return order[a.level] - order[b.level];
      });
      
      // 插入到 original_pool 开头
      variation.original_pool = [...seedsForVar, ...variation.original_pool];
      insertedCount += seedsForVar.length;
      console.log(`变例 ${varId}: 插入 ${seedsForVar.length} 道种子题`);
    }
  }
}

console.log(`\n共插入 ${insertedCount} 道种子题\n`);

// 3. 修改所有题目的 data_source 为 "original"
let modifiedCount = 0;
for (const spec of m05.specialties) {
  for (const variation of spec.variations) {
    for (const q of variation.original_pool) {
      if (q.data_source !== 'original') {
        q.data_source = 'original';
        modifiedCount++;
      }
    }
  }
}

console.log(`修改了 ${modifiedCount} 个题目的 data_source 为 "original"\n`);

// 4. 更新描述
m05.description = `【清洗版 v7.0】包含投影向量、极化恒等式、三点共线、建系策略的完整题目集。已合并 12 道种子题。`;
m05.last_updated = new Date().toISOString().split('T')[0];

// 5. 保存
fs.writeFileSync(m05Path, JSON.stringify(m05, null, 2), 'utf-8');
console.log(`M05.json 已更新，总题目数: ${countQuestions(m05)}\n`);

// 6. 统计各变例题目数量
console.log('=== 各变例题目统计 ===');
for (const spec of m05.specialties) {
  for (const variation of spec.variations) {
    const pool = variation.original_pool;
    const l2 = pool.filter(q => q.level === 'L2').length;
    const l3 = pool.filter(q => q.level === 'L3').length;
    const l4 = pool.filter(q => q.level === 'L4').length;
    console.log(`${spec.spec_id}/${variation.var_id} ${variation.name}: 总${pool.length}题 (L2:${l2}, L3:${l3}, L4:${l4})`);
  }
}

function countQuestions(data) {
  let count = 0;
  for (const spec of data.specialties) {
    for (const variation of spec.variations) {
      count += (variation.original_pool || []).length;
    }
  }
  return count;
}

function extractSeedQuestions(seedsData) {
  const questions = [];
  for (const spec of seedsData.specialties) {
    for (const variation of spec.variations) {
      for (const q of variation.original_pool) {
        // 修改 data_source 为 original
        questions.push({
          ...q,
          data_source: 'original',
          tags: (q.tags || []).filter(t => t !== '种子题') // 移除种子题标签
        });
      }
    }
  }
  return questions;
}
