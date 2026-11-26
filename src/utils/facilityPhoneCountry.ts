import { defaultCountries, parseCountry } from 'react-international-phone';

export const PALESTINE_PHONE_COUNTRY = 'ps';

const phoneCountries = defaultCountries.map(country => parseCountry(country));

export const phoneCountryOptions = phoneCountries.map(country => ({
  iso2: country.iso2,
  name: country.name,
  dialCode: country.dialCode,
  label: `${country.name} +${country.dialCode}`
}));

type PhoneCountrySource = {
  defaultPhoneCountry?: string | null;
};

export const facilityPhoneCountryIso2 = (facility?: PhoneCountrySource | null): string => {
  const code = String(facility?.defaultPhoneCountry ?? '').trim().toLowerCase();
  if (phoneCountries.some(country => country.iso2 === code)) {
    return code;
  }
  return PALESTINE_PHONE_COUNTRY;
};
