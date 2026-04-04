const motifModules = import.meta.glob('/src/data/M*.json')

let structureCache = null
let motifListCache = null

export const buildStructurePrompt = async () => {
  if (structureCache) return structureCache

  let promptContent = '\n【可选母题结构列表 - 必须从中选择】\n'

  const motifIds = Object.keys(motifModules)
    .map(path => path.match(/M(\d+)\.json$/)?.[0]?.replace('.json', ''))
    .filter(Boolean)
    .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))

  for (const motifId of motifIds) {
    try {
      const module = await motifModules[`/src/data/${motifId}.json`]()
      const data = module.default || module

      promptContent += `\n[${data.motif_id}] ${data.motif_name}\n`

      if (data.specialties) {
        data.specialties.forEach(spec => {
          promptContent += `  ${spec.spec_id} ${spec.spec_name}\n`

          if (spec.variations) {
            spec.variations.forEach(vari => {
              const difficulties = extractDifficulties(vari)
              const keywords = vari.keywords ? ` [关键词: ${vari.keywords.join(',')}]` : ''
              promptContent += `    ${vari.var_id} ${vari.name}${keywords} → 支持: ${difficulties}\n`
            })
          }
        })
      }
    } catch (error) {
      console.error(`[motifStructureExtractor] 加载 ${motifId} 失败:`, error)
    }
  }

  structureCache = promptContent
  return promptContent
}

const extractDifficulties = (variation) => {
  const levels = new Set()
  if (variation.original_pool) {
    variation.original_pool.forEach(q => {
      if (q.level) levels.add(q.level)
    })
  }
  return levels.size > 0 ? [...levels].sort().join('/') : 'L2/L3/L4'
}

export const getMotifList = async () => {
  if (motifListCache) return motifListCache

  const motifIds = Object.keys(motifModules)
    .map(path => path.match(/M(\d+)\.json$/)?.[0]?.replace('.json', ''))
    .filter(Boolean)
    .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))

  motifListCache = motifIds
  return motifIds
}

export const clearCache = () => {
  structureCache = null
  motifListCache = null
}
