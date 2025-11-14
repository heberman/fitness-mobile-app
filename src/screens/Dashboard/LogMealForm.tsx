import React, { useState, useCallback } from "react";
import { StyleSheet, View, TextInput, Alert } from "react-native";
import ThemedText from "../../components/ThemedText";
import ThemedCard from "../../components/ThemedCard";
import ThemedButton from "../../components/ThemedButton";
import { Colors } from "../../constants/Colors";

const LogMealForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string, calories: number) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");

  const handleSubmit = () => {
    const parsedCalories = parseInt(calories, 10);
    if (name.trim() && !isNaN(parsedCalories) && parsedCalories > 0) {
      onSubmit(name, parsedCalories);
    } else {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid meal name and a positive calorie count."
      );
    }
  };

  return (
    <ThemedCard style={styles.loggingCard}>
      <ThemedText title style={styles.loggingCardTitle}>
        Log Meal
      </ThemedText>
      <TextInput
        placeholder="Meal Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholderTextColor={Colors.placeholderText}
      />
      <TextInput
        placeholder="Calories"
        value={calories}
        onChangeText={setCalories}
        keyboardType="numeric"
        style={styles.input}
        placeholderTextColor={Colors.placeholderText}
      />
      <View style={styles.loggingButtonContainer}>
        <ThemedButton onPress={handleSubmit} style={styles.loggingButton}>
          <ThemedText style={styles.loggingButtonText}>Log</ThemedText>
        </ThemedButton>
        <ThemedButton
          onPress={onCancel}
          style={[styles.loggingButton, styles.cancelButton]}
        >
          <ThemedText
            style={[styles.loggingButtonText, styles.cancelButtonText]}
          >
            Cancel
          </ThemedText>
        </ThemedButton>
      </View>
    </ThemedCard>
  );
};

const styles = StyleSheet.create({
  loggingCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: Colors.uiBackground,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loggingCardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    height: 45,
    borderColor: Colors.inputBorder,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.inputBackground,
    fontSize: 16,
    color: Colors.text,
  },
  loggingButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 16,
  },
  loggingButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  loggingButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: Colors.uiBackground,
  },
  cancelButtonText: {
    color: Colors.text,
  },
});

export default LogMealForm;
