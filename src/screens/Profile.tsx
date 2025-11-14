import { TouchableOpacity } from "react-native";
import { useUser } from "../hooks/useUser";
import ThemedView from "../components/ThemedView";
import ThemedText from "../components/ThemedText";

export default function Profile() {
  const { signOut } = useUser();

  return (
    <ThemedView style={{ flex: 1 }} safe>
      <ThemedText style={{}}>Profile screen</ThemedText>
      <TouchableOpacity onPress={() => signOut()}>
        <ThemedText style={{}}>Sign out</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}
