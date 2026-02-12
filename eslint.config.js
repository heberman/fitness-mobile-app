import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
	{
		ignores: ['node_modules', 'dist', '.expo'],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
			globals: {
				React: 'readonly',
				global: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				process: 'readonly',
			},
		},
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
		},
	},
]
