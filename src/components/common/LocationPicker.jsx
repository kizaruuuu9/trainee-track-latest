
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { PHILIPPINE_CITIES } from '../../lib/psgc';

const LocationPicker = ({ value, onChange, placeholder = "Select City/Municipality", required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  const filteredCities = PHILIPPINE_CITIES.filter(city => 
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (city) => {
    onChange(city);
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          background: '#fff',
          cursor: 'pointer',
          minHeight: 42
        }}
      >
        <MapPin size={16} color="#64748b" />
        <span style={{ flex: 1, color: value ? '#0f172a' : '#94a3b8', fontSize: 14 }}>
          {value || placeholder}
        </span>
        {value && (
          <X 
            size={14} 
            color="#94a3b8" 
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }} 
            style={{ cursor: 'pointer' }}
          />
        )}
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight: 300,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={14} color="#94a3b8" />
            <input 
              autoFocus
              type="text"
              placeholder="Search city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%' }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filteredCities.length > 0 ? (
              filteredCities.map((city, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelect(city)}
                  style={{
                    padding: '10px 12px',
                    fontSize: 13,
                    cursor: 'pointer',
                    background: value === city ? '#f8fafc' : 'transparent',
                    borderLeft: value === city ? '3px solid #7c3aed' : '3px solid transparent'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.target.style.background = value === city ? '#f8fafc' : 'transparent'}
                >
                  {city}
                </div>
              ))
            ) : (
              <div style={{ padding: 12, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                No cities found
              </div>
            )}
          </div>
        </div>
      )}
      
      {required && !value && <input tabIndex={-1} autoComplete="off" style={{ opacity: 0, height: 0, position: 'absolute' }} required value="" onChange={() => {}} />}
    </div>
  );
};

export default LocationPicker;
