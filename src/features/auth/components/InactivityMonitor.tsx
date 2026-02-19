import { useInactivityLogout } from '../hooks/useInactivityLogout';

export function InactivityMonitor() {
  useInactivityLogout();
  return null;
}
