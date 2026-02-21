export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "moderator" | "support";
  status: "active" | "inactive";
  lastLogin: string;
}
