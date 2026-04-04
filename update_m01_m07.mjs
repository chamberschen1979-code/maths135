import fs from 'fs';

// M01 的变例武器映射（使用 var_id 作为键）
const m01WeaponMap = {
  '1.1': ['S-SET-01'],  // 集合基本运算
  '1.2': ['S-SET-01'],  // 子集问题
  '2.1': ['S-LOG-02'],  // 命题判断
  '2.2': ['S-LOG-02'],  // 充要条件
  '3.1': ['S-COMPLEX-01'],  // 复数运算
  '3.2': ['S-COMPLEX-01'],  // 复数几何意义
};

// M07 的变例武器映射（使用 var_id 作为键）
const m07WeaponMap = {
  '1.1': ['S-TRI-09'],  // 余弦定理直接计算
  '1.2': ['S-TRI-04'],  // 正弦定理与面积
  '2.1': ['S-TRI-06'],  // 中线长公式
  '2.2': ['S-TRI-08'],  // 边化角
};

// 处理 M01
console.log('\n处理 M01...');
const m01 = JSON.parse(fs.readFileSync('./src/data/M01.json', 'utf8'));
let m01Count = 0;

m01.specialties?.forEach(spec => {
  spec.variations?.forEach(vari => {
    const varId = vari.var_id;  // 如 "1.1"
    const weapons = m01WeaponMap[varId] || [];
    
    if (weapons.length === 0) {
      console.log(`  变例 ${varId} 没有配置武器映射`);
      return;
    }
    
    vari.original_pool?.forEach(p => {
      if (p.weapons && p.weapons.length === 0) {
        p.weapons = [...weapons];
        m01Count++;
      }
    });
  });
});

fs.writeFileSync('./src/data/M01.json', JSON.stringify(m01, null, 2), 'utf8');
console.log(`  更新了 ${m01Count} 道题的武器配置`);

// 处理 M07
console.log('\n处理 M07...');
const m07 = JSON.parse(fs.readFileSync('./src/data/M07.json', 'utf8'));
let m07Count = 0;

m07.specialties?.forEach(spec => {
  spec.variations?.forEach(vari => {
    const varId = vari.var_id;  // 如 "1.1"
    const weapons = m07WeaponMap[varId] || [];
    
    if (weapons.length === 0) {
      console.log(`  变例 ${varId} 没有配置武器映射`);
      return;
    }
    
    vari.original_pool?.forEach(p => {
      // M07 没有 weapons 字段，需要添加
      if (!p.weapons) {
        p.weapons = [...weapons];
        m07Count++;
      } else if (p.weapons.length === 0) {
        p.weapons = [...weapons];
        m07Count++;
      }
    });
  });
});

fs.writeFileSync('./src/data/M07.json', JSON.stringify(m07, null, 2), 'utf8');
console.log(`  更新了 ${m07Count} 道题的武器配置`);

console.log('\n完成！');
