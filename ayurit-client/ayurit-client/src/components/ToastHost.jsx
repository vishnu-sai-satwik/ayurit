import React, { useEffect, useState } from 'react';

const toastStyles = {
  position: 'fixed',
  right: '24px',
  bottom: '24px',
  zIndex: 200,
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  pointerEvents: 'none'
};

const toastItemStyles = {
  minWidth: '260px',
  maxWidth: '360px',
  padding: '14px 16px',
  borderRadius: '16px',
  color: '#F7F3EE',
  background: 'rgba(5, 20, 17, 0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 16px 40px rgba(0,0,0,0.28)',
  backdropFilter: 'blur(18px)',
  fontSize: '14px',
  lineHeight: 1.4
};

const toneStyles = {
  success: { borderColor: 'rgba(62, 207, 178, 0.35)', color: '#B8FFE9' },
  error: { borderColor: 'rgba(248, 113, 113, 0.35)', color: '#FFD1D1' },
  info: { borderColor: 'rgba(125, 211, 252, 0.35)', color: '#D2F0FF' }
};

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (event) => {
      const detail = event.detail || {};
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const nextToast = {
        id,
        type: detail.type || 'info',
        message: detail.message || 'Something happened'
      };

      setToasts((current) => [...current, nextToast]);

      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, detail.duration || 3500);
    };

    window.addEventListener('ayurit:toast', handleToast);
    return () => window.removeEventListener('ayurit:toast', handleToast);
  }, []);

  if (!toasts.length) {
    return null;
  }

  return (
    <div aria-live="polite" aria-atomic="true" style={toastStyles}>
      {toasts.map((toast) => (
        <div key={toast.id} style={{ ...toastItemStyles, ...toneStyles[toast.type] }}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}