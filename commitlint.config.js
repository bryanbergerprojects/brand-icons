/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'icons',
        'core',
        'react',
        'vue',
        'svelte',
        'wc',
        'docs',
        'build-icons',
        'agents',
        'rules',
        'ci',
        'release',
        'plan',
        'readme',
        'biome',
        'turbo',
        'changeset',
      ],
    ],
    'scope-empty': [2, 'never'],
    'subject-case': [2, 'always', 'lower-case'],
  },
};
