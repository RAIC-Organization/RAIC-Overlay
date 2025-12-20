"use client";

import { useState, KeyboardEvent } from "react";
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
} from "lucide-react";

export interface BrowserToolbarProps {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  zoom: number;
  isLoading: boolean;
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
  onNavigate,
  onBack,
  onForward,
  onRefresh,
  onZoomIn,
  onZoomOut,
}: BrowserToolbarProps) {
  const [inputValue, setInputValue] = useState(url);

  // Sync input when url prop changes from navigation
  if (inputValue !== url && !document.activeElement?.matches("input")) {
    setInputValue(url);
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onNavigate(inputValue);
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
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter URL..."
          className="h-8 pr-8"
        />
        {isLoading && (
          <Loader2 className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
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
