const babel = require('@babel/parser');
const fs = require('fs');
const path = require('path');

// Cache the parse results.
const cache = {};

function parse(file) {
  if (!cache[file]) {
    const source = fs.readFileSync(file, 'utf8');

    try {
      cache[file] = babel.parse(source, {sourceType: 'unambiguous', plugins: ['jsx', 'classProperties']});
    }
    catch (e) {
      cache[file] = null;
    }
  }

  return cache[file];
}

function getDependencies(file) {
  const ast = parse(file);

  if (!ast) {
    return [];
  }

  return ast.program.body
      .filter(node => node.type === 'ImportDeclaration')
      .filter(node => node.source.value.startsWith('.'))
      .map(node => {
        let dependencyPath = path.join(path.dirname(file), node.source.value + '.js');

        if (!fs.existsSync(dependencyPath)) {
          dependencyPath = path.join(path.dirname(file), node.source.value, 'index.js');
        }

        if (!fs.existsSync(dependencyPath)) {
          return null;
        }

        return {
          path: dependencyPath,
          dependencies: getDependencies(dependencyPath)
        };
      })
      .filter(Boolean);
}

function getFramerMetadata(file) {
  const matcher = /\@framerx (?<name>.*)/;
  const ast = parse(file);

  if (!ast) {
    return null;
  }

  const pragma = ast.comments.find(comment => matcher.test(comment.value));
  
  if (!pragma) {
    return null;
  }

  return {
    path: file,
    componentName: pragma.value.match(matcher).groups.name.trim(),
    dependencies: getDependencies(file)
  };
}

exports.getFramerMetadata = getFramerMetadata;