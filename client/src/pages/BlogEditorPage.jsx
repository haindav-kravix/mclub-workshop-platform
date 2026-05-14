import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_ORIGIN, blogAPI } from '../utils/api';
import { ErrorMessage, SuccessMessage } from '../components/UI';
import { MarkdownPreview } from '../utils/markdownParser';
import {
  FiArrowLeft,
  FiCode,
  FiEdit3,
  FiEye,
  FiFileText,
  FiImage,
  FiList,
  FiSave,
  FiSend,
  FiType,
  FiUpload,
  FiX
} from 'react-icons/fi';

const emptyPost = {
  title: '',
  body: '',
  tags: '',
  coverImage: ''
};

const formatTags = (tags = '') => tags.split(',').map(tag => tag.trim()).filter(Boolean);

export const BlogEditorPage = () => {
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [postForm, setPostForm] = useState(emptyPost);
  const [editorTab, setEditorTab] = useState('write');
  const [imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const primaryButtonClass = 'inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-slate-950 rounded-lg font-bold hover:bg-primary/80 transition disabled:opacity-50 disabled:cursor-not-allowed';
  const secondaryButtonClass = 'inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-slate-800 rounded-lg font-bold hover:bg-white/50 transition disabled:opacity-50 disabled:cursor-not-allowed';
  const iconButtonClass = 'inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white/70 px-3 text-sm font-bold text-slate-800 transition hover:border-primary hover:bg-primary/10';

  const handleCoverImageUpload = async (file) => {
    if (!file) return;
    const data = new FormData();
    data.append('image', file);
    setImageUploading(true);
    try {
      const response = await blogAPI.uploadImage(data);
      setPostForm(prev => ({ ...prev, coverImage: response.data.imageUrl }));
      setSuccess('Cover image uploaded');
    } catch (err) {
      setError('Failed to upload cover image');
    } finally {
      setImageUploading(false);
    }
  };

  const handleCreatePost = async (status) => {
    if (!postForm.title || !postForm.body) {
      setError('Title and content are required');
      return;
    }

    setLoading(true);
    try {
      await blogAPI.createPost({
        ...postForm,
        status,
        tags: formatTags(postForm.tags)
      });
      setSuccess(status === 'published' ? 'Blog published successfully!' : 'Draft saved successfully!');
      setTimeout(() => {
        navigate('/blogs');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save blog');
    } finally {
      setLoading(false);
    }
  };

  const insertFormatting = (before, after) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = postForm.body.substring(start, end);
    const beforeText = postForm.body.substring(0, start);
    const afterText = postForm.body.substring(end);

    const newText = beforeText + before + selectedText + after + afterText;
    setPostForm(prev => ({ ...prev, body: newText }));

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selectedText.length;
    }, 0);
  };

  return (
    <div className="min-h-screen app-shell">
      {/* Header */}
      <div className="z-10 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/blogs')} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white/70 text-slate-800 transition hover:bg-primary/10" aria-label="Back to blogs">
              <FiArrowLeft size={24} />
            </button>
            <span className="font-black text-slate-950">Create Blog Post</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditorTab('write')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition ${
                editorTab === 'write'
                  ? 'bg-primary text-slate-950'
                  : 'border border-slate-300 bg-white/70 text-slate-700 hover:bg-primary/10'
              }`}
            >
              <FiEdit3 />
              Write
            </button>
            <button
              onClick={() => setEditorTab('preview')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition ${
                editorTab === 'preview'
                  ? 'bg-primary text-slate-950'
                  : 'border border-slate-300 bg-white/70 text-slate-700 hover:bg-primary/10'
              }`}
            >
              <FiEye /> Preview
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        {editorTab === 'write' ? (
          <div className="panel rounded-2xl p-8">
            {/* Cover Image */}
            <div className="mb-8">
              {postForm.coverImage ? (
                <div className="relative">
                  <img
                    src={postForm.coverImage.startsWith('/uploads') ? `${API_ORIGIN}${postForm.coverImage}` : postForm.coverImage}
                    alt="Cover preview"
                    className="w-full max-h-96 object-cover rounded-lg mb-4"
                  />
                  <button
                    type="button"
                    onClick={() => setPostForm(prev => ({ ...prev, coverImage: '' }))}
                    className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/90 text-slate-900 shadow-sm transition hover:bg-rose-50 hover:text-rose-700"
                    aria-label="Remove cover image"
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-slate-300 p-12 text-center text-slate-500 mb-4">
                  <FiImage className="mx-auto mb-3 text-3xl text-primary" />
                  <p className="text-lg font-bold mb-2">Upload a cover image</p>
                  <p className="text-sm">This will be displayed at the top of your blog</p>
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white/70 px-5 py-3 font-bold text-slate-800 transition hover:border-primary hover:bg-primary/10">
                <FiUpload />
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCoverImageUpload(e.target.files?.[0])}
                  className="hidden"
                />
              </label>
              {imageUploading && <p className="text-sm text-green-600 mt-2 font-semibold">Uploading image...</p>}
            </div>

            {/* Title */}
            <input
              value={postForm.title}
              onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter your blog title here..."
              className="w-full text-4xl sm:text-5xl font-black border-none focus:outline-none placeholder:text-slate-400 mb-6"
            />

            {/* Tags */}
            <input
              value={postForm.tags}
              onChange={(e) => setPostForm(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Add tags (comma separated) e.g: mongodb, web, tutorial"
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus-ring mb-6 font-semibold"
            />

            {/* Formatting Toolbar */}
            <div className="rounded-lg border border-slate-200 bg-white/70 p-4 mb-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                <FiFileText className="text-primary" />
                Quick formatting
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  className={iconButtonClass}
                  title="Make text bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('_', '_')}
                  className={iconButtonClass}
                  title="Make text italic"
                >
                  <em>I</em>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('# ', '\n')}
                  className={iconButtonClass}
                  title="Add H1 heading"
                >
                  <FiType />
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('## ', '\n')}
                  className={iconButtonClass}
                  title="Add H2 heading"
                >
                  <FiType />
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('```\n', '\n```')}
                  className={iconButtonClass}
                  title="Insert code block"
                >
                  <FiCode />
                  Block
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('`', '`')}
                  className={iconButtonClass}
                  title="Inline code"
                >
                  <FiCode />
                  code
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('- ', '\n')}
                  className={iconButtonClass}
                  title="Add bullet point"
                >
                  <FiList />
                  List
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('> ', '\n')}
                  className={iconButtonClass}
                  title="Add quote"
                >
                  Quote
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-3">Select text and choose a format to apply it.</p>
            </div>

            {/* Editor */}
            <textarea
              ref={editorRef}
              rows="24"
              value={postForm.body}
              onChange={(e) => setPostForm(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Write your blog content here...

Use the format buttons above to style your text. Markdown is supported:
- **bold text** for emphasis
- _italic text_ for italics
- # Heading 1, ## Heading 2, etc.
- Use ```code``` for code blocks
- Use - for bullet points
- Use > for quotes"
              className="w-full px-5 py-4 border-2 border-slate-300 rounded-xl focus-ring text-base leading-8 font-mono resize-none"
            />

            {/* Character Count */}
            <p className="text-sm text-slate-600 mt-3">{postForm.body.length} characters</p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => handleCreatePost('published')}
                disabled={loading}
                className={`flex-1 ${primaryButtonClass}`}
              >
                <FiSend />
                {loading ? 'Publishing...' : 'Publish'}
              </button>
              <button
                onClick={() => handleCreatePost('draft')}
                disabled={loading}
                className={`flex-1 ${secondaryButtonClass}`}
              >
                <FiSave />
                {loading ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={() => navigate('/blogs')}
                className={`flex-1 ${secondaryButtonClass}`}
              >
                <FiX />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <article className="panel rounded-2xl overflow-hidden p-8">
            {postForm.coverImage && (
              <img
                src={postForm.coverImage.startsWith('/uploads') ? `${API_ORIGIN}${postForm.coverImage}` : postForm.coverImage}
                alt={postForm.title}
                className="w-full max-h-96 object-cover rounded-lg mb-6"
              />
            )}
            <div>
              <h1 className="text-4xl sm:text-5xl font-black mb-4">{postForm.title || 'Your post title will appear here'}</h1>
              <div className="flex flex-wrap gap-2 mb-6">
                {formatTags(postForm.tags).map(tag => (
                  <span key={tag} className="text-green-600 font-bold">#{tag}</span>
                ))}
              </div>
              <div className="prose prose-sm max-w-none text-slate-800">
                <MarkdownPreview content={postForm.body || 'Your content will appear here as you write...'} />
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
};
