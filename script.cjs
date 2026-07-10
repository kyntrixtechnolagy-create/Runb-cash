const fs = require('fs');
let content = fs.readFileSync('src/components/AuditorDashboardView.tsx', 'utf8');

const startStr1 = '{/* Staff Balances */}';
const endStr1 = '<div className="mb-6 mt-8 flex items-center justify-between">';
let startIdx1 = content.indexOf(startStr1);
let endIdx1 = content.indexOf(endStr1);
if (startIdx1 !== -1 && endIdx1 !== -1) {
  content = content.substring(0, startIdx1) + content.substring(endIdx1);
  console.log('Removed inline staff balances block');
}

const startStr2 = '{/* Staff Balances Modal */}';
let startIdx2 = content.indexOf(startStr2);
if (startIdx2 !== -1) {
  content = content.substring(0, startIdx2) + '\n    </div>\n  );\n}\n';
  console.log('Removed modal block');
}

fs.writeFileSync('src/components/AuditorDashboardView.tsx', content, 'utf8');
