import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { classInviteTemplate } from './templates/class-invite.template';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('MAIL_ACCOUNT'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendInviteMail(params: {
    to: string;
    classroomName: string;
    inviterName?: string;
    inviteUrl: string;
  }) {
    const html = classInviteTemplate(params);

    await this.transporter.sendMail({
      from: `CodeJudge <${this.configService.get('MAIL_ACCOUNT')}>`,
      to: params.to,
      subject: `Invitation to join ${params.classroomName}`,
      html,
    });
  }
}
