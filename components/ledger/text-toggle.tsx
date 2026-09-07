"use client";

type TextToggleProps = { label: string; options: string[]; value: string; onChange: (value: string) => void };

export function TextToggle({ label, options, value, onChange }: TextToggleProps) {
  return <fieldset><legend className="sr-only">{label}</legend>{options.map((option, index) => <span key={option}>{index ? " / " : null}<button aria-pressed={option === value} onClick={() => onChange(option)} type="button">{option}</button></span>)}</fieldset>;
}
