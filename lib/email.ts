import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM =
  process.env.RESEND_FROM_EMAIL ??
  "Keystone <no-reply@keystone.matthiasbenoit.fr>";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  member: "Éditeur",
  restricted: "Lecteur",
};

export async function sendInvitationEmail({
  to,
  orgName,
  role,
  inviteUrl,
}: {
  to: string;
  orgName: string;
  role: string;
  inviteUrl: string;
}) {
  const roleLabel = ROLE_LABELS[role] ?? role;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Vous avez été invité à rejoindre ${orgName} sur Keystone`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 0;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: #0f172a; padding: 24px 32px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Keystone</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="margin: 0 0 8px; font-size: 22px; color: #0f172a;">Invitation à rejoindre ${orgName}</h2>
      <p style="color: #64748b; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        Vous avez été invité à rejoindre l'organisation <strong>${orgName}</strong> en tant que <strong>${roleLabel}</strong>.
      </p>
      <a href="${inviteUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600;">
        Accepter l'invitation
      </a>
      <p style="color: #94a3b8; margin: 24px 0 0; font-size: 13px;">
        Ce lien expire dans 7 jours. Si vous n'avez pas de compte, vous pouvez en créer un gratuitement.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
        <a href="${inviteUrl}" style="color: #64748b; word-break: break-all;">${inviteUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  });

  if (error) {
    console.error("Error sending invitation email:", error);
    throw new Error("Erreur lors de l'envoi de l'email d'invitation");
  }
}
