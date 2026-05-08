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

const weekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

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
  const prefix = `${propertyName.toUpperCase()}`;
  const line = event.find((item) => item.toUpperCase().startsWith(prefix));
  if (!line) return "";
  return unescapeIcsValue(line.slice(line.indexOf(":") + 1));
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeScheduleTitle(summary) {
  const cleanSummary = summary || "Aula importada";
  const parts = cleanSummary.split(/\s[-–]\s/).map((part) => part.trim()).filter(Boolean);
  const subject = parts[0]?.toLowerCase() === "aula" ? parts[1] : parts[0];
  return {
    title: cleanSummary,
    subject: subject || cleanSummary,
  };
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

      const titleInfo = normalizeScheduleTitle(summary);
      return {
        type: "Aula",
        title: titleInfo.title,
        subject: titleInfo.subject,
        day: weekDays[start.getDay()] || "Segunda",
        date: formatDate(start),
        startTime: formatTime(start),
        endTime: formatTime(end),
        location,
        notes: description,
      };
    })
    .filter((item) => {
      if (!item) return false;
      return item.date >= formatDate(new Date());
    })
    .filter(Boolean);
}

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/import-schedule-url", async (request, response) => {
  const url = String(request.body.url || "").trim();

  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      response.status(400).json({ ok: false, error: "URL invalido." });
      return;
    }

    const remoteResponse = await fetch(parsedUrl);
    if (!remoteResponse.ok) {
      response.status(502).json({
        ok: false,
        error: `Nao foi possivel descarregar o horario (${remoteResponse.status}).`,
      });
      return;
    }

    const calendarText = await remoteResponse.text();
    const items = parseIcsSchedule(calendarText);
    response.json({ ok: true, items });
  } catch (error) {
    response.status(500).json({ ok: false, error: error.message });
  }
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
