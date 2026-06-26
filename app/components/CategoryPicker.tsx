import { CATEGORIES } from "~/utils/constants";

interface CategoryPickerProps {
  value: string;
  onChange: (key: string) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {CATEGORIES.map(({ key, label, Icon }) => {
        const isSelected = key === value;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={isSelected}
            className={`btn h-auto flex-col gap-1 py-3 ${
              isSelected ? "btn-primary" : "btn-outline"
            }`}
          >
            <Icon className="text-xl" />
            <span className="text-xs font-normal">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
