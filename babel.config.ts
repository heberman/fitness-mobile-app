module.exports = function (api: any) {
	api.cache(true)
	return {
		presets: ['babel-preset-expo'],
		plugins: [
			[
				'module-resolver',
				{
					root: ['./src'],
					extensions: ['.json', '.tsx', '.ts', '.js', '.jsx'],
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
}
