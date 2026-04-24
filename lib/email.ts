import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  await sgMail.send({
    to,
    from: FROM_EMAIL,
    subject: 'Reset your DevPort password',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #20293A;">Reset your password</h2>
        <p style="color: #677489;">Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; background: #6466E9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">Reset Password</a>
        <p style="color: #677489; font-size: 14px;">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const verifyUrl = `${APP_URL}/api/user/verify-email?token=${token}`;
  await sgMail.send({
    to,
    from: FROM_EMAIL,
    subject: 'Verify your DevPort account',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #20293A;">Verify your email</h2>
        <p style="color: #677489;">Click the link below to verify your account.</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #6466E9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">Verify Account</a>
      </div>
    `,
  });
}

export async function sendContactEmail(
  ownerEmail: string,
  senderEmail: string,
  senderName: string,
  message: string
): Promise<void> {
  await sgMail.send({
    to: ownerEmail,
    from: FROM_EMAIL,
    subject: `Message from ${senderName} via DevPort`,
    replyTo: senderEmail,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #20293A;">New message from your portfolio</h2>
        <p><strong>From:</strong> ${senderName} (${senderEmail})</p>
        <p style="color: #677489;">${message}</p>
      </div>
    `,
  });
}
