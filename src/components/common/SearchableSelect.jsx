import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

/**
 * A custom searchable dropdown component to replace native select
 * Fixes UI overlap issues and improves UX for long lists.
 */
export default function SearchableSelect({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select an option',
  label = '',
  error = '',
  status = '', // 'valid', 'error', or ''
  onBlur,
  disabled = false,
  searchable = true
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [dropDirection, setDropDirection] = useState('down'); // 'up' or 'down'
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter options based on debounced search term
  const filteredOptions = options.filter(opt => {
    const label = (opt.label || '').toLowerCase();
    const name = (opt.name || '').toLowerCase();
    const search = debouncedSearchTerm.toLowerCase();
    return label.includes(search) || name.includes(search);
  });

  const selectedOption = options.find(opt => String(opt.id || opt.value) === String(value));

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle selection
  const handleSelect = (opt) => {
    const val = opt.id !== undefined ? opt.id : opt.value;
    onChange({ target: { value: val } });
    setIsOpen(false);
    setSearchTerm('');
    if (onBlur) onBlur();
  };

  const toggleDropdown = () => {
    if (disabled) return;
    
    if (!isOpen) {
      // Check for available space before opening
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = 300; // Estimated max height
        
        if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
          setDropDirection('up');
        } else {
          setDropDirection('down');
        }
      }
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    
    setIsOpen(!isOpen);
  };

  return (
    <div className="searchable-select-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && <label className="form-label">{label}</label>}
      
      <div 
        className={`form-input searchable-select-trigger ${status} ${isOpen ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={toggleDropdown}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled ? '#f1f5f9' : 'white',
          paddingRight: 10,
          minHeight: 42,
          position: 'relative',
          borderWidth: 1,
          borderStyle: 'solid',
          zIndex: isOpen ? 1001 : 1
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          {isOpen && searchable ? <Search size={14} style={{ color: '#3b82f6' }} /> : null}
          <span style={{ 
            color: selectedOption ? 'inherit' : '#94a3b8',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1
          }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown size={16} style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', 
          transition: 'transform 0.2s',
          color: '#94a3b8',
          flexShrink: 0,
          marginLeft: 8
        }} />
      </div>

      {isOpen && (
        <div className={`searchable-select-dropdown ${dropDirection}`} style={{
          position: 'absolute',
          [dropDirection === 'down' ? 'top' : 'bottom']: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          boxShadow: dropDirection === 'down' 
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
            : '0 -10px 25px -5px rgba(0, 0, 0, 0.2), 0 -8px 10px -6px rgba(0, 0, 0, 0.1)',
          zIndex: 9999,
          overflow: 'hidden',
          animation: dropDirection === 'down' ? 'fadeSlideIn 0.2s ease-out' : 'fadeSlideInUp 0.2s ease-out'
        }}>
          {searchable && (
            <div className="searchable-select-search" style={{
              padding: 8,
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Search size={14} style={{ color: '#94a3b8' }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: 13,
                  background: 'transparent'
                }}
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <X 
                  size={14} 
                  style={{ color: '#94a3b8', cursor: 'pointer' }} 
                  onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }} 
                />
              )}
            </div>
          )}
          
          <div className="searchable-select-options" style={{
            maxHeight: 240,
            overflowY: 'auto',
            padding: '4px 0'
          }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id || opt.value}
                  className={`searchable-select-option ${String(opt.id || opt.value) === String(value) ? 'selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleSelect(opt); }}
                  style={{
                    padding: '10px 16px',
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    transition: 'background 0.15s',
                    background: String(opt.id || opt.value) === String(value) ? '#eff6ff' : 'transparent',
                    color: String(opt.id || opt.value) === String(value) ? '#2563eb' : '#1e293b'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = String(opt.id || opt.value) === String(value) ? '#eff6ff' : '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = String(opt.id || opt.value) === String(value) ? '#eff6ff' : 'transparent'}
                >
                  <span style={{ 
                    whiteSpace: 'normal', 
                    wordBreak: 'break-word',
                    lineHeight: 1.4
                  }}>
                    {opt.label}
                  </span>
                  {String(opt.id || opt.value) === String(value) && <Check size={14} />}
                </div>
              ))
            ) : (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                No results found
              </div>
            )}
          </div>
        </div>
      )}

      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
