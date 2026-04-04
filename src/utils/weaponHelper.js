import weaponDetailsAdapter from './weaponDetailsAdapter'

export const getWeaponInfo = (weaponId) => {
  return weaponDetailsAdapter.getWeaponById(weaponId)
}

export const getWeaponName = (weaponId) => {
  const info = getWeaponInfo(weaponId)
  if (info) {
    return `${info.id}: ${info.name}`
  }
  return weaponId
}

export const getWeaponDisplayName = (weaponId) => {
  const info = getWeaponInfo(weaponId)
  if (info) {
    return info.name
  }
  return weaponId
}

export const formatWeaponList = (weaponIds) => {
  if (!Array.isArray(weaponIds)) return []
  
  return weaponIds.map(id => {
    const info = getWeaponInfo(id)
    if (info) {
      return `${info.id}: ${info.name}`
    }
    return id
  })
}
