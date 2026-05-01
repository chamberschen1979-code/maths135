import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'src', 'data');
const result = {};

for (let i = 1; i <= 17; i++) {
  const motifId = 'M' + String(i).padStart(2, '0');
  const filePath = path.join(dataDir, motifId + '.json');
  
  if (!fs.existsSync(filePath)) {
    console.log('Missing: ' + motifId);
    continue;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const motifEntry = {
    motif_id: motifId,
    motif_name: data.motif_name,
    specialties: []
  };
  
  if (data.specialties) {
    data.specialties.forEach(spec => {
      const specEntry = {
        spec_id: spec.spec_id,
        spec_name: spec.spec_name,
        variations: []
      };
      
      if (spec.variations) {
        spec.variations.forEach(v => {
          const l3Questions = (v.original_pool || []).filter(q => q.level === 'L3');
          const selected = l3Questions.length > 0 ? l3Questions[0] : null;
          
          const varEntry = {
            var_id: v.var_id,
            name: v.name,
            logic_core: v.logic_core || '',
            question: selected ? {
              id: selected.id,
              source: selected.source || '',
              problem: selected.problem,
              answer: selected.answer,
              key_points: selected.key_points || [],
              analysis: selected.analysis || '',
              tags: selected.tags || [],
              quality_score: selected.quality_score || 0,
              meta: selected.meta || {}
            } : null
          };
          
          specEntry.variations.push(varEntry);
        });
      }
      
      motifEntry.specialties.push(specEntry);
    });
  }
  
  result[motifId] = motifEntry;
}

const outputPath = path.join(__dirname, '..', 'public', 'data', 'assessment_bank.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');

let totalVariations = 0;
let totalQuestions = 0;
Object.values(result).forEach(m => {
  m.specialties.forEach(s => {
    s.variations.forEach(v => {
      totalVariations++;
      if (v.question) totalQuestions++;
    });
  });
});

console.log('Done! Total: ' + Object.keys(result).length + ' motifs, ' + totalVariations + ' variations, ' + totalQuestions + ' questions');
console.log('File size: ' + (fs.statSync(outputPath).size / 1024).toFixed(1) + ' KB');
