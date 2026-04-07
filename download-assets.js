/**
 * download-assets.js
 * Downloads all Drive images for Alex Miller site
 */
const { execFileSync } = require('node:child_process');
const path = require('path');
const fs = require('fs');

const DRIVE_SCRIPT = 'C:\\Users\\KillerGrowth\\.openclaw\\skills\\google-workspace\\scripts\\drive.js';
const IMAGES_DIR = path.join(__dirname, 'images');
const USER = 'brickley@killergrowth.com';

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const files = [
  { fileId: '1gEhZE6pKbap37BanqOaZgcku4X3epiS3', name: 'alex-miller.svg' },
  { fileId: '1-IqfpZ4TUi204euD9DPUnd0T2Qd0m7gF', name: 'alex-miller.png' },
  { fileId: '1266Cl_ht70enEvgBGh8YCq55DCFVw8Ue', name: 'l2-realty-logo.svg' },
  { fileId: '1lyIqaD2QIUGy6cmR0_IAI7BcJMWHOU8-', name: 'alex-headshot-main.jpg' },
  { fileId: '1ZfU3zHNw2g9q3yV9yNSzRQWusDpFir77', name: 'alex-photo-2.jpg' },
  { fileId: '1VjILH6fMa-HTGlqWZqNdwJAhcTn-MSuQ', name: 'alex-hutch-12.jpg' },
  { fileId: '1zSfk8SA7vKXY9gFfg5ZGs9u7lq3trrXi', name: 'alex-hutch-16.jpg' },
  { fileId: '1uFc1GS6f_eOCe-vRowrFNSYXclHTz0Tm', name: 'alex-hutch-17.jpg' },
  { fileId: '1btqqrdronr0GEbnOvRqBO8DiyPXQUOHP',  name: 'alex-hutch-21.jpg' },
  { fileId: '14UAn0sj3mhC17JkdWBBviGmbhlOAtedD',  name: 'alex-hutch-29.jpg' },
  { fileId: '1d4mI-lrBjQpH4joEM6n8HKZoIR34ewj_', name: 'alex-hutch-46.jpg' },
  { fileId: '1yWx2bkZ_vrSqvOn0rM7j3gxiiAf__d7u', name: 'alex-award-photo.jpg' },
  { fileId: '12wR7crbTdPXEzrEnj03l8cjZ2Bkg20or', name: 'barton-23.jpg' },
  { fileId: '1K9IgcPNE66ooB53ZDiYMZkLv0C2gju6v', name: 'barton-31.jpg' },
  { fileId: '1StLJJgmkuagjpXI7YG02aNGAs_1t1-Wj', name: 'barton-42.jpg' },
  { fileId: '1qfu94Fhi5Qu78keW9M2MtAlsDpFir77',   name: 'barton-48.jpg' },
  { fileId: '1FWhlvZyhRcplX2g7YRydcW-iUVCqQYj-', name: 'barton-65.jpg' },
  { fileId: '1cZHQaE8w1ojJWSRG6SFbBj27KrUyT5g4', name: 'barton-67.jpg' },
  { fileId: '1uAMMgzTGienryrWkCdC0QReNHUUIZbV9', name: 'miller-10.jpg' },
  { fileId: '1DDjb0Bf5nlgyRsVYYkf4Qrm5Gh5eiawm', name: 'miller-14.jpg' },
];

let succeeded = 0;
let failed = [];

for (const f of files) {
  const outputPath = path.join(IMAGES_DIR, f.name);
  const opts = JSON.stringify({ user: USER, fileId: f.fileId, outputPath });
  console.log(`Downloading ${f.name} ...`);
  try {
    const result = execFileSync('node', [DRIVE_SCRIPT, 'download', opts], { encoding: 'utf8', timeout: 60000 });
    console.log(`  OK: ${f.name}`);
    if (result) console.log('  ' + result.trim());
    succeeded++;
  } catch (err) {
    console.error(`  FAIL: ${f.name} — ${err.message}`);
    failed.push(f.name);
  }
}

console.log(`\nDone: ${succeeded} downloaded, ${failed.length} failed.`);
if (failed.length) console.log('Failed:', failed.join(', '));
