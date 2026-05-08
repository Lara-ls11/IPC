import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpUsername = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASS;
const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUsername;
const fromName = process.env.SMTP_FROM_NAME || "SoftStudy";
const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUsername,
    pass: smtpPassword,
  },
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/send-validation-email", async (request, response) => {
  const name = String(request.body.name || "").trim();
  const email = String(request.body.email || "").trim().toLowerCase();
  const verificationCode = String(request.body.verificationCode || "").trim();
  const loginUrl = String(request.body.loginUrl || "").trim();
  const type = request.body.type === "password-reset" ? "password-reset" : "validation";

  if (!smtpUsername || !smtpPassword || !fromEmail) {
    response.status(500).json({ ok: false, error: "SMTP nao configurado." });
    return;
  }

  if (!name || !isValidEmail(email) || !verificationCode) {
    response.status(400).json({ ok: false, error: "Dados invalidos." });
    return;
  }

  try {
    const isPasswordReset = type === "password-reset";
    const subject = isPasswordReset
      ? "Codigo para recuperar a palavra-passe SoftStudy"
      : "Codigo de validacao SoftStudy";
    const intro = isPasswordReset
      ? "Recebemos um pedido para alterar a sua palavra-passe."
      : "O seu codigo de validacao SoftStudy e:";
    const warning = isPasswordReset
      ? "Se nao pediu esta alteracao, ignore este email."
      : "Se nao criou esta conta, ignore este email.";

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject,
      text: [
        `Ola ${name},`,
        "",
        intro,
        verificationCode,
        "",
        loginUrl ? `Pode voltar a app em: ${loginUrl}` : "",
        "",
        warning,
      ].join("\n"),
      html: `
        <p>Ola ${escapeHtml(name)},</p>
        <p>${escapeHtml(intro)}</p>
        <p style="font-size: 24px; font-weight: bold;">${escapeHtml(verificationCode)}</p>
        ${loginUrl ? `<p>Pode voltar a app em: <a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a></p>` : ""}
        <p>${escapeHtml(warning)}</p>
      `,
    });

    response.json({ ok: true });
  } catch (error) {
    response.status(500).json({ ok: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`SMTP email server running on http://localhost:${port}`);
});
