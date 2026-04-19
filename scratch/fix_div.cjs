const fs = require('fs');
let code = fs.readFileSync('scratch/out3.txt', 'utf8');

// I added an extra <div style={{ display: 'grid' }}> earlier, but I didn't add a closing </div> for it before the second large block `<div className="ln-card ln-feed-card"`.
// So we just add one!
code = code.replace(/<div className="ln-card ln-feed-card"/, '</div>\n\n        <div className="ln-card ln-feed-card"');

// And remove the hacky </div> I added to </form>
code = code.replace(/<\/div>\n        <\/form>/, '</form>');

fs.writeFileSync('scratch/out4.txt', code);
console.log('Fixed the missing div closure');
