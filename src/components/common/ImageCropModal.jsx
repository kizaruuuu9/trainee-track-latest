
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { getCroppedImgBlob } from '../../utils/cropUtils';

const ImageCropModal = ({ image, onCropComplete, onCancel, aspect = 1 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleDone = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImgBlob(image, croppedAreaPixels);
      await onCropComplete(croppedImageBlob);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '500px',
        height: 'min(550px, 90vh)',
        backgroundColor: '#fff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          height: '60px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9',
          flexShrink: 0
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Edit Image</h3>
          <button 
            onClick={onCancel}
            disabled={isProcessing}
            style={{ 
              background: '#f1f5f9', 
              border: 'none', 
              borderRadius: '50%', 
              width: '32px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: isProcessing ? 'default' : 'pointer',
              color: '#64748b',
              opacity: isProcessing ? 0.5 : 1
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cropper Container */}
        <div style={{ position: 'relative', width: '100%', flex: 1, backgroundColor: '#f8fafc' }}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={aspect === 1 ? 'round' : 'rect'}
            showGrid={false}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaComplete}
            onZoomChange={onZoomChange}
          />
        </div>

        {/* Footer Controls */}
        <div style={{
          height: 'auto',
          minHeight: '80px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          borderTop: '1px solid #f1f5f9',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ZoomOut size={16} color="#94a3b8" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              style={{ flex: 1, cursor: 'pointer' }}
            />
            <ZoomIn size={16} color="#94a3b8" />
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              onClick={onCancel}
              disabled={isProcessing}
              style={{
                padding: '8px 20px',
                backgroundColor: '#fff',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isProcessing ? 'default' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleDone}
              disabled={isProcessing}
              style={{
                padding: '8px 24px',
                backgroundColor: '#0a66c2',
                color: '#fff',
                border: 'none',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isProcessing ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isProcessing ? 0.7 : 1,
                minWidth: '100px',
                justifyContent: 'center'
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="ocr-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Check size={16} /> Apply
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <p style={{ color: '#fff', marginTop: '16px', fontSize: '12px', opacity: 0.8, textAlign: 'center' }}>
        Drag to adjust • Pinch/Scroll to zoom
      </p>
      
      <style>{`
        .ocr-spin {
          animation: ocr-spin 1s linear infinite;
        }
        @keyframes ocr-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ImageCropModal;
