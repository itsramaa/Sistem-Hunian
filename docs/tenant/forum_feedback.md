# Tenant Forum Feedback

## File Location
- `src/pages/tenant/Forum.tsx`
- `src/pages/tenant/ForumPost.tsx`

## Review Summary

### 1. Bugs & Errors

| Issue | Severity | Description |
|-------|----------|-------------|
| Like Count Race Condition | High | Like count updated manually after like insert, can cause race conditions |
| View Count Increment Issue | High | View count incremented every render due to useEffect dependency on `post?.id` |
| Comment Count Manual Update | High | Comment count updated manually, can get out of sync |
| Photo Upload to Wrong Bucket | Medium | Uses 'maintenance-photos' bucket for forum photos |
| Non-Atomic Like Operations | High | Like insert and count update are separate operations |

### 2. Validations

| Issue | Severity | Description |
|-------|----------|-------------|
| No Content Length Validation | Medium | No max length for post title or content |
| No Tag Validation | Low | Tags not validated for format or count |
| No Photo Count Limit Server | Medium | Photo limit (4) only enforced client-side |
| No Profanity Filter | Medium | No content moderation for posts/comments |

### 3. UX & Flow Pengguna

| Issue | Severity | Description |
|-------|----------|-------------|
| No Sort Options | Medium | Cannot sort posts by date, likes, or comments |
| No Pagination | High | All posts loaded at once |
| Limited Photo Preview | Low | Small photo preview (14x14), no lightbox |
| No Edit Post Capability | Medium | Users cannot edit their own posts |
| No Delete Post Option | Medium | Users cannot delete their own posts |
| Report Reason Hardcoded | Medium | Report uses hardcoded "inappropriate" reason |
| No Comment Edit | Low | Cannot edit comments |

### 4. Performance

| Issue | Severity | Description |
|-------|----------|-------------|
| Multiple Sequential Queries | Medium | Posts and profiles fetched separately |
| Full Post Fetch | Medium | Fetches all posts without pagination |
| No Image Lazy Loading | Low | Post images loaded eagerly |
| Client-Side Filtering | Medium | Search filtering done client-side |

### 5. Security

| Issue | Severity | Description |
|-------|----------|-------------|
| No Tenant Role Check | High | Any authenticated user can access forum |
| XSS Vulnerability | High | Post content rendered with `whitespace-pre-wrap` without sanitization |
| No Rate Limiting | High | No rate limit on post/comment creation |
| Photo URLs Exposed | Medium | Public URLs for forum photos |
| Report No Auth Check | Medium | Report insert doesn't verify reporter is legitimate user |

### 6. Consistency & Data Integrity

| Issue | Severity | Description |
|-------|----------|-------------|
| Like Count Sync Issues | High | Manual count updates can cause inconsistency |
| Property Filter Logic | Medium | OR condition for property_id may show unrelated posts |
| Comment Delete Cascade | Low | Deleting comment doesn't update count atomically |

### 7. Error Handling & Observability

| Issue | Severity | Description |
|-------|----------|-------------|
| Silent Photo Upload Failures | Medium | Failed uploads continue to next file |
| Generic Error Messages | Medium | Shows generic mutation error messages |
| No Report Confirmation | Low | Report submitted with minimal feedback |

### 8. Maintainability

| Issue | Severity | Description |
|-------|----------|-------------|
| Large Component Files | Medium | Both files are 400+ lines |
| Inline Profile Mapping | Low | Profile mapping logic could be extracted |
| Duplicate Like Logic | Medium | Like/unlike logic duplicated between Forum and ForumPost |

### 9. Compatibility & Environment

| Issue | Severity | Description |
|-------|----------|-------------|
| formatDistanceToNow Locale | Low | Uses default locale, not Indonesian |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 7 |
| Medium | 16 |
| Low | 8 |

## Recommended Actions

1. **Fix like/comment count updates** - use database triggers instead of manual updates
2. **Fix view count increment** - debounce or track in separate session
3. **Create proper forum-photos bucket** instead of using maintenance-photos
4. **Add XSS protection** - sanitize content before rendering
5. **Implement pagination** for posts and comments
6. **Add rate limiting** on post/comment/like creation
7. **Add edit/delete capability** for own posts and comments
8. **Use database triggers** for count updates to ensure consistency
