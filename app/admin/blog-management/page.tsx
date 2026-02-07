'use client';

import { AdminService } from '@/lib/admin-service';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
// import BlogTranslationModal from '@/components/admin/BlogTranslationModal';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  category: string;
  author: string;
  author_email: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  admin_notes: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  read_time: string;
  is_featured: boolean; // Use is_featured instead of featured
  publish_date?: string; // Use publish_date instead of published_at
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
}

const SUPPORTED_LANGUAGES = [
  { code: 'hi', label: '🇮🇳 हिंदी', name: 'Hindi' },
  { code: 'bn', label: '🇧🇩 বাংলা', name: 'Bengali' },
  { code: 'ar', label: '🇸🇦 العربية', name: 'Arabic' },
  { code: 'ta', label: '🇮🇳 தமிழ்', name: 'Tamil' },
  { code: 'zh', label: '🇨🇳 中文', name: 'Chinese' },
  { code: 'ja', label: '🇯🇵 日本語', name: 'Japanese' },
  { code: 'ru', label: '🇷🇺 Русский', name: 'Russian' },
  { code: 'es', label: '🇪🇸 Español', name: 'Spanish' },
  { code: 'de', label: '🇩🇪 Deutsch', name: 'German' },
  { code: 'fr', label: '🇫🇷 Français', name: 'French' },
  { code: 'pt', label: '🇵🇹 Português', name: 'Portuguese' }
];

const TRANSLATABLE_FIELDS = [
  { key: 'title', label: 'Title', type: 'text', maxLength: 500 },
  { key: 'content', label: 'Content', type: 'textarea', maxLength: 12000 },
  { key: 'excerpt', label: 'Excerpt', type: 'textarea', maxLength: 1000 },
  { key: 'category', label: 'Category', type: 'text', maxLength: 255 },
  { key: 'author', label: 'Author', type: 'text', maxLength: 255 },
  { key: 'seo_title', label: 'SEO Title', type: 'text', maxLength: 500 },
  { key: 'seo_description', label: 'SEO Description', type: 'textarea', maxLength: 2000 },
  { key: 'seo_keywords', label: 'SEO Keywords', type: 'text', maxLength: 1000 }
];

