import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, MapPin, Landmark, RotateCcw, ChevronRight } from 'lucide-react';
import { searchLocations } from '../services/openMeteoService';
import './GlobalWeatherSearch.css';

const GlobalWeatherSearch = ({
  onSelectLocation,
  onResetToIndia,
  currentSearchedLocation,
  isLoadingWeather
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced geocoding search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(trimmed, 8);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setHighlightedIndex(-1);
      } catch (err) {
        console.error("Geocoding lookup failed:", err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (loc) => {
    setQuery('');
    setIsOpen(false);
    setSuggestions([]);
    if (onSelectLocation) {
      onSelectLocation(loc);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="global-weather-search-container" ref={containerRef}>
      <div className="search-input-capsule">
        <div className="search-icon-wrapper">
          {isSearching || isLoadingWeather ? (
            <Loader2 size={16} className="animate-spin text-accent" />
          ) : (
            <Search size={16} className="text-accent" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          className="search-text-input"
          placeholder="Search Indian state or worldwide city (e.g., Karnataka, Kerala, Tokyo, London, Springfield)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search global location"
        />

        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={handleClear}
            title="Clear input"
          >
            <X size={14} />
          </button>
        )}

        {currentSearchedLocation && (
          <div className="active-search-indicator" title={`Active: ${currentSearchedLocation.display_name}`}>
            <span className="active-search-dot"></span>
            <span className="active-search-name">
              {currentSearchedLocation.city}
              {currentSearchedLocation.isIndianState ? ` (${currentSearchedLocation.location_type || 'State'})` : ''}
            </span>
            <button
              type="button"
              className="active-search-dismiss"
              onClick={onResetToIndia}
              title="Reset to India baseline"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Disambiguated Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="search-dropdown-glass fade-in">
          <div className="search-dropdown-header">
            <span>Location Suggestions ({suggestions.length})</span>
            <span className="search-source-tag">State Dataset & Open-Meteo</span>
          </div>

          <div className="search-suggestions-list" role="listbox">
            {suggestions.map((loc, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const isState = Boolean(loc.is_indian_state || loc.isIndianState);

              return (
                <div
                  key={`${loc.id}-${loc.latitude}-${loc.longitude}-${idx}`}
                  role="option"
                  aria-selected={isHighlighted}
                  className={`search-suggestion-item ${isState ? 'is-state-item' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                  onClick={() => handleSelect(loc)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <div className={`suggestion-icon-col ${isState ? 'state-icon-col' : ''}`}>
                    {isState ? (
                      <Landmark size={16} className="suggestion-state-icon" />
                    ) : (
                      <MapPin size={15} className="suggestion-pin-icon" />
                    )}
                  </div>

                  <div className="suggestion-info-col">
                    <div className="suggestion-name-row">
                      <span className="suggestion-city-name">{loc.name}</span>
                      {isState && (
                        <span className="suggestion-state-pill">
                          {loc.location_type ? loc.location_type.toUpperCase() : 'STATE'}
                        </span>
                      )}
                      {loc.country_code && (
                        <span className="suggestion-country-pill">{loc.country_code.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="suggestion-meta-row">
                      {isState ? (
                        <span className="suggestion-region state-rep-text">
                          Representative weather: <strong>{loc.representative_city}, {loc.name}</strong>
                        </span>
                      ) : (
                        <span className="suggestion-region">
                          {loc.admin1 ? `${loc.admin1}, ` : ''}{loc.country || 'Worldwide'}
                        </span>
                      )}
                      <span className="suggestion-coords">
                        {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
                      </span>
                    </div>
                  </div>

                  <div className="suggestion-arrow-col">
                    <ChevronRight size={14} className="suggestion-arrow" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalWeatherSearch;
