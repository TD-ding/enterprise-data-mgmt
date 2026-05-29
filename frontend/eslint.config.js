import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

export default [
  {
    files: ['src/**/*.{js,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      vue: pluginVue,
    },
    rules: {
      'no-unused-vars': 'error',
      'eqeqeq': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-dupe-keys': 'error',
      'no-empty': 'error',
      'no-unreachable': 'error',
      'vue/no-unused-vars': 'error',
      'vue/no-dupe-keys': 'error',
    },
  },
];
