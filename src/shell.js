const {spawn} = require('child_process');

function cd(path) {
  process.chdir(path);
}

async function exec(cmd, ...args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    
    proc.on('close', exitCode => {
      if (exitCode !== 0) {
        reject();
      }
      else {
        resolve();
      }
    });
  });
}

exports.cd = cd;
exports.exec = exec;