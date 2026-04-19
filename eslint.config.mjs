import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

const compat = new FlatCompat({
  baseDirectory: currentDir
});

export default compat.config({
  extends: ['next/core-web-vitals', 'next/typescript']
});
