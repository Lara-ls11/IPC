import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  USER: "softstudy:user",
  TASKS: "softstudy:tasks",
};

export async function loadUser() {
  const raw = await AsyncStorage.getItem(KEYS.USER);
  if (!raw) return null;
  const user = JSON.parse(raw);
  return {
    ...user,
    semesterProgress: user.semesterProgress ?? 0,
  };
}

export async function saveUser(user) {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export async function clearUser() {
  await AsyncStorage.removeItem(KEYS.USER);
}

export async function loadTasks() {
  const raw = await AsyncStorage.getItem(KEYS.TASKS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveTasks(tasks) {
  await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
}
