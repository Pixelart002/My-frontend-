import { useEffect, useId, useRef, useState } from 'react';
import {
  RiCheckLine,
  RiLoader4Line,
  RiMapPinLine,
} from '@remixicon/react';
import { locationService } from '../../services/locations';

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search your address',
}) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const requestId = useRef(0);
  const blurTimer = useRef(null);
  const inputId = useId();
  const listId = `${inputId}-suggestions`;

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    return () => {
      if (blurTimer.current) {
        clearTimeout(blurTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const text = query.trim();

    if (text.length < 3) {
      requestId.current += 1;
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }

    const id = ++requestId.current;

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const result = await locationService.autocomplete(text);

        if (id !== requestId.current) return;

        const items = Array.isArray(result)
          ? result
          : result?.items ||
            result?.results ||
            result?.suggestions ||
            [];

        const normalized = Array.isArray(items)
          ? items.slice(0, 8)
          : [];

        setSuggestions(normalized);
        setOpen(normalized.length > 0);
      } catch {
        if (id !== requestId.current) return;

        setSuggestions([]);
        setOpen(false);
      } finally {
        if (id === requestId.current) {
          setLoading(false);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const getLabel = (item) =>
    item?.description ||
    item?.formatted_address ||
    item?.display_name ||
    item?.name ||
    item?.address ||
    '';

  const getPlaceId = (item) =>
    item?.place_id ||
    item?.placeId ||
    item?.id ||
    item?.reference;

  const handleChange = (event) => {
    const nextValue = event.target.value;

    setQuery(nextValue);
    onChange?.(nextValue);
    setOpen(true);
  };

  const choose = async (item) => {
    const text = getLabel(item);

    if (!text) return;

    setQuery(text);
    setSuggestions([]);
    setOpen(false);
    onChange?.(text);

    try {
      const id = getPlaceId(item);

      if (!id) {
        onSelect?.(item);
        return;
      }

      const details = await locationService.details(id);

      onSelect?.(
        details?.data ||
          details?.result ||
          details ||
          item
      );
    } catch {
      onSelect?.(item);
    }
  };

  const handleBlur = () => {
    blurTimer.current = setTimeout(() => {
      setOpen(false);
    }, 160);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setOpen(true);
    }
  };

  return (
    <div className="relative w-full">
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-medium text-gray-900"
      >
        Delivery address
      </label>

      <div
        className="
          flex min-h-12 items-center gap-3
          rounded-xl
          border border-gray-200
          bg-white
          px-3
          shadow-[0_1px_2px_rgba(0,0,0,0.04)]
          transition-all duration-200
          focus-within:border-gray-400
          focus-within:ring-2
          focus-within:ring-gray-100
        "
      >
        <RiMapPinLine
          size={19}
          className="shrink-0 text-gray-400"
          aria-hidden="true"
        />

        <input
          id={inputId}
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          className="
            min-w-0 flex-1
            bg-transparent
            py-3
            text-base text-gray-900
            outline-none
            placeholder:text-gray-400
          "
        />

        {loading && (
          <RiLoader4Line
            size={18}
            className="shrink-0 animate-spin text-gray-400"
            aria-label="Loading suggestions"
          />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div
          id={listId}
          role="listbox"
          className="
            absolute
            z-50
            mt-2
            max-h-80
            w-full
            overflow-y-auto
            rounded-xl
            border border-gray-200
            bg-white
            shadow-[0_12px_32px_rgba(0,0,0,0.10)]
          "
        >
          {suggestions.map((item, index) => {
            const text = getLabel(item);
            const id = getPlaceId(item);

            return (
              <button
                type="button"
                role="option"
                key={`${id || text}-${index}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(item)}
                className="
                  flex
                  min-h-12
                  w-full
                  items-center
                  gap-3
                  border-b
                  border-gray-100
                  px-4
                  py-3
                  text-left
                  transition-colors
                  last:border-0
                  hover:bg-gray-50
                  focus:bg-gray-50
                  focus:outline-none
                "
              >
                <span
                  className="
                    flex h-8 w-8 shrink-0
                    items-center justify-center
                    rounded-lg
                    bg-gray-50
                    text-gray-500
                  "
                >
                  <RiMapPinLine size={16} aria-hidden="true" />
                </span>

                <span className="min-w-0 flex-1 text-sm leading-5 text-gray-700">
                  {text}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {query.trim().length >= 3 &&
        !loading &&
        open &&
        suggestions.length === 0 && (
          <div
            role="status"
            className="
              absolute
              z-50
              mt-2
              w-full
              rounded-xl
              border border-gray-200
              bg-white
              px-4 py-4
              text-sm text-gray-500
              shadow-sm
            "
          >
            No matching addresses found.
          </div>
        )}
    </div>
  );
}