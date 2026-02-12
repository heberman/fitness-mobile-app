import React from 'react'
import { ScrollView, type ScrollViewProps } from 'react-native'
import { Colors } from '@constants/Colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ThemedScrollViewProps extends ScrollViewProps {
	safe?: boolean
}

const ThemedScrollView = React.forwardRef<ScrollView, ThemedScrollViewProps>(
	function ThemedScrollView(
		{
			style,
			contentContainerStyle,
			showsVerticalScrollIndicator = false,
			showsHorizontalScrollIndicator = false,
			safe = false,
			...props
		},
		ref,
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
	},
)

export default ThemedScrollView
