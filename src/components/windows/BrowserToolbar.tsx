"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Minus,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { BrowserErrorEvent } from "@/types/browserWebView";

export interface BrowserToolbarProps {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  zoom: number;
  isLoading: boolean;
  error: BrowserErrorEvent | null;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function BrowserToolbar({
  url,
  canGoBack,
  canGoForward,
  zoom,
  isLoading,
  error,
  onNavigate,
  onBack,
  onForward,
  onRefresh,
  onZoomIn,
  onZoomOut,
}: BrowserToolbarProps) {
  const [inputValue, setInputValue] = useState(url);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input when url prop changes from navigation (only when not focused)
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setInputValue(url);
    }
  }, [url]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onNavigate(inputValue);
      // Blur input so subsequent URL changes from WebView navigation will update the bar
      inputRef.current?.blur();
    }
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b border-border">
      {/* Navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        disabled={!canGoBack}
        className="h-8 w-8"
        title="Go back"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onForward}
        disabled={!canGoForward}
        className="h-8 w-8"
        title="Go forward"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        className="h-8 w-8"
        title="Refresh"
      >
        <RotateCw className="h-4 w-4" />
      </Button>

      {/* Address bar */}
      <div className="flex-1 relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter URL..."
          className={`h-8 pr-8 ${error ? "border-destructive text-destructive" : ""}`}
        />
        {isLoading && !error && (
          <Loader2 className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {error && (
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2"
            title={error.message}
          >
            <AlertCircle className="h-4 w-4 text-destructive" />
          </span>
        )}
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Zoom controls */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        disabled={zoom <= 10}
        className="h-8 w-8"
        title="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-12 text-center text-sm tabular-nums">{zoom}%</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        disabled={zoom >= 200}
        className="h-8 w-8"
        title="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
