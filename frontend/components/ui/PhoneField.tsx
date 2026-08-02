'use client';

import 'react-international-phone/style.css';
import { PhoneInput } from 'react-international-phone';

const PREFERRED_COUNTRIES = ['cd', 'cg', 'fr', 'be', 'ch', 'ca'];

export default function PhoneField({
  label, name, required, value, onChange,
}: {
  label: string; name: string; required?: boolean;
  value: string; onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-ink-800 mb-1.5">
        {label}{required && <span className="text-brand-500"> *</span>}
      </span>
      <div
        className="flex rounded border border-paper-300 bg-white overflow-hidden focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-colors"
        style={{
          ['--react-international-phone-border-color' as string]: 'transparent',
          ['--react-international-phone-background-color' as string]: 'transparent',
          ['--react-international-phone-height' as string]: '48px',
          ['--react-international-phone-font-size' as string]: '16px',
        } as React.CSSProperties}
      >
        <PhoneInput
          defaultCountry="cd"
          preferredCountries={PREFERRED_COUNTRIES}
          value={value}
          onChange={onChange}
          name={name}
          required={required}
          placeholder="Votre numéro WhatsApp"
          className="w-full"
          inputClassName="!border-0 !rounded-none flex-1 !px-3 !bg-transparent placeholder:text-ink-400"
          countrySelectorStyleProps={{
            buttonClassName: '!border-0 !rounded-none !bg-transparent px-2',
          }}
        />
      </div>
    </label>
  );
}
