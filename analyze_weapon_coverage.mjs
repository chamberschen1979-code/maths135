import fs from 'fs';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         各母题杀手锏配置深度分析                              ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const motifFiles = ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09'];

// 读取 weapon_details.json
let weaponDetails = {};
try {
  weaponDetails = JSON.parse(fs.readFileSync('./src/data/weapon_details.json', 'utf8'));
} catch (e) {}

for (const motif of motifFiles) {
  const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📁 ${motif} ${data.motif_name}`);
  console.log(`${'═'.repeat(60)}`);
  
  // 统计变例级别的杀手锏
  const variations = [];
  let totalVariWeapons = 0;
  
  data.specialties?.forEach(spec => {
    spec.variations?.forEach(vari => {
      const weapons = vari.toolkit?.linked_weapons || [];
      totalVariWeapons += weapons.length;
      
      // 统计该变例的题目分布
      let l2Count = 0, l3Count = 0, l4Count = 0;
      let l2WithWeapon = 0, l3WithWeapon = 0, l4WithWeapon = 0;
      
      vari.original_pool?.forEach(p => {
        let level = p.level || p.meta?.level || 'L2';
        if (p.id && p.id.includes('_L2')) level = 'L2';
        if (p.id && p.id.includes('_L3')) level = 'L3';
        if (p.id && p.id.includes('_L4')) level = 'L4';
        
        const pWeapons = p.weapons || p.meta?.weapons || [];
        
        if (level === 'L2') { l2Count++; if (pWeapons.length > 0) l2WithWeapon++; }
        else if (level === 'L3') { l3Count++; if (pWeapons.length > 0) l3WithWeapon++; }
        else { l4Count++; if (pWeapons.length > 0) l4WithWeapon++; }
      });
      
      variations.push({
        id: `${spec.spec_id}.${vari.var_id}`,
        name: vari.name,
        weapons: weapons,
        l2: l2Count,
        l3: l3Count,
        l4: l4Count,
        l3WithWeapon,
        l4WithWeapon
      });
    });
  });
  
  // 输出变例统计
  console.log(`\n变例级别杀手锏配置:`);
  variations.forEach(v => {
    const weaponStr = v.weapons.length > 0 ? v.weapons.join(', ') : '(无)';
    const l3Rate = v.l3 > 0 ? ((v.l3WithWeapon / v.l3 * 100) || (v.weapons.length > 0 ? 100 : 0)).toFixed(0) : 0;
    const l4Rate = v.l4 > 0 ? ((v.l4WithWeapon / v.l4 * 100) || (v.weapons.length > 0 ? 100 : 0)).toFixed(0) : 0;
    
    console.log(`  ${v.id} ${v.name}`);
    console.log(`    变例级武器: ${weaponStr}`);
    console.log(`    题目分布: L2=${v.l2}, L3=${v.l3}(${l3Rate}%), L4=${v.l4}(${l4Rate}%)`);
  });
  
  // 分析问题
  console.log(`\n📊 分析:`);
  
  const avgWeaponsPerVari = totalVariWeapons / variations.length;
  console.log(`  平均每个变例配置 ${avgWeaponsPerVari.toFixed(1)} 个杀手锏`);
  
  // 检查是否有变例没有配置杀手锏
  const noWeaponVaris = variations.filter(v => v.weapons.length === 0);
  if (noWeaponVaris.length > 0) {
    console.log(`  ⚠️  有 ${noWeaponVaris.length} 个变例没有配置杀手锏:`);
    noWeaponVaris.forEach(v => {
      console.log(`    - ${v.id} ${v.name}`);
    });
  }
  
  // 检查 L3/L4 题目覆盖率低的变例
  const lowCoverageVaris = variations.filter(v => {
    const l3Rate = v.l3 > 0 ? (v.l3WithWeapon / v.l3 * 100) || (v.weapons.length > 0 ? 100 : 0) : 0;
    const l4Rate = v.l4 > 0 ? (v.l4WithWeapon / v.l4 * 100) || (v.weapons.length > 0 ? 100 : 0) : 0;
    return (v.l3 > 0 && l3Rate < 80) || (v.l4 > 0 && l4Rate < 80);
  });
  
  if (lowCoverageVaris.length > 0) {
    console.log(`  ⚠️  有 ${lowCoverageVaris.length} 个变例 L3/L4 覆盖率低于 80%:`);
    lowCoverageVaris.forEach(v => {
      const l3Rate = v.l3 > 0 ? ((v.l3WithWeapon / v.l3 * 100) || (v.weapons.length > 0 ? 100 : 0)).toFixed(0) : 0;
      const l4Rate = v.l4 > 0 ? ((v.l4WithWeapon / v.l4 * 100) || (v.weapons.length > 0 ? 100 : 0)).toFixed(0) : 0;
      console.log(`    - ${v.id}: L3=${l3Rate}%, L4=${l4Rate}%`);
    });
  }
}
