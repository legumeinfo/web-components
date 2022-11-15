#!/usr/bin/env node

'use strict';

import path from 'path';
import execSync from 'child_process';

const commands = [
  'npm install --only=dev',
  'npm install',
];
// TODO: make this iterate all packages in the dep/ directory instead of hard-coding
const build_dir = path.resolve('./dep/cem-plugin-jsdoc-example');
const options = {cwd: build_dir};

commands.forEach((cmd) => {
  // commands must be executed synchronously, i.e. one at a time in order
  const child_process = execSync.execSync(cmd, options, function(error, stdout, stderr) {
    if (error) {
      throw error;
    }
  });
});
