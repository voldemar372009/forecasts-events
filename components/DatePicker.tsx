"use client";

export default function DatePicker({
  value,
  onChange,
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  min: string;
  max: string;
}) {
  return (
    <input
      type="date"
      className="input-neon"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
