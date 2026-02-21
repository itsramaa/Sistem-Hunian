# Forum Moderation

## Overview
Moderasi forum tenant untuk menjaga konten tetap sesuai.

## File Location
- `src/pages/admin/ForumModeration.tsx` - Halaman moderasi forum

## Database Tables
- `forum_posts` - Post forum
- `forum_comments` - Komentar forum
- `forum_reports` - Laporan konten
- `forum_likes` - Like post/comment

## Features
- ✅ View reported posts
- ✅ View reported comments
- ✅ Hide/show content
- ✅ Lock posts
- ✅ Pin posts
- ✅ Delete content
- ✅ Ban users

## Implementation Status
| Feature | Status |
|---------|--------|
| View Reports | ✅ Complete |
| Hide Content | ✅ Complete |
| Lock Posts | ✅ Complete |
| Pin Posts | ✅ Complete |
| Delete | ✅ Complete |

## Report Status
- `pending` - Menunggu review
- `reviewed` - Sudah direview
- `dismissed` - Ditolak
- `action_taken` - Aksi diambil

## Report Reasons
- Spam
- Harassment
- Inappropriate content
- Other

## Related Components
- Forum pages (tenant)
- ForumPost detail
