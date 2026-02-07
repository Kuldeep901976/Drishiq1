'use client';

import { useRef, useState } from 'react';

const initialBanners = [
  {
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImNsYXJpdHkiIGN4PSIwLjUiIGN5PSIwLjUiIHI9IjAuNSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZmZjM5OTtzdG9wLW9wYWNpdHk6MC44Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmZmO3N0b3Atb3BhY2l0eTowIi8+PC9yYWRpYWxHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNjbGFyaXR5KSIvPjxyZWN0IHg9IjMwJSIgeT0iMjAlIiB3aWR0aD0iNDAlIiBoZWlnaHQ9IjYwJSIgcng9IjEwIiBmaWxsPSIjZjhmOGY4IiBvcGFjaXR5PSIwLjgiLz48Y2lyY2xlIGN4PSI0MCUiIGN5PSI0MCUiIHI9IjE1IiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iNDAlIiBjeT0iNDAlIiByPSI4IiBmaWxsPSIjMzMzIi8+PGxpbmUgeDE9IjQwJSIgeTE9IjQwJSIgeDI9IjQwJSIgeTI9IjMwJSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iNDAlIiB5MT0iNDAlIiB4Mj0iMzAlIiB5Mj0iMzUlIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSI0MCUiIHkxPSI0MCUiIHgyPSI1MCUiIHkyPSIzNSUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTMwJSA2MCUgUTQwJSA1MCUgNTAlIDYwJSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L3N2Zz4=',
    title: '🧠 Get Unstuck. Get Clarity.',
    text: 'Feeling foggy, overwhelmed, or torn between choices? DrishiQ helps you organize your thoughts, reflect deeply, and make wiser decisions — through emotionally intelligent, AI-powered conversations.',
    cta: { label: '🎯 Start Your Clarity Session', link: '/invitation' }
  },
  {
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImhvcGUiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZjhmOGY4O3N0b3Atb3BhY2l0eTowLjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmY7c3RvcC1vcGFjaXR5OjAuNyIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjaG9wZSkiLz48cmVjdCB4PSIyMCUiIHk9IjMwJSIgd2lkdGg9IjYwJSIgaGVpZ2h0PSI0MCUiIHJ4PSI1IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjkiLz48Y2lyY2xlIGN4PSIzMCUiIGN5PSI2MCUiIHI9IjEwIiBmaWxsPSIjMzMzIi8+PHBhdGggZD0iTTI1JSA2MCUgUTMwJSA1MCAzNSUgNjAlIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjx0ZXh0IHg9IjMwJSIgeT0iNDAlIiBmb250LWZhbWlseT0iQ291cmllciIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SGVscDwvdGV4dD48L3N2Zz4=',
    title: '💬 Can\'t Pay? Your Challenge Still Matters.',
    text: 'Struggling to figure things out but can\'t afford a session? We hear you. At DrishiQ, no voice goes unheard. Share your challenge — and we\'ll try to connect you with a sponsored session.',
            cta: { label: '📝 Submit Your Challenge for Support', link: '/support-in-need' }
  },
  {
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImdpZnQiIGN4PSIwLjUiIGN5PSIwLjUiIHI9IjAuNSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZmZjM5OTtzdG9wLW9wYWNpdHk6MC45Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmZmO3N0b3Atb3BhY2l0eTowIi8+PC9yYWRpYWxHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNnaWZ0KSIvPjxjaXJjbGUgY3g9IjM1JSIgY3k9IjQwJSIgcj0iMTUiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSI2NSUiIGN5PSI0MCUiIHI9IjE1IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTM1JSA0MCUgUTUwJSAzMCUgNjUlIDQwJSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjMiLz48Y2lyY2xlIGN4PSI1MCUiIGN5PSIzMCUiIHI9IjgiIGZpbGw9IiNmZmYzOTkiLz48dGV4dCB4PSI1MCUiIHk9IjU1JSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5HaWZ0PC90ZXh0Pjwvc3ZnPg==',
    title: '💚 Give the Gift of Clarity',
    text: 'A single conversation can shift someone\'s world. Donate a session to help someone move from confusion to confidence. Your kindness could be the turning point in their journey.',
    cta: { label: '🌟 Sponsor a Session Now', link: '/payment' }
  },
  {
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9InN0b3J5IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmZmMzk5O3N0b3Atb3BhY2l0eTowLjgiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmY7c3RvcC1vcGFjaXR5OjAuNiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjc3RvcnkpIi8+PHJlY3QgeD0iMjAlIiB5PSIyMCUiIHdpZHRoPSI2MCUiIGhlaWdodD0iNjAlIiByeD0iMTAiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuOSIvPjxjaXJjbGUgY3g9IjMwJSIgY3k9IjMwJSIgcj0iOCIgZmlsbD0iIzMzMyIvPjxwYXRoIGQ9Ik0yNSUgMzAgUTMwJSAyMCAzNSUgMzAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PGNpcmNsZSBjeD0iNzAlIiBjeT0iMzAlIiByPSI2IiBmaWxsPSIjZmZmMzk5Ii8+PGNpcmNsZSBjeD0iNzAlIiBjeT0iNjAlIiByPSI2IiBmaWxsPSIjZmZmMzk5Ii8+PGNpcmNsZSBjeD0iODAlIiBjeT0iNDUlIiByPSI2IiBmaWxsPSIjZmZmMzk5Ii8+PC9zdmc+',
    title: '🔄 Share to Inspire. Earn Credits.',
    text: 'Did DrishiQ help you solve a challenge or gain emotional clarity? Your story could inspire someone else — and earn you session credits in return.',
    cta: { label: '📣 Share Your Story', link: '/stories' }
  },
  {
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImpvdXJuZXkiIGN4PSIwLjUiIGN5PSIwLjUiIHI9IjAuNSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzAwODBmZjtzdG9wLW9wYWNpdHk6MC44Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmZmO3N0b3Atb3BhY2l0eTowIi8+PC9yYWRpYWxHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNqb3VybmV5KSIvPjxwYXRoIGQ9Ik01MCUgMjAgUTMwJSA0MCA3MCUgNDAgUTUwJSA2MCAzMCUgODAgUTUwJSA2MCA3MCUgODAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+PGNpcmNsZSBjeD0iMjAlIiBjeT0iMzAlIiByPSI0IiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iODAlIiBjeT0iMzAlIiByPSI0IiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iMjAlIiBjeT0iNzAlIiByPSI0IiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iODAlIiBjeT0iNzAlIiByPSI0IiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iNTAlIiBjeT0iNTAlIiByPSI2IiBmaWxsPSIjZmZmMzk5Ii8+PC9zdmc+',
    title: '🌍 One Platform. Many Journeys.',
    text: 'Every journey to clarity is different. Some seek guidance, others offer support. DrishiQ brings it all together — powered by insight, empathy, and shared human growth.',
    cta: { label: '🧭 Explore the DrishiQ Experience', link: '/about' }
  },
  {
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImNpcmNsZSIgY3g9IjAuNSIgY3k9IjAuNSIgcj0iMC41Ij48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmZmMzk5O3N0b3Atb3BhY2l0eTowLjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmY7c3RvcC1vcGFjaXR5OjAiLz48L3JhZGlhbEdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2NpcmNsZSkiLz48Y2lyY2xlIGN4PSI1MCUiIGN5PSI1MCUiIHI9IjMwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMyIvPjxjaXJjbGUgY3g9IjUwJSIgY3k9IjMwJSIgcj0iNiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjcwJSIgY3k9IjQwJSIgcj0iNiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjgwJSIgY3k9IjYwJSIgcj0iNiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjYwJSIgY3k9IjgwJSIgcj0iNiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjMwJSIgY3k9IjgwJSIgcj0iNiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjIwJSIgY3k9IjYwJSIgcj0iNiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjMwJSIgY3k9IjQwJSIgcj0iNiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjUwJSIgY3k9IjUwJSIgcj0iOCIgZmlsbD0iI2ZmZjM5OSIvPjwvc3ZnPg==',
    title: '🤝 Be Part of the Clarity Circle',
    text: 'Join a growing community of seekers, sponsors, and storytellers. DrishiQ isn\'t just about answers — it\'s about connection, compassion, and collective growth.',
              cta: { label: '🔗 Request Invitation', link: '/invitation' }
  }
];

