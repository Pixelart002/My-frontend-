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

// Tailwind v4 places utilities in @layer utilities. Legacy component CSS is
// unlayered, so it would outrank those utilities regardless of selector
// specificity (for example, ".mobile-nav { display: none }" would suppress
// the scoped ".flex" utility). Keep the #root scope but unwrap the utilities
// layer so the existing #root specificity contract works as intended.
root.walkAtRules('layer', (layer) => {
  const names = layer.params.split(',').map((name) => name.trim());
  if (!layer.nodes || names.length !== 1 || names[0] !== 'utilities') return;

  const parent = layer.parent;
  if (!parent) return;

  // PostCSS containers don't expose unwrap() on all supported versions.
  // Move each child before the wrapper, preserving its original order.
  for (const child of [...layer.nodes]) {
    parent.insertBefore(layer, child);
  }
  layer.remove();
});

let remainingLayeredUtilityRules = 0;
root.walkRules((rule) => {
  let current = rule.parent;
  while (current) {
    if (
      current.type === 'atrule' &&
      current.name === 'layer' &&
      current.params.split(',').some((name) => name.trim() === 'utilities')
    ) {
      remainingLayeredUtilityRules += 1;
      break;
    }
    current = current.parent;
  }
});

const scopedCss = root.toString();
if (remainingLayeredUtilityRules > 0) {
  throw new Error('Tailwind cascade fix failed: utility rules remain inside @layer utilities.');
}
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
