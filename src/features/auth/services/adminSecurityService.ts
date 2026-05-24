import { apiClient } from '@/lib/axios';
import { supabase } from '@/lib/integrations/supabase/client';
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
    const { data, error } = await supabase
      .from('profiles')
      .select('admin_2fa_enabled')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data?.admin_2fa_enabled || false;
  },

  async enable2FA(userId: string, secret: string, token: string) {
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
    
    const { error } = await supabase
      .from('profiles')
      .update({
        admin_2fa_enabled: true,
        admin_2fa_secret: secret,
      })
      .eq('user_id', userId);
    
    if (error) throw error;
    
    await createAuditLog({
      action: 'enable_2fa',
      entityType: 'user',
      entityId: userId,
      metadata: { method: 'totp' },
      userId
    });
  },

  async disable2FA(userId: string) {
    const { error } = await supabase
      .from('profiles')
      .update({
        admin_2fa_enabled: false,
        admin_2fa_secret: null,
      })
      .eq('user_id', userId);
    
    if (error) throw error;
    
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
