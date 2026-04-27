import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useApp } from "../context/AppContext";
import { colors, radius, spacing } from "../theme";

const IMPORTANCE_LEVELS = ["Baixa", "Média", "Alta"];

export default function NewTaskScreen({ navigation }) {
  const { addTask } = useApp();
  const now = new Date();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Interação Pessoa Computador");
  const [dueDate, setDueDate] = useState(now.toISOString().slice(0, 10));
  const [dueTime, setDueTime] = useState("23:59");
  const [importance, setImportance] = useState("Média");
  const [notes, setNotes] = useState("");
  const [remind, setRemind] = useState(true);

  const save = async () => {
    if (!title.trim()) return Alert.alert("Erro", "Adiciona um título para a tarefa.");
    await addTask({ title, subject, dueDate, dueTime, importance, notes, remind });
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <TextInput
        style={styles.input}
        placeholder="Ex: Resolver lista de exercícios"
        value={title}
        onChangeText={setTitle}
      />
      <Text style={styles.label}>Disciplina</Text>
      <TextInput style={styles.input} value={subject} onChangeText={setSubject} />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Data de entrega</Text>
          <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Hora</Text>
          <TextInput style={styles.input} value={dueTime} onChangeText={setDueTime} />
        </View>
      </View>

      <Text style={styles.label}>Grau de importância</Text>
      <View style={styles.row}>
        {IMPORTANCE_LEVELS.map((level) => (
          <Pressable
            key={level}
            style={[styles.importanceButton, importance === level && styles.importanceButtonActive]}
            onPress={() => setImportance(level)}
          >
            <Text style={[styles.importanceText, importance === level && styles.importanceTextActive]}>{level}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Notas adicionais</Text>
      <TextInput
        style={[styles.input, { height: 96, textAlignVertical: "top" }]}
        placeholder="Ex: Entregar via portal Moodle em PDF..."
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <View style={styles.reminderRow}>
        <Text style={{ color: colors.text }}>Adicionar lembrete</Text>
        <Switch value={remind} onValueChange={setRemind} trackColor={{ true: colors.primary }} />
      </View>

      <Pressable style={styles.saveButton} onPress={save}>
        <Text style={styles.saveButtonText}>Guardar Tarefa</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  label: {
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
    color: colors.textMuted,
    textTransform: "uppercase",
    fontWeight: "700",
    fontSize: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  row: { flexDirection: "row", gap: spacing.sm },
  importanceButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: "center",
  },
  importanceButtonActive: { backgroundColor: "#F1E7FE", borderColor: colors.primaryDark },
  importanceText: { color: colors.textMuted, fontWeight: "700" },
  importanceTextActive: { color: colors.primaryDark },
  reminderRow: {
    marginTop: spacing.md,
    backgroundColor: "#F3ECFD",
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  saveButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    paddingVertical: 14,
  },
  saveButtonText: { color: colors.surface, fontWeight: "700", fontSize: 16 },
});
