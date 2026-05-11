import { readFileSync } from 'fs';
import { parse } from '@babel/parser';

try {
  const code = readFileSync('src/components/dashboards/PartnerDashboard.jsx', 'utf8');
  parse(code, { sourceType: 'module', plugins: ['jsx'] });
  console.log('PartnerDashboard.jsx: OK');
} catch (e) {
  console.log('PartnerDashboard.jsx ERROR:');
  console.log('  Line:', e.loc?.line, 'Col:', e.loc?.column);
  console.log('  Message:', e.message.substring(0, 500));
}

try {
  const code2 = readFileSync('src/components/dashboards/TraineeDashboard.jsx', 'utf8');
  parse(code2, { sourceType: 'module', plugins: ['jsx'] });
  console.log('TraineeDashboard.jsx: OK');
} catch (e) {
  console.log('TraineeDashboard.jsx ERROR:');
  console.log('  Line:', e.loc?.line, 'Col:', e.loc?.column);
  console.log('  Message:', e.message.substring(0, 500));
}
