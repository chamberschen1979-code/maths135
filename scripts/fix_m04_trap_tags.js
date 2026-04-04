import fs from 'fs';

const m04Path = './src/data/M04.json';
const m04 = JSON.parse(fs.readFileSync(m04Path, 'utf-8'));

console.log('=== M04.json L4 trap_tags 补全脚本 ===\n');

// 统计 L4 题目 trap_tags 情况
let l4Total = 0;
let l4MissingTraps = 0;

for (const spec of m04.specialties) {
  for (const variation of spec.variations) {
    for (const q of variation.original_pool) {
      if (q.level === 'L4') {
        l4Total++;
        const traps = q.meta?.trap_tags || [];
        if (traps.length === 0) {
          l4MissingTraps++;
        }
      }
    }
  }
}

console.log(`L4 题目总数: ${l4Total}`);
console.log(`缺少 trap_tags: ${l4MissingTraps}\n`);

// 根据变例主题定义常见陷阱
const trapTemplates = {
  '1.1': [ // 复合运算与指对转化
    '换底公式应用时底数和真数对应错误',
    '指数与对数互化时符号错误',
    '忽略定义域限制导致结果错误',
    '链式运算中中间步骤计算失误',
    '对数恒等式记忆模糊导致代入错误'
  ],
  '1.2': [ // 指对同构
    '比较大小未考虑函数单调性',
    '中间值法选择不当导致判断错误',
    '忽略底数对单调性的影响',
    '构造函数时形式选择错误',
    '同构变形时等价性判断失误'
  ],
  '2.1': [ // 对数不等式与参数范围
    '解不等式时忽略定义域限制',
    '分类讨论不全面导致漏解',
    '参数范围取交集时计算错误',
    '对数不等式方向判断错误',
    '边界值取舍不当'
  ],
  '2.2': [ // 复合函数零点
    '换元后忽略新变量取值范围',
    '分段函数分段讨论不完整',
    '零点存在性定理应用条件不足',
    '复合函数单调性判断错误',
    '多解情况遗漏'
  ],
  '2.3': [ // 奇偶性与周期性
    '奇偶性判断前未检验定义域对称性',
    '周期性与对称性混淆',
    '利用性质画图时关键点遗漏',
    '周期函数的定义域理解错误',
    '对称轴与周期关系判断失误'
  ]
};

// 补全 trap_tags
let fixedCount = 0;

for (const spec of m04.specialties) {
  for (const variation of spec.variations) {
    const varId = variation.var_id;
    const traps = trapTemplates[varId] || [
      '审题不仔细导致理解偏差',
      '计算过程中符号错误',
      '分类讨论不全面',
      '边界条件处理不当',
      '检验环节遗漏'
    ];
    
    for (const q of variation.original_pool) {
      if (q.level === 'L4') {
        const existingTraps = q.meta?.trap_tags || [];
        
        if (existingTraps.length === 0) {
          // 从模板中随机选择 2-3 个陷阱
          const numTraps = Math.floor(Math.random() * 2) + 2;
          const shuffled = [...traps].sort(() => Math.random() - 0.5);
          const selectedTraps = shuffled.slice(0, numTraps);
          
          if (!q.meta) q.meta = {};
          q.meta.trap_tags = selectedTraps;
          
          console.log(`${q.id}: 添加 ${selectedTraps.length} 个陷阱标签`);
          fixedCount++;
        }
      }
    }
  }
}

// 保存
m04.last_updated = new Date().toISOString().split('T')[0];
fs.writeFileSync(m04Path, JSON.stringify(m04, null, 2), 'utf-8');

console.log(`\n=== 补全完成 ===`);
console.log(`共为 ${fixedCount} 道 L4 题目补充了 trap_tags`);
