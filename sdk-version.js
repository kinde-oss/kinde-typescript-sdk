#!/usr/bin/env node
const { version: packageVersion } = require('./package.json');
const { promises: fsPromises } = require('fs');
const { join } = require('path');

const VERSION_PLACEHOLDER = 'SDK_VERSION_PLACEHOLDER';

const run = async () => {
  const pathToFile = join(__dirname, 'lib/sdk/version.ts');
  const fileContent = await fsPromises.readFile(pathToFile, 'utf8');

  const isCleanArg = process.argv[2] === 'clean';
  const [searchValue, replaceValue] = !isCleanArg
    ? [VERSION_PLACEHOLDER, packageVersion]
    : [packageVersion, VERSION_PLACEHOLDER];

  const updatedContent = fileContent.replace(searchValue, replaceValue);
  await fsPromises.writeFile(pathToFile, updatedContent);
};

run().catch((error) => console.error(error));
