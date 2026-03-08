import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, X, CheckCircle, AlertTriangle, Loader, RotateCcw, Image } from 'lucide-react';
import * as faceapi from 'face-api.js';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export default function Step2SelfieVerification({ data, onChange, onValidChange }) {
    const [mode, setMode] = useState(null);          // null | 'camera' | 'upload'
    const [cameraReady, setCameraReady] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [faceResult, setFaceResult] = useState(null); // null | 'success' | 'no-face' | 'multi-face'
    const [errorMsg, setErrorMsg] = useState('');

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);

    // Load face-api models once
    useEffect(() => {
        const loadModels = async () => {
            if (modelsLoaded || modelsLoading) return;
            setModelsLoading(true);
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                setModelsLoaded(true);
            } catch (err) {
                console.error('Failed to load face detection models:', err);
                setErrorMsg('Failed to load face detection. Please refresh the page.');
            } finally {
                setModelsLoading(false);
            }
        };
        loadModels();
    }, []);

    // Validate: step is valid only when a selfie is captured AND face was detected
    useEffect(() => {
        onValidChange(!!data.selfieUrl && faceResult === 'success');
    }, [data.selfieUrl, faceResult, onValidChange]);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => stopCamera();
    }, []);

    // ─── Camera Functions ────────────────────────────────────────
    const startCamera = async () => {
        setMode('camera');
        setFaceResult(null);
        setErrorMsg('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setCameraReady(true);
                };
            }
        } catch (err) {
            console.error('Camera access error:', err);
            setErrorMsg('Could not access camera. Please allow camera permissions or upload a photo instead.');
            setMode(null);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraReady(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        // Mirror for front camera
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        stopCamera();
        setMode(null);
        processSelfie(dataUrl);
    };

    // ─── File Upload ─────────────────────────────────────────────
    const handleFileUpload = (file) => {
        if (!file) return;
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setErrorMsg('Please upload PNG, JPG, or JPEG files only.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            setMode(null);
            processSelfie(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    // ─── Face Detection ──────────────────────────────────────────
    const processSelfie = async (imageDataUrl) => {
        onChange({ selfieUrl: imageDataUrl });
        setDetecting(true);
        setFaceResult(null);
        setErrorMsg('');

        try {
            // Create an image element for face-api
            const img = new window.Image();
            img.src = imageDataUrl;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            // Detect faces with minimum 1.5s delay so user sees the animation
            const [detections] = await Promise.all([
                faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 512,
                    scoreThreshold: 0.1, // Even more permissive for different angles
                })),
                new Promise(r => setTimeout(r, 1500)),
            ]);

            if (detections.length === 0) {
                setFaceResult('no-face');
                onValidChange(false);
            } else if (detections.length > 1) {
                setFaceResult('multi-face');
                onValidChange(false);
            } else {
                setFaceResult('success');
                onValidChange(true);
            }
        } catch (err) {
            console.error('Face detection error:', err);
            setErrorMsg('Face detection failed. Please try again.');
            setFaceResult(null);
            onValidChange(false);
        } finally {
            setDetecting(false);
        }
    };

    // ─── Retake / Remove ─────────────────────────────────────────
    const resetSelfie = () => {
        onChange({ selfieUrl: null });
        setFaceResult(null);
        setErrorMsg('');
        setDetecting(false);
    };

    // ─── Render ──────────────────────────────────────────────────
    return (
        <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                Step 2 — Selfie Verification
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                Take a selfie to verify your identity. Make sure your face is clearly visible and well-lit.
            </p>

            {/* Info Banner */}
            <div className="ocr-banner ocr-success" style={{ marginBottom: 20, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                <Camera size={20} />
                <div>
                    <strong>Why do we need a selfie?</strong>
                    <p style={{ margin: '4px 0 0' }}>This helps verify that you are a real person and the rightful owner of the School ID you uploaded. An administrator will review your selfie alongside your ID during the approval process.</p>
                </div>
            </div>

            {/* Models Loading */}
            {modelsLoading && (
                <div className="ocr-banner ocr-loading" style={{ marginBottom: 16 }}>
                    <div className="ocr-spinner" />
                    <div>
                        <strong>Loading face detection...</strong>
                        <p>Please wait while the detection model loads.</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {errorMsg && (
                <div className="ocr-banner ocr-fail" style={{ marginBottom: 16 }}>
                    <AlertTriangle size={20} />
                    <div>
                        <strong>Error</strong>
                        <p>{errorMsg}</p>
                    </div>
                </div>
            )}

            {/* No selfie yet — show capture options */}
            {!data.selfieUrl && mode !== 'camera' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    {/* Camera Option */}
                    <button
                        onClick={startCamera}
                        disabled={!modelsLoaded}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: 12, padding: '32px 20px',
                            border: '2px dashed #cbd5e1', borderRadius: 12,
                            background: modelsLoaded ? '#f8fafc' : '#f1f5f9',
                            cursor: modelsLoaded ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            opacity: modelsLoaded ? 1 : 0.5,
                        }}
                        onMouseEnter={(e) => { if (modelsLoaded) { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff'; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = modelsLoaded ? '#f8fafc' : '#f1f5f9'; }}
                    >
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Camera size={22} style={{ color: 'white' }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Take a Selfie</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Use your camera</div>
                        </div>
                    </button>

                    {/* Upload Option */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!modelsLoaded}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: 12, padding: '32px 20px',
                            border: '2px dashed #cbd5e1', borderRadius: 12,
                            background: modelsLoaded ? '#f8fafc' : '#f1f5f9',
                            cursor: modelsLoaded ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            opacity: modelsLoaded ? 1 : 0.5,
                        }}
                        onMouseEnter={(e) => { if (modelsLoaded) { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff'; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = modelsLoaded ? '#f8fafc' : '#f1f5f9'; }}
                    >
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Upload size={22} style={{ color: 'white' }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Upload Photo</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>From your device</div>
                        </div>
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e.target.files[0])}
                    />
                </div>
            )}

            {/* Camera View */}
            {mode === 'camera' && (
                <div style={{ marginBottom: 20 }}>
                    <div style={{
                        position: 'relative', borderRadius: 12, overflow: 'hidden',
                        border: '2px solid #2563eb', background: '#000',
                        maxWidth: 480, margin: '0 auto',
                    }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                width: '100%', display: 'block',
                                transform: 'scaleX(-1)', // Mirror
                            }}
                        />
                        {/* Face oval guide */}
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '55%', height: '70%',
                            border: '3px dashed rgba(255,255,255,0.5)',
                            borderRadius: '50%',
                            pointerEvents: 'none',
                        }} />
                        {!cameraReady && (
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                color: 'white', fontSize: 14, fontWeight: 600,
                            }}>
                                <Loader size={24} style={{ animation: 'ocr-spin 0.8s linear infinite' }} />
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                        <button
                            className="btn btn-outline"
                            onClick={() => { stopCamera(); setMode(null); }}
                        >
                            <X size={15} /> Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={capturePhoto}
                            disabled={!cameraReady}
                        >
                            <Camera size={15} /> Capture
                        </button>
                    </div>
                    <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
                        Position your face inside the oval guide, then click Capture
                    </p>
                </div>
            )}

            {/* Hidden canvas for capturing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Selfie Preview + Detection Result */}
            {data.selfieUrl && (
                <div style={{ marginBottom: 20 }}>
                    {/* Image Preview */}
                    <div style={{
                        position: 'relative', borderRadius: 12, overflow: 'hidden',
                        border: `2px solid ${faceResult === 'success' ? '#22c55e' : faceResult ? '#ef4444' : '#cbd5e1'}`,
                        maxWidth: 360, margin: '0 auto',
                        transition: 'border-color 0.3s',
                    }}>
                        <img
                            src={data.selfieUrl}
                            alt="Selfie preview"
                            style={{ width: '100%', display: 'block' }}
                        />
                        {/* Detection overlay */}
                        {detecting && (
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'rgba(0,0,0,0.5)',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: 12,
                            }}>
                                <Loader size={32} style={{ color: 'white', animation: 'ocr-spin 0.8s linear infinite' }} />
                                <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>Detecting face...</span>
                            </div>
                        )}
                    </div>

                    {/* Detection result banners */}
                    {detecting && (
                        <div className="ocr-banner ocr-loading" style={{ marginTop: 12 }}>
                            <div className="ocr-spinner" />
                            <div style={{ flex: 1 }}>
                                <strong>Verifying your selfie...</strong>
                                <p>Detecting face in the image</p>
                                <div className="progress-bar-wrap" style={{ marginTop: 8, height: 6 }}>
                                    <div
                                        className="progress-bar-fill progress-high"
                                        style={{
                                            width: '80%',
                                            background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                                            animation: 'idCheckPulse 1.5s ease-in-out infinite',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {faceResult === 'success' && (
                        <div className="ocr-banner ocr-success" style={{ marginTop: 12 }}>
                            <CheckCircle size={20} />
                            <div>
                                <strong>Face Detected Successfully</strong>
                                <p>Your selfie has been verified. You may proceed to the next step.</p>
                            </div>
                        </div>
                    )}

                    {faceResult === 'no-face' && (
                        <div className="ocr-banner ocr-fail" style={{ marginTop: 12 }}>
                            <AlertTriangle size={20} />
                            <div>
                                <strong>No Face Detected</strong>
                                <p>We couldn't detect a face in this image. Please make sure your face is clearly visible, well-lit, and not covered. Try again.</p>
                            </div>
                        </div>
                    )}

                    {faceResult === 'multi-face' && (
                        <div className="ocr-banner ocr-fail" style={{ marginTop: 12 }}>
                            <AlertTriangle size={20} />
                            <div>
                                <strong>Multiple Faces Detected</strong>
                                <p>We detected more than one face. Please take a selfie with only your face visible in the frame.</p>
                            </div>
                        </div>
                    )}

                    {/* Retake button */}
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <button className="btn btn-outline" onClick={resetSelfie}>
                            <RotateCcw size={15} /> Retake Selfie
                        </button>
                    </div>
                </div>
            )}

            {/* Tips */}
            {!data.selfieUrl && mode !== 'camera' && (
                <div style={{
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                    padding: 16, fontSize: 13, color: '#475569', lineHeight: 1.7,
                }}>
                    <div style={{ fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>Tips for a good selfie:</div>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                        <li>Make sure your <strong>face is clearly visible</strong> and centered</li>
                        <li>Use <strong>good lighting</strong> — avoid backlighting or dark areas</li>
                        <li>Remove <strong>sunglasses or face coverings</strong></li>
                        <li>Look directly at the camera</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
