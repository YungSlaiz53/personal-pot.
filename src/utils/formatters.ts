export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return isoString;
  }
}

export function formatTimeAgo(isoString: string): string {
  try {
    const now = Date.now();
    const past = new Date(isoString).getTime();
    const diff = Math.floor((now - past) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return formatDate(isoString);
  } catch {
    return isoString;
  }
}

export function getFileCategoryIconName(mimeType: string, category?: string): string {
  const mime = (mimeType || '').toLowerCase();
  const cat = (category || '').toLowerCase();

  if (mime.includes('image') || cat.includes('design')) return 'Image';
  if (mime.includes('video') || cat.includes('video')) return 'Video';
  if (mime.includes('pdf')) return 'FileText';
  if (mime.includes('markdown') || mime.includes('text') || cat.includes('doc')) return 'FileText';
  if (mime.includes('json') || mime.includes('javascript') || mime.includes('typescript') || cat.includes('web')) return 'Code';
  if (mime.includes('zip') || mime.includes('archive') || mime.includes('tar')) return 'Archive';
  if (cat.includes('certificate')) return 'Award';
  if (cat.includes('resume') || cat.includes('cv')) return 'UserCheck';
  if (cat.includes('link')) return 'ExternalLink';
  return 'File';
}

export function getCategoryBadgeColor(category: string): { bg: string; text: string; border: string } {
  switch (category) {
    case 'CV and Resume':
      return { bg: 'bg-[#FF003C]/15', text: 'text-[#FF4D6D]', border: 'border-[#FF003C]/40' };
    case 'Web Development':
      return { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/40' };
    case 'Graphic Design':
      return { bg: 'bg-[#FF1E46]/15', text: 'text-[#FF4D6D]', border: 'border-[#FF1E46]/40' };
    case 'Certificates':
      return { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/40' };
    case 'Video Projects':
      return { bg: 'bg-[#FF003C]/20', text: 'text-[#FF2A4D]', border: 'border-[#FF003C]/45' };
    case 'Social Media Marketing':
      return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/40' };
    case 'Personal Projects':
      return { bg: 'bg-[#FF003C]/15', text: 'text-[#FF4D6D]', border: 'border-[#FF003C]/40' };
    case 'Resources and Links':
      return { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/40' };
    case 'Documents':
      return { bg: 'bg-slate-500/15', text: 'text-slate-200', border: 'border-slate-500/40' };
    default:
      return { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30' };
  }
}
