const {spawn} = require('child_process');

function cd(path) {
  process.chdir(path);
}

async function exec(cmd, ...args) {
  return new Promise((resolve, reject) => {
    let output = '';
    const proc = spawn(cmd, args);
    proc.stdout.on('data', data => output += data);
    proc.stderr.on('data', data => output += data);
    
    proc.on('close', exitCode => {
      if (exitCode !== 0) {
        reject(output);
      }
      else {
        resolve();
      }
    });
  });
}

exports.cd = cd;
exports.exec = exec;