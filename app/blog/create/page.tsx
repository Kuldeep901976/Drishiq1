'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/drishiq-i18n';
import dynamic from 'next/dynamic';
import { CheckCircle, Eye, Clock, Heart, PenLine } from 'lucide-react';

// Temporarily commented out due to type declaration issues
// const ReactQuill = dynamic(() => import('react-quill'), {
//   ssr: false,
//   loading: () => <p>Loading editor...</p>
// });

interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  read_time: string;
  featured_image: string;
  author: string;
  author_email: string;
  slug: string; // ✅ Add slug field
  // ✅ Add SEO fields
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  // ✅ Add OG (Open Graph) fields
  og_title: string;
  og_description: string;
  og_image: string;
  meta_description: string;
  canonical_url: string;
}

export default function BlogCreatePage() {
  const router = useRouter();
  const { t } = useLanguage(['blog_create', 'common']);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // More reliable way to detect edit mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const editParam = urlParams.get('edit');
      const modeParam = urlParams.get('mode');
      
      if (editParam) {
        setEditMode(editParam);
        setIsEdit(true);
      } else {
        setEditMode(null);
        setIsEdit(false);
      }
      setIsLoading(false);
    }
  }, []);
  
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
    slug: '', // ✅ Add slug field
    // ✅ Add SEO fields
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    // ✅ Add OG (Open Graph) fields
    og_title: '',
    og_description: '',
    og_image: '',
    meta_description: '',
    canonical_url: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedPost, setSubmittedPost] = useState<any>(null);

  // ✅ Add slug generation function
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // ✅ Auto-generate slug when title changes
  useEffect(() => {
    if (formData.title && !isEdit) { // Only generate slug for new posts, not when editing
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(formData.title)
      }));
    }
  }, [formData.title, isEdit]);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: { matchVisual: false }
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'align', 'link', 'image'
  ];

  const loadPostData = async (postId: string) => {
    try {
      const { data: post, error } = await (supabase as any)
        .from('blog_posts')
        .select(`
          id,
          title,
          excerpt,
          content,
          category,
          tags,
          reading_time_minutes,
          featured_image,
          author,
          author_email,
          slug,
          seo_title,
          seo_description,
          seo_keywords,
          og_title,
          og_description,
          og_image,
          meta_description,
          canonical_url
        `)
        .eq('id', postId)
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      if (post) {
        // Ensure featured_image is a full URL
        let imageUrl = (post as any).featured_image || '';
        
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('blob:')) {
          // If it's just a filename, construct the full URL
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(imageUrl);
          imageUrl = urlData.publicUrl;
        }

        setFormData({
          title: post.title || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          category: post.category || '',
          tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
          read_time: post.reading_time_minutes?.toString() || '',
          featured_image: imageUrl,
          author: post.author || '',
          author_email: post.author_email || '',
          slug: post.slug || '',
          seo_title: post.seo_title || '',
          seo_description: post.seo_description || '',
          seo_keywords: post.seo_keywords || '',
          og_title: post.og_title || '',
          og_description: post.og_description || '',
          og_image: post.og_image || '',
          meta_description: post.meta_description || '',
          canonical_url: post.canonical_url || ''
        });
        
        if (imageUrl) {
          setImagePreview(imageUrl);
        }
      }
    } catch (error) {
      console.error('❌ Error in loadPostData:', error);
      setMessage(t('blog_create.errors.load_error') ?? 'Error loading post data. Please try again.');
    }
  };

  useEffect(() => {
    console.log('useEffect triggered:', { isEdit, editMode });
    if (isEdit && editMode) {
      console.log('Calling loadPostData with:', editMode);
      loadPostData(editMode);
    }
  }, [isEdit, editMode]);

  useEffect(() => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      return () => URL.revokeObjectURL(imagePreview);
    }
  }, [imagePreview]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const clearSelectedImage = () => {
    // Clear any blob URLs
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    
    setImageFile(null);
    setImagePreview('');
    
    // Also clear the featured_image in formData if it's a blob URL
    if (formData.featured_image && formData.featured_image.startsWith('blob:')) {
      setFormData(prev => ({ ...prev, featured_image: '' }));
    }
  };

  const getCurrentImage = () => {
    // If we have a new image file selected, use its preview
    if (imageFile && imagePreview) {
      return imagePreview;
    }
    
    // If we have an existing image URL, use it
    if (formData.featured_image) {
      return formData.featured_image;
    }
    
    // Fallback to imagePreview
    return imagePreview || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let finalImageUrl = formData.featured_image;

      // Handle image upload if a new file was selected
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await (supabase as any).storage
          .from('blog-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        // Get public URL for the uploaded image
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fileName);

        finalImageUrl = urlData.publicUrl;
      }

      // Ensure we have a valid image URL
      if (!finalImageUrl) {
        setMessage(t('blog_create.errors.no_image') ?? 'Please select a featured image');
        setLoading(false);
        return;
      }

      // Validate minimum content length (2000 characters after HTML stripping)
      const strippedContent = formData.content.replace(/<[^>]+>/g, '');
      const contentLength = strippedContent.length;
      const MIN_CONTENT_LENGTH = 2000;
      
      if (contentLength < MIN_CONTENT_LENGTH) {
        setMessage(
          t('blog_create.errors.content_too_short') ?? 
          `Content must be at least ${MIN_CONTENT_LENGTH} characters. Currently ${contentLength} characters.`
        );
        setLoading(false);
        return;
      }

      // Submit via API route (bypasses RLS)
      const response = await fetch('/api/blog/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          category: formData.category,
          tags: formData.tags,
          read_time: formData.read_time,
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
          post_id: isEdit ? editMode : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to submit blog post');
      }

      setSubmittedPost(formData);
      setShowSuccess(true);
      router.push('/blog/submission-confirmation');
    } catch (error) {
      console.error('Error submitting post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage(t('blog_create.errors.submit_error') ?? `Error submitting post: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Render loading AFTER all hooks are declared (keeps hook order stable)
  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422] mx-auto mb-4"></div>
            <p className="text-gray-600">{t('blog_create.loading') ?? 'Loading...'}</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Success Message Overlay */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('blog_create.success.title') ?? 'Thank You!'}</h2>
                  <p className="text-lg text-gray-600">
                    {t('blog_create.success.message') ?? 'Your blog post has been submitted successfully for review.'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {t('blog_create.success.submessage') ?? 'We will review and publish it soon.'}
                  </p>
                </div>

                {/* Blog Snapshot */}
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('blog_create.success.snapshot_title') ?? 'Blog Post Snapshot'}</h3>
                  
                  {/* Featured Image */}
                  {(imagePreview || submittedPost?.featured_image) && (
                    <div className="mb-4">
                      <img
                        src={imagePreview || submittedPost?.featured_image}
                        alt="Blog preview"
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Post Details */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">{t('blog_create.form.title_label') ?? 'Title:'}</span>
                      <p className="text-gray-900 font-semibold">{submittedPost?.title}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500">{t('blog_create.form.author_label') ?? 'Author:'}</span>
                      <p className="text-gray-900">{submittedPost?.author}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500">{t('blog_create.form.category_label') ?? 'Category:'}</span>
                      <p className="text-gray-900">{submittedPost?.category}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500">{t('blog_create.form.excerpt_label') ?? 'Excerpt:'}</span>
                      <p className="text-gray-900">{submittedPost?.excerpt}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500">{t('blog_create.form.read_time_label') ?? 'Read Time:'}</span>
                      <p className="text-gray-900">{submittedPost?.read_time} {t('blog_create.form.minutes') ?? 'minutes'}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => router.push('/admin/blog-management')}
                    className="px-6 py-3 bg-[#0B4422] text-white rounded-lg hover:bg-[#0B4422]/90 transition-colors"
                  >
                    {t('blog_create.success.go_to_admin') ?? 'Go to Admin Panel'}
                  </button>
                  <button
                    onClick={() => setShowSuccess(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('blog_create.success.create_another') ?? 'Create Another Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transparent DrishiQ Green Header */}
        <div className="bg-gradient-to-r from-[#0B4422]/90 to-[#0B4422]/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-3">
                {isEdit ? (t('blog_create.header.edit_title') ?? 'Edit Blog Post') : (t('blog_create.header.create_title') ?? 'Create New Blog Post')}
              </h1>
              <p className="text-white/90 text-lg max-w-2xl mx-auto">
                {isEdit 
                  ? (t('blog_create.header.edit_subtitle') ?? 'Update your blog post content and resubmit for approval')
                  : (t('blog_create.header.create_subtitle') ?? 'Share your knowledge and insights with the DrishiQ community')
                }
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 -mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold text-[#0B4422] mb-6">
                  {isEdit ? (t('blog_create.header.edit_title') ?? 'Edit Blog Post') : (t('blog_create.header.create_title') ?? 'Create New Blog Post')}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Author Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('blog_create.form.author_name') ?? 'Author Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.author}
                        onChange={(e) => setFormData({...formData, author: e.target.value})}
                        placeholder={t('blog_create.form.author_name_placeholder') ?? 'Enter author name'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('blog_create.form.author_email') ?? 'Author Email'}
                      </label>
                      <input
                        type="email"
                        value={formData.author_email}
                        onChange={(e) => setFormData({...formData, author_email: e.target.value})}
                        placeholder={t('blog_create.form.author_email_placeholder') ?? 'Enter author email'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Basic Information Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <h2 className="text-xl font-semibold text-[#0B4422] mb-4">{t('blog_create.form.basic_info') ?? 'Basic Information'}</h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('blog_create.form.title') ?? 'Title *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={t('blog_create.form.title_placeholder') ?? 'Enter your blog post title'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('blog_create.form.excerpt') ?? 'Excerpt *'}
                      </label>
                      <textarea
                        required
                        value={formData.excerpt}
                        onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={t('blog_create.form.excerpt_placeholder') ?? 'Brief summary of your blog post'}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        <span className={formData.excerpt.length > 160 ? 'text-red-500' : 'text-gray-500'}>
                          {formData.excerpt.length}/160 {t('blog_create.form.characters') ?? 'characters'}
                        </span>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('blog_create.form.category') ?? 'Category *'}
                        </label>
                        <select
                          required
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">{t('blog_create.form.select_category') ?? 'Select category'}</option>
                          <option value="Personal Clarity">{t('blog_create.categories.personal_clarity') ?? 'Personal Clarity'}</option>
                          <option value="Growth & Work">{t('blog_create.categories.growth_work') ?? 'Growth & Work'}</option>
                          <option value="Business Challenges">{t('blog_create.categories.business_challenges') ?? 'Business Challenges'}</option>
                          <option value="Professional Challenges">{t('blog_create.categories.professional_challenges') ?? 'Professional Challenges'}</option>
                          <option value="Survival & Stability">{t('blog_create.categories.survival_stability') ?? 'Survival & Stability'}</option>
                          <option value="Life Situations">{t('blog_create.categories.life_situations') ?? 'Life Situations'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('blog_create.form.read_time') ?? 'Read Time (minutes) *'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          required
                          value={formData.read_time}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                              setFormData({...formData, read_time: value});
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="5"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {t('blog_create.form.read_time_hint') ?? 'Enter time in minutes (e.g., 5 for 5 minutes)'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('blog_create.form.tags') ?? 'Tags'}
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({...formData, tags: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={t('blog_create.form.tags_placeholder') ?? 'Comma-separated tags (e.g., technology, AI, future)'}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t('blog_create.form.tags_hint') ?? 'Comma-separated keywords for search engines'}
                      </p>
                    </div>
                  </div>

                  {/* SEO Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-xl font-semibold text-[#0B4422] mb-4">{t('blog_create.form.seo_meta') ?? 'SEO & Meta'}</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('blog_create.form.seo_title') ?? 'SEO Title'}
                        </label>
                        <input
                          type="text"
                          value={formData.seo_title}
                          onChange={(e) => setFormData({...formData, seo_title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder={t('blog_create.form.seo_title_placeholder') ?? 'SEO optimized title'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('blog_create.form.seo_slug') ?? 'SEO Slug'}
                        </label>
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => setFormData({...formData, slug: e.target.value})}
                          placeholder={t('blog_create.form.seo_slug_placeholder') ?? 'url-friendly-slug'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('blog_create.form.meta_description') ?? 'Meta Description'}
                      </label>
                      <textarea
                        value={formData.seo_description}
                        onChange={(e) => setFormData({...formData, seo_description: e.target.value})}
                        placeholder={t('blog_create.form.meta_description_placeholder') ?? 'Brief description for search engines'}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('blog_create.form.meta_keywords') ?? 'Meta Keywords'}
                      </label>
                      <input
                        type="text"
                        value={formData.seo_keywords}
                        onChange={(e) => setFormData({...formData, seo_keywords: e.target.value})}
                        placeholder={t('blog_create.form.meta_keywords_placeholder') ?? 'keyword1, keyword2, keyword3'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Open Graph (OG) Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-xl font-semibold text-[#0B4422] mb-4">
                      {t('blog_create.form.og_meta') ?? 'Open Graph (Social Media)'}
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      {t('blog_create.form.og_description_hint') ?? 'These fields control how your post appears when shared on social media (Facebook, Twitter, LinkedIn, etc.)'}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('blog_create.form.og_title') ?? 'OG Title'} 
                          <span className="text-xs text-gray-500 ml-2">(max 60 chars)</span>
                        </label>
                        <input
                          type="text"
                          maxLength={60}
                          value={formData.og_title}
                          onChange={(e) => setFormData({...formData, og_title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder={(t('blog_create.form.og_title_placeholder') ?? formData.title) || 'Open Graph title (defaults to title if empty)'}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.og_title.length}/60 {t('blog_create.form.characters') ?? 'characters'}
                          {!formData.og_title && (
                            <span className="text-blue-600 ml-2">
                              (Will use title if empty)
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('blog_create.form.og_image') ?? 'OG Image URL'}
                        </label>
                        <input
                          type="url"
                          value={formData.og_image}
                          onChange={(e) => setFormData({...formData, og_image: e.target.value})}
                          placeholder={(t('blog_create.form.og_image_placeholder') ?? formData.featured_image) || 'https://example.com/og-image.jpg'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {!formData.og_image && (
                            <span className="text-blue-600">
                              (Will use featured image if empty)
                            </span>
                          )}
                          {formData.og_image && (
                            <span className="text-green-600">✓ Custom OG image set</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('blog_create.form.og_description') ?? 'OG Description'} 
                        <span className="text-xs text-gray-500 ml-2">(max 160 chars)</span>
                      </label>
                      <textarea
                        maxLength={160}
                        value={formData.og_description}
                        onChange={(e) => setFormData({...formData, og_description: e.target.value})}
                        placeholder={(t('blog_create.form.og_description_placeholder') ?? formData.excerpt) || 'Open Graph description (defaults to excerpt if empty)'}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.og_description.length}/160 {t('blog_create.form.characters') ?? 'characters'}
                        {!formData.og_description && (
                          <span className="text-blue-600 ml-2">
                            (Will use excerpt if empty)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('blog_create.form.canonical_url') ?? 'Canonical URL'}
                      </label>
                      <input
                        type="url"
                        value={formData.canonical_url}
                        onChange={(e) => setFormData({...formData, canonical_url: e.target.value})}
                        placeholder={t('blog_create.form.canonical_url_placeholder') ?? `https://yoursite.com/blog/${formData.slug || 'your-slug'}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {!formData.canonical_url && (
                          <span className="text-blue-600">
                            (Will auto-generate if empty)
                          </span>
                        )}
                        {formData.canonical_url && (
                          <span className="text-green-600">✓ Custom canonical URL set</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Content Settings Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <h2 className="text-xl font-semibold text-[#0B4422] mb-4">{t('blog_create.form.content_settings') ?? 'Content Settings'}</h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('blog_create.form.featured_image') ?? 'Featured Image'}
                      </label>
                      <div className="space-y-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        
                        {/* Image Preview */}
                        {getCurrentImage() && (
                          <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('blog_create.form.image_preview') ?? 'Image Preview:'}</h4>
                            <img
                              src={getCurrentImage()}
                              alt="Preview"
                              className="max-w-full h-32 object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            {imageFile && (
                              <p className="text-sm text-gray-600 mt-2">
                                {t('blog_create.form.new_image_selected') ?? 'New image selected:'} {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                              </p>
                            )}
                            {!imageFile && formData.featured_image && (
                              <p className="text-sm text-gray-600 mt-2">
                                {t('blog_create.form.current_image') ?? 'Current image:'} {formData.featured_image}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={clearSelectedImage}
                              className="px-3 py-2 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-md hover:bg-red-50"
                            >
                              {t('blog_create.form.clear') ?? 'Clear'}
                            </button>
                          </div>
                        )}

                        {/* Image URL Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('blog_create.form.or_enter_image_url') ?? 'Or Enter Image URL'}
                          </label>
                          <input
                            type="url"
                            value={formData.featured_image && !formData.featured_image.startsWith('blob:') ? formData.featured_image : ''}
                            onChange={(e) => {
                              const newUrl = e.target.value;
                              setFormData({...formData, featured_image: newUrl});
                              // Only set imagePreview if it's not a blob URL
                              if (!newUrl.startsWith('blob:')) {
                                setImagePreview(newUrl);
                              }
                            }}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Editor Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <h2 className="text-xl font-semibold text-[#0B4422] mb-4">{t('blog_create.form.content') ?? 'Content'}</h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('blog_create.form.blog_content') ?? 'Blog Content *'}
                      </label>
                      <div className="border border-gray-300 rounded-md">
                        {/* <ReactQuill
                          value={formData.content}
                          onChange={(value) => setFormData({...formData, content: value})}
                          modules={quillModules}
                          formats={quillFormats}
                          placeholder="Write your blog post content here..."
                          className="min-h-[300px]"
                        /> */}
                        <textarea
                          value={formData.content}
                          onChange={(e) => setFormData({...formData, content: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder={t('blog_create.form.content_placeholder') ?? 'Write your blog post content here...'}
                          rows={15}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {t('blog_create.form.cancel') ?? 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-[#0B4422] text-white rounded-lg hover:bg-[#0B4422]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (t('blog_create.form.saving') ?? 'Saving...') : (isEdit ? (t('blog_create.form.update_post') ?? 'Update Post') : (t('blog_create.form.submit_post') ?? 'Submit Post'))}
                    </button>
                  </div>
                </form>

                {message && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {message}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Preview */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-[#1A3D2D] mb-4 flex items-center gap-2">
                  <Eye size={20} className="text-emerald-600" />
                  {t('blog_create.preview.article_preview') ?? 'Article Preview'}
                </h2>

                {/* Blog Card Preview */}
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-6">
                  {/* Featured Image */}
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
                      <span className="text-gray-400 text-sm">{t('blog_create.preview.no_image') ?? 'No featured image'}</span>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-4">
                    {/* Category Badge */}
                    {formData.category && (
                      <div className="mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0B4422]/10 text-[#0B4422] border border-[#0B4422]/20">
                          {formData.category}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                      {formData.title || (t('blog_create.preview.title_placeholder') ?? 'Your Blog Title Will Appear Here')}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-600 text-sm line-clamp-3 mb-3 min-h-[4rem]">
                      {formData.excerpt || (t('blog_create.preview.excerpt_placeholder') ?? 'Your blog excerpt will appear here. Make it compelling to attract readers!')}
                    </p>

                    {/* Tags */}
                    {formData.tags && formData.tags.trim() && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {formData.tags.split(',').map((tag, index) => (
                          tag.trim() && (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs border border-gray-200"
                            >
                              #{tag.trim()}
                            </span>
                          )
                        ))}
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formData.read_time || '5'} {t('blog_create.preview.min_read') ?? 'min read'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          0 {t('blog_create.preview.views') ?? 'views'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart size={12} />
                        0 {t('blog_create.preview.likes') ?? 'likes'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Article Preview */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-[#0B4422] mb-3">{t('blog_create.preview.article_preview') ?? 'Article Preview'}</h3>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {/* Article Header */}
                    <div className="mb-4">
                      <h1 className="text-xl font-bold text-gray-900 mb-2">
                        {formData.title || (t('blog_create.preview.title_placeholder') ?? 'Your Blog Title')}
                      </h1>
                      
                      {/* Featured Image */}
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
                      
                      {/* Article Meta */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span>{t('blog_create.preview.by') ?? 'By'} {formData.author || (t('blog_create.preview.author_placeholder') ?? 'Author Name')}</span>
                        <span>•</span>
                        <span>{formData.read_time || '5'} {t('blog_create.preview.min_read') ?? 'min read'}</span>
                        <span>•</span>
                        <span>{formData.category || (t('blog_create.preview.category_placeholder') ?? 'Category')}</span>
                      </div>
                      
                      {/* Excerpt */}
                      {formData.excerpt && (
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {formData.excerpt}
                        </p>
                      )}
                    </div>
                    
                    {/* Article Content Preview */}
                    <div className="prose prose-sm max-w-none">
                      <div 
                        className="text-gray-700 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: formData.content || `<p>${t('blog_create.preview.content_placeholder') ?? 'Your article content will appear here...'}</p>` 
                        }}
                      />
                    </div>
                  </div>

                  {/* SEO Indicators */}
                  <div className="space-y-3 mt-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{t('blog_create.preview.title_length') ?? 'Title Length'}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        (formData.title?.length || 0) > 60 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {(formData.title?.length || 0)}/60
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{t('blog_create.preview.excerpt_length') ?? 'Excerpt Length'}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        (formData.excerpt?.length || 0) > 160 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {(formData.excerpt?.length || 0)}/160
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{t('blog_create.preview.content_length') ?? 'Content Length'}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        (() => {
                          const stripped = (formData.content || '').replace(/<[^>]+>/g, '');
                          const length = stripped.length;
                          return length >= 2000 
                            ? 'bg-green-100 text-green-700' 
                            : length >= 1500
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700';
                        })()
                      }`}>
                        {(() => {
                          const stripped = (formData.content || '').replace(/<[^>]+>/g, '');
                          return `${stripped.length} / 2000 ${t('blog_create.preview.chars') ?? 'chars'}`;
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Writing Tips */}
                  <div className="mt-6 p-4 bg-[#1A3D2D]/5 rounded-lg border border-[#1A3D2D]/20">
                    <h4 className="text-sm font-medium text-[#1A3D2D] mb-2 flex items-center gap-1">
                      <PenLine size={14} /> {t('blog_create.preview.writing_tips') ?? 'Writing Tips'}
                    </h4>
                    <ul className="text-xs text-[#0B4422]/80 space-y-1">
                      <li>• {t('blog_create.preview.tip_title') ?? 'Keep title under 60 characters'}</li>
                      <li>• {t('blog_create.preview.tip_excerpt') ?? 'Write compelling excerpt (160 chars)'}</li>
                      <li>• {t('blog_create.preview.tip_content_length') ?? 'Minimum 2000 characters required (HTML stripped)'}</li>
                      <li>• {t('blog_create.preview.tip_tags') ?? 'Use relevant tags for SEO'}</li>
                      <li>• {t('blog_create.preview.tip_image') ?? 'Add featured image for engagement'}</li>
                    </ul>
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

