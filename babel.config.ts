module.exports = {
	presets: ['module:metro-react-native-babel-preset'],
	plugins: [
		[
			'module-resolver',
			{
				root: ['./src'],
				extensions: ['.json', '.tsx', '.ts'],
				alias: {
					'@components': './src/components',
					'@screens': './src/screens',
					'@app': './src/app',
					'@utils': './src/utils',
					'@hooks': './src/hooks',
					'@contexts': './src/contexts',
					'@server': './src/server',
					'@services': './src/server/services',
					'@constants': './src/constants',
					'@assets': './assets',
				},
			},
		],
	],
}
