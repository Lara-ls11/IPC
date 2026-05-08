import { useEffect, useMemo, useState } from "react";
import softStudyLogo from "../LogoCompleto.png";
import softStudyWordmark from "../Logosótexto.png";

const STORAGE_KEY = "softstudy:web:v1";
const ACCOUNTS_KEY = "softstudy:web:accounts:v1";
const DEADLINE_ALERTS_SENT_KEY = "softstudy:web:deadline-alerts-sent:v1";
const SMTP_EMAIL_API_URL =
  import.meta.env.VITE_SMTP_EMAIL_API_URL || "http://localhost:3001/api/send-validation-email";
const SCHEDULE_IMPORT_API_URL =
  import.meta.env.VITE_SCHEDULE_IMPORT_API_URL ||
  SMTP_EMAIL_API_URL.replace("/api/send-validation-email", "/api/import-schedule-url");

const initialState = {
  user: null,
  tasks: [],
  scheduleItems: [],
  settings: {
    deadlineAlerts: true,
    alertInterval: "30 min",
    theme: "Auto",
    textSize: 16,
    language: "Português",
    screenReader: false,
  },
};

const universityOptions = [
  "Universidade Aberta",
  "Universidade dos Açores",
  "Universidade do Algarve",
  "Universidade de Aveiro",
  "Universidade da Beira Interior",
  "Universidade de Coimbra",
  "Universidade de Évora",
  "Universidade de Lisboa",
  "Universidade da Madeira",
  "Universidade do Minho",
  "Universidade Nova de Lisboa",
  "Universidade do Porto",
  "Universidade de Trás-os-Montes e Alto Douro (UTAD)",
  "ISCTE – Instituto Universitário de Lisboa",
  "Universidade Autónoma de Lisboa Luís de Camões",
  "Universidade Católica Portuguesa",
  "Universidade da Maia (ISMAI)",
  "Universidade Europeia",
  "Universidade Lusófona (Lisboa e Porto)",
  "Instituto Superior Miguel Torga",
  "Instituto Politécnico de Beja",
  "Instituto Politécnico de Bragança",
  "Instituto Politécnico de Castelo Branco",
  "Instituto Politécnico do Cávado e do Ave",
  "Instituto Politécnico de Coimbra",
  "Instituto Politécnico da Guarda",
  "Instituto Politécnico de Leiria",
  "Instituto Politécnico de Lisboa",
  "Instituto Politécnico de Portalegre",
  "Instituto Politécnico do Porto",
  "Instituto Politécnico de Santarém",
  "Instituto Politécnico de Setúbal",
  "Instituto Politécnico de Tomar",
  "Instituto Politécnico de Viana do Castelo",
  "Instituto Politécnico de Viseu",
  "Escola Superior de Enfermagem de Coimbra",
  "Escola Superior de Enfermagem de Lisboa",
  "Escola Superior de Enfermagem do Porto",
  "Escola Náutica Infante D. Henrique",
  "Escola Superior de Hotelaria e Turismo do Estoril",
  "Instituto Politécnico da Lusofonia",
  "Instituto Politécnico da Maia (IPMAIA)",
  "Instituto Politécnico de Gestão e Tecnologia (ISLA Gaia)",
  "Instituto Politécnico de Ciências da Saúde Norte (CESPU)",
  "Instituto Politécnico de Ciências da Saúde Sul (CESPU)",
  "Instituto Politécnico de Saúde do Norte (IPSN)",
  "Instituto Politécnico de Saúde do Sul (IPSS)",
];
const courseOptions = [
  "Engenharia Informática",
  "Ciência de Dados",
  "Engenharia de Telecomunicações",
  "Informática de Gestão",
  "Gestão",
  "Economia",
  "Contabilidade e Finanças",
  "Marketing",
  "Recursos Humanos",
  "Psicologia",
  "Sociologia",
  "Serviço Social",
  "Ciência Política",
  "Relações Internacionais",
  "Engenharia Mecânica",
  "Engenharia Eletrotécnica",
  "Engenharia Civil",
  "Engenharia Biomédica",
  "Engenharia Química",
  "Engenharia de Gestão Industrial",
  "Medicina Veterinária",
  "Assessoria e Tradução",
  "Comércio Internacional",
  "Enologia",
  "Agronomia",
  "Arquitetura",
  "Engenharia Zootécnica",
  "Ciências Agrárias",
  "Ciências da Comunicação",
  "Ciências do Desporto",
  "Desporto",
  "Ciências da Educação",
  "Cinema",
  "Comunicação e multimédia",
  "Criminologia",
  "Design Sustentável",
  "Design de Comunicação",
  "Direito",
  "Solicitadoria",
  "Bioengenharia",
  "Bioinformática",
  "Biologia",
  "Biologia e Geologia",
  "Biologia Marinha",
  "Bioquímica",
  "Biotecnologia",
  "Enfermagem e Reabilitação",
  "Engenharia Aeroespacial",
  "Engenharia do Ambiente",
  "Engenharia Física",
  "Estudos Europeus",
  "Medicina",
  "Enfermagem",
  "Genética e Biotecnologia",
  "Ciências Farmacêuticas",
  "Ciências da Nutrição",
  "Tecnologias de Informação",
  "Automação e Robótica",
  "Contabilidade",
  "Comércio e Negócios Internacionais",
  "Fisioterapia",
  "Farmácia",
  "Radiologia",
  "Dietética e Nutrição",
  "Educação Básica",
  "Educação Social",
  "Animação Sociocultural",
  "Fotografia",
  "Teatro",
  "Comunicação Social",
  "Turismo",
  "Gestão Hoteleira",
  "Guias de Natureza",
  "Arquitetura",
  "Design",
  "Filosofia",
  "Física",
  "Filosofia",
  "Gastronomia",
  "Línguas e Literaturas Modernas",
];
const yearOptions = [
  "1.º Ano",
  "2.º Ano",
  "3.º Ano",
  "4.º Ano",
  "5.º Ano",
];
const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const icsWeekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function formatDateLabel(date) {
  const today = new Date();
  const target = new Date(`${date}T00:00:00`);
  const msPerDay = 86400000;
  const diff = Math.round((target - new Date(today.toDateString())) / msPerDay);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return target.toLocaleDateString("pt-PT");
}

