const fs = require('fs');

let pd = fs.readFileSync('src/components/dashboards/PartnerDashboard.jsx', 'utf8');

// 1. Filter Logic
const filterLogicMatch = pd.match(/const filteredFeed = React\.useMemo\(\(\) => \{[\s\S]*?return list;\n    \}, \[unifiedFeed, feedFilter\]\);/);
if (filterLogicMatch) {
    const newLogic = `const filteredFeed = React.useMemo(() => {
        let list = unifiedFeed;
        if (feedFilter === "All" || feedFilter === "Recommended") {
        } else if (feedFilter === "Announcement") {
            list = list.filter(item => item.post_type === "announcement" && ['industry_partner', 'admin', 'partner'].includes(item.author_type || item.role));
        } else if (feedFilter === "Job Hiring" || feedFilter === "Hiring Update") {
            list = list.filter(item => item.post_type === "hiring_update" || item.feedType === "job");
        } else if (feedFilter === "Trainee Finding Job" || feedFilter === "Looking for Job") {
            list = list.filter(item => item.post_type === "lf_job" || item.post_type === "trainee_finding_job");
        }
        return list;
    }, [unifiedFeed, feedFilter]);`;
    pd = pd.replace(filterLogicMatch[0], newLogic);
}

// 2. Filter Dropdown (replace all options)
const dropdownMatch = pd.match(/onChange=\{\(e\) => \{ setFeedFilter[\s\S]*?<\/select>/);
if (dropdownMatch) {
    const newDropdown = `onChange={(e) => { setFeedFilter(e.target.value); setVisibleFeedCount(20); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
              <option value="All">All</option>
              <option value="Announcement">Announcement</option>
              <option value="Job Hiring">Job Hiring</option>
              <option value="Trainee Finding Job">Trainee Finding Job</option>
          </select>`;
    pd = pd.replace(dropdownMatch[0], newDropdown);
}

// 3. Rename Create Post option
pd = pd.replace(/<option value="hiring_update">💼 Hiring Update<\/option>/g, '<option value="hiring_update">💼 Job Hiring</option>');
pd = pd.replace(/Share a hiring update/g, 'Share a job hiring update');
// 4. Also any "Hiring Update" inside option to "Job Hiring" if we missed it
pd = pd.replace(/value="Hiring Update">Hiring Update/g, 'value="Job Hiring">Job Hiring');

fs.writeFileSync('src/components/dashboards/PartnerDashboard.jsx', pd);

// ----- TRAINEE DASHBOARD -----
let td = fs.readFileSync('src/components/dashboards/TraineeDashboard.jsx', 'utf8');

// 1. Filter Logic
const tdFilterLogicMatch = td.match(/const filteredFeed = useMemo\(\(\) => \{[\s\S]*?if \(feedSearchText\.trim\(\)\) \{/);
if (tdFilterLogicMatch) {
    const newLogic = `const filteredFeed = useMemo(() => {
        let list = unifiedFeed;
        if (feedFilter === 'All' || feedFilter === 'Recommended') {
        } else if (feedFilter === 'Announcement') {
            list = list.filter(item => (item.post_type === 'announcement' || item.feedType === 'bulletin') && ['industry_partner', 'admin', 'partner'].includes(item.author_type || item.role));
        } else if (feedFilter === 'Job Hiring' || feedFilter === 'Hiring Update') {
            list = list.filter(item => item.post_type === 'hiring_update' || item.feedType === 'job');
        }
        
        if (feedSearchText.trim()) {`;
        
    td = td.replace(tdFilterLogicMatch[0], newLogic);
}

// 2. Filter Dropdown (replace all options)
const tdDropdownMatch = td.match(/onChange=\{\(e\) => \{\s*setFeedFilter\(e\.target\.value\);[\s\S]*?<\/select>/);
if (tdDropdownMatch) {
    const tdNewDropdown = `onChange={(e) => {
                                setFeedFilter(e.target.value);
                                setVisibleFeedCount(20);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            <option value="All">All</option>
                            <option value="Announcement">Announcement</option>
                            <option value="Job Hiring">Job Hiring</option>
                        </select>`;
    td = td.replace(tdDropdownMatch[0], tdNewDropdown);
}

// 3. Change "Looking for Job" to "Trainee Finding Job"
td = td.replace(/>Looking for Job<\/option>/g, '>Trainee Finding Job</option>');
td = td.replace(/<option value="lf_job">Looking for Job<\/option>/g, '<option value="lf_job">Trainee Finding Job</option>');

fs.writeFileSync('src/components/dashboards/TraineeDashboard.jsx', td);

// ----- FEED COMPONENTS -----
let fc = fs.readFileSync('src/components/dashboards/FeedComponents.jsx', 'utf8');
fc = fc.replace(/\{ value: 'hiring_update', label: 'Job Hiring', icon: '💼' \}/g, "{ value: 'hiring_update', label: 'Job Hiring', icon: '💼' }");
fc = fc.replace(/\{ value: 'hiring_update', label: 'Hiring Update', icon: '💼' \}/g, "{ value: 'hiring_update', label: 'Job Hiring', icon: '💼' }");
fs.writeFileSync('src/components/dashboards/FeedComponents.jsx', fc);

console.log('All files updated properly.');
