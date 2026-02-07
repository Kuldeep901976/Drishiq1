'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { ImageOptimizer } from '@/lib/image-optimizer';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Temporarily commented out for testing
// const ReactQuill = dynamic(() => import('react-quill'), {
//   ssr: false,
//   loading: () => <p>Loading editor...</p>
// });

type BlogFormData = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  read_time: string;
  featured_image: string;
  author: string;
  author_email: string;
  slug: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  meta_description: string;
  canonical_url: string;
};

export default function AdminBlogEditPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    read_time: '',
    featured_image: '',
    author: '',
    author_email: '',
    slug: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
    meta_description: '',
    canonical_url: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('blog_posts')
          .select('title, excerpt, content, category, tags, reading_time_minutes, featured_image, author, author_email, slug, seo_title, seo_description, seo_keywords, og_title, og_description, og_image, meta_description, canonical_url')
          .eq('id', id)
          .single();
        if (error) throw error;
        if (data) {
          setFormData({
            title: data.title || '',
            excerpt: data.excerpt || '',
            content: data.content || '',
            category: data.category || '',
            tags: data.tags || '',
            read_time: (data.reading_time_minutes ?? '')?.toString(),
            featured_image: data.featured_image || '',
            author: data.author || '',
            author_email: data.author_email || '',
            slug: data.slug || '',
            seo_title: data.seo_title || '',
            seo_description: data.seo_description || '',
            seo_keywords: data.seo_keywords || '',
            og_title: data.og_title || '',
            og_description: data.og_description || '',
            og_image: data.og_image || '',
            meta_description: data.meta_description || '',
            canonical_url: data.canonical_url || ''
          });
          setImagePreview(data.featured_image || '');
        }
      } catch {
        setMessage('Failed to load blog');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const onChange =
    (k: keyof BlogFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const v = e.target.value;
      setFormData(prev => ({ ...prev, [k]: v }));
      if (k === 'featured_image') setImagePreview(v);
    };
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      // Also update the form data so the input field shows the new file
      setFormData(prev => ({ ...prev, featured_image: previewUrl }));
    }
  };

  const onContentChange = (html: string) => {
    setFormData(prev => ({ ...prev, content: html }));
    };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setMessage('Title is required');
        setSaving(false);
        return;
      }
      
      if (!formData.content.trim()) {
        setMessage('Content is required');
        setSaving(false);
        return;
      }

      // Handle image upload if there's a new file
      let finalImageUrl = formData.featured_image || '';
      if (imageFile) {
        try {
          // Validate file type
          if (!ImageOptimizer.isValidImage(imageFile)) {
            setMessage(`Please select a valid image file. Allowed formats: JPEG, PNG, WebP, GIF`);
            setSaving(false);
            return;
          }

          // Show optimization message
          setMessage('🔄 Optimizing image for web...');
          
          // Optimize image using the featured profile (1200x800, max 500KB)
          const optimizedImage = await ImageOptimizer.optimizeImage(imageFile, { type: 'featured' });
          
          console.log('Image optimization complete:', {
            originalSize: ImageOptimizer.formatFileSize(imageFile.size),
            optimizedSize: ImageOptimizer.formatFileSize(optimizedImage.size),
            dimensions: `${optimizedImage.width}x${optimizedImage.height}`,
            format: optimizedImage.format
          });

          // Create optimized file for upload
          const optimizedFile = new File([optimizedImage.blob], imageFile.name, {
            type: `image/${optimizedImage.format}`,
            lastModified: Date.now()
          });

          const fileName = `${Date.now()}-${imageFile.name}`;
          console.log('Uploading optimized image:', fileName, 'Size:', ImageOptimizer.formatFileSize(optimizedImage.size));
          
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('blog-images')
            .upload(fileName, optimizedFile);
            
          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error(`Image upload failed: ${uploadError.message}`);
          }
          
          const { data: urlData } = supabase
            .storage
            .from('blog-images')
            .getPublicUrl(fileName);
          finalImageUrl = urlData.publicUrl;
          console.log('Optimized image uploaded successfully:', finalImageUrl);
          
          // Clear the optimization message
          setMessage(null);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          const errorMsg = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          
          if (errorMsg.includes('row-level security policy')) {
            setMessage(`❌ Image upload failed due to permissions. Please provide an image URL instead or contact an administrator. Error: ${errorMsg}`);
          } else {
            setMessage(`❌ Image upload failed: ${errorMsg}`);
          }
          
          setSaving(false);
          return;
        }
      } else if (finalImageUrl.startsWith('blob:') || finalImageUrl.startsWith('http://localhost')) {
        // If there's a blob URL but no file, try to extract from the featured_image input
        if (formData.featured_image && formData.featured_image.startsWith('http')) {
          finalImageUrl = formData.featured_image;
        } else {
          setMessage('Please upload an image or provide a hosted image URL');
          setSaving(false);
          return;
        }
      }

      // Update blog post
      const reading_time_minutes =
        formData.read_time === '' ? null : Math.max(1, Math.min(60, parseInt(formData.read_time, 10) || 1));
        
      console.log('Updating blog post with data:', {
        title: formData.title,
        category: formData.category,
        featured_image: finalImageUrl
      });

      const { error: updateError } = await (supabase as any)
        .from('blog_posts')
        .update({
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          category: formData.category,
          tags: formData.tags,
          reading_time_minutes,
          featured_image: finalImageUrl,
          author: formData.author,
          author_email: formData.author_email,
          slug: formData.slug,
          seo_title: formData.seo_title,
          seo_description: formData.seo_description,
          seo_keywords: formData.seo_keywords,
          og_title: formData.og_title,
          og_description: formData.og_description,
          og_image: formData.og_image,
          meta_description: formData.meta_description,
          canonical_url: formData.canonical_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }
      
      setMessage('✅ Blog post saved successfully!');
      setTimeout(() => router.push('/admin/blog-management'), 2000);
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Resolve storage path to public URL (Supabase) and keep preview in sync
  const resolveImageUrl = (val: string) => {
    if (!val) return '';
    if (val.startsWith('http') || val.startsWith('blob:')) return val;
    const { data } = supabase.storage.from('blog-images').getPublicUrl(val);
    return data?.publicUrl || '';
  };
  // Removed problematic useEffect that was overriding imagePreview
  const getCurrentImage = () => {
    // Prefer local preview when a new file is selected
    if (imageFile && imagePreview) return imagePreview;
    if (formData.featured_image) return resolveImageUrl(formData.featured_image);
    if (imagePreview) return imagePreview;
    return '';
  };

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean']
      ],
      clipboard: { matchVisual: false }
    }),
    []
  );
  const quillFormats = useMemo(
    () => ['header', 'bold', 'italic', 'underline', 'strike', 'color', 'background', 'align', 'link', 'image'],
    []
  );

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
        </div>
      </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Blog Post</h1>
            <p className="text-gray-600 mt-2">Update your blog post content and settings</p>
            {message && (
              <div className={`mt-4 p-4 rounded-lg border ${
                message.includes('✅') 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : message.includes('❌') 
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-center gap-2">
                  {message.includes('✅') && <span className="text-green-600">✅</span>}
                  {message.includes('❌') && <span className="text-red-600">❌</span>}
                  <span className="font-medium">{message.replace(/[✅❌]/g, '').trim()}</span>
                </div>
              </div>
            )}
        </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
        <form onSubmit={onSubmit} className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                      <input value={formData.title} onChange={onChange('title')} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                      <input value={formData.category} onChange={onChange('category')} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt *</label>
                    <textarea value={formData.excerpt} onChange={onChange('excerpt')} required rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    <p className="text-sm text-gray-500 mt-1">{formData.excerpt.length}/160 characters</p>
          </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Read Time (minutes) *</label>
                      <input type="number" min={1} max={60} value={formData.read_time} onChange={onChange('read_time')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                      <input value={formData.tags} onChange={onChange('tags')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Comma-separated tags" />
                    </div>
            </div>
          </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured Image</h2>
                  <input value={formData.featured_image} onChange={onChange('featured_image')} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Image URL (e.g., https://example.com/image.jpg)" />
                  <p className="text-sm text-gray-500 mt-1">Enter an image URL or upload a file below</p>
                  <div className="space-y-4 mt-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-sm text-gray-500">Note: If file upload fails, you can use the URL input above instead</p>
                    <p className="text-sm text-gray-500">Images are automatically optimized to 1200x800px and compressed to under 500KB</p>
                    <p className="text-sm text-gray-500">Allowed formats: JPEG, PNG, WebP, GIF</p>
                  </div>
                  {getCurrentImage() && (
                    <img
                      src={getCurrentImage()}
                      alt="Preview"
                      className="mt-3 w-full max-h-64 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
          </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Content</h2>
                  <div className="border rounded-md">
                    {/* Temporarily commented out for testing */}
                    {/* <ReactQuill value={formData.content} onChange={onContentChange} modules={quillModules} formats={quillFormats} /> */}
                    <textarea 
                      value={formData.content} 
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full p-3 border rounded-md min-h-[200px]"
                      placeholder="Enter blog content..."
                    />
                  </div>
          </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">SEO Settings</h2>
                  <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SEO Title</label>
                      <input value={formData.seo_title} onChange={onChange('seo_title')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SEO Description</label>
                      <textarea rows={4} value={formData.seo_description} onChange={onChange('seo_description')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SEO Keywords</label>
                      <textarea rows={3} placeholder="comma,separated,keywords" value={formData.seo_keywords} onChange={onChange('seo_keywords')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
            </div>
          </div>

                <div className="bg-white rounded-lg shadow p-6 mt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Open Graph (Social Media)</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    These fields control how your post appears when shared on social media (Facebook, Twitter, LinkedIn, etc.)
                  </p>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          OG Title <span className="text-xs text-gray-500">(max 60 chars)</span>
                        </label>
                        <input
                          type="text"
                          maxLength={60}
                          value={formData.og_title}
                          onChange={onChange('og_title')}
                          placeholder={formData.title || 'Open Graph title (defaults to title if empty)'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.og_title.length}/60 characters
                          {!formData.og_title && <span className="text-blue-600 ml-2">(Will use title if empty)</span>}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">OG Image URL</label>
                        <input
                          type="url"
                          value={formData.og_image}
                          onChange={onChange('og_image')}
                          placeholder={formData.featured_image || 'https://example.com/og-image.jpg'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {!formData.og_image && <span className="text-blue-600">(Will use featured image if empty)</span>}
                          {formData.og_image && <span className="text-green-600">✓ Custom OG image set</span>}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OG Description <span className="text-xs text-gray-500">(max 160 chars)</span>
                      </label>
                      <textarea
                        maxLength={160}
                        rows={3}
                        value={formData.og_description}
                        onChange={onChange('og_description')}
                        placeholder={formData.excerpt || 'Open Graph description (defaults to excerpt if empty)'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.og_description.length}/160 characters
                        {!formData.og_description && <span className="text-blue-600 ml-2">(Will use excerpt if empty)</span>}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                      <textarea
                        rows={3}
                        value={formData.meta_description}
                        onChange={onChange('meta_description')}
                        placeholder="Meta description for SEO (max 160 chars recommended)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Canonical URL</label>
                      <input
                        type="url"
                        value={formData.canonical_url}
                        onChange={onChange('canonical_url')}
                        placeholder={`https://yoursite.com/blog/${formData.slug || 'your-slug'}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {!formData.canonical_url && <span className="text-blue-600">(Will auto-generate if empty)</span>}
                        {formData.canonical_url && <span className="text-green-600">✓ Custom canonical URL set</span>}
                      </p>
                    </div>
                  </div>
                </div>

          <div className="flex items-center gap-3">
                  <button disabled={saving} type="submit" className="px-4 py-2 bg-emerald-700 text-white rounded-md">{saving ? 'Saving…' : 'Save changes'}</button>
                  <button type="button" className="px-4 py-2 border rounded-md" onClick={() => router.push('/admin/blog-management')}>Cancel</button>
          </div>
        </form>
            </div>

            {/* Right Side - Preview (mirrors Blog Create) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-[#0B4422] mb-4 flex items-center gap-2">
                  <span className="text-emerald-600">👁️</span>
                  Article Preview
                </h2>

                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-6">
                  {getCurrentImage() ? (
                    <div className="relative h-48 bg-gray-100">
                      <img
                        src={getCurrentImage()}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No featured image</span>
                    </div>
                  )}

                  <div className="p-4">
                    {formData.category && (
                      <div className="mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0B4422]/10 text-[#0B4422] border border-[#0B4422]/20">
                          {formData.category}
                        </span>
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                      {formData.title || 'Your Blog Title Will Appear Here'}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-3 min-h-[4rem]">
                      {formData.excerpt || 'Your blog excerpt will appear here. Make it compelling to attract readers!'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <span>⏱️</span>
                          {formData.read_time || '5'} min read
                        </span>
                        <span className="flex items-center gap-1">
                          <span>👁️</span>
                          0 views
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>❤️</span>
                        0 likes
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-[#0B4422] mb-3">Article Preview</h3>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="mb-4">
                      <h1 className="text-xl font-bold text-gray-900 mb-2">
                        {formData.title || 'Your Blog Title'}
                      </h1>
                      {getCurrentImage() && (
                        <div className="mb-4">
                          <img 
                            src={getCurrentImage()} 
                            alt="Featured image"
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span>By {formData.author || 'Author Name'}</span>
                        <span>•</span>
                        <span>{formData.read_time || '5'} min read</span>
                        <span>•</span>
                        <span>{formData.category || 'Category'}</span>
                      </div>
                      {formData.excerpt && (
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {formData.excerpt}
                        </p>
                      )}
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <div 
                        className="text-gray-700 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: formData.content || '<p>Your article content will appear here...</p>' 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
      <Footer />
    </>
  );
}
