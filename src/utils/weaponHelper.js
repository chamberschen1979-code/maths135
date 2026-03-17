import strategyLib from '../data/strategy_lib.json';

const weaponCache = new Map();

const buildWeaponCache = () => {
  if (weaponCache.size > 0) return;
  
  const categories = strategyLib.categories || [];
  for (const category of categories) {
    const weapons = category.weapons || [];
    for (const weapon of weapons) {
      weaponCache.set(weapon.id, {
        id: weapon.id,
        name: weapon.name,
        rank: weapon.rank,
        description: weapon.description,
        categoryName: category.name
      });
    }
  }
};

export const getWeaponInfo = (weaponId) => {
  buildWeaponCache();
  return weaponCache.get(weaponId) || null;
};

export const getWeaponName = (weaponId) => {
  const info = getWeaponInfo(weaponId);
  if (info) {
    return `${info.id}: ${info.name}`;
  }
  return weaponId;
};

export const getWeaponDisplayName = (weaponId) => {
  const info = getWeaponInfo(weaponId);
  if (info) {
    return info.name;
  }
  return weaponId;
};

export const formatWeaponList = (weaponIds) => {
  if (!Array.isArray(weaponIds)) return [];
  
  return weaponIds.map(id => {
    const info = getWeaponInfo(id);
    if (info) {
      return `${info.id}: ${info.name}`;
    }
    return id;
  });
};
