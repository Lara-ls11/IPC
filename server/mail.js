export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendSoftStudyMail(transporter, { fromEmail, fromName, toEmail, name, verificationCode, loginUrl, type }) {
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
    to: toEmail,
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
}
