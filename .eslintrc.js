module.exports = {
  parser: '@typescript-eslint/parser', // Especifica el parser de TypeScript
  extends: [
    'eslint:recommended', // Reglas recomendadas de ESLint
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // Reglas recomendadas para TypeScript
  ],
  parserOptions: {
    ecmaVersion: 2020, // Permite el uso de características modernas de ECMAScript
    sourceType: 'module', // Permite el uso de imports
  },
  rules: {
    // Aquí puedes personalizar las reglas de ESLint o @typescript-eslint
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    'prettier/prettier': 'error',
  },
};
