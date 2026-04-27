import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearUser, loadTasks, loadUser, saveTasks, saveUser } from "../storage/storage";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const bootstrap = async () => {
      const [savedUser, savedTasks] = await Promise.all([loadUser(), loadTasks()]);
      setUser(savedUser);
      setTasks(savedTasks);
      setBootstrapped(true);
    };
    bootstrap();
  }, []);

  const loginOrRegister = async ({ name, email, password }) => {
    const nextUser = {
      id: "local-user",
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      semesterProgress: 68,
    };
    setUser(nextUser);
    await saveUser(nextUser);
  };

  const logout = async () => {
    setUser(null);
    await clearUser();
  };

  const addTask = async (taskInput) => {
    const newTask = {
      id: Date.now().toString(),
      title: taskInput.title.trim(),
      subject: taskInput.subject.trim(),
      dueDate: taskInput.dueDate,
      dueTime: taskInput.dueTime,
      importance: taskInput.importance,
      notes: taskInput.notes.trim(),
      remind: taskInput.remind,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    await saveTasks(updated);
  };

  const toggleTask = async (taskId) => {
    const updated = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updated);
    await saveTasks(updated);
  };

  const value = useMemo(
    () => ({
      bootstrapped,
      user,
      tasks,
      loginOrRegister,
      logout,
      addTask,
      toggleTask,
    }),
    [bootstrapped, user, tasks]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