function getTaskDateTime(task) {
  return new Date(`${task.dueDate || "9999-12-31"}T${task.dueTime || "23:59"}`).getTime();
}

function getImportanceRank(importance) {
  return { Alta: 0, Média: 1, Baixa: 2 }[importance] ?? 3;
}

function getAlertIntervalMinutes(interval) {
  return { "30 min": 30, "1 h": 60, "2 h": 120, "24 h": 1440 }[interval] ?? 30;
}

function getDeadlineAlertInfo(task, interval, now) {
  if (task.completed || !task.dueDate || !task.dueTime) return null;

  const deadlineMs = getTaskDateTime(task);
  const minutesLeft = Math.ceil((deadlineMs - now) / 60000);
  const alertWindowMinutes = getAlertIntervalMinutes(interval);

  if (minutesLeft < 0 || minutesLeft > alertWindowMinutes) return null;

  return {
    minutesLeft,
    label: minutesLeft <= 0 ? "Termina agora" : `Faltam ${minutesLeft} min`,
  };
}

function unfoldIcsLines(icsText) {
  return String(icsText)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .reduce((lines, line) => {
      if (/^[ \t]/.test(line) && lines.length > 0) {
        lines[lines.length - 1] += line.slice(1);
      } else {
        lines.push(line);
      }
      return lines;
    }, []);
}

function unescapeIcsValue(value = "") {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function parseIcsDate(value = "") {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?/);
  if (!match) return null;

  const [, year, month, day, hour = "00", minute = "00"] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
}

function readIcsProperty(event, propertyName) {
  const prefix = propertyName.toUpperCase();
  const line = event.find((item) => item.toUpperCase().startsWith(prefix));
  if (!line) return "";
  return unescapeIcsValue(line.slice(line.indexOf(":") + 1));
}

function formatScheduleTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatScheduleDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getScheduleItemKey(item) {
  return [
    item.type,
    item.title,
    item.subject,
    item.day,
    item.startTime,
    item.endTime,
    item.location,
  ].join("|").toLowerCase();
}

function parseIcsSchedule(icsText) {
  const lines = unfoldIcsLines(icsText);
  const events = [];
  let currentEvent = null;

  lines.forEach((line) => {
    if (line === "BEGIN:VEVENT") {
      currentEvent = [];
      return;
    }
    if (line === "END:VEVENT" && currentEvent) {
      events.push(currentEvent);
      currentEvent = null;
      return;
    }
    if (currentEvent) currentEvent.push(line);
  });

  return events
    .map((event) => {
      const summary = readIcsProperty(event, "SUMMARY");
      const location = readIcsProperty(event, "LOCATION");
      const description = readIcsProperty(event, "DESCRIPTION");
      const start = parseIcsDate(readIcsProperty(event, "DTSTART"));
      const end = parseIcsDate(readIcsProperty(event, "DTEND"));
      if (!start || !end) return null;

      const cleanSummary = summary || "Aula importada";
      const parts = cleanSummary.split(/\s[-–]\s/).map((part) => part.trim()).filter(Boolean);
      const subject = parts[0]?.toLowerCase() === "aula" ? parts[1] : parts[0];

      return {
        type: "Aula",
        title: cleanSummary,
        subject: subject || cleanSummary,
        day: icsWeekDays[start.getDay()] || "Segunda",
        date: formatScheduleDate(start),
        startTime: formatScheduleTime(start),
        endTime: formatScheduleTime(end),
        location,
        notes: description,
      };
    })
    .filter((item) => {
      if (!item) return false;
      return item.date >= formatScheduleDate(new Date());
    })
    .filter(Boolean);
}

