import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIMEOUT = 29 * 60 * 1000; // Show warning 1 minute before

export function useInactivityLogout() {
  const { user, signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    setShowWarning(false);

    if (user) {
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        toast.warning('Sesi Anda akan berakhir dalam 1 menit karena tidak aktif.', {
          duration: 10000,
          action: {
            label: 'Tetap Login',
            onClick: resetTimer,
          },
        });
      }, WARNING_TIMEOUT);

      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    }
  };

  const handleLogout = async () => {
    toast.info('Sesi Anda telah berakhir karena tidak aktif.');
    await signOut();
    window.location.href = '/auth?mode=login';
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    // Throttle resetTimer to run at most once per second
    let lastRun = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastRun >= 1000) {
        resetTimer();
        lastRun = now;
      }
    };

    if (user) {
      events.forEach(event => {
        window.addEventListener(event, handleActivity);
      });
      resetTimer();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user]);

  return { showWarning, resetTimer };
}
