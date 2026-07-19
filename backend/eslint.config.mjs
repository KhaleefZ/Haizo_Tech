import shared from '@haizo/config/eslint';

export default [
  ...shared,
  {
    // Seeds and one-off scripts talk to a human on stdout. console is the point.
    files: ['prisma/**/*.ts', 'scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
];
