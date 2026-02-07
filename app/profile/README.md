# Profile Page Component

Production-ready profile settings page with astrology opt-in, avatar upload, and comprehensive validation.

## Components

- **`page.tsx`** - Main profile page component
- **`hooks/useProfile.ts`** - Custom hook for profile data management
- **`components/AvatarUploader.tsx`** - Avatar upload with preview
- **`components/AstroBlock.tsx`** - Collapsible astrology fields
- **`components/UnlockModal.tsx`** - Birth data unlock confirmation

## API Integration

### Required Endpoints

#### GET `/api/profile`
Returns current user profile.

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "firstName": "Kuldeep",
    "email": "k@example.com",
    "socialLogin": true,
    "country": "IN",
    "city": "Jaipur",
    "phone": "+911234567890",
    "dob": "1990-12-01",
    "gender": "Male",
    "avatarUrl": "https://...",
    "astroOptIn": true,
    "timeOfBirth": "06:15",
    "placeOfBirth": "Jaipur, India",
    "freezeBirthData": false,
    "consentProvided": true
  }
}
```

#### POST `/api/profile`
Saves profile data.

**Request:**
```json
{
  "firstName": "Kuldeep",
  "email": "k@example.com",
  "country": "IN",
  "city": "Jaipur",
  "phone": "+911234567890",
  "dob": "1990-12-01",
  "gender": "Male",
  "avatarUrl": "https://...",
  "astroOptIn": true,
  "timeOfBirth": "06:15",
  "placeOfBirth": "Jaipur, India",
  "freezeBirthData": false,
  "consentProvided": true
}
```

**Response:**
```json
{
  "success": true,
  "profile": { ... }
}
```

#### POST `/api/avatar-upload`
Uploads avatar image.

**Request:** `multipart/form-data` with `avatar` file

**Response:**
```json
{
  "url": "https://..."
}
```

#### POST `/api/profile/unlock-birth`
Unlocks frozen birth data.

**Request:**
```json
{
  "confirmation": "UNLOCK"
}
```

**Response:**
```json
{
  "success": true
}
```

## Supabase Integration

### Setup

1. Add columns to existing `users` table:
```sql
-- Add columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS time_of_birth TIME;
ALTER TABLE users ADD COLUMN IF NOT EXISTS astro_opt_in BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_provided BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS freeze_birth_data BOOLEAN DEFAULT false;
```

2. Run the migration: See `database/add-profile-columns-to-users.sql`

3. The API routes are already configured to use the `users` table. See `app/api/profile/route.ts`

### Already Configured

The `users` table already has RLS policies. The Profile API uses Supabase Auth to ensure users can only access their own data.

## Phone Number Library (Optional)

Replace `CountryCodeDropdown` with `react-phone-input-2`:

```bash
npm install react-phone-input-2
```

```typescript
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

<PhoneInput
  country="us"
  value={formData.phone}
  onChange={(value) => updateField('phone', value)}
/>
```

## Testing

Run unit tests:
```bash
npm test app/profile
```

## Features

- ✅ Avatar upload with preview
- ✅ Client-side age calculation
- ✅ Astrology opt-in with consent
- ✅ Birth data freeze/unlock
- ✅ Validation with inline errors
- ✅ Unsaved changes warning
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ Responsive design (Tailwind CSS)

## Accessibility

- All inputs have labels and ARIA attributes
- Form errors announced to screen readers
- Keyboard accessible navigation
- Focus management for modals

## Security & Privacy

- Consent required for astrology data
- Birth data can be locked
- Secure upload handling
- Audit logging (backend)
- Data encryption (backend)

