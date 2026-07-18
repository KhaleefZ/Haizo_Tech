import shared from '@haizo/config/eslint';

export default [...shared, { ignores: ['.next/**', 'next-env.d.ts'] }];
