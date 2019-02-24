const program = require('commander');
const syncFramer = require('./src/framer-sync');
const version = require('./package.json').version;

program.version(version)
  .arguments('<project-directory> <framer-file>')
  .action(async (projectDirectory, framerFilePath) => {
    try {
      await syncFramer(projectDirectory, framerFilePath);
    }
    catch (e) {
      console.error(e);
    }
  })
  .parse(process.argv);