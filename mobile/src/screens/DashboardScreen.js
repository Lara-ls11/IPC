import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "../context/AppContext";
import { colors, radius, spacing } from "../theme";

export default function DashboardScreen({ navigation }) {
  const { user, tasks, logout } = useApp();
  const pending = tasks.filter((task) => !task.completed).slice(0, 3);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name || "Estudante"}!</Text>
          <Text style={styles.caption}>Vamos focar nos estudos hoje?</Text>
        </View>
        <Pressable onPress={logout}>
          <Text style={styles.link}>Terminar sessão</Text>
        </Pressable>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Semestre 2024.1</Text>
        <Text style={styles.caption}>Você está quase lá!</Text>
        <Text style={styles.progressValue}>{user?.semesterProgress ?? 68}%</Text>
      </View>

      <View style={styles.quickActions}>
        <Pressable style={[styles.actionCard, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate("Tarefas")}>
          <Text style={[styles.actionTitle, { color: colors.surface }]}>Nova Tarefa</Text>
          <Text style={[styles.actionSub, { color: "#F6EFFF" }]}>Criar lembrete</Text>
        </Pressable>
        <Pressable style={styles.actionCard} onPress={() => navigation.navigate("Foco")}>
          <Text style={styles.actionTitle}>Timer Foco</Text>
          <Text style={styles.actionSub}>25:00 min</Text>
        </Pressable>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Próximas Tarefas</Text>
      </View>
      {pending.length === 0 ? (
        <View style={styles.taskCard}>
          <Text style={styles.caption}>Sem tarefas pendentes. Crie a primeira tarefa!</Text>
        </View>
      ) : (
        pending.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <Text style={styles.taskSubject}>{task.subject || "Disciplina"}</Text>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.caption}>
              {task.dueDate} {task.dueTime ? `· ${task.dueTime}` : ""}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  greeting: { fontSize: 30, fontWeight: "800", color: colors.text },
  caption: { color: colors.textMuted },
  link: { color: colors.primaryDark, fontWeight: "600" },
  progressCard: {
    backgroundColor: "#EEF4FF",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  progressTitle: { fontSize: 30, fontWeight: "700", color: colors.text },
  progressValue: { fontSize: 36, fontWeight: "800", color: colors.primaryDark, marginTop: spacing.sm },
  quickActions: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  actionTitle: { fontSize: 24, fontWeight: "700", color: colors.text },
  actionSub: { marginTop: spacing.xs, color: colors.textMuted },
  sectionRow: { marginBottom: spacing.sm },
  sectionTitle: { fontSize: 30, fontWeight: "700", color: colors.text },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  taskSubject: { textTransform: "uppercase", color: colors.info, fontSize: 12, fontWeight: "700" },
  taskTitle: { fontSize: 24, fontWeight: "700", color: colors.text, marginVertical: 2 },
});
