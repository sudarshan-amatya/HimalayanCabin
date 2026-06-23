import { MapPin } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { getFilteredNepalLocations } from "../data/nepalLocations";

type LocationSuggestInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
  inputClassName?: string;
  showIcon?: boolean;
};

function LocationSuggestInput({
  value,
  onChange,
  placeholder = "Where in Nepal?",
  suggestions = [],
  className = "",
  inputClassName = "",
  showIcon = true,
}: LocationSuggestInputProps) {
  const [open, setOpen] = useState(false);
  const blurTimeout = useRef<number | null>(null);

  const filteredSuggestions = useMemo(
    () => getFilteredNepalLocations(value, suggestions),
    [value, suggestions],
  );

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
    setOpen(true);
  }

  function handleBlur() {
    blurTimeout.current = window.setTimeout(() => {
      setOpen(false);
    }, 120);
  }

  function handleFocus() {
    if (blurTimeout.current) {
      window.clearTimeout(blurTimeout.current);
    }
    setOpen(true);
  }

  function handleSelect(location: string) {
    onChange(location);
    setOpen(false);
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-3">
        {showIcon && <MapPin size={18} className="shrink-0 text-[#24472f]" />}
        <input
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full bg-transparent outline-none ${inputClassName}`}
          autoComplete="off"
        />
      </div>

      {open && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-md border border-black/10 bg-white shadow-xl">
          <p className="border-b border-black/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Nepal suggestions
          </p>
          {filteredSuggestions.map((location) => (
            <button
              key={location}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(location)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-[#101918] transition hover:bg-[#eff8f5]"
            >
              <MapPin size={15} className="text-[#17703a]" />
              {location}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LocationSuggestInput;
