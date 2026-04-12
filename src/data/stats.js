import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

for (let i = 1; i <= 17; i++) {
  const num = String(i).padStart(2, '0');
  const file = path.join(__dirname, 'M' + num + '.json');
  if (!fs.existsSync(file)) continue;

  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log('\n## M' + num + ' ' + data.motif_name);
  console.log('| 专项 | 变例 | 名称 | L2 | L3 | L4 |');
  console.log('|:--|:--|:--|:-:|:-:|:-:|');

  for (const spec of data.specialties || []) {
    for (const v of spec.variations || []) {
      const dist = { L2: 0, L3: 0, L4: 0 };
      for (const pool of v.original_pool || []) {
        const lvl = pool.level || 'L2';
        if (dist[lvl] !== undefined) dist[lvl]++;
      }
      const name = v.name.length > 16 ? v.name.slice(0, 16) + '...' : v.name;
      console.log('| ' + spec.spec_id + ' | ' + v.var_id + ' | ' + name + ' | ' + dist.L2 + ' | ' + dist.L3 + ' | ' + dist.L4 + ' |');
    }
  }
}
