'use client';

import React, { isValidElement, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import { Clock, Eye, RefreshCw, ZoomIn } from 'lucide-react';
import { format } from 'date-fns';

import { Post } from '@/types';
import PostCard from '@/components/shared/PostCard';
import ShareButtons from '@/components/shared/ShareButtons';
import LikeButton from '@/components/shared/LikeButton';
import TableOfContents from '@/components/shared/TableOfContents';
import CommentSection from '@/app/posts/[slug]/CommentSection';
import MermaidRenderer from '@/components/shared/MermaidRenderer';
import LightboxModal, { LightboxMedia } from '@/components/shared/LightboxModal';

interface ArticleRendererProps {
  post: Post;
  postUrl: string;
  relatedPosts?: Post[];
  showEngagement?: boolean;
  showComments?: boolean;
  showRelatedPosts?: boolean;
}

export default function ArticleRenderer({
  post,
  postUrl,
  relatedPosts = [],
  showEngagement = true,
  showComments = true,
  showRelatedPosts = true,
}: ArticleRendererProps) {
  const publishDate = post.published_at ? new Date(post.published_at) : new Date(post.created_at);
  const imageUrl = post.cover_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80';
  const [lightboxMedia, setLightboxMedia] = useState<LightboxMedia | null>(null);

  return (
    <main className="pb-16">
      <article>
        <header className="container mx-auto px-4 py-12 md:py-20 max-w-4xl text-center">
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              {post.categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="inline-block px-3 py-1 border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-primary-500 hover:text-primary-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-primary-400 dark:hover:text-slate-50 rounded-full"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-900 dark:text-white leading-tight mb-8">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <Link href={`/author/${post.author?.slug || post.author_id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {post.author?.avatar_url ? (
                <Image
                  src={post.author.avatar_url}
                  alt={post.author.name}
                  width={32}
                  height={32}
                  className="rounded-full object-cover w-8 h-8"
                  style={{ width: '32px', height: '32px' }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                  {post.author?.name?.charAt(0) || 'A'}
                </div>
              )}
              <span className="font-medium text-slate-700 dark:text-slate-300">{post.author?.name || 'Anonymous'}</span>
            </Link>

            <div className="flex items-center gap-3">
              <time dateTime={publishDate.toISOString()}>
                <span className="sr-only">Published: </span>
                🇮🇩 {format(publishDate, 'MMMM d, yyyy')}
              </time>

              {post.updated_at && new Date(post.updated_at).getTime() - publishDate.getTime() > 24 * 60 * 60 * 1000 && (
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-medium" title="Terakhir diperbarui">
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                  <span className="sr-only">Last updated: </span>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <time dateTime={new Date(post.updated_at).toISOString()}>
                    {format(new Date(post.updated_at), 'MMM d, yyyy')}
                  </time>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{post.reading_time || 1} min read</span>
            </div>

            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{post.views || 0} views</span>
            </div>
          </div>
        </header>

        <div className="relative w-full max-w-6xl mx-auto px-4 mb-12 md:mb-20 aspect-[21/9] group cursor-zoom-in" onClick={() => setLightboxMedia({ type: 'image', src: imageUrl, alt: post.cover_image_alt || post.title })}>
          <Image
            src={imageUrl}
            alt={post.cover_image_alt || post.title}
            fill
            sizes="100vw"
            priority
            className="object-cover rounded-2xl shadow-xl transition-transform duration-300 group-hover:scale-[1.005]"
            unoptimized={imageUrl.startsWith('https://cdn.envoyou.com/')}
          />
        </div>

        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex gap-10">
            <aside className="hidden xl:block w-64 shrink-0">
              <div className="sticky top-20">
                <TableOfContents content={post.content} />
              </div>
            </aside>

            <div className="min-w-0 flex-1 max-w-4xl mx-auto">
              <div className="xl:hidden">
                <TableOfContents content={post.content} />
              </div>

              <div className="prose prose-lg dark:prose-invert prose-slate prose-headings:font-serif prose-a:text-primary-600 hover:prose-a:text-primary-500 max-w-none">
                {(post.content || '').split(/(@\[youtube\]\([^)]+\))/g).map((part, index) => {
                  const youtubeMatch = part.match(/^@\[youtube\]\(([^)]+)\)/);
                  if (youtubeMatch) {
                    const embedUrl = youtubeMatch[1];
                    return (
                      <div key={index} className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-lg my-8 border border-slate-200 dark:border-slate-800">
                        <iframe
                          src={embedUrl}
                          className="absolute inset-0 w-full h-full border-0"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    );
                  }

                  return (
                    <ReactMarkdown
                      key={index}
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSlug, rehypeHighlight]}
                      components={{
                        pre: ({ children, ...props }) => {
                          const isMermaid = isValidElement(children) && 
                            String((children.props as any)?.className || '').includes('language-mermaid');
                          
                          if (isMermaid) {
                            return <>{children}</>;
                          }
                          return <pre {...props}>{children}</pre>;
                        },
                        code: ({ className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const isMermaid = match && match[1] === 'mermaid';
                          
                          if (isMermaid) {
                            return (
                              <MermaidRenderer
                                chart={String(children).replace(/\n$/, '')}
                                onExpand={(svgContent) => setLightboxMedia({ type: 'mermaid', svgContent })}
                              />
                            );
                          }
                          
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                        table: ({ children, ...props }) => (
                          <div className="my-8 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900/90">
                            <table className="w-full text-left text-sm border-collapse min-w-[500px]" {...props}>
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children, ...props }) => (
                          <thead className="bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80" {...props}>
                            {children}
                          </thead>
                        ),
                        tbody: ({ children, ...props }) => (
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60" {...props}>
                            {children}
                          </tbody>
                        ),
                        tr: ({ children, ...props }) => (
                          <tr className="even:bg-slate-50/50 dark:even:bg-slate-800/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors" {...props}>
                            {children}
                          </tr>
                        ),
                        th: ({ children, ...props }) => (
                          <th className="px-5 py-3.5 text-left font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/80" {...props}>
                            {children}
                          </th>
                        ),
                        td: ({ children, ...props }) => (
                          <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 align-middle text-sm border-b border-slate-100 dark:border-slate-800/60" {...props}>
                            {children}
                          </td>
                        ),
                        a: ({ href, children, ...props }) => {
                          let isExternal = false;
                          if (href && href.startsWith('http')) {
                            try {
                              const url = new URL(href);
                              isExternal = url.hostname !== 'envoyou.com' && !url.hostname.endsWith('.envoyou.com');
                            } catch {
                              isExternal = false;
                            }
                          }
                          return (
                            <a
                              href={href}
                              target={isExternal ? '_blank' : undefined}
                              rel={isExternal ? 'noopener noreferrer' : undefined}
                              {...props}
                            >
                              {children}
                            </a>
                          );
                        },
                        img: ({ src, alt, ...props }) => {
                          if (!src) return null;
                          
                          let cleanAlt = alt || '';
                          let customWidth: string | undefined = undefined;
                          let captionText: string | undefined = undefined;
                          
                          if (cleanAlt.includes('|')) {
                            const parts = cleanAlt.split('|');
                            cleanAlt = parts[0].trim();
                            if (parts.length >= 2) {
                              const p1 = parts[1].trim();
                              if (/^\d+(px|%)?$/.test(p1) || p1 === '') {
                                if (p1 !== '') {
                                  customWidth = /^\d+$/.test(p1) ? `${p1}px` : p1;
                                }
                                if (parts.length >= 3) {
                                  captionText = parts.slice(2).join('|').trim();
                                }
                              } else {
                                captionText = parts.slice(1).join('|').trim();
                              }
                            }
                          }

                          const imageSrc = typeof src === 'string' ? src : '';

                          return (
                            <span className="block my-8 text-center group cursor-zoom-in">
                              <img
                                src={src}
                                alt={cleanAlt || 'Article image'}
                                style={customWidth ? { width: customWidth } : undefined}
                                onClick={() => setLightboxMedia({ type: 'image', src: imageSrc, alt: cleanAlt, caption: captionText })}
                                title="Click to zoom image"
                                className="inline-block rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 max-w-full h-auto !m-0 transition-transform duration-200 group-hover:scale-[1.01]"
                              />
                              {captionText && (
                                <span className="block text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 font-sans italic text-center max-w-xl mx-auto px-4">
                                  {captionText}
                                </span>
                              )}
                            </span>
                          );
                        }
                      }}
                    >
                      {part}
                    </ReactMarkdown>
                  );
                })}
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map(tag => (
                      <span key={tag.id} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-sm">
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {showEngagement && (
                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <ShareButtons url={postUrl} title={post.title} />
                  <LikeButton postId={post.id} />
                </div>
              )}

              {showComments && <CommentSection postId={post.id} />}

              {/* Editorial Note */}
              <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-[11px] md:text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-sans text-center max-w-2xl mx-auto">
                <p>
                  <strong>Editorial Note:</strong> Articles on E-Blog may involve the use of AI technology as part of the research, editing, or content refinement process. All materials remain subject to editorial review before publication. The information presented is for educational and general reference purposes only and is not intended as a substitute for professional advice. Readers are advised to perform additional verification before making decisions based on the information in the article.
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {showRelatedPosts && relatedPosts.length > 0 && (
        <section className="bg-slate-50 dark:bg-slate-900/50 py-16 mt-16 border-t border-slate-200 dark:border-slate-800">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-8 text-center">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedPosts.map(relatedPost => (
                <PostCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox Modal for enlarged Images and Mermaid diagrams */}
      <LightboxModal media={lightboxMedia} onClose={() => setLightboxMedia(null)} />
    </main>
  );
}

