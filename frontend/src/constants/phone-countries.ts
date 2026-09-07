/**
 * Country + calling code + expected phone-digit-count list — shared source of
 * truth for phone validation across the app (used by Register; matches the
 * same pattern/validation philosophy as DealLakay's Supplier Hub phone check).
 * DealLakay's primary user base is Haiti, so "Ayiti" is listed first/default.
 */
export interface PhoneCountry {
  name: string;
  code: string;
  digits: [number, number]; // [min, max] digits AFTER the country code
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { name: "Ayiti", code: "+509", digits: [8, 8] },
  { name: "United States", code: "+1", digits: [10, 10] },
  { name: "Canada", code: "+1", digits: [10, 10] },
  { name: "Dominican Republic", code: "+1", digits: [10, 10] },
  { name: "France", code: "+33", digits: [9, 9] },
  { name: "Other", code: "", digits: [7, 15] },
];
