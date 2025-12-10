import { Resend } from 'resend';

let resendInstance: Resend | null = null;

/**
 * Get the Resend client instance (lazy initialization)
 * This prevents build-time errors when RESEND_API_KEY is not set
 */
export function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY environment variable is not set. ' +
        'Please add it to your .env.local file.'
      );
    }

    resendInstance = new Resend(apiKey);
  }

  return resendInstance;
}

export const EMAIL_FROM = 'Breath of Now <noreply@breathofnow.site>';
