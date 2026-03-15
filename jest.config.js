/** @type {import('jest').Config} */
module.exports = {
  collectCoverageFrom: [
    'src/main/**/*.{js,jsx}',
    'src/preload/**/*.{js,jsx}',
    'src/renderer/src/**/*.{js,jsx}',
    '!src/renderer/src/main.jsx',
    '!**/__mocks__/**',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      lines: 50,
      functions: 40,
      branches: 45,
      statements: 50
    }
  },
  projects: [
    {
      displayName: 'main',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/main/**/*.test.js'],
      transform: {
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        electron: '<rootDir>/tests/__mocks__/electron.js'
      },
      transformIgnorePatterns: [
        'node_modules/(?!(uuid)/)'
      ]
    },
    {
      displayName: 'renderer',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/renderer/**/*.test.js'],
      transform: {
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.module\\.css$': 'identity-obj-proxy',
        '\\.css$': '<rootDir>/tests/__mocks__/styleMock.js'
      },
      setupFilesAfterEnv: ['@testing-library/jest-dom'],
      transformIgnorePatterns: [
        'node_modules/(?!(uuid)/)'
      ]
    }
  ]
}
