import { readFile, writeFile } from 'node:fs/promises';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

const outputPath = 'public/tailwind.css';
const css = await readFile(outputPath, 'utf8');
const root = postcss.parse(css, { from: outputPath });
let scopedRuleCount = 0;

root.walkRules((rule) => {
  let current = rule.parent;
  let isUtilityLayer = false;

  while (current) {
    if (
      current.type === 'atrule' &&
      current.name === 'layer' &&
      current.params.split(',').some((name) => name.trim() === 'utilities')
    ) {
      isUtilityLayer = true;
      break;
    }
    current = current.parent;
  }

  if (!isUtilityLayer || !rule.selector) return;

  rule.selector = selectorParser((selectors) => {
    selectors.each((selector) => {
      const first = selector.first;
      if (first?.type === 'id' && first.value === 'root') return;
      selector.prepend(selectorParser.combinator({ value: ' ' }));
      selector.prepend(selectorParser.id({ value: 'root' }));
    });
  }).processSync(rule.selector);

  scopedRuleCount += 1;
});

const scopedCss = root.toString();
if (scopedRuleCount < 100 || !scopedCss.includes('#root .flex')) {
  throw new Error(
    'Tailwind root encapsulation failed: expected at least 100 scoped utility rules and #root .flex.',
  );
}

for (const required of ['#root .flex', '#root .text-gold', '#root .hidden']) {
  if (!scopedCss.includes(required)) {
    throw new Error('Required production utility missing after CSS build: ' + required);
  }
}

await writeFile(outputPath, scopedCss, 'utf8');
console.log('Scoped Tailwind utility rules under #root:', scopedRuleCount);
