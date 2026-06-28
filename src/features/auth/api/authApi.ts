import { apiClient, TOKEN_KEY } from "@/shared/lib/axios";
import { AuthTokens, AuthUser, UserProfile } from "@/features/auth/types/auth";

export const authApi = {
  async getMe(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>("/auth/me");
    return data;
  },

  async login(
    email: string,
    password: string,
  ): Promise<AuthTokens & { user: AuthUser }> {
    const { data } = await apiClient.post<AuthTokens & { user: AuthUser }>(
      "/auth/login",
      { email, password },
    );
    return data;
  },

  async updateMe(
    payload: Partial<{
      name: string;
      phone_number: string;
    }>,
  ): Promise<void> {
    await apiClient.patch("/auth/me", payload);
  },

  async changePassword(
    old_password: string,
    new_password: string,
  ): Promise<void> {
    await apiClient.post("/auth/change-password", {
      old_password,
      new_password,
    });
  },
};
