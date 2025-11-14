import { ScrollView } from "react-native";
import { Colors } from "../constants/Colors";

const ThemedScrollView = ({ style, ...props }) => {
  return (
    <ScrollView
      style={[{ backgroundColor: Colors.background }, style]}
      {...props}
    />
  );
};

export default ThemedScrollView;
