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

  async sendVerifyMail(to: string, link: string) {
    return this.transporter.sendMail({
      from: process.env.SMPT_USER,
      to,
      subject: 'Confirmation code to log in to messenger',
      text: '',
      html: `
        <div>
          <a href="${link}">V E R I F Y</a>
        </div>
      `,
    });
  }
}

export const mailService = new MailService();
