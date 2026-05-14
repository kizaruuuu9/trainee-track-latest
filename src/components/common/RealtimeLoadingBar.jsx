import React, { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';

const RealtimeLoadingBar = () => {
    const isFetching = useIsFetching();
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isFetching > 0) {
            setVisible(true);
            const timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return 90;
                    return prev + (90 - prev) * 0.1;
                });
            }, 200);
            return () => clearInterval(timer);
        } else {
            setProgress(100);
            const timer = setTimeout(() => {
                setVisible(false);
                setProgress(0);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isFetching]);

    if (!visible && progress === 0) return null;

    return (
        <div 
            id="realtime-loading-bar"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: `${progress}%`,
                height: '3px',
                background: 'linear-gradient(90deg, #4f46e5, #06b6d4, #4f46e5)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite linear',
                zIndex: 100000,
                transition: progress === 100 ? 'width 0.4s ease-out, opacity 0.4s ease-in 0.2s' : 'width 0.4s ease-out',
                opacity: progress === 100 && !visible ? 0 : 1,
                boxShadow: '0 0 8px rgba(79, 70, 229, 0.6)'
            }} 
        />
    );
};

export default RealtimeLoadingBar;