function App() {
  const [booted, setBooted] = useState(false);
  const [screen, setScreen] = useState("welcome");
  const [authMode, setAuthMode] = useState("login");
  const [registerAwaitingCode, setRegisterAwaitingCode] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [user, setUser] = useState(initialState.user);
  const [tasks, setTasks] = useState(initialState.tasks);
  const [scheduleItems, setScheduleItems] = useState(initialState.scheduleItems);
  const [settings, setSettings] = useState(initialState.settings);
  const [now, setNow] = useState(() => Date.now());
  const [sentDeadlineAlerts, setSentDeadlineAlerts] = useState(() => {
    const raw = localStorage.getItem(DEADLINE_ALERTS_SENT_KEY);
    return raw ? JSON.parse(raw) : {};
  });
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [customFocusMinutes, setCustomFocusMinutes] = useState("25");
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState(null);
  const [taskFilter, setTaskFilter] = useState("Todas");
  const [subjectFilter, setSubjectFilter] = useState("Todas");
  const [taskSearch, setTaskSearch] = useState("");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    verificationCode: "",
    university: universityOptions[0],
    course: courseOptions[0],
    year: yearOptions[0],
  });
  const [notification, setNotification] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    subject: "Interação Pessoa Computador",
    dueDate: new Date().toISOString().slice(0, 10),
    dueTime: "23:59",
    importance: "Média",
    notes: "",
    remind: true,
  });
  const [newScheduleItem, setNewScheduleItem] = useState({
    type: "Aula",
    title: "",
    subject: "Interação Pessoa Computador",
    day: weekDays[0],
    startTime: "09:00",
    endTime: "10:30",
    location: "",
    notes: "",
  });
  const [scheduleImportUrl, setScheduleImportUrl] = useState("");
  const [scheduleImportPreview, setScheduleImportPreview] = useState([]);
  const [scheduleImportStatus, setScheduleImportStatus] = useState("");
  const [profileForm, setProfileForm] = useState({
    degree: "Engenharia Informática - 3º Ano",
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const accountsRaw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const loadedUser = parsed.user
        ? { ...parsed.user, semesterProgress: parsed.user.semesterProgress ?? 0 }
        : null;
      setUser(loadedUser);
      setTasks(parsed.tasks ?? []);
      setScheduleItems(parsed.scheduleItems ?? []);
      const parsedSettings = parsed.settings ?? {};
      setSettings({ ...initialState.settings, ...parsedSettings });
      setScreen(loadedUser ? "dashboard" : "welcome");
    }
    if (accountsRaw) {
      const parsedAccounts = JSON.parse(accountsRaw).map((account) => ({
        ...account,
        semesterProgress: account.semesterProgress ?? 0,
        isVerified: account.isVerified ?? true,
        verificationCode: account.verificationCode ?? "",
        verificationEmailSent: account.verificationEmailSent ?? true,
      }));
      setAccounts(parsedAccounts);
    }
    setBooted(true);
  }, []);

  useEffect(() => {
    if (!booted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, tasks, scheduleItems, settings }));
  }, [user, tasks, scheduleItems, settings, booted]);

  useEffect(() => {
    localStorage.setItem(DEADLINE_ALERTS_SENT_KEY, JSON.stringify(sentDeadlineAlerts));
  }, [sentDeadlineAlerts]);

  useEffect(() => {
    if (!settings.deadlineAlerts) return undefined;

    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, [settings.deadlineAlerts]);

  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const clampProgress = (value) => Math.min(100, Math.max(0, value));
  const updateCurrentUserProgress = (delta) => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      const nextProgress = clampProgress((prevUser.semesterProgress ?? 0) + delta);
      const nextUser = { ...prevUser, semesterProgress: nextProgress };
      setAccounts((prevAccounts) =>
        prevAccounts.map((account) =>
          account.email === nextUser.email ? { ...account, semesterProgress: nextProgress } : account
        )
      );
      return nextUser;
    });
  };

  const generateVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));
  const isSmtpEmailConfigured = Boolean(SMTP_EMAIL_API_URL);
  const sendValidationEmail = async ({ name, email, verificationCode, type = "validation" }) => {
    if (!isSmtpEmailConfigured) return false;

    const payload = {
      name,
      email,
      verificationCode,
      loginUrl: window.location.origin,
      type,
    };

    const response = await fetch(SMTP_EMAIL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response.ok;
  };

  const semesterProgress = user?.semesterProgress ?? 0;

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
          updateCurrentUserProgress(2);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [focusRunning]);
  const isDarkMode =
    settings.theme === "Escuro" ||
    (settings.theme === "Auto" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  const accountToVerify = accounts.find(
    (account) => account.email === authForm.email.toLowerCase().trim()
  );
  const needsVerification = authMode === "login" && accountToVerify && !accountToVerify.isVerified;
  const accountToReset = accounts.find(
    (account) => account.email === authForm.email.toLowerCase().trim()
  );
  const passwordResetCodeSent = authMode === "reset" && Boolean(accountToReset?.passwordResetCode);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = taskSearch.toLowerCase().trim();
    const bySearch = tasks.filter((task) => {
      const title = task.title.toLowerCase();
      const subject = task.subject.toLowerCase();
      return title.includes(normalizedSearch) || subject.includes(normalizedSearch);
    });
    const byStatus = bySearch.filter((task) => {
      if (taskFilter === "Pendentes") return !task.completed;
      if (taskFilter === "Concluídas") return task.completed;
      if (taskFilter === "Urgentes") return task.importance === "Alta";
      return true;
    });
    const bySubject = byStatus.filter((task) =>
      subjectFilter === "Todas" ? true : task.subject === subjectFilter
    );

    return [...bySubject].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const dateDiff = getTaskDateTime(a) - getTaskDateTime(b);
      if (dateDiff !== 0) return dateDiff;
      return getImportanceRank(a.importance) - getImportanceRank(b.importance);
    });
  }, [tasks, taskSearch, taskFilter, subjectFilter]);

  const subjectOptions = useMemo(
    () => ["Todas", ...Array.from(new Set(tasks.map((task) => task.subject).filter(Boolean))).sort()],
    [tasks]
  );
  const scheduleByDay = useMemo(() => {
    const grouped = Object.fromEntries(weekDays.map((day) => [day, []]));

    scheduleItems.forEach((item) => {
      const day = weekDays.includes(item.day) ? item.day : weekDays[0];
      grouped[day].push(item);
    });

    return Object.entries(grouped)
      .map(([day, items]) => ({
        day,
        items: [...items].sort((a, b) => a.startTime.localeCompare(b.startTime)),
      }))
      .filter((group) => group.items.length > 0);
  }, [scheduleItems]);
  const scheduleGrid = useMemo(() => {
    const grouped = Object.fromEntries(weekDays.map((day) => [day, []]));

    scheduleItems.forEach((item) => {
      const day = weekDays.includes(item.day) ? item.day : weekDays[0];
      grouped[day].push(item);
    });

    return weekDays.map((day) => ({
      day,
      items: [...grouped[day]].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));
  }, [scheduleItems]);
  const deadlineAlertTasks = useMemo(() => {
    if (!settings.deadlineAlerts) return [];

    return pendingTasks
      .map((task) => ({
        ...task,
        deadlineAlert: getDeadlineAlertInfo(task, settings.alertInterval, now),
      }))
      .filter((task) => task.deadlineAlert)
      .sort((a, b) => getTaskDateTime(a) - getTaskDateTime(b));
  }, [pendingTasks, settings.deadlineAlerts, settings.alertInterval, now]);

  useEffect(() => {
    if (!settings.deadlineAlerts || deadlineAlertTasks.length === 0) return;

    const getAlertKey = (task) =>
      `${task.id}:${task.dueDate}:${task.dueTime}:${settings.alertInterval}`;
    const nextTask = deadlineAlertTasks.find(
      (task) => !sentDeadlineAlerts[getAlertKey(task)]
    );
    if (!nextTask) return;

    const alertKey = getAlertKey(nextTask);
    const message = `${nextTask.title} termina em ${formatDateLabel(nextTask.dueDate)} às ${nextTask.dueTime}.`;
    window.setTimeout(() => {
      setNotification(`Alerta de prazo: ${message}`);
    }, 0);

    if ("Notification" in window) {
      const showNotification = () =>
        new Notification("Alerta de prazo SoftStudy", {
          body: message,
        });

      if (Notification.permission === "granted") {
        showNotification();
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") showNotification();
        });
      }
    }

    window.setTimeout(() => {
      setSentDeadlineAlerts((prev) => ({ ...prev, [alertKey]: true }));
    }, 0);
  }, [deadlineAlertTasks, sentDeadlineAlerts, settings.alertInterval, settings.deadlineAlerts]);

  useEffect(() => {
    if (pendingTasks.length === 0) {
      setFocusTaskId(null);
      return;
    }
    setFocusTaskId((current) =>
      current && pendingTasks.some((task) => task.id === current)
        ? current
        : pendingTasks[0].id
    );
  }, [pendingTasks]);

  const focusTask = pendingTasks.find((task) => task.id === focusTaskId) || pendingTasks[0];
  const mm = String(Math.floor(focusSecondsLeft / 60)).padStart(2, "0");
  const ss = String(focusSecondsLeft % 60).padStart(2, "0");

  const onAuthSubmit = async () => {
    const email = authForm.email.toLowerCase().trim();
    const existingAccount = accounts.find((account) => account.email === email);
    if (!email.includes("@")) {
      alert("Email inválido.");
      return;
    }
    if (!(authMode === "register" && registerAwaitingCode) && authForm.password.length < 8) {
      alert("A palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }
    if (authMode === "register") {
      if (registerAwaitingCode) {
        if (!existingAccount) {
          alert("Conta não encontrada. Crie a conta novamente.");
          setRegisterAwaitingCode(false);
          return;
        }
        if (existingAccount.isVerified) {
          alert("Este email já está validado. Faça login.");
          setRegisterAwaitingCode(false);
          setAuthMode("login");
          return;
        }
        const enteredCode = authForm.verificationCode.trim();
        if (!enteredCode) {
          alert("Insira o código de validação enviado para o seu email.");
          return;
        }
        if (enteredCode !== existingAccount.verificationCode) {
          alert("Código de validação inválido.");
          return;
        }
        setAccounts((prev) =>
          prev.map((account) =>
            account.email === existingAccount.email
              ? { ...account, isVerified: true, verificationCode: "", verificationEmailSent: true }
              : account
          )
        );
        setRegisterAwaitingCode(false);
        setNotification("Email validado com sucesso. Já pode fazer login.");
        alert("Email validado com sucesso. Agora faça login.");
        setAuthMode("login");
        setAuthForm((prev) => ({
          ...prev,
          password: "",
          confirmPassword: "",
          verificationCode: "",
        }));
        return;
      }
      if (authForm.name.trim().length < 2) {
        alert("Nome inválido.");
        return;
      }
      if (!authForm.university || !authForm.course || !authForm.year) {
        alert("Escolha universidade, curso e ano.");
        return;
      }
      if (authForm.password !== authForm.confirmPassword) {
        alert("As palavras-passe não coincidem.");
        return;
      }
      if (existingAccount) {
        if (existingAccount.isVerified) {
          alert("Esta conta já existe e já está validada. Faça login.");
          return;
        }

        if (!existingAccount.verificationCode) {
          const newCode = generateVerificationCode();
          setAccounts((prev) =>
            prev.map((account) =>
              account.email === existingAccount.email
                ? { ...account, verificationCode: newCode, verificationEmailSent: false }
                : account
            )
          );
          const emailResult = await sendValidationEmail({
            name: existingAccount.name,
            email: existingAccount.email,
            verificationCode: newCode,
          });
          if (emailResult.ok) {
            alert(`Conta já criada mas não validada. Enviámos um novo código para ${existingAccount.email}. Insira-o para validar.`);
          } else {
            alert("Conta já criada mas não validada. Não foi possível enviar o código agora. Tente reenviar.");
          }
        } else {
          alert("Esta conta já existe mas ainda não está validada. Insira o código enviado para o email ou reenvie o código.");
        }
        setRegisterAwaitingCode(true);
        return;
      }

      const verificationCode = generateVerificationCode();
      const account = {
        id: crypto.randomUUID(),
        name: authForm.name.trim(),
        email,
        password: authForm.password,
        university: authForm.university,
        course: authForm.course,
        year: authForm.year,
        semesterProgress: 0,
        isVerified: false,
        verificationCode,
        verificationEmailSent: false,
      };
      setAccounts((prev) => [...prev, account]);
      const emailResult = await sendValidationEmail({
        name: account.name,
        email: account.email,
        verificationCode,
      });
      if (emailResult.ok) {
        setAccounts((prev) =>
          prev.map((existing) =>
            existing.email === account.email
              ? { ...existing, verificationEmailSent: true }
              : existing
          )
        );
        alert(`Conta criada. Um código de validação foi enviado para ${account.email}. Insira o código para validar o email.`);
        setNotification(`Código enviado para ${account.email}.`);
        setRegisterAwaitingCode(true);
      } else {
        alert("Conta criada, mas não foi possível enviar o código agora. Tente reenviar.");
        setNotification("Falha ao enviar email. Reenvie o código.");
        setRegisterAwaitingCode(true);
      }
      setAuthForm((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
        verificationCode: "",
      }));
      return;
    }

    if (!existingAccount || existingAccount.password !== authForm.password) {
      alert("Conta não encontrada ou palavra-passe incorreta.");
      return;
    }
    if (!existingAccount.isVerified) {
      alert("Email ainda não validado. Vá para 'Criar Conta' e introduza o código enviado.");
      return;
    }
    setUser({
      name: existingAccount.name,
      email: existingAccount.email,
      semesterProgress: existingAccount.semesterProgress ?? 0,
      university: existingAccount.university,
      course: existingAccount.course,
      year: existingAccount.year,
    });
    setScreen("dashboard");
  };

  const resendVerificationCode = async () => {
    const email = authForm.email.toLowerCase().trim();
    const account = accounts.find((a) => a.email === email);
    if (!account) {
      alert("Conta não encontrada.");
      return;
    }
    if (account.isVerified) {
      alert("Esta conta já está verificada.");
      return;
    }
    const verificationCode = account.verificationCode || generateVerificationCode();
    if (!account.verificationCode) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.email === account.email ? { ...a, verificationCode, verificationEmailSent: false } : a
        )
      );
    }
    const emailResult = await sendValidationEmail({
      name: account.name,
      email: account.email,
      verificationCode,
    });
    if (emailResult.ok) {
      alert(`Código de validação reenviado para ${account.email}. Verifique o seu email.`);
      setNotification(`Código reenviado com sucesso.`);
    } else {
      alert("Não foi possível reenviar o código. Tente novamente mais tarde.");
      setNotification("Falha ao reenviar. Tente novamente.");
    }
  };

  const requestPasswordReset = async () => {
    const email = authForm.email.toLowerCase().trim();
    const account = accounts.find((a) => a.email === email);
    if (!email.includes("@")) {
      alert("Email inválido.");
      return;
    }
    if (!account) {
      alert("Conta não encontrada.");
      return;
    }

    const passwordResetCode = generateVerificationCode();
    const emailOk = await sendValidationEmail({
      name: account.name,
      email: account.email,
      verificationCode: passwordResetCode,
      type: "password-reset",
    });

    if (emailOk) {
      setAccounts((prev) =>
        prev.map((existing) =>
          existing.email === account.email ? { ...existing, passwordResetCode } : existing
        )
      );
      alert(`Código de recuperação enviado para ${account.email}.`);
      setNotification(`Código de recuperação enviado para ${account.email}.`);
    } else {
      alert("Não foi possível enviar o email de recuperação. Tente novamente mais tarde.");
      setNotification("Falha ao enviar email de recuperação.");
    }
  };

  const confirmPasswordReset = () => {
    const email = authForm.email.toLowerCase().trim();
    const account = accounts.find((a) => a.email === email);
    if (!account) {
      alert("Conta não encontrada.");
      return;
    }
    if (!authForm.verificationCode || authForm.verificationCode !== account.passwordResetCode) {
      alert("Código de recuperação inválido.");
      return;
    }
    if (authForm.password.length < 8) {
      alert("A nova palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }
    if (authForm.password !== authForm.confirmPassword) {
      alert("As palavras-passe não coincidem.");
      return;
    }

    setAccounts((prev) =>
      prev.map((existing) =>
        existing.email === account.email
          ? { ...existing, password: authForm.password, passwordResetCode: null }
          : existing
      )
    );
    setAuthMode("login");
    setNotification("Palavra-passe alterada com sucesso. Já pode entrar.");
    setAuthForm((prev) => ({
      ...prev,
      password: "",
      confirmPassword: "",
      verificationCode: "",
    }));
  };

  const logout = () => {
    setUser(null);
    setScreen("welcome");
    setAuthMode("login");
    setRegisterAwaitingCode(false);
    setNotification("");
    setAuthForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      verificationCode: "",
      university: universityOptions[0],
      course: courseOptions[0],
      year: yearOptions[0],
    });
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

  const addScheduleItem = () => {
    if (!newScheduleItem.title.trim()) {
      alert("O nome da aula ou atividade é obrigatório.");
      return;
    }
    if (newScheduleItem.endTime <= newScheduleItem.startTime) {
      alert("A hora de fim deve ser posterior à hora de início.");
      return;
    }

    const item = {
      id: crypto.randomUUID(),
      ...newScheduleItem,
      title: newScheduleItem.title.trim(),
      subject: newScheduleItem.subject.trim(),
      location: newScheduleItem.location.trim(),
      notes: newScheduleItem.notes.trim(),
    };

    setScheduleItems((prev) => [...prev, item]);
    setNewScheduleItem((prev) => ({ ...prev, title: "", location: "", notes: "" }));
  };

  const previewImportedScheduleItems = (items, sourceLabel) => {
    const uniqueItems = Array.from(
      new Map(items.map((item) => [getScheduleItemKey(item), item])).values()
    );

    if (!uniqueItems.length) {
      setScheduleImportPreview([]);
      setScheduleImportStatus("Não foram encontrados eventos no horário importado.");
      return;
    }

    setScheduleImportPreview(uniqueItems);
    setScheduleImportStatus(
      `${uniqueItems.length} evento(s) únicos encontrados em ${sourceLabel}. Clique em "Guardar eventos importados" para visualizar na grelha.`
    );
  };

  const importScheduleFromUrl = async () => {
    const url = scheduleImportUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      alert("Cole um URL válido do horário.");
      return;
    }

    try {
      setScheduleImportStatus("A importar horário por URL...");
      const response = await fetch(SCHEDULE_IMPORT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("O servidor de importação não respondeu em JSON. Confirme que o backend está a correr com npm run dev:server.");
      }

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Não foi possível importar o horário.");
      }

      previewImportedScheduleItems(result.items || [], "URL");
    } catch (error) {
      setScheduleImportStatus(error.message);
    }
  };

  const importScheduleFromFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      previewImportedScheduleItems(parseIcsSchedule(text), file.name);
    } catch (error) {
      setScheduleImportStatus(error.message);
    } finally {
      event.target.value = "";
    }
  };

  const saveImportedScheduleItems = () => {
    if (!scheduleImportPreview.length) return;

    const existingKeys = new Set(scheduleItems.map(getScheduleItemKey));
    const newItems = [];

    scheduleImportPreview.forEach((item) => {
      const key = getScheduleItemKey(item);
      if (existingKeys.has(key)) return;
      existingKeys.add(key);
      newItems.push({ ...item, id: crypto.randomUUID(), imported: true });
    });

    if (!newItems.length) {
      setScheduleImportStatus("Todos os eventos importados já existem no horário.");
      return;
    }

    setScheduleItems((prev) => [...prev, ...newItems]);
    setScheduleImportPreview([]);
    setScheduleImportStatus(`${newItems.length} evento(s) adicionados ao horário. Veja-os na grelha semanal abaixo.`);
  };

  const deleteScheduleItem = (id) => {
    setScheduleItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const updated = { ...task, completed: !task.completed };
        updateCurrentUserProgress(updated.completed ? 8 : -8);
        return updated;
      })
    );
  };

  const resetTimer = () => {
    setFocusRunning(false);
    setFocusSecondsLeft(focusMinutes * 60);
  };

  const applyCustomFocusMinutes = () => {
    const value = Number(customFocusMinutes);
    if (!Number.isInteger(value) || value < 1 || value > 180) {
      alert("Escolha um tempo entre 1 e 180 minutos.");
      return;
    }

    setFocusMinutes(value);
    setFocusSecondsLeft(value * 60);
    setFocusRunning(false);
  };

  const toggleFocusRunning = () => {
    if (!focusRunning && focusSecondsLeft === 0) {
      setFocusSecondsLeft(focusMinutes * 60);
    }
    setFocusRunning((current) => !current);
  };

  if (!booted) return <div className="app-container loading">A carregar...</div>;

  const showBottomNav = ["dashboard", "tasks", "focus", "schedule", "settings", "profile"].includes(screen);

  return (
    <div className={`app-container ${isDarkMode ? "dark" : ""}`} style={{ fontSize: `${settings.textSize}px` }}>
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
            <button className="btn primary" onClick={() => { setAuthMode("register"); setRegisterAwaitingCode(false); setScreen("auth"); }}>
              Criar Conta
            </button>
            <button className="btn ghost" onClick={() => { setAuthMode("login"); setRegisterAwaitingCode(false); setScreen("auth"); }}>
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
            <h2>
              {authMode === "register"
                ? "Bem Vindo à SoftStudy"
                : authMode === "reset"
                  ? "Recuperar palavra-passe"
                  : "Bem Vindo de volta!"}
            </h2>
            <p className="muted">
              {authMode === "register"
                ? "Preencha os dados para começar"
                : authMode === "reset"
                  ? "Indique o email da conta para receber um código."
                  : "Faça login para continuar."}
            </p>
            {notification && <p className="muted info-text">{notification}</p>}
            {authMode === "register" && !registerAwaitingCode && (
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
            {(authMode !== "reset" || passwordResetCodeSent) && (
              <input
                className="input"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={authForm.password}
                onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
              />
            )}
            {authMode === "register" && (
              <input
                className="input"
                type="password"
                placeholder={authMode === "reset" ? "Nova palavra-passe" : "Mínimo 8 caracteres"}
                value={authForm.password}
                onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
              />
            )}
            {(authMode === "register" || passwordResetCodeSent) && (
              <input
                className="input"
                type="password"
                placeholder={
                  authMode === "reset" ? "Confirmar nova palavra-passe" : "Confirmar palavra-passe"
                }
                value={authForm.confirmPassword}
                onChange={(e) => setAuthForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              />
            )}

            {((authMode === "login" && needsVerification) || passwordResetCodeSent) && (
              <>
                <input
                  className="input"
                  placeholder={
                    authMode === "reset" ? "Código de recuperação" : "Código de validação"
                  }
                  value={authForm.verificationCode}
                  onChange={(e) => setAuthForm((p) => ({ ...p, verificationCode: e.target.value }))}
                />
                {authMode === "login" && (
                  <button className="btn ghost" onClick={resendVerificationCode}>
                    Reenviar Código
                  </button>
                )}
              </>
            )}
            {authMode === "register" && (
              <>
                <label className="input-label">Universidade</label>
                <select
                  className="input"
                  value={authForm.university}
                  onChange={(e) => setAuthForm((p) => ({ ...p, university: e.target.value }))}
                >
                  {universityOptions.map((uni) => (
                    <option key={uni} value={uni}>{uni}</option>
                  ))}
                </select>
                <label className="input-label">Curso</label>
                <select
                  className="input"
                  value={authForm.course}
                  onChange={(e) => setAuthForm((p) => ({ ...p, course: e.target.value }))}
                >
                  {courseOptions.map((course) => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
                <label className="input-label">Ano</label>
                <select
                  className="input"
                  value={authForm.year}
                  onChange={(e) => setAuthForm((p) => ({ ...p, year: e.target.value }))}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </>
            )}
          </div>
          <div className="actions-stack">
<<<<<<< HEAD
            <button className="btn primary" onClick={onAuthSubmit}>
              {authMode === "register"
                ? registerAwaitingCode
            <button
              className="btn primary"
              onClick={
                authMode === "reset"
                  ? passwordResetCodeSent
                    ? confirmPasswordReset
                    : requestPasswordReset
                  : onAuthSubmit
              }
            >
              {authMode === "register"
                ? "Criar Conta"
                : authMode === "reset"
                  ? passwordResetCodeSent
                    ? "Alterar Palavra-passe"
                    : "Enviar Código"
                  : "Entrar"}
            </button>
            {authMode === "login" && (
              <button
                className="link-button"
                onClick={() => {
                  setNotification("");
                  setAuthMode("reset");
                  setAuthForm((prev) => ({
                    ...prev,
                    password: "",
                    confirmPassword: "",
                    verificationCode: "",
                  }));
                }}
              >
                Esqueceu-se da palavra-passe?
              onClick={() => {
                setNotification("");
                setRegisterAwaitingCode(false);
                setAuthMode((m) => (m === "login" ? "register" : "login"));
                setAuthForm((prev) => ({
                  ...prev,
                  password: "",
                  confirmPassword: "",
                  verificationCode: "",
                }));
              }}
            >
              {authMode === "register" || authMode === "reset"
                ? "Já tem conta? Entrar"
                : "Ainda não tem conta? Criar conta"}
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
            <button className="card action" onClick={() => setScreen("schedule")}>
              <strong>Horário</strong>
              <span>Aulas e atividades</span>
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
            placeholder="Pesquisar por tarefa ou cadeira..."
            value={taskSearch}
            onChange={(e) => setTaskSearch(e.target.value)}
          />
          <p className="muted">Organizadas automaticamente por prazo e importância.</p>
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
          <label className="input-label">Filtrar por cadeira</label>
          <div className="chips">
            {subjectOptions.map((subject) => (
              <button
                key={subject}
                className={`chip ${subjectFilter === subject ? "active" : ""}`}
                onClick={() => setSubjectFilter(subject)}
              >
                {subject}
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
            <button className="btn primary" onClick={toggleFocusRunning}>{focusRunning ? "Pausar" : "Iniciar"}</button>
            <button className="btn ghost" onClick={() => setScreen("tasks")}>Tarefas</button>
          </div>
          <div className="card">
            <label className="input-label">Tempo personalizado em minutos</label>
            <input
              className="input"
              min="1"
              max="180"
              placeholder="Ex: 30"
              type="number"
              value={customFocusMinutes}
              onChange={(e) => setCustomFocusMinutes(e.target.value)}
            />
            <button className="btn ghost" onClick={applyCustomFocusMinutes}>
              Aplicar tempo
            </button>
          </div>
        </section>
      )}

      {screen === "schedule" && (
        <section className="screen scroll">
          <div className="top-row">
            <div>
              <h2>Horário</h2>
              <p className="muted">Importe o horário escolar e adicione atividades externas.</p>
            </div>
            <button className="small-link" onClick={() => setScreen("dashboard")}>Voltar</button>
          </div>

          <div className="card">
            <h3>Importar horário escolar</h3>
            <p className="muted">
              Cole o URL de sincronização do Inforestudante ou importe um ficheiro .ics descarregado.
            </p>
            <label className="input-label">URL do horário</label>
            <input
              className="input"
              placeholder="https://inforestudante.utad.pt/nonio/util/sincronizaHorarioNonio.do?..."
              value={scheduleImportUrl}
              onChange={(e) => setScheduleImportUrl(e.target.value)}
            />
            <button className="btn ghost" onClick={importScheduleFromUrl}>
              Importar por URL
            </button>
            <label className="input-label">Ou importar ficheiro .ics</label>
            <input className="input" type="file" accept=".ics,text/calendar" onChange={importScheduleFromFile} />
            {scheduleImportStatus && <p className="muted info-text">{scheduleImportStatus}</p>}
            {scheduleImportPreview.length > 0 && (
              <>
                <h4>Pré-visualização</h4>
                {scheduleImportPreview.slice(0, 5).map((item) => (
                  <div key={getScheduleItemKey(item)} className="card task">
                    <small>{item.day} · {item.startTime} - {item.endTime}</small>
                    <h4>{item.title}</h4>
                    <p className="muted">
                      {item.subject}
                      {item.location ? ` · ${item.location}` : ""}
                    </p>
                  </div>
                ))}
                {scheduleImportPreview.length > 5 && (
                  <p className="muted">Mais {scheduleImportPreview.length - 5} evento(s) na importação.</p>
                )}
                <button className="btn primary" onClick={saveImportedScheduleItems}>
                  Guardar eventos importados e mostrar no horário
                </button>
                <button className="btn ghost" onClick={() => setScheduleImportPreview([])}>
                  Cancelar importação
                </button>
              </>
            )}
          </div>

          <div className="card">
            <h3>Adicionar atividade manual</h3>
            <label className="input-label">Tipo</label>
            <div className="chips">
              {["Aula", "Atividade externa"].map((type) => (
                <button
                  key={type}
                  className={`chip ${newScheduleItem.type === type ? "active" : ""}`}
                  onClick={() => setNewScheduleItem((prev) => ({ ...prev, type }))}
                >
                  {type}
                </button>
              ))}
            </div>
            <label className="input-label">Nome</label>
            <input
              className="input"
              placeholder="Ex: Teórica de IPC ou Ginásio"
              value={newScheduleItem.title}
              onChange={(e) => setNewScheduleItem((prev) => ({ ...prev, title: e.target.value }))}
            />
            <label className="input-label">Cadeira ou área</label>
            <input
              className="input"
              placeholder="Ex: Interação Pessoa Computador"
              value={newScheduleItem.subject}
              onChange={(e) => setNewScheduleItem((prev) => ({ ...prev, subject: e.target.value }))}
            />
            <div className="grid-2">
              <div>
                <label className="input-label">Dia</label>
                <select
                  className="input"
                  value={newScheduleItem.day}
                  onChange={(e) => setNewScheduleItem((prev) => ({ ...prev, day: e.target.value }))}
                >
                  {weekDays.map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Local</label>
                <input
                  className="input"
                  placeholder="Sala, campus ou local"
                  value={newScheduleItem.location}
                  onChange={(e) =>
                    setNewScheduleItem((prev) => ({ ...prev, location: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label className="input-label">Início</label>
                <input
                  className="input"
                  type="time"
                  value={newScheduleItem.startTime}
                  onChange={(e) =>
                    setNewScheduleItem((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="input-label">Fim</label>
                <input
                  className="input"
                  type="time"
                  value={newScheduleItem.endTime}
                  onChange={(e) =>
                    setNewScheduleItem((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                />
              </div>
            </div>
            <label className="input-label">Notas</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Ex: levar portátil, material, grupo de trabalho..."
              value={newScheduleItem.notes}
              onChange={(e) => setNewScheduleItem((prev) => ({ ...prev, notes: e.target.value }))}
            />
            <button className="btn primary" onClick={addScheduleItem}>
              Adicionar ao Horário
            </button>
          </div>

          <h3>Vista semanal</h3>
          {scheduleByDay.length === 0 && (
            <p className="muted">Ainda não há eventos guardados. Importe o horário ou adicione uma atividade.</p>
          )}
          <div className="schedule-grid">
            {scheduleGrid.map((group) => (
              <div key={group.day} className="schedule-day">
                <strong>{group.day}</strong>
                {group.items.length === 0 ? (
                  <p className="muted">Sem eventos</p>
                ) : (
                  group.items.map((item) => (
                    <div key={item.id} className="schedule-block">
                          <small>
                            {item.date ? `${formatDateLabel(item.date)} · ` : ""}
                            {item.startTime} - {item.endTime}
                          </small>
                      <h4>{item.title}</h4>
                      <p>
                        {item.type} · {item.subject}
                        {item.location ? ` · ${item.location}` : ""}
                      </p>
                      {item.notes && <p className="muted">{item.notes}</p>}
                      <button className="btn mini ghost" onClick={() => deleteScheduleItem(item.id)}>
                        Remover
                      </button>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {screen === "settings" && (
        <section className="screen scroll">
          <div className="top-row">
            <h2>Configurações</h2>
            <button className="small-link" onClick={() => setScreen("profile")}>Voltar</button>
          </div>
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
                <p className="muted">Escolha quanto tempo antes do prazo quer ser avisado</p>
              </div>
            </div>
            <select className="input" value={settings.alertInterval} onChange={(e) => setSettings((s) => ({ ...s, alertInterval: e.target.value }))}>
              <option>30 min</option>
              <option>1 h</option>
              <option>2 h</option>
              <option>24 h</option>
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
              </div>
            </div>
            <div className="settings-row" style={{ alignItems: "center", gap: "12px" }}>
              <input
                type="range"
                min="14"
                max="22"
                value={settings.textSize}
                aria-label="Tamanho do texto"
                onChange={(e) => setSettings((s) => ({ ...s, textSize: Number(e.target.value) }))}
              />
            </div>
            <button className="btn ghost">Exemplo de texto académico</button>
          </div>

          <div className="card tile settings-row">
            <div className="tile-main">
              <span className="tile-icon">♿</span>
              <div>
                <strong>Leitor de Tela</strong>
              </div>
            </div>
            <label className="switch-row" style={{ gap: "8px", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={settings.screenReader}
                onChange={(e) => setSettings((s) => ({ ...s, screenReader: e.target.checked }))}
                aria-label="Ativar leitor de tela"
              />
              {settings.screenReader ? "Ativado" : "Desativado"}
            </label>
          </div>
          <button className="btn ghost settings-reset" onClick={() => setSettings(initialState.settings)}>Repor Predefinições</button>
        </section>
      )}

      {screen === "notifications" && (
        <section className="screen scroll">
          <div className="top-row">
            <h2>{"Notifica\u00E7\u00F5es"}</h2>
            <button className="small-link" onClick={() => setScreen("dashboard")}>Fechar</button>
          </div>
          {!settings.deadlineAlerts ? (
            <div className="card task">
              <h4>Alertas desligados</h4>
              <p className="muted">Ative os alertas de prazos nas configurações para receber lembretes.</p>
            </div>
          ) : deadlineAlertTasks.length === 0 ? (
            <div className="card task">
              <h4>Sem alertas pendentes</h4>
              <p className="muted">Não há tarefas a terminar dentro do intervalo de {settings.alertInterval}.</p>
            </div>
          ) : (
            deadlineAlertTasks.slice(0, 8).map((task) => (
              <div key={task.id} className="card task">
                <small>Prazo próximo · {task.deadlineAlert.label}</small>
                <h4>{task.title}</h4>
                <p className="muted">{task.subject} · {formatDateLabel(task.dueDate)} às {task.dueTime}</p>
                <button className="btn mini primary" onClick={() => setScreen("tasks")}>Ver tarefa</button>
              </div>
            ))
          )}
        </section>
      )}

      {screen === "language" && (
        <section className="screen scroll">
          <div className="top-row">
            <h2>Idioma</h2>
            <button className="small-link" onClick={() => setScreen("profile")}>Fechar</button>
          </div>
          <div className="card tile">
            <div className="tile-main">
              <span className="tile-icon">🌐</span>
              <div>
                <strong>Idioma da interface</strong>
                <p className="muted">Escolhe o idioma da aplicação.</p>
              </div>
            </div>
            <select
              className="input"
              value={settings.language}
              onChange={(e) => setSettings((s) => ({ ...s, language: e.target.value }))}
            >
              <option>Português</option>
              <option>English</option>
              <option>Español</option>
              <option>Français</option>
              <option>Italiano</option>
              <option>Deutsch</option>
              <option>Nederlands</option>
              <option>日本語</option>
              <option>简体中文</option>
              <option>한국어</option>
            </select>
          </div>
          <p className="muted">A selecção de idioma é apenas para demonstrar o fluxo na interface.</p>
        </section>
      )}

      {screen === "history" && (
        <section className="screen scroll">
          <div className="top-row">
            <h2>Histórico</h2>
            <button className="small-link" onClick={() => setScreen("profile")}>Fechar</button>
          </div>
          {completedTasks.length === 0 ? (
            <div className="card task">
              <h4>Sem histórico de tarefas</h4>
              <p className="muted">Quando completares tarefas, elas aparecerão aqui.</p>
            </div>
          ) : (
            completedTasks.slice(-10).reverse().map((task) => (
              <div key={task.id} className="card task">
                <small>Concluída</small>
                <h4>{task.title}</h4>
                <p className="muted">{task.subject} · {formatDateLabel(task.dueDate)} às {task.dueTime}</p>
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
            <button className="card action" onClick={() => setScreen("notifications")}>🔔 Notificações</button>
            <button className="card action" onClick={() => setScreen("settings")}>⚙️ Personalização</button>
            <button className="card action" onClick={() => setScreen("language")}>🌐 Idioma</button>
            <button className="card action" onClick={() => setScreen("history")}>🕘 Histórico</button>
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
          <button className={screen === "schedule" ? "active" : ""} onClick={() => setScreen("schedule")}><span>▦</span>Horário</button>
          <button className={screen === "settings" ? "active" : ""} onClick={() => setScreen("settings")}><span>⚙</span>Ajustes</button>
        </nav>
      )}
    </div>
  );
}

export default App;