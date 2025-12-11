import React from 'react'
import { ScrollView } from 'react-native'
import { Colors } from '@constants/Colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ThemedScrollView = React.forwardRef(function ThemedScrollView(
	{
		style,
		contentContainerStyle,
		showsVerticalScrollIndicator = false,
		showsHorizontalScrollIndicator = false,
		safe = false,
		...props
	}: any,
	ref: any,
) {
	const insets = useSafeAreaInsets()

	return (
		<ScrollView
			ref={ref}
			style={[
				{
					backgroundColor: Colors.background,
					paddingTop: safe ? insets.top : 0,
				},
				style,
			]}
			contentContainerStyle={contentContainerStyle}
			showsVerticalScrollIndicator={showsVerticalScrollIndicator}
			showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
			{...props}
		/>
	)
})

export default ThemedScrollView
