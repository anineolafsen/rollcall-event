export type SmsRecipient = { id: string; name: string; phone: string };
export type SmsResult = { success: boolean; sentCount: number; failedCount: number };

export interface SmsProvider {
  sendSms(recipients: SmsRecipient[], message: string): Promise<SmsResult>;
}
