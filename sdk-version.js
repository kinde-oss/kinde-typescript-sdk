import packageJson from './package.json' with { type: 'json' };
import { promises as fsPromises } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const VERSION_PLACEHOLDER = 'SDK_VERSION_PLACEHOLDER';

const run = async () => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const pathToFile = join(__dirname, 'lib/sdk/version.ts');
  const fileContent = await fsPromises.readFile(pathToFile, 'utf8');

  // eslint-disable-next-line no-undef
  const isCleanArg = process.argv[2] === 'clean';
  const [searchValue, replaceValue] = !isCleanArg
    ? [VERSION_PLACEHOLDER, packageJson.version]
    : [packageJson.version, VERSION_PLACEHOLDER];

  const updatedContent = fileContent.replace(searchValue, replaceValue);
  await fsPromises.writeFile(pathToFile, updatedContent);
};

run().catch((error) => console.error(error));
