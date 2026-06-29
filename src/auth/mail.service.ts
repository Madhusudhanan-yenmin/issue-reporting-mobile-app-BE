import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private etherealTransporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465, // true for 465, false for other ports (like 587)
        auth: {
          user,
          pass,
        },
      });
      this.logger.log('SMTP Mail transporter configured successfully');
    } else {
      this.logger.warn('SMTP credentials not fully set. Will fall back to Ethereal SMTP.');
    }
  }

  async sendOtpEmail(to: string, otp: string): Promise<{ sent: boolean; mocked: boolean; previewUrl?: string }> {
    let transporter = this.transporter;
    let isMocked = false;

    if (!transporter) {
      isMocked = true;
      if (!this.etherealTransporter) {
        this.logger.log('SMTP credentials not configured. Attempting to create a temporary Ethereal test account...');
        try {
          const testAccount = await nodemailer.createTestAccount();
          this.etherealTransporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
              user: testAccount.user, // generated ethereal user
              pass: testAccount.pass, // generated ethereal password
            },
          });
          this.logger.log(`Created Ethereal test account successfully: ${testAccount.user}`);
        } catch (err) {
          this.logger.error('Failed to create Ethereal test account. Falling back to console log mock.', err);
        }
      }
      transporter = this.etherealTransporter;
    }

    if (!transporter) {
      this.logger.log(`[MOCK EMAIL LOG] To: ${to}, OTP: ${otp}`);
      return { sent: true, mocked: true };
    }

    const from = this.configService.get<string>('SMTP_FROM') || 'no-reply@issue-reporter.com';
    const mailOptions = {
      from,
      to,
      subject: 'Password Reset OTP - Civic Issue Reporting App',
      text: `Your One-Time Password (OTP) for password reset is: ${otp}. It is valid for 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f9; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e1e4e8;">
            <h2 style="color: #4F6EF7; text-align: center; margin-bottom: 20px;">Civic Grievance App</h2>
            <p>Hello,</p>
            <p>We received a request to reset the password for your account. Please use the following One-Time Password (OTP) to complete the reset process:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #4F6EF7; letter-spacing: 5px; background-color: #f0f3ff; padding: 10px 20px; border-radius: 4px; border: 1px dashed #4F6EF7;">${otp}</span>
            </div>
            <p style="color: #555;">This OTP is valid for <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email or contact support.</p>
            <hr style="border: 0; border-top: 1px solid #e1e4e8; margin: 30px 0;" />
            <p style="font-size: 12px; color: #888; text-align: center;">This is an automated email. Please do not reply directly to this message.</p>
          </div>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      this.logger.log(`OTP email sent successfully to ${to}`);
      const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      if (previewUrl) {
        this.logger.log(`Ethereal Email Preview URL: ${previewUrl}`);
      }
      return { sent: true, mocked: isMocked, previewUrl };
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}`, error);
      throw error;
    }
  }
}