export default function BannerAdminPage() {
  const [banners, setBanners] = useState(initialBanners);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, field: string, value: string) => {
    const updated = banners.map((b, i) => {
      if (i === idx) {
        if (field === 'ctaLabel') {
          return { ...b, cta: { ...b.cta, label: value } };
        } else if (field === 'ctaLink') {
          return { ...b, cta: { ...b.cta, link: value } };
        } else {
          return { ...b, [field]: value };
        }
      }
      return b;
    });
    setBanners(updated);
    setSaved(false);
  };

  const handleImageUpload = async (idx: number, file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, GIF, SVG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(idx);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bannerId', idx.toString());

      // Upload to API endpoint
      const response = await fetch('/api/admin/banners/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        handleChange(idx, 'image', result.imageUrl);
        alert('Image uploaded successfully!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleFileSelect = (idx: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(idx, file);
    }
  };

  const triggerFileUpload = (idx: number) => {
    fileInputRefs.current[idx]?.click();
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/banners/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ banners }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        alert('Banners saved successfully!');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save banners. Please try again.');
    }
  };

  const handlePreview = (idx: number) => {
    const banner = banners[idx];
    alert(`Preview for Banner ${idx + 1}:\n\nTitle: ${banner.title}\nText: ${banner.text}\nCTA: ${banner.cta.label} -> ${banner.cta.link}`);
  };

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '2rem auto', 
      padding: '2rem', 
      background: '#fff', 
      borderRadius: 16, 
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        borderBottom: '2px solid #0B4422',
        paddingBottom: '1rem'
      }}>
        <h1 style={{ color: '#0B4422', margin: 0 }}>🎯 Banner Management</h1>
        <button 
          onClick={handleSave}
          style={{ 
            background: saved ? '#22c55e' : '#0B4422', 
            color: '#fff', 
            padding: '0.8rem 2rem', 
            borderRadius: 20, 
            fontWeight: 600, 
            border: 'none', 
            fontSize: 16,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {saved ? '✅ Saved!' : '💾 Save All Banners'}
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
        gap: '2rem' 
      }}>
        {banners.map((banner, idx) => (
          <div key={idx} style={{ 
            border: '2px solid #e5e7eb', 
            borderRadius: 16, 
            padding: '1.5rem', 
            background: '#f9fafb',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1rem' 
            }}>
              <h2 style={{ color: '#0B4422', margin: 0, fontSize: '1.5rem' }}>Banner {idx + 1}</h2>
              <button 
                onClick={() => handlePreview(idx)}
                style={{ 
                  background: '#3b82f6', 
                  color: '#fff', 
                  padding: '0.5rem 1rem', 
                  borderRadius: 8, 
                  border: 'none', 
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                👁️ Preview
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                  Title:
                </label>
                <input 
                  type="text" 
                  value={banner.title} 
                  onChange={e => handleChange(idx, 'title', e.target.value)} 
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: 8, 
                    border: '1px solid #d1d5db',
                    fontSize: '1rem'
                  }}
                  placeholder="Banner title..."
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                  Description Text:
                </label>
                <textarea 
                  value={banner.text} 
                  onChange={e => handleChange(idx, 'text', e.target.value)} 
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: 8, 
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Banner description..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                    CTA Button Text:
                  </label>
                  <input 
                    type="text" 
                    value={banner.cta.label} 
                    onChange={e => handleChange(idx, 'ctaLabel', e.target.value)} 
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: 8, 
                      border: '1px solid #d1d5db',
                      fontSize: '1rem'
                    }}
                    placeholder="Button text..."
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                    CTA Link:
                  </label>
                  <input 
                    type="text" 
                    value={banner.cta.link} 
                    onChange={e => handleChange(idx, 'ctaLink', e.target.value)} 
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: 8, 
                      border: '1px solid #d1d5db',
                      fontSize: '1rem'
                    }}
                    placeholder="/page-url"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                  Banner Image:
                </label>
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <button 
                    onClick={() => triggerFileUpload(idx)}
                    disabled={uploading === idx}
                    style={{ 
                      background: uploading === idx ? '#9ca3af' : '#0B4422', 
                      color: '#fff', 
                      padding: '0.75rem 1.5rem', 
                      borderRadius: 8, 
                      border: 'none', 
                      cursor: uploading === idx ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {uploading === idx ? '⏳ Uploading...' : '📁 Upload Image'}
                  </button>
                  <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    JPG, PNG, GIF, SVG (max 5MB)
                  </span>
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={(el) => { fileInputRefs.current[idx] = el; }}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(idx, e)}
                  style={{ display: 'none' }}
                />

                {/* Current image preview */}
                {banner.image && (
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '1rem', 
                    background: '#f3f4f6', 
                    borderRadius: 8,
                    border: '1px solid #d1d5db'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontWeight: 600, color: '#374151' }}>Current Image:</span>
                      <button 
                        onClick={() => handleChange(idx, 'image', '')}
                        style={{ 
                          background: '#ef4444', 
                          color: '#fff', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: 4, 
                          border: 'none', 
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                    <img 
                      src={banner.image} 
                      alt={`Banner ${idx + 1}`}
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100px', 
                        borderRadius: 4,
                        border: '1px solid #d1d5db'
                      }}
                    />
                  </div>
                )}

                {/* Manual image URL input */}
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                    Or enter image URL manually:
                  </label>
                  <textarea 
                    value={banner.image} 
                    onChange={e => handleChange(idx, 'image', e.target.value)} 
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: 8, 
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      minHeight: '60px',
                      resize: 'vertical',
                      fontFamily: 'monospace'
                    }}
                    placeholder="https://example.com/image.jpg or data:image/svg+xml;base64,..."
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: '#f0f9ff', 
        borderRadius: 8, 
        border: '1px solid #0ea5e9' 
      }}>
        <h3 style={{ color: '#0b5a78', margin: '0 0 0.5rem 0' }}>💡 Tips:</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#0b5a78' }}>
          <li>Upload images in JPG, PNG, GIF, or SVG format (max 5MB)</li>
          <li>Images will be stored in the assets folder</li>
          <li>You can also use external URLs or SVG data URLs</li>
          <li>Keep titles concise and engaging</li>
          <li>Make CTA buttons action-oriented</li>
          <li>Test all links before saving</li>
        </ul>
      </div>
    </div>
  );
} 
