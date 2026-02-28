import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import LazyImage from '../common/LazyImage';

export default function ImageGallery({ images = [] }) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  if (!images.length) return (
    <div className="bg-dva-blue-muted rounded-xl h-80 flex items-center justify-center">
      <span className="text-gray-400">Aucune image disponible</span>
    </div>
  );

  const current = images[selected];

  return (
    <div>
      {/* Image principale */}
      <div className="relative rounded-xl overflow-hidden bg-dva-blue-muted mb-3 cursor-zoom-in"
        onClick={() => setZoomed(true)}>
        <LazyImage
          src={current.url}
          alt={current.alt_text || 'Image produit'}
          className="h-80 w-full"
        />
        <button className="absolute top-3 right-3 bg-white/80 rounded-full p-1.5 hover:bg-white transition-colors">
          <ZoomIn className="w-4 h-4 text-gray-600" />
        </button>
        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setSelected((s) => (s - 1 + images.length) % images.length); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 hover:bg-white">
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setSelected((s) => (s + 1) % images.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 hover:bg-white">
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Miniatures */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setSelected(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === selected ? 'border-dva-blue' : 'border-transparent hover:border-gray-300'
              }`}>
              <img src={img.url} alt={img.alt_text} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Zoom modal */}
      {zoomed && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}>
          <img src={current.url} alt={current.alt_text}
            className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}
