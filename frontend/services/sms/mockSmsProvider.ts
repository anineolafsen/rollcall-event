import type { SmsProvider, SmsRecipient, SmsResult } from './smsProvider';

export const mockSmsProvider: SmsProvider = {
  async sendSms(recipients: SmsRecipient[], message: string): Promise<SmsResult> {
    console.log('[MOCK SMS] Recipients:', recipients);
    console.log('[MOCK SMS] Message:', message);
    return { success: true, sentCount: recipients.length, failedCount: 0 };
  },
};
