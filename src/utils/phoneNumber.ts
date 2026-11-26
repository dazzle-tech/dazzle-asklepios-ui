import { guessCountryByPartialPhoneNumber } from 'react-international-phone';

export const isPhoneValid = (phone: unknown): boolean => {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return false;
  const { country } = guessCountryByPartialPhoneNumber({ phone: String(phone) });
  return digits.length > (country?.dialCode?.length ?? 0);
};
