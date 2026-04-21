import React, { useState, useEffect } from 'react';
import { MapPin, Loader, ChevronDown } from 'lucide-react';

const API_BASE = 'https://psgc.gitlab.io/api';

export default function PhilAddressSelector({ 
  values = {}, 
  onChange, 
  required = false,
  disabled = false,
  error = ''
}) {
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [loading, setLoading] = useState({
    regions: false,
    provinces: false,
    cities: false,
    barangays: false
  });

  // Initial load: Regions
  useEffect(() => {
    const fetchRegions = async () => {
      setLoading(prev => ({ ...prev, regions: true }));
      try {
        const res = await fetch(`${API_BASE}/regions/`);
        const data = await res.json();
        setRegions(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error('Failed to fetch regions:', err);
      } finally {
        setLoading(prev => ({ ...prev, regions: false }));
      }
    };
    fetchRegions();
  }, []);

  // Fetch Provinces when Region changes
  useEffect(() => {
    if (!values.regionCode) {
      setProvinces([]);
      setCities([]);
      setBarangays([]);
      return;
    }

    const fetchProvinces = async () => {
      setLoading(prev => ({ ...prev, provinces: true }));
      try {
        // Some regions (like NCR) don't have provinces, they have cities directly
        const res = await fetch(`${API_BASE}/regions/${values.regionCode}/provinces/`);
        const data = await res.json();
        
        if (data.length === 0) {
          // If no provinces, try fetching cities directly for this region (e.g. NCR)
          const cityRes = await fetch(`${API_BASE}/regions/${values.regionCode}/cities-municipalities/`);
          const cityData = await cityRes.json();
          setCities(cityData.sort((a, b) => a.name.localeCompare(b.name)));
          setProvinces([]);
        } else {
          setProvinces(data.sort((a, b) => a.name.localeCompare(b.name)));
          setCities([]);
        }
      } catch (err) {
        console.error('Failed to fetch provinces:', err);
      } finally {
        setLoading(prev => ({ ...prev, provinces: false }));
      }
    };
    fetchProvinces();
  }, [values.regionCode]);

  // Fetch Cities when Province changes
  useEffect(() => {
    if (!values.provinceCode) {
      if (provinces.length > 0) setCities([]);
      setBarangays([]);
      return;
    }

    const fetchCities = async () => {
      setLoading(prev => ({ ...prev, cities: true }));
      try {
        const res = await fetch(`${API_BASE}/provinces/${values.provinceCode}/cities-municipalities/`);
        const data = await res.json();
        setCities(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error('Failed to fetch cities:', err);
      } finally {
        setLoading(prev => ({ ...prev, cities: false }));
      }
    };
    fetchCities();
  }, [values.provinceCode, provinces.length]);

  // Fetch Barangays when City changes
  useEffect(() => {
    if (!values.cityCode) {
      setBarangays([]);
      return;
    }

    const fetchBarangays = async () => {
      setLoading(prev => ({ ...prev, barangays: true }));
      try {
        const res = await fetch(`${API_BASE}/cities-municipalities/${values.cityCode}/barangays/`);
        const data = await res.json();
        setBarangays(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error('Failed to fetch barangays:', err);
      } finally {
        setLoading(prev => ({ ...prev, barangays: false }));
      }
    };
    fetchBarangays();
  }, [values.cityCode]);

  const handleSelectChange = (field, codeField, list) => (e) => {
    const code = e.target.value;
    const item = list.find(i => i.code === code);
    
    const updates = {
      [field]: item ? item.name : '',
      [codeField]: code
    };

    // Reset dependent fields
    if (field === 'region') {
      updates.province = '';
      updates.provinceCode = '';
      updates.city = '';
      updates.cityCode = '';
      updates.barangay = '';
      updates.barangayCode = '';
    } else if (field === 'province') {
      updates.city = '';
      updates.cityCode = '';
      updates.barangay = '';
      updates.barangayCode = '';
    } else if (field === 'city') {
      updates.barangay = '';
      updates.barangayCode = '';
    }

    onChange(updates);
  };

  return (
    <div className="psgc-selector-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {/* Region */}
      <div className="form-group">
        <label className="form-label">Region {required && <span style={{ color: '#ef4444' }}>*</span>}</label>
        <div style={{ position: 'relative' }}>
          <select 
            className="form-input" 
            style={{ paddingLeft: 38 }}
            value={values.regionCode || ''} 
            onChange={handleSelectChange('region', 'regionCode', regions)}
            disabled={disabled || loading.regions}
            required={required}
          >
            <option value="">Select Region</option>
            {regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
          </select>
          <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          {loading.regions && <Loader size={14} style={{ position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)', animation: 'ocr-spin 1s linear infinite', color: '#94a3b8' }} />}
        </div>
      </div>

      {/* Province (Hidden if region has no provinces, like NCR) */}
      {(provinces.length > 0 || loading.provinces) && (
        <div className="form-group">
          <label className="form-label">Province {required && <span style={{ color: '#ef4444' }}>*</span>}</label>
          <div style={{ position: 'relative' }}>
            <select 
              className="form-input" 
              style={{ paddingLeft: 38 }}
              value={values.provinceCode || ''} 
              onChange={handleSelectChange('province', 'provinceCode', provinces)}
              disabled={disabled || !values.regionCode || loading.provinces}
              required={required}
            >
              <option value="">Select Province</option>
              {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
            <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            {loading.provinces && <Loader size={14} style={{ position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)', animation: 'ocr-spin 1s linear infinite', color: '#94a3b8' }} />}
          </div>
        </div>
      )}

      {/* City / Municipality */}
      <div className="form-group">
        <label className="form-label">City / Municipality {required && <span style={{ color: '#ef4444' }}>*</span>}</label>
        <div style={{ position: 'relative' }}>
          <select 
            className="form-input" 
            style={{ paddingLeft: 38 }}
            value={values.cityCode || ''} 
            onChange={handleSelectChange('city', 'cityCode', cities)}
            disabled={disabled || (!values.provinceCode && provinces.length > 0) || (!values.regionCode && provinces.length === 0) || loading.cities}
            required={required}
          >
            <option value="">Select City/Municipality</option>
            {cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          {loading.cities && <Loader size={14} style={{ position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)', animation: 'ocr-spin 1s linear infinite', color: '#94a3b8' }} />}
        </div>
      </div>

      {/* Barangay */}
      <div className="form-group">
        <label className="form-label">Barangay {required && <span style={{ color: '#ef4444' }}>*</span>}</label>
        <div style={{ position: 'relative' }}>
          <select 
            className="form-input" 
            style={{ paddingLeft: 38 }}
            value={values.barangayCode || ''} 
            onChange={handleSelectChange('barangay', 'barangayCode', barangays)}
            disabled={disabled || !values.cityCode || loading.barangays}
            required={required}
          >
            <option value="">Select Barangay</option>
            {barangays.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
          <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          {loading.barangays && <Loader size={14} style={{ position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)', animation: 'ocr-spin 1s linear infinite', color: '#94a3b8' }} />}
        </div>
      </div>

      {/* Detailed Address */}
      <div className="form-group reg-full-width" style={{ gridColumn: '1 / -1' }}>
        <label className="form-label">Street / House No. / Building {required && <span style={{ color: '#ef4444' }}>*</span>}</label>
        <div style={{ position: 'relative' }}>
          <input 
            className="form-input" 
            style={{ paddingLeft: 38 }}
            placeholder="e.g. 123 Rizal St., BGC"
            value={values.detailedAddress || ''} 
            onChange={(e) => onChange({ detailedAddress: e.target.value })}
            disabled={disabled}
            required={required}
          />
          <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        </div>
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4, gridColumn: '1 / -1' }}>{error}</p>}
    </div>
  );
}
