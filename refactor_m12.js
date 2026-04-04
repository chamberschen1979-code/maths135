const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/M12.json', 'utf8'));

data.specialties.forEach(spec => {
  spec.variations.forEach(v => {
    const pool = v.original_pool || [];
    pool.forEach(p => {
      const level = p.level;
      const varId = v.var_id;
      
      if (level === 'L2') {
        p.weapons = [];
        return;
      }
      
      if (varId === '1.1' && (level === 'L3' || level === 'L4')) {
        p.weapons = ['S-LOGIC-01'];
        return;
      }
      
      if (varId === '1.2' && level === 'L3') {
        p.weapons = ['S-LOGIC-02'];
        return;
      }
      
      if (varId === '2.1' && (level === 'L3' || level === 'L4')) {
        p.weapons = ['S-LOGIC-02'];
        return;
      }
      
      if (varId === '2.2' && level === 'L3') {
        p.weapons = ['S-FUNC-02'];
        return;
      }
      
      p.weapons = [];
    });
  });
});

fs.writeFileSync('src/data/M12.json', JSON.stringify(data, null, 2), 'utf8');
console.log('M12.json 武器重构完成');
