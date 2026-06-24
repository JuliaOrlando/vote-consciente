import "server-only";

// Envio de e-mail desacoplado do provedor.
// - Se RESEND_API_KEY estiver definido, envia de verdade pela API da Resend.
// - Caso contrário (dev/curso), apenas registra o link no console do servidor.
// Assim o fluxo de redefinição de senha funciona sem infraestrutura de e-mail,
// e basta configurar a chave para passar a enviar mensagens reais.

const FROM = process.env.EMAIL_FROM ?? "Vote Consciente <onboarding@resend.dev>";

type SendResult = { delivered: boolean };

async function sendViaResend(to: string, subject: string, html: string): Promise<SendResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao enviar e-mail (HTTP ${response.status}).`);
  }
  return { delivered: true };
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<SendResult> {
  const subject = "Redefinição de senha — Vote Consciente";
  const html = `
    <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
    <p><a href="${resetUrl}">Clique aqui para escolher uma nova senha</a>. O link expira em 1 hora.</p>
    <p>Se não foi você, pode ignorar este e-mail.</p>
  `;

  if (process.env.RESEND_API_KEY) {
    return sendViaResend(to, subject, html);
  }

  // Fallback de desenvolvimento: sem provedor configurado, registra o link.
  console.log(`\n[email:dev] Redefinição de senha para ${to}\n[email:dev] ${resetUrl}\n`);
  return { delivered: false };
}
