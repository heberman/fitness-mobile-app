import { Tabs } from 'expo-router'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { Colors } from '@constants/Colors'

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: Colors.surfaceBackground,
					borderColor: Colors.border,
				},
				tabBarActiveTintColor: Colors.logo,
				tabBarInactiveTintColor: Colors.navIcon,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Home',
					tabBarIcon: ({ focused }) => (
						<MaterialIcons size={28} name="home" color={focused ? Colors.logo : Colors.navIcon} />
					),
				}}
			/>
			<Tabs.Screen
				name="genie"
				options={{
					title: 'Genie',
					tabBarIcon: ({ focused }) => (
						<MaterialIcons size={28} name="chat" color={focused ? Colors.logo : Colors.navIcon} />
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: 'Profile',
					tabBarIcon: ({ focused }) => (
						<MaterialIcons size={28} name="person" color={focused ? Colors.logo : Colors.navIcon} />
					),
				}}
			/>
		</Tabs>
	)
}
