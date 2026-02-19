
import fs from 'fs';
import path from 'path';

const moves = [
  // UI Components
  { src: 'src/components/ui', dest: 'src/shared/components/ui' },
  // Layouts
  { src: 'src/components/layouts', dest: 'src/shared/components/layouts' },
  // Feature Components
  { src: 'src/components/admin', dest: 'src/features/admin/components' },
  { src: 'src/components/analytics', dest: 'src/features/analytics/components' },
  { src: 'src/components/auth', dest: 'src/features/auth/components' },
  { src: 'src/components/chatbot', dest: 'src/features/chatbot/components' },
  { src: 'src/components/maintenance', dest: 'src/features/maintenance/components' },
  { src: 'src/components/merchant', dest: 'src/features/merchant/components' },
  { src: 'src/components/notifications', dest: 'src/features/notifications/components' },
  { src: 'src/components/payment', dest: 'src/features/payment/components' },
  { src: 'src/components/referral', dest: 'src/features/referral/components' },
  { src: 'src/components/signature', dest: 'src/features/signature/components' },
  { src: 'src/components/tenant', dest: 'src/features/tenant/components' },
  { src: 'src/components/vendor', dest: 'src/features/vendor/components' },
  
  // Specific files in src/components that might be shared or need placement
  { src: 'src/components/EnhancedFileUpload.tsx', dest: 'src/shared/components/EnhancedFileUpload.tsx' },
  { src: 'src/components/FileUpload.tsx', dest: 'src/shared/components/FileUpload.tsx' },
  { src: 'src/components/NavLink.tsx', dest: 'src/shared/components/NavLink.tsx' },

  // Constants
  { src: 'src/lib/constants', dest: 'src/constants' },

  // Utils
  { src: 'src/lib/utils.ts', dest: 'src/shared/utils/utils.ts' },
  { src: 'src/lib/validations', dest: 'src/shared/utils/validations' },
  
  { src: 'src/lib/analytics.ts', dest: 'src/shared/utils/analytics.ts' },
  { src: 'src/lib/auditLog.ts', dest: 'src/shared/utils/auditLog.ts' },
  { src: 'src/lib/auth-errors.ts', dest: 'src/features/auth/utils/auth-errors.ts' },
  { src: 'src/lib/currency.ts', dest: 'src/shared/utils/currency.ts' },
  { src: 'src/lib/dateUtils.ts', dest: 'src/shared/utils/dateUtils.ts' },
  { src: 'src/lib/exportUtils.ts', dest: 'src/shared/utils/exportUtils.ts' },
  { src: 'src/lib/haptic.ts', dest: 'src/shared/utils/haptic.ts' },
  { src: 'src/lib/imageCompression.ts', dest: 'src/shared/utils/imageCompression.ts' },
  { src: 'src/lib/merchantValidations.ts', dest: 'src/features/merchant/utils/merchantValidations.ts' },
  { src: 'src/lib/notifications.ts', dest: 'src/features/notifications/utils/notifications.ts' },
  { src: 'src/lib/statusColors.ts', dest: 'src/shared/utils/statusColors.ts' },
  { src: 'src/lib/vendorValidations.ts', dest: 'src/features/vendor/utils/vendorValidations.ts' },

  // Integrations
  { src: 'src/integrations', dest: 'src/lib/integrations' },

  // Hooks
  { src: 'src/hooks/use-mobile.tsx', dest: 'src/shared/hooks/use-mobile.tsx' },
  { src: 'src/hooks/use-toast.ts', dest: 'src/shared/hooks/use-toast.ts' },
  { src: 'src/hooks/useResumableUpload.ts', dest: 'src/shared/hooks/useResumableUpload.ts' },
  
  { src: 'src/hooks/useAdminGuard.ts', dest: 'src/features/admin/hooks/useAdminGuard.ts' },
  { src: 'src/hooks/useAuth.tsx', dest: 'src/features/auth/hooks/useAuth.tsx' },
  { src: 'src/hooks/useChatbotConversation.ts', dest: 'src/features/chatbot/hooks/useChatbotConversation.ts' },
  { src: 'src/hooks/useSubscriptionLimits.ts', dest: 'src/features/merchant/hooks/useSubscriptionLimits.ts' },
  { src: 'src/hooks/useAnalytics.ts', dest: 'src/features/analytics/hooks/useAnalytics.ts' },

  // Types
  { src: 'src/types/auth.ts', dest: 'src/features/auth/types/auth.ts' },
  { src: 'src/types/merchant.ts', dest: 'src/features/merchant/types/merchant.ts' },
];

moves.forEach(({ src, dest }) => {
  const fullSrc = path.resolve(process.cwd(), src);
  const fullDest = path.resolve(process.cwd(), dest);
  
  if (fs.existsSync(fullSrc)) {
    const stat = fs.statSync(fullSrc);
    
    // Ensure parent dir of dest exists
    const destDir = stat.isDirectory() ? fullDest : path.dirname(fullDest);
    if (!fs.existsSync(destDir)) {
       fs.mkdirSync(destDir, { recursive: true });
    }

    if (stat.isDirectory()) {
       // If it's a directory, move contents if dest exists and is a directory
       if (fs.existsSync(fullDest) && fs.statSync(fullDest).isDirectory()) {
          const files = fs.readdirSync(fullSrc);
          files.forEach(file => {
             const srcFile = path.join(fullSrc, file);
             const destFile = path.join(fullDest, file);
             // Recursively move or just rename? 
             // Rename works across dirs on same filesystem.
             fs.renameSync(srcFile, destFile);
          });
          // Remove empty src dir
          try { fs.rmdirSync(fullSrc); } catch(e) {}
       } else {
          fs.renameSync(fullSrc, fullDest);
       }
    } else {
       // File
       fs.renameSync(fullSrc, fullDest);
    }
    console.log(`Moved: ${src} -> ${dest}`);
  } else {
    console.log(`Skipped (not found): ${src}`);
  }
});
