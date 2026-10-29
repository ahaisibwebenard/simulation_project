import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');

// Recreate only the generated output directory. Source files remain editable.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of ['index.html', 'src', 'public']) {
  await cp(path.join(root, entry), path.join(output, entry), { recursive: true });
}
console.log('Static website created in dist/.');
