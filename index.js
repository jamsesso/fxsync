#!/usr/bin/env node
const program = require('commander');
const fxsync = require('./src/fxsync');
const version = require('./package.json').version;

program.version(version)
  .arguments('<project-directory> <framer-file>')
  .action(async (projectDirectory, framerFilePath) => {
    try {
      await fxsync(projectDirectory, framerFilePath);
    }
    catch (e) {
      console.error(e);
    }
  })
  .parse(process.argv);