
import { SocialSettings } from "../types";

export interface EmailData {
  to: string;
  subject: string;
  body: string;
}

export const sendEmail = async (settings: SocialSettings, data: EmailData): Promise<boolean> => {
  if (!settings.gmailEnabled) return false;

  console.info("Gmail feature is in local mode. Opening mailto link.");
  const mailtoUrl = `mailto:${data.to}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;
  window.location.href = mailtoUrl;
  return true;
};
