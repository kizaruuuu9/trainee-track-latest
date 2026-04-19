const fs = require("fs");
const file = "C:\\Users\\admin\\Downloads\\Latest_Capstone\\trainee-track-latest\\src\\components\\dashboards\\PartnerDashboard.jsx";
let content = fs.readFileSync(file, "utf8");

const startRegex = /\{showPostModal\s*&&\s*\((?:[^<]*(?:<(?!PartnerLayout)[^>]*>[^<]*)*)<\/div>\s*\)\s*\}/s;
const startMatch = content.match(startRegex);
if (!startMatch) {
  console.log("Could not find startMatch"); 
  process.exit(1); 
}

const modalStr = startMatch[0];
content = content.replace(modalStr, "");

const insertRegex = /((?:[\s\n]*)<\/>[\s\n]*\);[\s\n]*};[\s\n]*(?:\/\/[^\n]*[\s\n]*)?)const VerificationPage/s;
const insertMatch = content.match(insertRegex);

if (!insertMatch) {
  console.log("Could not find insertMatch");
  process.exit(1);
}

const beforeStr = content.substring(0, insertMatch.index + (insertMatch[1].indexOf("</>") - 1));
const afterStr = content.substring(insertMatch.index + (insertMatch[1].indexOf("</>") - 1));

content = beforeStr + "\n      " + modalStr + "\n" + afterStr;

fs.writeFileSync(file, content, "utf8");
console.log("Success");
