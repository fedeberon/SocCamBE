import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = process.env;

const createTransporter = async () => {
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: false, // set true if you use 465
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  // Fallback: usar cuenta de prueba de nodemailer (ethereal) para desarrollo
  // eslint-disable-next-line no-console
  console.warn('SMTP configuration is missing. Using ethereal test account (emails no se entregan realmente).');
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const transporterPromise = createTransporter();

export const sendMail = async (options: { to: string; subject: string; html?: string; text?: string }) => {
  const transporter = await transporterPromise;
  const from = SMTP_FROM || SMTP_USER || 'no-reply@example.com';
  const info = await transporter.sendMail({ from, ...options });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    // eslint-disable-next-line no-console
    console.log(`Preview URL: ${previewUrl}`);
  }

  return info;
};

export default transporterPromise;
