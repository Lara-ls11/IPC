import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useApp } from "../context/AppContext";
import { colors, radius, spacing } from "../theme";

export default function AuthScreen() {
  const { loginOrRegister } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async () => {
    if (isRegister && form.name.trim().length < 2) return Alert.alert("Erro", "Nome inválido.");
    if (!form.email.includes("@")) return Alert.alert("Erro", "Email inválido.");
    if (form.password.length < 8) return Alert.alert("Erro", "Mínimo 8 caracteres.");
    if (isRegister && form.password !== form.confirmPassword) {
      return Alert.alert("Erro", "As palavras-passe não coincidem.");
    }

    await loginOrRegister({
      name: isRegister ? form.name : form.email.split("@")[0],
      email: form.email,
      password: form.password,
    });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={styles.logo}>SoftStudy</Text>
      <Text style={styles.title}>{isRegister ? "Bem Vindo à SoftStudy" : "Bem Vindo de volta!"}</Text>
      <Text style={styles.subtitle}>
        {isRegister ? "Preencha os dados para começar" : "Faça login para continuar."}
      </Text>

      {isRegister && (
        <TextInput
          placeholder="Como quer ser chamado?"
          style={styles.input}
          value={form.name}
          onChangeText={(v) => updateField("name", v)}
          placeholderTextColor="#C8B6DD"
        />
      )}
      <TextInput
        placeholder="Seu nome/exemplo@gmail.com"
        style={styles.input}
        value={form.email}
        onChangeText={(v) => updateField("email", v)}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#C8B6DD"
      />
      <TextInput
        placeholder={isRegister ? "Mínimo 8 caracteres" : "Sua senha secreta"}
        style={styles.input}
        value={form.password}
        onChangeText={(v) => updateField("password", v)}
        secureTextEntry
        placeholderTextColor="#C8B6DD"
      />
      {isRegister && (
        <TextInput
          placeholder="Repita a sua palavra-passe"
          style={styles.input}
          value={form.confirmPassword}
          onChangeText={(v) => updateField("confirmPassword", v)}
          secureTextEntry
          placeholderTextColor="#C8B6DD"
        />
      )}

      <Pressable style={styles.primaryButton} onPress={submit}>
        <Text style={styles.primaryButtonText}>{isRegister ? "Criar Conta" : "Entrar"}</Text>
      </Pressable>
      <Pressable onPress={() => setIsRegister((prev) => !prev)}>
        <Text style={styles.linkText}>
          {isRegister ? "Já tem conta? Entrar" : "Ainda não tem conta? Criar conta"}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    gap: spacing.sm,
  },
  logo: {
    textAlign: "center",
    color: colors.primaryDark,
    fontSize: 34,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  title: { textAlign: "center", fontSize: 34, fontWeight: "700", color: colors.primaryDark },
  subtitle: {
    textAlign: "center",
    color: colors.text,
    marginBottom: spacing.lg,
    fontSize: 18,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: spacing.md,
  },
  primaryButtonText: { color: colors.surface, fontWeight: "700", fontSize: 17 },
  linkText: {
    textAlign: "center",
    marginTop: spacing.md,
    color: colors.primaryDark,
    fontWeight: "600",
  },
});
