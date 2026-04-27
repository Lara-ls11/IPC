import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useApp } from "../context/AppContext";
import { colors, radius, spacing } from "../theme";

const PRESETS = [25, 45, 60];

export default function FocusScreen() {
  const { tasks } = useApp();
  const firstPending = useMemo(() => tasks.find((task) => !task.completed), [tasks]);
  const [selectedPreset, setSelectedPreset] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let timer;
    if (running && remaining > 0) {
      timer = setInterval(() => setRemaining((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [running, remaining]);

  const setPreset = (minutes) => {
    setSelectedPreset(minutes);
    setRemaining(minutes * 60);
    setRunning(false);
  };

  const reset = () => {
    setRemaining(selectedPreset * 60);
    setRunning(false);
  };

  const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
  const secs = String(remaining % 60).padStart(2, "0");

  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Text style={styles.mode}>Sessão de Foco</Text>
        <Text style={styles.time}>{mins}:{secs}</Text>
        <Text style={styles.sub}>minutos restantes</Text>
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={reset}>
          <Text style={styles.controlText}>Reset</Text>
        </Pressable>
        <Pressable style={[styles.controlButton, styles.primary]} onPress={() => setRunning((prev) => !prev)}>
          <Text style={[styles.controlText, { color: colors.surface }]}>{running ? "Pausar" : "Iniciar"}</Text>
        </Pressable>
      </View>

      <View style={styles.presets}>
        {PRESETS.map((preset) => (
          <Pressable
            key={preset}
            style={[styles.preset, selectedPreset === preset && styles.presetActive]}
            onPress={() => setPreset(preset)}
          >
            <Text style={[styles.presetText, selectedPreset === preset && styles.presetTextActive]}>{preset}m</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.taskBox}>
        <Text style={styles.taskLabel}>Tarefa Atual</Text>
        <Text style={styles.taskTitle}>{firstPending?.title || "Sem tarefa associada"}</Text>
        <Text style={styles.taskSubject}>{firstPending?.subject || "Associe uma tarefa no separador Tarefas."}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  circle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 10,
    borderColor: "#D9C2FA",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: spacing.md,
  },
  mode: { color: colors.primaryDark, fontWeight: "700" },
  time: { fontSize: 54, fontWeight: "800", color: colors.text },
  sub: { color: colors.textMuted },
  controls: { marginTop: spacing.lg, flexDirection: "row", justifyContent: "center", gap: spacing.sm },
  controlButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  controlText: { color: colors.text, fontWeight: "700" },
  presets: {
    marginTop: spacing.md,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  preset: { flex: 1, alignItems: "center", paddingVertical: 12, backgroundColor: "#ECEEF2" },
  presetActive: { backgroundColor: "#F3E9FF" },
  presetText: { color: colors.textMuted, fontWeight: "700" },
  presetTextActive: { color: colors.primaryDark },
  taskBox: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  taskLabel: { color: colors.textMuted, marginBottom: spacing.xs },
  taskTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  taskSubject: { marginTop: spacing.xs, color: colors.textMuted },
});
