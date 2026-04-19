// restore_functions.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appContextPath = path.join(__dirname, '..', 'src', 'context', 'AppContext.jsx');

try {
  // Get the HEAD version of AppContext.jsx
  console.log('Fetching HEAD version of AppContext.jsx...');
  const headContent = execSync('git show HEAD:src/context/AppContext.jsx', {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Extract fetchPostComments function
  const fetchPostCommentsMatch = headContent.match(
    /const fetchPostComments = async \(\) => \{[\s\S]*?\n  \};/
  );
  if (!fetchPostCommentsMatch) {
    throw new Error('Could not find fetchPostComments function in HEAD');
  }
  const fetchPostComments = fetchPostCommentsMatch[0];
  console.log('✓ Found fetchPostComments');

  // Extract fetchJobPostingComments function
  const fetchJobPostingCommentsMatch = headContent.match(
    /const fetchJobPostingComments = async \(\) => \{[\s\S]*?\n  \};/
  );
  if (!fetchJobPostingCommentsMatch) {
    throw new Error('Could not find fetchJobPostingComments function in HEAD');
  }
  const fetchJobPostingComments = fetchJobPostingCommentsMatch[0];
  console.log('✓ Found fetchJobPostingComments');

  // Read current AppContext.jsx
  let currentContent = fs.readFileSync(appContextPath, 'utf-8');

  // Find the insertion point (before const addPostComment)
  const insertionPattern = /(\n  const addPostComment = async)/;
  if (!insertionPattern.test(currentContent)) {
    throw new Error('Could not find insertion point (const addPostComment)');
  }

  // Insert the functions before const addPostComment
  const updatedContent = currentContent.replace(
    insertionPattern,
    `\n  ${fetchPostComments}\n\n  ${fetchJobPostingComments}$1`
  );

  // Write the updated content back
  fs.writeFileSync(appContextPath, updatedContent, 'utf-8');
  console.log('✓ Successfully inserted functions into AppContext.jsx');
  console.log('\nFunctions inserted before const addPostComment = async');

} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}