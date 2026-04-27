import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { colors, radius, spacing } from "../theme";

const FILTERS = ["Todas", "Pendentes", "Concluídas", "Urgentes"];

export default function TasksScreen({ navigation }) {
  const { tasks, toggleTask } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todas");

  const filteredTasks = useMemo(() => {
    const byQuery = tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()));
    if (filter === "Pendentes") return byQuery.filter((task) => !task.completed);
    if (filter === "Concluídas") return byQuery.filter((task) => task.completed);
    if (filter === "Urgentes") return byQuery.filter((task) => task.importance === "Alta");
    return byQuery;
  }, [tasks, query, filter]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Pesquisar tarefas..."
        placeholderTextColor="#9CA3AF"
      />

      <View style={styles.filtersRow}>
        {FILTERS.map((item) => (
          <Pressable
            key={item}
            style={[styles.filterChip, item === filter && styles.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterLabel, item === filter && styles.filterLabelActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.newButton} onPress={() => navigation.navigate("NewTask")}>
        <Text style={styles.newButtonText}>+ Adicionar nova tarefa</Text>
      </Pressable>

      {filteredTasks.length === 0 ? (
        <View style={styles.taskCard}>
          <Text style={{ color: colors.textMuted }}>Sem tarefas neste filtro.</Text>
        </View>
      ) : (
        filteredTasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <Text style={styles.subject}>{task.subject}</Text>
            <Text style={styles.title}>{task.title}</Text>
            <Text style={styles.meta}>
              {task.dueDate} {task.dueTime ? `· ${task.dueTime}` : ""} · {task.importance}
            </Text>
            {task.notes ? <Text style={styles.notes}>{task.notes}</Text> : null}
            <Pressable
              style={[styles.action, task.completed && { backgroundColor: colors.success }]}
              onPress={() => toggleTask(task.id)}
            >
              <Text style={styles.actionText}>{task.completed ? "Concluída" : "Concluir"}</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  search: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.sm,
  },
  filtersRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
  filterChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: { backgroundColor: "#F1E7FE", borderColor: colors.primaryDark },
  filterLabel: { color: colors.textMuted, fontWeight: "600" },
  filterLabelActive: { color: colors.primaryDark },
  newButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: "dashed",
    padding: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  newButtonText: { color: colors.primaryDark, fontWeight: "700" },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  subject: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", color: colors.info },
  title: { fontSize: 20, fontWeight: "700", color: colors.text, marginTop: 4 },
  meta: { marginTop: 6, color: colors.textMuted },
  notes: { marginTop: 6, color: colors.text, fontStyle: "italic" },
  action: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  actionText: { color: colors.surface, fontWeight: "700" },
});
