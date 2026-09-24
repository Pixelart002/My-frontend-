import { useEffect, useRef, useState } from 'react';
import { RiMapPinLine, RiLoader4Line, RiArrowRightLine } from '@remixicon/react';
import { locationService } from '../../services/locations';

export default function LocationAutocomplete({ value, onChange, onSelect, placeholder = 'Search your address' }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const requestId = useRef(0);

  useEffect(() => setQuery(value || ''), [value]);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 3) {
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
        const items = Array.isArray(result) ? result : result?.items || result?.results || result?.suggestions || [];
        setSuggestions(items.slice(0, 8));
        setOpen(true);
      } catch {
        if (id === requestId.current) setSuggestions([]);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const label = (item) => item?.description || item?.formatted_address || item?.display_name || item?.name || item?.address || '';
  const placeId = (item) => item?.place_id || item?.placeId || item?.id || item?.reference;

  const choose = async (item) => {
    const text = label(item);
    setQuery(text);
    setSuggestions([]);
    setOpen(false);
    onChange?.(text);

    try {
      const id = placeId(item);
      if (id) {
        const details = await locationService.details(id);
        onSelect?.(details?.data || details?.result || details || item);
      } else {
        onSelect?.(item);
      }
    } catch {
      onSelect?.(item);
    }
  };

  return (
    <div className="location-autocomplete">
      <div className="location-search-wrap">
        <RiMapPinLine size={17} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange?.(event.target.value);
            setOpen(true);
          }}
          onFocus={() => suggestions.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {loading ? (
          <RiLoader4Line className="location-spinner" size={16} aria-label="Loading suggestions" />
        ) : (
          <span className="location-can-search" aria-hidden="true"><RiArrowRightLine size={14} /></span>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="location-suggestions" role="listbox">
          {suggestions.map((item, index) => {
            const text = label(item);
            return (
              <button
                type="button"
                role="option"
                key={`${placeId(item) || text}-${index}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(item)}
              >
                <RiMapPinLine size={16} />
                <span>{text}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
