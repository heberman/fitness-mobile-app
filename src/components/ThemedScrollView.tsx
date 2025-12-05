import React from 'react'
import { ScrollView } from 'react-native'
import { Colors } from '@constants/Colors'

const ThemedScrollView = React.forwardRef(function ThemedScrollView(
	{
		style,
		contentContainerStyle,
		showsVerticalScrollIndicator = false,
		showsHorizontalScrollIndicator = false,
		...props
	}: any,
	ref: any,
) {
	return (
		<ScrollView
			ref={ref}
			style={[{ backgroundColor: Colors.background }, style]}
			contentContainerStyle={contentContainerStyle}
			showsVerticalScrollIndicator={showsVerticalScrollIndicator}
			showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
			{...props}
		/>
	)
})

export default ThemedScrollView
