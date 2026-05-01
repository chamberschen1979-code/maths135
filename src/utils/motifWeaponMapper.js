import tacticalMaps from '../data/tacticalMaps.json' with { type: 'json' };
import weaponDetails from '../data/weapon_details.json' with { type: 'json' };

import M01 from '../data/M01.json' with { type: 'json' };
import M02 from '../data/M02.json' with { type: 'json' };
import M03 from '../data/M03.json' with { type: 'json' };
import M04 from '../data/M04.json' with { type: 'json' };
import M05 from '../data/M05.json' with { type: 'json' };
import M06 from '../data/M06.json' with { type: 'json' };
import M07 from '../data/M07.json' with { type: 'json' };
import M08 from '../data/M08.json' with { type: 'json' };
import M09 from '../data/M09.json' with { type: 'json' };
import M10 from '../data/M10.json' with { type: 'json' };
import M11 from '../data/M11.json' with { type: 'json' };
import M12 from '../data/M12.json' with { type: 'json' };
import M13 from '../data/M13.json' with { type: 'json' };
import M14 from '../data/M14.json' with { type: 'json' };
import M15 from '../data/M15.json' with { type: 'json' };
import M16 from '../data/M16.json' with { type: 'json' };
import M17 from '../data/M17.json' with { type: 'json' };

const motifFiles = {
  M01, M02, M03, M04, M05, M06, M07, M08, M09, M10,
  M11, M12, M13, M14, M15, M16, M17
};

const extractWeaponsFromMotifFile = (motifData, motifId) => {
  const weapons = new Set();
  
  if (motifData?.toolkit?.linked_weapons) {
    motifData.toolkit.linked_weapons.forEach(w => weapons.add(w));
  }
  
  if (motifData?.specialties) {
    for (const spec of motifData.specialties) {
      if (spec.toolkit?.linked_weapons) {
        spec.toolkit.linked_weapons.forEach(w => weapons.add(w));
      }
      if (spec.variations) {
        for (const variation of spec.variations) {
          if (variation.toolkit?.linked_weapons) {
            variation.toolkit.linked_weapons.forEach(w => weapons.add(w));
          }
          if (variation.original_pool) {
            for (const question of variation.original_pool) {
              if (question.weapons) {
                question.weapons.forEach(w => weapons.add(w));
              }
              if (question.meta?.weapons) {
                question.meta.weapons.forEach(w => weapons.add(w));
              }
            }
          }
        }
      }
    }
  }
  
  return Array.from(weapons);
};

const buildMotifWeaponMap = () => {
  const map = {};
  
  for (const [motifId, motifData] of Object.entries(motifFiles)) {
    const motifName = motifData?.name || motifData?.motif_name || motifId;
    const weapons = extractWeaponsFromMotifFile(motifData, motifId);
    
    map[motifId] = {
      name: motifName,
      weapons: weapons
    };
  }
  
  const allWeaponsInDetails = Object.keys(weaponDetails);
  const usedWeapons = new Set();
  for (const data of Object.values(map)) {
    data.weapons.forEach(w => usedWeapons.add(w));
  }
  
  const unusedWeapons = allWeaponsInDetails.filter(w => !usedWeapons.has(w));
  if (unusedWeapons.length > 0) {
  }
  
  return map;
};

export const motifWeaponMap = buildMotifWeaponMap();

export const getLinkedMotifsForWeapon = (weaponId) => {
  const linkedMotifs = [];
  
  for (const [motifId, data] of Object.entries(motifWeaponMap)) {
    if (data.weapons && data.weapons.includes(weaponId)) {
      linkedMotifs.push({
        id: motifId,
        name: data.name
      });
    }
  }
  
  return linkedMotifs;
};

export const getLinkedWeaponsForMotif = (motifId) => {
  const data = motifWeaponMap[motifId];
  if (!data) return [];
  
  return data.weapons.map(weaponId => {
    const weaponInfo = getWeaponInfo(weaponId);
    return weaponInfo ? {
      id: weaponId,
      name: weaponInfo.name
    } : null;
  }).filter(Boolean);
};

const getWeaponInfo = (weaponId) => {
  const weapon = weaponDetails[weaponId];
  if (weapon) {
    return {
      id: weaponId,
      name: weaponId,
      ...weapon
    };
  }
  return null;
};

export const getMotifInfo = (motifId) => {
  for (const map of tacticalMaps.tactical_maps) {
    const encounter = map.encounters.find(e => e.target_id === motifId);
    if (encounter) {
      return {
        id: motifId,
        name: encounter.target_name
      };
    }
  }
  
  return null;
};

export const isMotifActivated = (motifId, tacticalData) => {
  if (!tacticalData?.tactical_maps) return false
  
  for (const map of tacticalData.tactical_maps) {
    const encounter = map.encounters?.find(e => e.target_id === motifId)
    if (encounter) {
      return encounter.gear_level > 0 || (encounter.elo_score && encounter.elo_score > 1000)
    }
  }
  
  return false
}

export const getWeaponStatus = (weapon, tacticalData) => {
  const certifiedWeapons = tacticalData?.user_profile?.certifiedWeapons || []
  if (certifiedWeapons.includes(weapon.id)) {
    return 'CERTIFIED'
  }
  
  const linkedMotifs = weapon.linked_motifs || []
  const hasActivatedMotif = linkedMotifs.some(m => 
    isMotifActivated(m.id, tacticalData)
  )
  
  if (hasActivatedMotif) {
    return 'UNLOCKED'
  }
  
  return 'LOCKED'
}

