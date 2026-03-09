const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/M10.json', 'utf8'));

// 更新 Meta 信息
data.logic_schema_version = "9.6-LIB-SYNC";
data.last_updated = "2026-03-09";

// 武器映射规则
const weaponMapping = {
  '1.1': {
    toolkit: ['S-CONIC-01'],
    note: '本变例核心武器：S-CONIC-01 (定义降维与第三定义)。利用第一/二定义将复杂距离关系转化为基本量，利用第三定义将斜率积直接转化为离心率。'
  },
  '1.2': {
    toolkit: ['S-CONIC-02'],
    note: '本变例核心武器：S-CONIC-02 (焦点三角形面积/角度模型)。拒绝繁琐的余弦定理展开，利用面积秒杀公式和定义式整体代换。'
  },
  '2.1': {
    toolkit: ['S-CONIC-03'],
    note: '本变例核心武器：S-CONIC-03 (渐近线几何性质与距离公式)。利用焦到渐近距离为 b 这一核心性质，避免复杂运算。'
  },
  '2.2': {
    toolkit: ['S-CONIC-04'],
    note: '本变例核心武器：S-CONIC-04 (几何不等式构造与边界分析)。通过几何约束构建关于 e 的不等式，核心在于边界条件的精准判定。'
  }
};

// 统计
let deletedCount = 0;
let updatedCount = 0;

// 遍历更新
data.specialties.forEach(function(specialty) {
  specialty.variations.forEach(function(variation) {
    const varId = variation.var_id;
    const mapping = weaponMapping[varId];
    
    if (mapping) {
      // 更新 toolkit
      if (variation.toolkit) {
        variation.toolkit.linked_weapons = mapping.toolkit;
        variation.toolkit.weapon_map_note = mapping.note;
        updatedCount++;
        console.log('变例 ' + varId + ' toolkit 已更新: ' + JSON.stringify(mapping.toolkit));
      }
      
      // 删除 master_benchmarks 中的 linked_weapons
      if (variation.master_benchmarks) {
        variation.master_benchmarks.forEach(function(benchmark) {
          if (benchmark.analysis && benchmark.analysis.linked_weapons) {
            delete benchmark.analysis.linked_weapons;
            deletedCount++;
          }
        });
      }
    }
  });
});

// 保存文件
fs.writeFileSync('src/data/M10.json', JSON.stringify(data, null, 2), 'utf8');

console.log('\n=== M10.json 更新报告 ===');
console.log('已更新 toolkit 数: ' + updatedCount);
console.log('已删除 master_benchmarks.linked_weapons 数: ' + deletedCount);
console.log('\nM10.json 武器库映射已完成');
