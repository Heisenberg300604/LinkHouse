import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
const latest = readdirSync('runs', { withFileTypes: true })
  .filter((x) => x.isDirectory())
  .map((x) => x.name)
  .sort()
  .at(-1);
if (!latest) {
  console.log('No runs yet. Run npm run test:e2e.');
} else {
  console.log(path.resolve('runs', latest));
  console.log(readFileSync(path.join('runs', latest, 'run-summary.json'), 'utf8'));
}
