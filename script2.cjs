const fs = require('fs');
let content = fs.readFileSync('src/components/AuditorDashboardView.tsx', 'utf8');

const startStr = '{/* Staff Balances */}';
let startIdx = content.indexOf(startStr);

// Find the start of Recent Activity or similar to delete up to that point
const endStr = '      <div className="mb-6 mt-8 flex items-center justify-between">';
let endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + content.substring(endIdx);
  console.log('Removed inline staff balances block');
} else {
  console.log('Could not find start or end index:', startIdx, endIdx);
}

fs.writeFileSync('src/components/AuditorDashboardView.tsx', content, 'utf8');
