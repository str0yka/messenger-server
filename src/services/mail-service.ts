import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

class MailService {
  transporter: Transporter<SMTPTransport.SentMessageInfo>;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMPT_HOST,
      port: Number(process.env.SMPT_PORT),
      secure: false,
      auth: {
        user: process.env.SMPT_USER,
        pass: process.env.SMPT_PASSWORD,
      },
    });
  }

  async sendVerificationCode(to: string, code: number) {
    return this.transporter.sendMail({
      from: process.env.SMPT_USER,
      to,
      subject: 'Verification code to log in to messenger',
      text: '',
      html: `
        <div>
          Your code is <b>${code}</b>
        </div>
      `,
    });
  }
}

export const mailService = new MailService();