export default function BlogManagementPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'published'>('all');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | 'publish'>('approve');
  const [processing, setProcessing] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  
  // Translation modal state
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [selectedPostForTranslation, setSelectedPostForTranslation] = useState<BlogPost | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);
  const [isSavingTranslation, setIsSavingTranslation] = useState(false);
  const [translationError, setTranslationError] = useState<string>('');
  const [translationSuccess, setTranslationSuccess] = useState<string>('');
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    console.log('🔄 useEffect triggered with selectedStatus:', selectedStatus);
    fetchPosts();
  }, [selectedStatus]);

  // Load translation data when language changes
  useEffect(() => {
    if (selectedLanguage && selectedPostForTranslation) {
      loadTranslationData(selectedPostForTranslation.id, selectedLanguage);
    }
  }, [selectedLanguage, selectedPostForTranslation]);

  // Add debugging when component mounts
  useEffect(() => {
    console.log('🚀 BlogManagementPage component mounted');
    console.log('🔍 Initial selectedStatus:', selectedStatus);
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Check admin access
      const adminCheck = await AdminService.checkAdminAccess(session.user.id);
      if (!adminCheck.isAdmin) {
        throw new Error('Admin access required');
      }

      console.log('🔍 Fetching posts with status filter:', selectedStatus);
      
      let query = (supabase as any).from('blog_posts').select('*').order('created_at', { ascending: false });
      if (selectedStatus !== 'all') query = query.eq('status', selectedStatus);
      
      console.log('🔍 Query:', query);
      
      const { data, error } = await query;
      if (error) throw error;

      console.log('🔍 Raw data from Supabase:', data);
      console.log('🔍 Number of posts fetched:', data?.length || 0);
      console.log('🔍 Posts:', data);

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setMessage(`Error loading posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedPost) return;

    try {
      setProcessing(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error('Not authenticated');

      let updateData: any = {
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      };

      switch (action) {
        case 'approve':
          updateData.status = 'approved';
          updateData.approval_date = new Date().toISOString();
          break;
        case 'reject':
          updateData.status = 'rejected';
          break;
        case 'publish':
          updateData.status = 'published';
          updateData.publish_date = new Date().toISOString(); // Use publish_date instead of published_at
          break;

      }

      console.log('Updating blog post with data:', updateData);
      
      const { error } = await (supabase as any)
        .from('blog_posts')
        .update(updateData)
        .eq('id', selectedPost.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(`Database update failed: ${error.message}`);
      }

      // Refresh posts
      await fetchPosts();
      setShowModal(false);
      setSelectedPost(null);
      setAdminNotes('');
      const actionText = action === 'publish' ? 'published' : 
                        action === 'approve' ? 'approved' : 
                        action === 'reject' ? 'rejected' : 'updated';
      setMessage(`✅ Post ${actionText} successfully!`);
    } catch (error) {
      console.error('Error updating post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update post';
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditPost = (post: BlogPost) => {
    // Redirect to blog creation form with edit mode
    router.push(`/admin/blog-management/edit/${post.id}`);
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        setProcessing(true);
        
        // First check if user is admin
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }

        const adminCheck = await AdminService.checkAdminAccess(session.user.id);
        if (!adminCheck.isAdmin) {
          throw new Error('Admin access required');
        }

        // Try to delete the post
        const { error } = await (supabase as any)
          .from('blog_posts')
          .delete()
          .eq('id', postId);

        if (error) {
          console.error('Delete error:', error);
          throw new Error(`Delete failed: ${error.message}`);
        }
        
        // Refresh the posts list
        await fetchPosts();
        setMessage('Post deleted successfully!');
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
        
      } catch (error) {
        console.error('Error deleting post:', error);
        setMessage(`Error deleting post: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Clear error message after 5 seconds
        setTimeout(() => setMessage(null), 5000);
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleFeaturePost = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

              const { error } = await (supabase as any)
          .from('blog_posts')
          .update({
            is_featured: !post.is_featured,
            updated_at: new Date().toISOString()
          })
          .eq('id', postId);

      if (error) throw error;
      
      fetchPosts();
      setMessage(`Post ${post.is_featured ? 'unfeatured' : 'featured'} successfully!`);
    } catch (error) {
      console.error('Error featuring post:', error);
      setMessage('Error featuring post. Please try again.');
    }
  };

  const handleTranslate = (post: BlogPost) => {
    setSelectedPostForTranslation(post);
    setIsTranslationModalOpen(true);
  };

  const handleCloseTranslation = () => {
    setIsTranslationModalOpen(false);
    setSelectedPostForTranslation(null);
    setSelectedLanguage('');
    setTranslations({});
    setTranslationError('');
    setTranslationSuccess('');
  };

  const loadTranslationData = async (postId: string, language: string) => {
    setIsLoadingTranslation(true);
    setTranslationError('');
    
    try {
      const response = await fetch(`/api/admin/blog/translate-chunked?postId=${postId}&language=${language}`);
      const result = await response.json();
      
      if (result.success) {
        const existingTranslations = result.data.translations || {};
        setTranslations(existingTranslations);
        
        // Auto-select fields that have existing translations or are empty
        const fieldSelection: Record<string, boolean> = {};
        TRANSLATABLE_FIELDS.forEach(field => {
          if (language === 'all') {
            // For "all" languages, select all fields by default since we're translating to all languages
            fieldSelection[field.key] = true;
          } else {
            // For specific language, select if field has translation or if it's empty (needs translation)
            const hasTranslation = existingTranslations[field.key] && existingTranslations[field.key].trim() !== '';
            const isOriginalEmpty = !selectedPostForTranslation?.[field.key as keyof BlogPost] || 
                                   selectedPostForTranslation[field.key as keyof BlogPost] === '';
            
            fieldSelection[field.key] = hasTranslation || isOriginalEmpty;
          }
        });
        setSelectedFields(fieldSelection);
      } else {
        setTranslationError(result.error || 'Failed to load translation data');
      }
    } catch (err) {
      setTranslationError('Network error while loading translation data');
    } finally {
      setIsLoadingTranslation(false);
    }
  };

  const handleSaveTranslation = async () => {
    if (!selectedPostForTranslation || !selectedLanguage) return;
    
    // Filter translations to only include selected fields
    const selectedFieldsList = Object.keys(selectedFields).filter(field => selectedFields[field]);
    if (selectedFieldsList.length === 0) {
      setTranslationError('Please select at least one field to translate');
      return;
    }
    
    const filteredTranslations = selectedFieldsList.reduce((acc, field) => {
      if (translations[field]) {
        acc[field] = translations[field];
      }
      return acc;
    }, {} as Record<string, string>);
    
    setIsSavingTranslation(true);
    setTranslationError('');
    setTranslationSuccess('');
    
    try {
      console.log('Saving translations:', {
        selectedLanguage,
        selectedFieldsList,
        filteredTranslations,
        postId: selectedPostForTranslation.id
      });

      if (selectedLanguage === 'all') {
        // Save to all languages in a single API call
        const response = await fetch('/api/admin/blog/translate-chunked', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: selectedPostForTranslation.id,
            language: 'all',
            translations: filteredTranslations
          })
        });
        
        const result = await response.json();
        console.log('Save result for all languages:', result);
        if (result.success) {
          setTranslationSuccess(`Selected fields saved to all 11 languages successfully! (${selectedFieldsList.length} fields)`);
        } else {
          setTranslationError(result.error || 'Failed to save translations');
        }
      } else {
        // Save to single language
        const response = await fetch('/api/admin/blog/translate-chunked', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: selectedPostForTranslation.id,
            language: selectedLanguage,
            translations: filteredTranslations
          })
        });
        
        const result = await response.json();
        console.log('Save result for single language:', result);
        
        if (result.success) {
          setTranslationSuccess(`Selected fields saved for ${result.data.languageLabel} successfully! (${selectedFieldsList.length} fields)`);
        } else {
          setTranslationError(result.error || 'Failed to save translations');
        }
      }
    } catch (err) {
      setTranslationError('Network error while saving translations');
    } finally {
      setIsSavingTranslation(false);
    }
  };

  const handleClearTranslation = async () => {
    if (!selectedPostForTranslation || !selectedLanguage) return;
    
    if (!confirm(`Are you sure you want to clear all translations for ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}?`)) {
      return;
    }
    
    setIsSavingTranslation(true);
    setTranslationError('');
    
    try {
      const response = await fetch(`/api/admin/blog/translate-chunked?postId=${selectedPostForTranslation.id}&language=${selectedLanguage}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTranslationSuccess(`Translations for ${result.data.languageLabel} cleared successfully!`);
        setTranslations({});
      } else {
        setTranslationError(result.error || 'Failed to clear translations');
      }
    } catch (err) {
      setTranslationError('Network error while clearing translations');
    } finally {
      setIsSavingTranslation(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setTranslations(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFieldSelection = (field: string, selected: boolean) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: selected
    }));
  };

  const handleSelectAllFields = () => {
    const allSelected = TRANSLATABLE_FIELDS.reduce((acc, field) => {
      acc[field.key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setSelectedFields(allSelected);
  };

  const handleDeselectAllFields = () => {
    setSelectedFields({});
  };

  // Auto-translate using server-side API (bypasses CSP issues)
  const translateText = async (text: string, targetLang: string): Promise<string> => {
    if (!text || text.trim() === '') return '';
    
    try {
      console.log(`Translating to ${targetLang}:`, text.substring(0, 100) + '...');
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          targetLang: targetLang
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Translation API result:', result);
        
        if (result.success && result.translatedText && result.translatedText !== text) {
          console.log(`Translation success (${result.source}):`, result.translatedText.substring(0, 100) + '...');
          return result.translatedText;
        } else {
          console.log('Translation failed, using original text');
          return text;
        }
      } else {
        console.error('Translation API error:', response.status, response.statusText);
        return text;
      }
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
  };

  const handleAutoTranslate = async () => {
    if (!selectedLanguage || selectedLanguage === 'all') return;
    
    setIsTranslating(true);
    setTranslationError('');
    setTranslationSuccess('');
    
    try {
      const selectedFieldsList = Object.keys(selectedFields).filter(field => selectedFields[field]);
      const newTranslations = { ...translations };
      let successCount = 0;
      let errorCount = 0;
      
      for (const field of selectedFieldsList) {
        const originalText = selectedPostForTranslation?.[field as keyof BlogPost];
        if (originalText && typeof originalText === 'string' && originalText.trim() !== '') {
          const translatedText = await translateText(originalText, selectedLanguage);
          
          // Check if translation actually changed the text
          if (translatedText !== originalText) {
            newTranslations[field] = translatedText;
            successCount++;
          } else {
            errorCount++;
            console.warn(`Translation failed for field ${field}, using original text`);
          }
        }
      }
      
      setTranslations(newTranslations);
      
      if (successCount > 0) {
        setTranslationSuccess(`Auto-translated ${successCount} fields successfully!`);
      }
      if (errorCount > 0) {
        setTranslationError(`Translation failed for ${errorCount} fields. Check console for details.`);
      }
    } catch (error) {
      console.error('Auto-translation error:', error);
      setTranslationError('Auto-translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAutoTranslateAll = async () => {
    if (selectedLanguage === 'all') {
      // For all languages, we need to translate each field to each language
      // But the API expects { field: value } format and applies to all languages
      // So we'll translate each field to each language and save them individually
      setIsTranslating(true);
      setTranslationError('');
      
      try {
        const selectedFieldsList = Object.keys(selectedFields).filter(field => selectedFields[field]);
        let successCount = 0;
        let errorCount = 0;
        
        // Translate each field to each language and save immediately
        for (const field of selectedFieldsList) {
          const originalText = selectedPostForTranslation?.[field as keyof BlogPost];
          if (originalText && typeof originalText === 'string' && originalText.trim() !== '') {
            
            // Translate to each language individually
            for (const lang of SUPPORTED_LANGUAGES) {
              try {
                const translatedText = await translateText(originalText, lang.code);
                
                // Check if translation actually changed the text
                if (translatedText !== originalText) {
                  // Save this translation immediately to the database
                  const response = await fetch('/api/admin/blog/translate-chunked', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      postId: selectedPostForTranslation.id,
                      language: lang.code,
                      translations: { [field]: translatedText }
                    })
                  });
                  
                  const result = await response.json();
                  if (result.success) {
                    successCount++;
                  } else {
                    errorCount++;
                    console.error(`Failed to save translation for ${field} to ${lang.code}:`, result.error);
                  }
                } else {
                  errorCount++;
                  console.warn(`Translation failed for field ${field} to ${lang.code}, using original text`);
                }
              } catch (error) {
                errorCount++;
                console.error(`Translation error for ${field} to ${lang.code}:`, error);
              }
            }
          }
        }
        
        if (successCount > 0) {
          setTranslationSuccess(`Auto-translated and saved ${successCount} fields across all ${SUPPORTED_LANGUAGES.length} languages!`);
          // Reload the translation data to show the new translations
          await loadTranslationData(selectedPost?.id || '', 'en');
        }
        if (errorCount > 0) {
          setTranslationError(`Translation failed for ${errorCount} fields. Check console for details.`);
        }
      } catch (error) {
        setTranslationError('Auto-translation failed. Please try again.');
      } finally {
        setIsTranslating(false);
      }
    } else {
      await handleAutoTranslate();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading blog posts...</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0B4422] mb-4">Blog Management</h1>
            <p className="text-gray-600">Review and manage blog submissions</p>
            
            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href="/admin"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
              >
                🏠 Back to Admin Dashboard
              </a>
              <a
                href="/admin/blog-audit"
                className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
              >
                🔍 Blog SEO Audit
              </a>
            </div>
          </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Posts</h3>
            <p className="text-3xl font-bold text-[#0B4422]">{posts.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {posts.filter(p => p.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Published</h3>
            <p className="text-3xl font-bold text-green-600">
              {posts.filter(p => p.status === 'published').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Featured Posts</h3>
            <p className="text-3xl font-bold text-blue-600">
              {posts.filter(p => p.is_featured).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex flex-wrap gap-4">
                             {(['all', 'pending', 'approved', 'rejected', 'published'] as const).map(status => (
                   <button
                     key={status}
                     onClick={() => setSelectedStatus(status)}
                     className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                       selectedStatus === status
                         ? 'bg-[#0B4422] text-white'
                         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                     }`}
                   >
                     {status.charAt(0).toUpperCase() + status.slice(1)}
                      {status !== 'all' && (
                       <span className="ml-2 bg-white text-[#0B4422] px-2 py-1 rounded-full text-xs">
                          {posts.filter(p => p.status === status).length}
                       </span>
                     )}
                   </button>
                 ))}
          </div>
        </div>

        {/* Posts List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{post.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {post.is_featured && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{post.author}</div>
                      <div className="text-sm text-gray-500">{post.author_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>👁️ {post.views_count || 0} views</div>
                        <div>❤️ {post.likes_count || 0} likes</div>
                        <div>💬 {post.comments_count || 0} comments</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {/* View Button */}
                        <button
                          onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          title="View published post"
                        >
                          👁️ View
                        </button>

                        {/* Edit Button - Now redirects to creation form */}
                        <button
                          onClick={() => handleEditPost(post)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          title="Edit post content"
                        >
                          ✏️ Edit
                        </button>

                        {/* Delete Button with Loading State */}
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          disabled={processing}
                          className={`text-red-600 hover:text-red-900 text-sm font-medium ${
                            processing ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Delete post permanently"
                        >
                          {processing ? '🗑️ Deleting...' : '🗑️ Delete'}
                        </button>

                        {/* Existing Approve Button */}
                        <button
                          onClick={() => {
                            setSelectedPost(post);
                            setAction('approve');
                            setShowModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 text-sm font-medium"
                        >
                          Approve
                        </button>

                        {/* Existing Reject Button */}
                        <button
                          onClick={() => {
                            setSelectedPost(post);
                            setAction('reject');
                            setShowModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Reject
                        </button>

                        {/* Rest of existing buttons... */}
                        {post.status === 'approved' && (
                          <button
                            onClick={() => {
                              setSelectedPost(post);
                              setAction('publish');
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            Publish
                          </button>
                        )}
                        <button
                          onClick={() => handleFeaturePost(post.id)}
                          className={`text-sm font-medium ${post.is_featured ? 'text-orange-600 hover:text-orange-900' : 'text-purple-600 hover:text-purple-900'}`}
                        >
                          {post.is_featured ? 'Unfeature' : 'Feature'}
                        </button>

                        {/* Translate Button */}
                        <button
                          onClick={() => handleTranslate(post)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          title="Translate to other languages"
                        >
                          🌐 Translate
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Modal */}
        {showModal && selectedPost && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {action.charAt(0).toUpperCase() + action.slice(1)} Post
                </h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Title:</strong> {selectedPost.title}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Author:</strong> {selectedPost.author}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B4422]"
                    rows={3}
                    placeholder="Add notes about this action..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedPost(null);
                      setAdminNotes('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={processing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAction}
                    disabled={processing}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                      action === 'reject' 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : action === 'publish'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-green-600 hover:bg-green-700'
                    } disabled:opacity-50`}
                  >
                    {processing ? 'Processing...' : action.charAt(0).toUpperCase() + action.slice(1)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {message && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
            {message}
          </div>
        )}

        {/* Translation Modal - Full Interface */}
        {isTranslationModalOpen && selectedPostForTranslation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full h-[95vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Translate Blog Post</h2>
                  <p className="text-gray-600 mt-1">{selectedPostForTranslation.title}</p>
                </div>
                <button
                  onClick={handleCloseTranslation}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Main Content - Side by Side Layout */}
              <div className="flex-1 flex min-h-0">
                {/* Left Side - Language Selection */}
                <div className="w-80 border-r border-gray-200 flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Select Language</h3>
                    <button
                      onClick={() => setSelectedLanguage('all')}
                      className={`w-full p-3 rounded-lg text-left transition-colors mb-3 ${
                        selectedLanguage === 'all'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="font-medium">🌍 Translate All Languages</div>
                      <div className="text-sm opacity-80">Save to all 11 languages</div>
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => setSelectedLanguage(lang.code)}
                          className={`w-full p-3 rounded-lg border text-left transition-colors ${
                            selectedLanguage === lang.code
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">{lang.label}</div>
                          <div className="text-sm text-gray-500">{lang.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side - Translation Form */}
                <div className="flex-1 flex flex-col min-h-0">
                  {selectedLanguage && selectedLanguage !== 'all' && (
                    <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: '500px' }}>
                      {isLoadingTranslation ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          <span className="ml-2 text-gray-600">Loading translation data...</span>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                              Translating to: {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}
                            </h3>
                            <p className="text-sm text-gray-500">Select fields to translate and fill in the translations below</p>
                          </div>

                          {/* Translation Progress Summary */}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                            <h4 className="font-medium text-gray-800 mb-3">Translation Status</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {TRANSLATABLE_FIELDS.filter(field => translations[field.key] && translations[field.key].trim() !== '').length}
                                </div>
                                <div className="text-gray-600">Translated</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">
                                  {TRANSLATABLE_FIELDS.filter(field => !translations[field.key] || translations[field.key].trim() === '').length}
                                </div>
                                <div className="text-gray-600">Missing</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                  {Object.keys(selectedFields).filter(field => selectedFields[field]).length}
                                </div>
                                <div className="text-gray-600">Selected</div>
                              </div>
                            </div>
                          </div>

                          {/* Field Selection Controls */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-blue-800">Select Fields to Translate</h4>
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleSelectAllFields}
                                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Select All
                                </button>
                                <button
                                  onClick={handleDeselectAllFields}
                                  className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                  Deselect All
                                </button>
                                <button
                                  onClick={handleAutoTranslateAll}
                                  disabled={isTranslating || Object.keys(selectedFields).filter(field => selectedFields[field]).length === 0}
                                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                  {isTranslating ? 'Translating...' : '🤖 Auto Translate'}
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {TRANSLATABLE_FIELDS.map((field) => {
                                const hasTranslation = translations[field.key] && translations[field.key].trim() !== '';
                                const isSelected = selectedFields[field.key] || false;
                                
                                return (
                                  <label key={field.key} className={`flex items-center justify-between p-2 rounded-lg border ${
                                    hasTranslation 
                                      ? 'bg-green-50 border-green-200' 
                                      : isSelected 
                                        ? 'bg-blue-50 border-blue-200' 
                                        : 'bg-gray-50 border-gray-200'
                                  }`}>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => handleFieldSelection(field.key, e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className={`text-sm font-medium ${
                                        hasTranslation ? 'text-green-800' : 'text-gray-700'
                                      }`}>
                                        {field.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {hasTranslation ? (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                          ✓ Translated
                                        </span>
                                      ) : (
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                          ⚠ Missing
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-500">
                                        {translations[field.key]?.length || 0}/{field.maxLength}
                                      </span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                          
                          {TRANSLATABLE_FIELDS.filter(field => selectedFields[field.key]).map((field) => (
                            <div key={field.key} className="bg-white border border-gray-200 rounded-lg p-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {field.label}
                                <span className="text-gray-500 ml-2">
                                  ({translations[field.key]?.length || 0}/{field.maxLength} characters)
                                </span>
                              </label>
                              
                              {/* Original text for reference */}
                              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                                <div className="text-xs text-gray-500 mb-1">Original (English):</div>
                                <div className="text-sm text-gray-700">
                                  {selectedPostForTranslation[field.key as keyof BlogPost] || 'N/A'}
                                </div>
                              </div>
                              
                              {/* Translation input with clear button */}
                              <div className="relative">
                                {field.type === 'textarea' ? (
                                  <textarea
                                    value={translations[field.key] || ''}
                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                    placeholder={`Enter ${field.label.toLowerCase()} in ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || selectedLanguage}...`}
                                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                                    rows={field.key === 'content' ? 10 : 5}
                                    maxLength={field.maxLength}
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={translations[field.key] || ''}
                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                    placeholder={`Enter ${field.label.toLowerCase()} in ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || selectedLanguage}...`}
                                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    maxLength={field.maxLength}
                                  />
                                )}
                                {/* Clear field button */}
                                {translations[field.key] && (
                                  <button
                                    onClick={() => handleFieldChange(field.key, '')}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 text-xl"
                                    title="Clear this field"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* All Languages Selection */}
                  {selectedLanguage === 'all' && (
                    <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: '500px' }}>
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">🌍 Translate to All Languages</h3>
                        <p className="text-sm text-gray-500">Select fields and enter translations that will be saved to all 11 languages</p>
                      </div>

                      {/* Field Selection Controls for All Languages */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-blue-800">Select Fields to Translate</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSelectAllFields}
                              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Select All
                            </button>
                            <button
                              onClick={handleDeselectAllFields}
                              className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {TRANSLATABLE_FIELDS.map((field) => (
                            <label key={field.key} className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={selectedFields[field.key] || false}
                                onChange={(e) => handleFieldSelection(field.key, e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-gray-700">{field.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <h4 className="font-medium text-green-800 mb-2">Languages to be translated:</h4>
                        <div className="text-sm text-green-700">
                          Hindi, Bengali, Arabic, Tamil, Chinese, Japanese, Russian, Spanish, German, French, Portuguese
                        </div>
                      </div>

                      {/* Auto-translate button for all languages */}
                      <div className="mb-4">
                        <button
                          onClick={handleAutoTranslateAll}
                          disabled={isTranslating}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {isTranslating ? '🤖 Translating...' : '🤖 Auto Translate All Fields'}
                        </button>
                      </div>

                      <div className="space-y-4">
                        {TRANSLATABLE_FIELDS.map((field) => (
                          <div key={field.key} className="bg-white border border-gray-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {field.label}
                              <span className="text-gray-500 ml-2">
                                ({translations[field.key]?.length || 0}/{field.maxLength} characters)
                              </span>
                            </label>
                            
                            <div className="relative">
                              {field.type === 'textarea' ? (
                                <textarea
                                  value={translations[field.key] || ''}
                                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                  placeholder={`Enter ${field.label.toLowerCase()} to translate to all languages...`}
                                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                                  rows={field.key === 'content' ? 8 : 4}
                                  maxLength={field.maxLength}
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={translations[field.key] || ''}
                                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                  placeholder={`Enter ${field.label.toLowerCase()} to translate to all languages...`}
                                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  maxLength={field.maxLength}
                                />
                              )}
                              {translations[field.key] && (
                                <button
                                  onClick={() => handleFieldChange(field.key, '')}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 text-xl"
                                  title="Clear this field"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No language selected */}
                  {!selectedLanguage && (
                    <div className="flex-1 flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🌐</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Language</h3>
                        <p className="text-gray-500">Choose a language from the left panel to start translating</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              {(translationError || translationSuccess) && (
                <div className="px-6 py-3">
                  {translationError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {translationError}
                    </div>
                  )}
                  {translationSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                      {translationSuccess}
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <div className="text-sm text-gray-500">
                  {selectedLanguage && (
                    <>
                      {selectedLanguage === 'all' 
                        ? 'Ready to translate to all 11 languages' 
                        : `Ready to translate to ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || selectedLanguage}`
                      }
                    </>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCloseTranslation}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {selectedLanguage && (
                    <>
                      <button
                        onClick={handleAutoTranslateAll}
                        disabled={isTranslating || isSavingTranslation}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {isTranslating ? 'Translating...' : '🤖 Auto Translate'}
                      </button>
                      <button
                        onClick={handleClearTranslation}
                        disabled={isSavingTranslation || isTranslating}
                        className="px-4 py-2 text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={handleSaveTranslation}
                        disabled={isSavingTranslation || isTranslating}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSavingTranslation ? 'Saving...' : selectedLanguage === 'all' ? 'Save to All Languages' : 'Save Translations'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
      <Footer />
    </>
  );
} 