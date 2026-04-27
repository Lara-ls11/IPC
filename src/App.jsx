import { useEffect, useMemo, useState } from "react";
import softStudyLogo from "../Captura de ecrã 2026-04-27, às 17.09.25.png";
import softStudyWordmark from "../Captura de ecrã 2026-04-27, às 17.20.39.png";

const STORAGE_KEY = "softstudy:web:v1";
const ACCOUNTS_KEY = "softstudy:web:accounts:v1";

const initialState = {
  user: null,
  tasks: [],
  settings: {
    deadlineAlerts: true,
    alertInterval: "30 min",
    theme: "Auto",
    textSize: 16,
  },
};

function formatDateLabel(date) {
  const today = new Date();
  const target = new Date(`${date}T00:00:00`);
  const msPerDay = 86400000;
  const diff = Math.round((target - new Date(today.toDateString())) / msPerDay);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return target.toLocaleDateString("pt-PT");
}

function App() {
  const [booted, setBooted] = useState(false);
  const [screen, setScreen] = useState("welcome");
  const [authMode, setAuthMode] = useState("login");
  const [accounts, setAccounts] = useState([]);
  const [user, setUser] = useState(initialState.user);
  const [tasks, setTasks] = useState(initialState.tasks);
  const [settings, setSettings] = useState(initialState.settings);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [taskFilter, setTaskFilter] = useState("Todas");
  const [taskSearch, setTaskSearch] = useState("");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [newTask, setNewTask] = useState({
    title: "",
    subject: "Interação Pessoa Computador",
    dueDate: new Date().toISOString().slice(0, 10),
    dueTime: "23:59",
    importance: "Média",
    notes: "",
    remind: true,
  });
  const [profileForm, setProfileForm] = useState({
    degree: "Engenharia Informática - 3º Ano",
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const accountsRaw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      setUser(parsed.user ?? null);
      setTasks(parsed.tasks ?? []);
      setSettings(parsed.settings ?? initialState.settings);
      setScreen(parsed.user ? "dashboard" : "welcome");
    }
    if (accountsRaw) {
      setAccounts(JSON.parse(accountsRaw));
    }
    setBooted(true);
  }, []);

  useEffect(() => {
    if (!booted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, tasks, settings }));
  }, [user, tasks, settings, booted]);

  useEffect(() => {
    if (!booted) return;
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }, [accounts, booted]);

  useEffect(() => {
    if (!focusRunning) return undefined;
    const timer = setInterval(() => {
      setFocusSecondsLeft((prev) => {
        if (prev <= 1) {
          setFocusRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [focusRunning]);

  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const semesterProgress = user?.semesterProgress ?? 68;
  const isDarkMode =
    settings.theme === "Escuro" ||
    (settings.theme === "Auto" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  const filteredTasks = useMemo(() => {
    const bySearch = tasks.filter((task) =>
      task.title.toLowerCase().includes(taskSearch.toLowerCase())
    );
    if (taskFilter === "Pendentes") return bySearch.filter((task) => !task.completed);
    if (taskFilter === "Concluídas") return bySearch.filter((task) => task.completed);
    if (taskFilter === "Urgentes") return bySearch.filter((task) => task.importance === "Alta");
    return bySearch;
  }, [tasks, taskSearch, taskFilter]);

  const focusTask = pendingTasks[0];
  const mm = String(Math.floor(focusSecondsLeft / 60)).padStart(2, "0");
  const ss = String(focusSecondsLeft % 60).padStart(2, "0");

  const onAuthSubmit = () => {
    const email = authForm.email.toLowerCase().trim();
    const existingAccount = accounts.find((account) => account.email === email);
    if (!email.includes("@")) {
      alert("Email inválido.");
      return;
    }
    if (authForm.password.length < 8) {
      alert("A palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }
    if (authMode === "register") {
      if (authForm.name.trim().length < 2) {
        alert("Nome inválido.");
        return;
      }
      if (authForm.password !== authForm.confirmPassword) {
        alert("As palavras-passe não coincidem.");
        return;
      }
      if (existingAccount) {
        alert("Esta conta já existe. Faz login.");
        return;
      }

      const account = {
        id: crypto.randomUUID(),
        name: authForm.name.trim(),
        email,
        password: authForm.password,
      };
      setAccounts((prev) => [...prev, account]);
      setUser({
        name: account.name,
        email: account.email,
        semesterProgress: 68,
      });
      setScreen("dashboard");
      return;
    }

    if (!existingAccount || existingAccount.password !== authForm.password) {
      alert("Conta não encontrada ou palavra-passe incorreta.");
      return;
    }
    setUser({
      name: existingAccount.name,
      email: existingAccount.email,
      semesterProgress: 68,
    });
    setScreen("dashboard");
  };

  const logout = () => {
    setUser(null);
    setScreen("welcome");
    setAuthMode("login");
    setAuthForm({ name: "", email: "", password: "", confirmPassword: "" });
  };

  const addTask = () => {
    if (!newTask.title.trim()) {
      alert("O título da tarefa é obrigatório.");
      return;
    }
    const task = {
      id: crypto.randomUUID(),
      ...newTask,
      title: newTask.title.trim(),
      subject: newTask.subject.trim(),
      notes: newTask.notes.trim(),
      completed: false,
    };
    setTasks((prev) => [task, ...prev]);
    setScreen("tasks");
    setNewTask((prev) => ({ ...prev, title: "", notes: "" }));
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  const resetTimer = () => {
    setFocusRunning(false);
    setFocusSecondsLeft(focusMinutes * 60);
  };

  const setPreset = (value) => {
    setFocusMinutes(value);
    setFocusSecondsLeft(value * 60);
    setFocusRunning(false);
  };

  if (!booted) return <div className="app-container loading">A carregar...</div>;

  const showBottomNav = ["dashboard", "tasks", "focus", "settings", "profile"].includes(screen);

  return (
    <div className={`app-container ${isDarkMode ? "dark" : ""}`}>
      {screen === "welcome" && (
        <section className="screen welcome-layout">
          <header className="hero">
            <img className="logo-image" src={softStudyLogo} alt="SoftStudy" />
            <p className="muted">Produtividade sem pressão!</p>
          </header>
          <div className="card promo">
            <h3>Organiza o teu tempo</h3>
            <p>Faz a gestão das tuas cadeiras e tarefas num só lugar, sem complicações.</p>
          </div>
          <div className="actions-stack">
            <button className="btn primary" onClick={() => { setAuthMode("register"); setScreen("auth"); }}>
              Criar Conta
            </button>
            <button className="btn ghost" onClick={() => { setAuthMode("login"); setScreen("auth"); }}>
              Entrar
            </button>
          </div>
        </section>
      )}

      {screen === "auth" && (
        <section className="screen scroll auth-layout">
          <header className="logo-top">
            <img className="logo-image small" src={softStudyLogo} alt="SoftStudy" />
          </header>
          <div className="auth-content">
            <h2>{authMode === "register" ? "Bem Vindo à SoftStudy" : "Bem Vindo de volta!"}</h2>
            <p className="muted">{authMode === "register" ? "Preencha os dados para começar" : "Faça login para continuar."}</p>
            {authMode === "register" && (
              <input
                className="input"
                placeholder="Como quer ser chamado?"
                value={authForm.name}
                onChange={(e) => setAuthForm((p) => ({ ...p, name: e.target.value }))}
              />
            )}
            <input
              className="input"
              placeholder="exemplo@gmail.com"
              value={authForm.email}
              onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))}
            />
            <input
              className="input"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={authForm.password}
              onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
            />
            {authMode === "register" && (
              <input
                className="input"
                type="password"
                placeholder="Repita a sua palavra-passe"
                value={authForm.confirmPassword}
                onChange={(e) => setAuthForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              />
            )}
          </div>
          <div className="actions-stack">
            <button className="btn primary" onClick={onAuthSubmit}>
              {authMode === "register" ? "Criar Conta" : "Entrar"}
            </button>
            <button className="link-button" onClick={() => setAuthMode((m) => (m === "login" ? "register" : "login"))}>
              {authMode === "register" ? "Já tem conta? Entrar" : "Ainda não tem conta? Criar conta"}
            </button>
          </div>
        </section>
      )}

      {screen === "dashboard" && (
        <section className="screen scroll">
          <header className="dashboard-header">
            <div className="status-row">
              <span>9:41</span>
              <span>●●●</span>
            </div>
            <div className="dash-brand-row">
              <img className="wordmark" src={softStudyWordmark} alt="SoftStudy" />
              <div className="dash-icons">
                <button className="icon-btn" aria-label="Notificações" onClick={() => setScreen("notifications")}>🔔</button>
                <button className="avatar-btn" aria-label="Perfil" onClick={() => setScreen("profile")}>🐻</button>
              </div>
            </div>
          </header>
          <div className="top-row">
            <div>
              <h2>Olá, {user?.name || "Afonso"}!</h2>
              <p className="muted">Vamos focar nos estudos hoje?</p>
            </div>
            <button className="small-link" onClick={logout}>Sair</button>
          </div>
          <div className="card progress">
            <h3>Semestre 2024.1</h3>
            <p className="muted">Você está quase lá!</p>
            <div className="progress-line">
              <div className="progress-fill" style={{ width: `${semesterProgress}%` }} />
            </div>
            <strong>{semesterProgress}% concluído</strong>
          </div>
          <div className="grid-2">
            <button className="card action primary-card" onClick={() => setScreen("newTask")}>
              <strong>Nova Tarefa</strong>
              <span>Criar lembrete</span>
            </button>
            <button className="card action" onClick={() => setScreen("focus")}>
              <strong>Timer Foco</strong>
              <span>25:00 min</span>
            </button>
          </div>
          <div className="top-row">
            <h3>Próximas Tarefas</h3>
            <button className="small-link" onClick={() => setScreen("tasks")}>Ver tudo</button>
          </div>
          {(pendingTasks.slice(0, 3).length ? pendingTasks.slice(0, 3) : [{ id: "empty", title: "Sem tarefas pendentes", subject: "Começa por criar uma tarefa.", dueDate: "" }]).map((task) => (
            <div key={task.id} className="card task">
              <small>{task.subject}</small>
              <h4>{task.title}</h4>
              {task.dueDate && <p className="muted">{formatDateLabel(task.dueDate)}, {task.dueTime}</p>}
            </div>
          ))}
        </section>
      )}

      {screen === "tasks" && (
        <section className="screen scroll">
          <h2>Minhas Tarefas</h2>
          <input
            className="input"
            placeholder="Pesquisar tarefas..."
            value={taskSearch}
            onChange={(e) => setTaskSearch(e.target.value)}
          />
          <div className="chips">
            {["Todas", "Pendentes", "Concluídas", "Urgentes"].map((filter) => (
              <button
                key={filter}
                className={`chip ${taskFilter === filter ? "active" : ""}`}
                onClick={() => setTaskFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          {filteredTasks.map((task) => (
            <div key={task.id} className="card task">
              <small>{task.subject}</small>
              <h4>{task.title}</h4>
              <p className="muted">
                {formatDateLabel(task.dueDate)}, {task.dueTime} · {task.importance}
              </p>
              {task.notes && <p>{task.notes}</p>}
              <button className="btn mini primary" onClick={() => toggleTask(task.id)}>
                {task.completed ? "Reabrir" : "Concluir"}
              </button>
            </div>
          ))}
          {!filteredTasks.length && <p className="muted">Sem tarefas neste filtro.</p>}
          <button className="btn primary" onClick={() => setScreen("newTask")}>Adicionar tarefa</button>
        </section>
      )}

      {screen === "newTask" && (
        <section className="screen scroll">
          <h2>Nova Tarefa</h2>
          <input className="input" placeholder="Ex: Resolver lista de exercícios" value={newTask.title} onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))} />
          <label>Disciplina</label>
          <input className="input" value={newTask.subject} onChange={(e) => setNewTask((p) => ({ ...p, subject: e.target.value }))} />
          <div className="grid-2">
            <div>
              <label>Data de entrega</label>
              <input className="input" type="date" value={newTask.dueDate} onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div>
              <label>Hora</label>
              <input className="input" type="time" value={newTask.dueTime} onChange={(e) => setNewTask((p) => ({ ...p, dueTime: e.target.value }))} />
            </div>
          </div>
          <label>Grau de importância</label>
          <div className="chips">
            {["Baixa", "Média", "Alta"].map((importance) => (
              <button
                key={importance}
                className={`chip ${newTask.importance === importance ? "active" : ""}`}
                onClick={() => setNewTask((p) => ({ ...p, importance }))}
              >
                {importance}
              </button>
            ))}
          </div>
          <label>Notas adicionais</label>
          <textarea className="input" rows={4} placeholder="Ex: Entregar via portal Moodle em PDF..." value={newTask.notes} onChange={(e) => setNewTask((p) => ({ ...p, notes: e.target.value }))} />
          <label className="switch-row">
            <input type="checkbox" checked={newTask.remind} onChange={(e) => setNewTask((p) => ({ ...p, remind: e.target.checked }))} />
            <span>Adicionar lembrete</span>
          </label>
          <button className="btn primary" onClick={addTask}>Guardar Tarefa</button>
          <button className="btn ghost" onClick={() => setScreen("tasks")}>Cancelar</button>
        </section>
      )}

      {screen === "focus" && (
        <section className="screen scroll">
          <h2>Temporizador</h2>
          <div className="timer-circle">
            <small>Sessão de Foco</small>
            <div>{mm}:{ss}</div>
            <small>minutos restantes</small>
          </div>
          <div className="grid-3">
            <button className="btn ghost" onClick={resetTimer}>Reset</button>
            <button className="btn primary" onClick={() => setFocusRunning((v) => !v)}>{focusRunning ? "Pausar" : "Iniciar"}</button>
            <button className="btn ghost" onClick={() => setScreen("tasks")}>Tarefas</button>
          </div>
          <div className="chips">
            {[25, 45, 60].map((v) => (
              <button key={v} className={`chip ${focusMinutes === v ? "active" : ""}`} onClick={() => setPreset(v)}>
                {v}m
              </button>
            ))}
          </div>
          <div className="card task">
            <small>Tarefa Atual</small>
            <h4>{focusTask?.title || "Sem tarefa associada"}</h4>
            <p className="muted">{focusTask?.subject || "Escolhe uma tarefa em 'Tarefas'."}</p>
          </div>
        </section>
      )}

      {screen === "settings" && (
        <section className="screen scroll">
          <h2 className="settings-title">Configurações</h2>
          <div className="settings-group-title">NOTIFICAÇÕES</div>
          <div className="card settings-row tile">
            <div className="tile-main">
              <span className="tile-icon">🔔</span>
              <div>
                <strong>Alertas de Prazos</strong>
                <p className="muted">Receber lembretes antes das entregas</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.deadlineAlerts}
              onChange={(e) => setSettings((s) => ({ ...s, deadlineAlerts: e.target.checked }))}
            />
          </div>
          <div className="card tile">
            <div className="tile-main">
              <span className="tile-icon">🔉</span>
              <div>
                <strong>Intervalos de Alerta</strong>
                <p className="muted">30 min, 1h e 2h antes</p>
              </div>
            </div>
            <select className="input" value={settings.alertInterval} onChange={(e) => setSettings((s) => ({ ...s, alertInterval: e.target.value }))}>
              <option>30 min</option>
              <option>1 h</option>
              <option>2 h</option>
            </select>
          </div>

          <div className="settings-group-title">APARÊNCIA</div>
          <div className="card tile">
            <div className="tile-main">
              <span className="tile-icon">🌙</span>
              <div>
                <strong>Tema Escuro</strong>
                <p className="muted">Automático com o sistema</p>
              </div>
            </div>
            <select className="input" value={settings.theme} onChange={(e) => setSettings((s) => ({ ...s, theme: e.target.value }))}>
              <option>Auto</option>
              <option>Claro</option>
              <option>Escuro</option>
            </select>
          </div>

          <div className="settings-group-title">ACESSIBILIDADE</div>
          <div className="card tile">
            <div className="tile-main">
              <span className="tile-icon">T</span>
              <div>
                <strong>Tamanho do Texto</strong>
                <p className="muted">Ajuste para melhor leitura</p>
              </div>
            </div>
            <input
              type="range"
              min="14"
              max="22"
              value={settings.textSize}
              onChange={(e) => setSettings((s) => ({ ...s, textSize: Number(e.target.value) }))}
            />
            <button className="btn ghost">Exemplo de texto académico</button>
          </div>

          <div className="card tile">
            <div className="tile-main">
              <span className="tile-icon">♿</span>
              <div>
                <strong>Leitor de Tela</strong>
                <p className="muted">Otimizar rótulos para TalkBack/VoiceOver</p>
              </div>
            </div>
          </div>
          <button className="btn ghost settings-reset" onClick={() => setSettings(initialState.settings)}>Repor Predefinições</button>
        </section>
      )}

      {screen === "notifications" && (
        <section className="screen scroll">
          <div className="top-row">
            <h2>Notificações</h2>
            <button className="small-link" onClick={() => setScreen("dashboard")}>Fechar</button>
          </div>
          {pendingTasks.length === 0 ? (
            <div className="card task">
              <h4>Sem alertas pendentes</h4>
              <p className="muted">Cria tarefas com prazo para receberes lembretes aqui.</p>
            </div>
          ) : (
            pendingTasks.slice(0, 8).map((task) => (
              <div key={task.id} className="card task">
                <small>Prazo próximo</small>
                <h4>{task.title}</h4>
                <p className="muted">{task.subject} · {formatDateLabel(task.dueDate)} às {task.dueTime}</p>
                <button className="btn mini primary" onClick={() => setScreen("tasks")}>Ver tarefa</button>
              </div>
            ))
          )}
        </section>
      )}

      {screen === "profile" && (
        <section className="screen scroll profile-screen">
          <div className="top-row">
            <h2>Perfil</h2>
            <button className="small-link" onClick={() => setScreen("dashboard")}>Voltar</button>
          </div>
          <div className="card profile-card">
            <div className="avatar avatar-bear">🐻</div>
            <h3>{user?.name || "Afonso Pinto"}</h3>
            <p className="muted">{user?.email || "al000000@alunos.utad.pt"}</p>
            <span className="badge">{profileForm.degree}</span>
            <div className="profile-progress-box">
              <div>
                <small>PROGRESSO DO SEMESTRE</small>
                <div className="profile-progress-number">{semesterProgress}%</div>
                <div className="progress-line">
                  <div className="progress-fill" style={{ width: `${semesterProgress}%` }} />
                </div>
              </div>
              <div className="profile-pending">
                <strong>{pendingTasks.length}</strong>
                <small>TAREFAS PENDENTES</small>
              </div>
            </div>
          </div>
          <h4>Atalhos Rápidos</h4>
          <div className="grid-2">
            <button className="card action">🔔 Notificações</button>
            <button className="card action">⚙️ Personalização</button>
            <button className="card action">🌐 Idioma</button>
            <button className="card action">🕘 Histórico</button>
          </div>
          <button className="btn primary" onClick={() => setProfileForm((prev) => ({ ...prev }))}>Editar Perfil</button>
          <button className="btn danger" onClick={logout}>Terminar Sessão</button>
        </section>
      )}

      {showBottomNav && (
        <nav className="bottom-nav">
          <button className={screen === "dashboard" ? "active" : ""} onClick={() => setScreen("dashboard")}><span>⌂</span>Painel</button>
          <button className={screen === "tasks" || screen === "newTask" ? "active" : ""} onClick={() => setScreen("tasks")}><span>☷</span>Tarefas</button>
          <button className={screen === "focus" ? "active" : ""} onClick={() => setScreen("focus")}><span>◴</span>Foco</button>
          <button className={screen === "settings" ? "active" : ""} onClick={() => setScreen("settings")}><span>⚙</span>Ajustes</button>
        </nav>
      )}
    </div>
  );
}

export default App;