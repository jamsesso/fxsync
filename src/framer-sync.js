const fs = require('fs');
const uuid = require('uuid/v4');

const parser = require('./parser');
const fileManager = require('./file-manager');
const shell = require('./shell');

async function main(projectDirectory, framerFilePath) {
  // Make sure the requisite files exist before continuing.
  if (!fs.existsSync(projectDirectory)) {
    throw new Error(`Project directory does not exist: ${projectDirectory}`);
  }

  if (!fs.existsSync(`${projectDirectory}/package.json`)) {
    throw new Error('Project directory must contain a package.json file');
  }

  if (!fs.existsSync(framerFilePath)) {
    throw new Error(`Framer file does not exist: ${framerFilePath}`);
  }

  const project = fileManager.getProject(projectDirectory);
  const libraryName = `framer-sync-${uuid()}`;

  // Run create-react-library to create an empty library to copy our files into.
  console.log(`Creating a temporary library at ${libraryName}`);
  // TODO depend on a concrete version of create-react-library instead of using npx for better reliability.
  await shell.exec('./node_modules/create-react-library/index.js', '--skip-prompts', '--no-git', libraryName);

  // Update the temporary library package.json.
  console.log(`Copying dependencies from ${projectDirectory}/package.json`);
  fileManager.update(`./${libraryName}/package.json`, content => {
    const packageJson = JSON.parse(content);

    // Copy the dependencies from the target project into the library.
    packageJson.dependencies = project.dependencies;

    // Remove prop-types as a peerDependency (FramerX does not supply this dependency by default because of TS)
    delete packageJson.peerDependencies['prop-types'];
    return JSON.stringify(packageJson, null, 4);
  });
  
  // We need to update the rollup.config.js in the temporary library to handle the react-is package.
  fileManager.update(`./${libraryName}/rollup.config.js`, script => {
    return script.replace(
      'commonjs()',
      `commonjs({namedExports: {'node_modules/react-is/index.js': ['isElement', 'isValidElementType', 'ForwardRef']}})`
    );
  });

  // Get all of the files in the target project that have the @framerx pragma.
  console.log('Looking for @framerx components');
  const filesWithPragma = project.files.map(file => parser.getFramerMetadata(file)).filter(Boolean);
  console.log(`Found ${filesWithPragma.length} @framerx components:`);
  filesWithPragma.forEach(file => console.log(` - <${file.componentName} /> from ${file.path}`));

  // For each of the files with the pragma, copy that file and it's dependencies to the temporary library and
  // generate a top-level script for our library that exports each component.
  let exportScript = '';

  for (let file of filesWithPragma) {
    fileManager.deepCopy(`./${libraryName}/src/lib`, file);
    exportScript += `export {default as ${file.componentName}} from './lib/${file.path}';\n`;
  }

  // Write the export script to the temporary library entry point.
  console.log('Writing library entry script');
  fs.writeFileSync(`./${libraryName}/src/index.js`, exportScript, 'utf8');

  // Run npm install in the temporary library directory to pull the target project's dependencies in.
  console.log('Installing dependencies');
  shell.cd(`./${libraryName}`);
  await shell.exec('npm', 'install');

  // Run the rollup build to generate a JS artifact file that will be embedded in the .framerx file.
  console.log('Generating library build');
  await shell.exec('npm', 'run', 'build');

  // Unzip the framer file.
  console.log('Opening the framer design file');
  shell.cd('..');
  const openFramerFile = `framer-${uuid()}`;
  await fileManager.unzip(framerFilePath, openFramerFile);

  // Move the JS artifact file into the framer file.
  console.log('Copying the build artifact');
  fileManager.move(`./${libraryName}/dist/index.js`, `./${openFramerFile}/code/lib/${project.name}.js`);

  // Re-zip the framer file.
  console.log('Closing the framer design file');
  await fileManager.zip(openFramerFile, framerFilePath);
  
  // Clean up.
  console.log('Cleaning up');
  await shell.exec('rm', '-r', `./${openFramerFile}`);
  await shell.exec('rm', '-r', `./${libraryName}`);

  console.log('Done');
}

module.exports = main;