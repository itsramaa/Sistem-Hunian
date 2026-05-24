import { apiClient } from '@/lib/axios';
import { createAuditLog } from '@/shared/utils/auditLog';
import * as OTPAuth from 'otpauth';

export const adminSecurityService = {
  async validateAdminSecret(secretKey: string): Promise<boolean> {
    try {
      const response = await apiClient.post('/auth/admin/2fa/validate', { secretKey });
      return response.data?.valid === true;
    } catch (error) {
      console.error('Error validating secret:', error);
      return false;
    }
  },

  async get2FAStatus(userId: string) {
    try {
      const { data } = await apiClient.get<{ admin_2fa_enabled: boolean }>(`/users/${userId}/2fa-status`);
      return data?.admin_2fa_enabled || false;
    } catch (error) {
      throw error;
    }
  },

  async enable2FA(userId: string, secret: string, token: string) {
    // TODO: implement Go endpoint for 2FA enable
    // Verify the TOTP code before enabling
    const totp = new OTPAuth.TOTP({
      issuer: 'Sistem Hunian',
      label: 'Admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret)
    });

    const isValid = totp.validate({ token, window: 1 });
    
    if (isValid === null) {
      throw new Error('Kode verifikasi tidak valid. Silakan coba lagi.');
    }
    
    await apiClient.post(`/users/${userId}/2fa/enable`, { secret });
    
    await createAuditLog({
      action: 'enable_2fa',
      entityType: 'user',
      entityId: userId,
      metadata: { method: 'totp' },
      userId
    });
  },

  async disable2FA(userId: string) {
    // TODO: implement Go endpoint for 2FA disable
    await apiClient.post(`/users/${userId}/2fa/disable`);
    
    await createAuditLog({
      action: 'disable_2fa',
      entityType: 'user',
      entityId: userId,
      userId
    });
  },

  generateSecret() {
    const secret = new OTPAuth.Secret({ size: 20 });
    return secret.base32;
  },

  generateRecoveryCodes() {
    const codes: string[] = [];
    const randomValues = new Uint32Array(16); // 2 values per code * 8 codes
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < 8; i++) {
      const val1 = randomValues[i * 2].toString(36).substring(0, 4).toUpperCase();
      const val2 = randomValues[i * 2 + 1].toString(36).substring(0, 4).toUpperCase();
      const code = val1.padStart(4, 'X') + '-' + val2.padStart(4, 'X');
      codes.push(code);
    }
    return codes;
  }
};
