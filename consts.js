const regularSuffix = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '/index.js',
  '/index.jsx',
  '/index.ts',
  '/index.tsx'
];

const rareSuffix = [
  '.ios.js',
  '.ios.jsx',
  '.ios.ts',
  '.ios.tsx',
  '.android.js',
  '.android.jsx',
  '.android.ts',
  '.android.tsx',
  '/index.ios.js',
  '/index.ios.jsx',
  '/index.ios.ts',
  '/index.ios.tsx',
  '/index.android.js',
  '/index.android.js',
  '/index.android.tsx',
  '/index.android.tsx'
];

module.exports = { regularSuffix, rareSuffix };
