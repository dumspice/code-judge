'use client';

import { Languages } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { SUPPORTED_LANGUAGES } from '@/lib/supported-languages';
import { cn } from '@/lib/utils';

const LANGUAGE_LABELS: Record<string, string> = {
  PYTHON: 'Python',
  JAVASCRIPT: 'JavaScript',
  CPP: 'C++',
  JAVA: 'Java',
  GO: 'Go',
  RUST: 'Rust',
};

type SupportedLanguagesPickerProps = {
  value: string[];
  onChange: (languages: string[]) => void;
  label?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
};

export function SupportedLanguagesPicker({
  value,
  onChange,
  label = 'Supported Languages',
  hint,
  className,
  disabled = false,
}: SupportedLanguagesPickerProps) {
  const selected = new Set(value.map((l) => l.trim().toUpperCase()));

  function toggle(lang: string) {
    const key = lang.toUpperCase();
    if (selected.has(key)) {
      const next = value.filter((l) => l.trim().toUpperCase() !== key);
      onChange(next);
      return;
    }
    onChange([...value, key]);
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Languages className="w-4 h-4 text-slate-400" />
          {label}
        </Label>
        {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isOn = selected.has(lang);
          return (
            <button
              key={lang}
              type="button"
              disabled={disabled}
              onClick={() => toggle(lang)}
              className={cn(
                disabled && 'opacity-50 cursor-not-allowed',
                'px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all',
                isOn
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200',
              )}
              aria-pressed={isOn}
            >
              {LANGUAGE_LABELS[lang] ?? lang}
            </button>
          );
        })}
      </div>
    </div>
  );
}
