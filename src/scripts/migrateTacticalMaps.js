/**
 * 迁移脚本：将 tacticalMaps.json 中的 sub_targets 状态迁移到 specialties 结构
 * 
 * 运行方式：node src/scripts/migrateTacticalMaps.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LEVEL_INITIAL_ELO = { L1: 800, L2: 1000, L3: 1800, L4: 2500 };

const MOTIF_FILES = {
  'M01': '../data/M01.json',
  'M02': '../data/M02.json',
  'M03': '../data/M03.json',
  'M04': '../data/M04.json',
  'M05': '../data/M05.json',
  'M06': '../data/M06.json',
  'M07': '../data/M07.json',
  'M08': '../data/M08.json',
  'M09': '../data/M09.json',
  'M10': '../data/M10.json',
  'M11': '../data/M11.json',
  'M12': '../data/M12.json',
  'M13': '../data/M13.json',
  'M14': '../data/M14.json',
  'M15': '../data/M15.json',
  'M16': '../data/M16.json',
  'M17': '../data/M17.json',
};

async function loadMotifData(motifId) {
  const filePath = path.join(__dirname, MOTIF_FILES[motifId]);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.warn(`无法加载 ${motifId} 数据:`, e.message);
    return null;
  }
}

function generateLegacyId(motifId, level, index) {
  return `${motifId}_${level}_${index}`;
}

function migrateEncounter(encounter, motifData) {
  const oldSubTargets = encounter.sub_targets || [];
  
  if (!motifData?.specialties) {
    console.log(`  [${encounter.target_id}] 无 specialties 数据，保留原状`);
    return encounter;
  }
  
  const subTargetMap = new Map();
  oldSubTargets.forEach(sub => {
    subTargetMap.set(sub.sub_id, sub);
  });
  
  const newSpecialties = JSON.parse(JSON.stringify(motifData.specialties));
  
  const levelCounters = { L2: 0, L3: 0, L4: 0 };
  
  newSpecialties.forEach(spec => {
    spec.variations?.forEach(v => {
      v.master_benchmarks?.forEach(b => {
        const level = b.level;
        levelCounters[level]++;
        const legacyId = generateLegacyId(encounter.target_id, level, levelCounters[level]);
        
        b.legacy_id = legacyId;
        
        const oldSub = subTargetMap.get(legacyId);
        if (oldSub) {
          b.is_mastered = oldSub.is_mastered === true;
          b.consecutive_correct = oldSub.consecutive_correct || 0;
          b.last_practice = oldSub.last_practice || null;
          b.l2_status = oldSub.l2_status || 'GREEN';
          b.elo = LEVEL_INITIAL_ELO[level];
          console.log(`  [${encounter.target_id}] 迁移 ${legacyId}: is_mastered=${b.is_mastered}`);
        } else {
          b.is_mastered = false;
          b.consecutive_correct = 0;
          b.last_practice = null;
          b.l2_status = 'GREEN';
          b.elo = LEVEL_INITIAL_ELO[level];
        }
      });
    });
  });
  
  const newEncounter = {
    ...encounter,
    specialties: newSpecialties,
    schemaVersion: 2
  };
  
  delete newEncounter.sub_targets;
  
  return newEncounter;
}

async function main() {
  console.log('=== 开始迁移 tacticalMaps.json ===\n');
  
  const tacticalMapsPath = path.join(__dirname, '../data/tacticalMaps.json');
  const tacticalMaps = JSON.parse(fs.readFileSync(tacticalMapsPath, 'utf-8'));
  
  console.log(`当前 schemaVersion: ${tacticalMaps.schemaVersion}`);
  
  if (tacticalMaps.schemaVersion >= 2) {
    console.log('数据已经是 v2 版本，无需迁移');
    return;
  }
  
  let totalMigrated = 0;
  let totalSkipped = 0;
  
  for (const map of tacticalMaps.tactical_maps) {
    console.log(`\n处理地图: ${map.map_name}`);
    
    for (let i = 0; i < map.encounters.length; i++) {
      const encounter = map.encounters[i];
      console.log(`  处理母题: ${encounter.target_id} - ${encounter.target_name}`);
      
      const motifData = await loadMotifData(encounter.target_id);
      
      if (motifData?.specialties) {
        map.encounters[i] = migrateEncounter(encounter, motifData);
        totalMigrated++;
      } else {
        console.log(`  [${encounter.target_id}] 跳过，无 specialties 数据`);
        totalSkipped++;
      }
    }
  }
  
  tacticalMaps.schemaVersion = 2;
  tacticalMaps.DATA_VERSION = '12.0-UNIFIED';
  
  const backupPath = path.join(__dirname, '../data/tacticalMaps.backup.json');
  fs.writeFileSync(backupPath, fs.readFileSync(tacticalMapsPath));
  console.log(`\n备份已保存到: ${backupPath}`);
  
  fs.writeFileSync(tacticalMapsPath, JSON.stringify(tacticalMaps, null, 2));
  console.log(`\n迁移完成！`);
  console.log(`  - 成功迁移: ${totalMigrated} 个母题`);
  console.log(`  - 跳过: ${totalSkipped} 个母题`);
}

main().catch(console.error);
