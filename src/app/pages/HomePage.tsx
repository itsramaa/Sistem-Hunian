import { Navigate } from 'react-router-dom';

// Root "/" redirects to login; after login Auth.tsx handles role-based redirect
export default function HomePage() {
  return <Navigate to="/login" replace />;
}
