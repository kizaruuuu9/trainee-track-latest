const fs = require("fs");
const path = require("path");
const file = "C:\\Users\\admin\\Downloads\\Latest_Capstone\\trainee-track-latest\\src\\components\\dashboards\\PartnerDashboard.jsx";
let content = fs.readFileSync(file, "utf8");

const startIdx = content.indexOf("{showPostModal && (");
if(startIdx === -1) { console.log("Did not find modal"); process.exit(1); }

// Find the end: we know it ends right before `<PartnerLayout`
const layoutIdx = content.indexOf("<PartnerLayout", startIdx);
let modalStr = content.substring(startIdx, layoutIdx);

// Remove whitespace that is after modalStr
const match = modalStr.match(/(\s*)$/);
if (match) {
    modalStr = modalStr.slice(0, modalStr.length - match[0].length);
}

// Remove the modal from the bottom
content = content.replace(content.substring(startIdx, layoutIdx), "\n      ");

// Now we need to insert `modalStr` at the end of `PartnerHome`, just before its closing `</>`
// PartnerHome ends around `// --- PAGE: VERIFICATION`
const verificationIdx = content.indexOf("const VerificationPage = ({ setActivePage }) => {");
const closingRegex = /(?:(\s*)<\/>\s*);\s*};\s*\/\/[^\n]*PAGE: VERIFICATION/i;

const match2 = closingRegex.exec(content);
if (!match2) { console.log("Did not find PartnerHome ending"); process.exit(1); }

const targetIdx = match2.index; // index of the whitespace before `</>`
const spaces = match2[1];

content = content.slice(0, targetIdx) + spaces + modalStr + content.slice(targetIdx);

fs.writeFileSync(file, content, "utf8");
console.log("Success");
