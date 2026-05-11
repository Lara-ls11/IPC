import bcrypt from "bcryptjs";
import {
  createUser,
  findUserByEmail,
  findUserById,
  getAppData,
  saveAppData,
  serializeUser,
  setPasswordResetCode,
  setVerificationEmailSentByEmail,
  updatePasswordHashByEmail,
  updateProfile,
  verifyUserEmail,
} from "./db.js";
import { authMiddleware, signUserToken } from "./jwt.js";
import { sendSoftStudyMail } from "./mail.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildSession(userId) {
  const row = findUserById(userId);
  const data = getAppData(userId) || {
    tasks: [],
    scheduleItems: [],
    settings: {},
    sentDeadlineAlerts: {},
  };
  return {
    user: serializeUser(row),
    tasks: data.tasks,
    scheduleItems: data.scheduleItems,
    settings: data.settings,
    sentDeadlineAlerts: data.sentDeadlineAlerts,
  };
}

export function mountUserApiRoutes(app, { transporter, smtpUsername, smtpPassword, fromEmail, fromName }) {
  const canSendMail = Boolean(smtpUsername && smtpPassword && fromEmail);

  app.post("/api/auth/register", async (request, response) => {
    const name = String(request.body.name || "").trim();
    const email = String(request.body.email || "").trim().toLowerCase();
    const password = String(request.body.password || "");
    const university = String(request.body.university || "").trim();
    const course = String(request.body.course || "").trim();
    const year = String(request.body.year || "").trim();
    const loginUrl = String(request.body.loginUrl || "").trim();

    if (name.length < 2) {
      response.status(400).json({ ok: false, error: "Nome inválido." });
      return;
    }
    if (!isValidEmail(email)) {
      response.status(400).json({ ok: false, error: "Email inválido." });
      return;
    }
    if (password.length < 8) {
      response.status(400).json({ ok: false, error: "A palavra-passe deve ter pelo menos 8 caracteres." });
      return;
    }
    if (!university || !course || !year) {
      response.status(400).json({ ok: false, error: "Universidade, curso e ano são obrigatórios." });
      return;
    }
    if (findUserByEmail(email)) {
      response.status(409).json({ ok: false, error: "Esta conta já existe." });
      return;
    }

    const verificationCode = generateCode();
    const passwordHash = bcrypt.hashSync(password, 10);
    let emailSent = false;

    if (canSendMail) {
      try {
        await sendSoftStudyMail(transporter, {
          fromEmail,
          fromName,
          toEmail: email,
          name,
          verificationCode,
          loginUrl,
          type: "validation",
        });
        emailSent = true;
      } catch (error) {
        console.error("Erro ao enviar email de validação:", error.message);
      }
    }

    createUser({
      email,
      passwordHash,
      name,
      university,
      course,
      year,
      verificationCode,
      verificationEmailSent: emailSent,
    });

    response.status(201).json({ ok: true, emailSent });
  });

  app.post("/api/auth/login", async (request, response) => {
    const email = String(request.body.email || "").trim().toLowerCase();
    const password = String(request.body.password || "");
    const verificationCode = String(request.body.verificationCode || "").trim();

    if (!isValidEmail(email) || password.length < 8) {
      response.status(400).json({ ok: false, error: "Dados inválidos." });
      return;
    }

    const user = findUserByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      response.status(401).json({ ok: false, error: "Conta não encontrada ou palavra-passe incorreta." });
      return;
    }

    if (!user.is_verified) {
      if (!verificationCode) {
        response.status(403).json({
          ok: false,
          code: "NEEDS_VERIFICATION",
          error: "Insira o código enviado para o email.",
        });
        return;
      }
      if (verificationCode !== user.verification_code) {
        response.status(400).json({ ok: false, error: "Código de verificação inválido." });
        return;
      }
      verifyUserEmail(user.id);
    }

    const token = await signUserToken(user.id);
    response.json({ ok: true, token, ...buildSession(user.id) });
  });

  app.post("/api/auth/resend-verification", async (request, response) => {
    const email = String(request.body.email || "").trim().toLowerCase();
    const loginUrl = String(request.body.loginUrl || "").trim();

    if (!isValidEmail(email)) {
      response.status(400).json({ ok: false, error: "Email inválido." });
      return;
    }
    const user = findUserByEmail(email);
    if (!user) {
      response.status(404).json({ ok: false, error: "Conta não encontrada." });
      return;
    }
    if (user.is_verified) {
      response.status(400).json({ ok: false, error: "Esta conta já está verificada." });
      return;
    }
    if (!canSendMail) {
      response.status(500).json({ ok: false, error: "SMTP não configurado." });
      return;
    }
    try {
      await sendSoftStudyMail(transporter, {
        fromEmail,
        fromName,
        toEmail: email,
        name: user.name,
        verificationCode: user.verification_code,
        loginUrl,
        type: "validation",
      });
      setVerificationEmailSentByEmail(email, true);
      response.json({ ok: true });
    } catch (error) {
      response.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/auth/forgot-password", async (request, response) => {
    const email = String(request.body.email || "").trim().toLowerCase();
    const loginUrl = String(request.body.loginUrl || "").trim();

    if (!isValidEmail(email)) {
      response.status(400).json({ ok: false, error: "Email inválido." });
      return;
    }
    const user = findUserByEmail(email);
    if (!user) {
      response.status(404).json({ ok: false, error: "Conta não encontrada." });
      return;
    }
    if (!canSendMail) {
      response.status(500).json({ ok: false, error: "SMTP não configurado." });
      return;
    }
    const passwordResetCode = generateCode();
    setPasswordResetCode(email, passwordResetCode);
    try {
      await sendSoftStudyMail(transporter, {
        fromEmail,
        fromName,
        toEmail: email,
        name: user.name,
        verificationCode: passwordResetCode,
        loginUrl,
        type: "password-reset",
      });
      response.json({ ok: true });
    } catch (error) {
      response.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/auth/reset-password", (request, response) => {
    const email = String(request.body.email || "").trim().toLowerCase();
    const code = String(request.body.code || "").trim();
    const newPassword = String(request.body.newPassword || "");

    if (!isValidEmail(email)) {
      response.status(400).json({ ok: false, error: "Email inválido." });
      return;
    }
    const user = findUserByEmail(email);
    if (!user) {
      response.status(404).json({ ok: false, error: "Conta não encontrada." });
      return;
    }
    if (!user.password_reset_code || user.password_reset_code !== code) {
      response.status(400).json({ ok: false, error: "Código de recuperação inválido." });
      return;
    }
    if (newPassword.length < 8) {
      response.status(400).json({ ok: false, error: "A nova palavra-passe deve ter pelo menos 8 caracteres." });
      return;
    }
    updatePasswordHashByEmail(email, bcrypt.hashSync(newPassword, 10));
    response.json({ ok: true });
  });

  const requireAuth = authMiddleware();

  app.get("/api/me/data", requireAuth, (request, response) => {
    response.json({ ok: true, ...buildSession(request.userId) });
  });

  app.put("/api/me/data", requireAuth, (request, response) => {
    const { tasks, scheduleItems, settings, sentDeadlineAlerts, semesterProgress } = request.body || {};
    saveAppData(request.userId, {
      tasks,
      scheduleItems,
      settings,
      sentDeadlineAlerts,
      semesterProgress,
    });
    response.json({ ok: true });
  });

  app.patch("/api/me/profile", requireAuth, (request, response) => {
    const name = String(request.body.name || "").trim();
    const email = String(request.body.email || "").trim().toLowerCase();

    if (name.length < 2) {
      response.status(400).json({ ok: false, error: "Nome inválido." });
      return;
    }
    if (!isValidEmail(email)) {
      response.status(400).json({ ok: false, error: "Email inválido." });
      return;
    }
    const result = updateProfile(request.userId, { name, email });
    if (!result.ok) {
      response.status(409).json({ ok: false, error: "Este email já está em uso." });
      return;
    }
    const row = findUserById(request.userId);
    response.json({ ok: true, user: serializeUser(row) });
  });
}
