'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ZoomIn, ZoomOut, RotateCw, Download, ImageOff } from 'lucide-react';

interface ReceiptImageViewerProps {
  imageUrl?: string;
  receiptId: string;
}

export default function ReceiptImageViewer({ imageUrl, receiptId }: ReceiptImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  function zoomIn() { setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2))); }
  function zoomOut() { setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2))); }
  function rotate() { setRotation((r) => (r + 90) % 360); }

  if (!imageUrl) {
    return (
      <div className="admin-card flex flex-col items-center justify-center py-16 gap-3">
        <div className="p-4 bg-slate-700/30 rounded-xl">
          <ImageOff className="w-8 h-8 text-slate-500" />
        </div>
        <p className="text-sm text-slate-500">No image available</p>
      </div>
    );
  }

  return (
    <div className="admin-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <p className="text-sm font-medium text-slate-300">Receipt Image</p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={zoomOut}
            disabled={zoom <= 0.5}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 disabled:opacity-40 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 w-12 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={zoom >= 3}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 disabled:opacity-40 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-700" />
          <button
            onClick={rotate}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <a
            href={imageUrl}
            download={`receipt-${receiptId}.jpg`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Image area */}
      <div className="overflow-auto bg-[#0F172A] min-h-80 max-h-[60vh] flex items-center justify-center p-4">
        <div
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease',
            transformOrigin: 'center center',
          }}
        >
          <Image
            src={imageUrl}
            alt={`Receipt ${receiptId}`}
            width={400}
            height={600}
            className="rounded-lg shadow-xl max-w-none"
            style={{ objectFit: 'contain' }}
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}
