"use client";

/**
 * Markdown Renderer Component
 *
 * Renders Markdown files using react-markdown with styled output.
 * Supports standard Markdown syntax with dark theme styling.
 *
 * @feature 016-file-viewer-window
 */

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";

export interface MarkdownRendererProps {
  /** File path to the Markdown file */
  filePath: string;
  /** Zoom level as percentage (10-200) */
  zoom: number;
}

export function MarkdownRenderer({ filePath, zoom }: MarkdownRendererProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Markdown file
  useEffect(() => {
    if (!filePath) return;

    setIsLoading(true);
    setError(null);

    const loadMarkdown = async () => {
      try {
        // Use Tauri's fs plugin to read the file
        const { readTextFile } = await import("@tauri-apps/plugin-fs");
        const text = await readTextFile(filePath);
        setContent(text);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load Markdown:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load Markdown file"
        );
        setIsLoading(false);
      }
    };

    loadMarkdown();
  }, [filePath]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive">
        <p className="text-sm">Failed to load Markdown</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  // Calculate font size based on zoom
  const baseFontSize = 16;
  const fontSize = (baseFontSize * zoom) / 100;

  return (
    <div
      className="p-4 overflow-auto h-full"
      style={{ fontSize: `${fontSize}px` }}
    >
      <article className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown
          components={{
            // Custom styling for markdown elements
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground border-b border-border pb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-bold mt-5 mb-3 text-foreground border-b border-border pb-1">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-base font-semibold mt-3 mb-2 text-foreground">
                {children}
              </h4>
            ),
            h5: ({ children }) => (
              <h5 className="text-sm font-semibold mt-2 mb-1 text-foreground">
                {children}
              </h5>
            ),
            h6: ({ children }) => (
              <h6 className="text-sm font-medium mt-2 mb-1 text-muted-foreground">
                {children}
              </h6>
            ),
            p: ({ children }) => (
              <p className="my-2 text-foreground leading-relaxed">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside my-2 text-foreground space-y-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside my-2 text-foreground space-y-1">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-foreground">{children}</li>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary pl-4 my-4 text-muted-foreground italic">
                {children}
              </blockquote>
            ),
            code: ({ children, className }) => {
              // Check if it's inline code (no className) or code block
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                    {children}
                  </code>
                );
              }
              return (
                <code className="block bg-muted p-4 rounded-lg overflow-x-auto font-mono text-sm text-foreground my-4">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="bg-muted rounded-lg overflow-x-auto my-4">
                {children}
              </pre>
            ),
            hr: () => <hr className="border-border my-6" />,
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border border-border">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-muted">{children}</thead>
            ),
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => (
              <tr className="border-b border-border">{children}</tr>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2 text-left font-semibold text-foreground">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 text-foreground">{children}</td>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-foreground">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-foreground">{children}</em>
            ),
            img: ({ src, alt }) => (
              <img
                src={src}
                alt={alt || ""}
                className="max-w-full h-auto rounded my-4"
              />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
