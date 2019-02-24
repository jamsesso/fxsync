const fs = require('fs');
const path = require('path');
const shell = require('./shell');

function update(path, updater) {
  if (!fs.existsSync(path)) {
    throw new Error(`File not found: ${path}`);
  }

  const content = updater(fs.readFileSync(path, 'utf8'));
  fs.writeFileSync(path, content, 'utf8');
}

function deepCopy(basePath, {path: file, dependencies}) {
  const targetPath = path.resolve(`./${basePath}/${file}`);

  if (fs.existsSync(targetPath)) {
    // This file already exists, so there is nothing to do.
    return;
  }

  // Copy this file.
  fs.mkdirSync(path.resolve(path.dirname(targetPath)), {recursive: true});
  fs.copyFileSync(file, targetPath);
  
  // Copy each of the dependencies recursively.
  dependencies.forEach(dependency => deepCopy(basePath, dependency));
}

function findFiles(directory, predicate) {
  const files = fs.readdirSync(directory);

  return files
    .filter(file => file !== 'node_modules') // TODO honor .gitignore exclusions
    .map(file => path.join(directory, file))
    .reduce((list, file) => {
      const stat = fs.statSync(file);

      if (stat.isDirectory()) {
        return list.concat(findFiles(file, predicate));
      }

      if (stat.isFile() && predicate(file)) {
        list.push(file);
      }

      return list;
    }, []);
}

function getProject(directory) {
  const packageJson = require(path.join(directory, 'package.json'));

  return {
    ...packageJson,
    files: findFiles(directory, file => !file.startsWith('.'))
  };
}

async function unzip(file, destination) {
  await shell.exec('unzip', file, '-d', destination);
}

async function zip(directory, destination) {
  const cwd = process.cwd();
  shell.cd(directory);
  await shell.exec('zip', '-r', destination, '.');
  shell.cd(cwd);
}

function move(from, to) {
  fs.mkdirSync(path.dirname(to), {recursive: true});
  fs.renameSync(from, to);
}

exports.update = update;
exports.deepCopy = deepCopy;
exports.findFiles = findFiles;
exports.getProject = getProject;
exports.unzip = unzip;
exports.zip = zip;
exports.move = move;