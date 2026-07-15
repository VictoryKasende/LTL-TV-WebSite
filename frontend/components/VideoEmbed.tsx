'use client';

import { useState } from 'react';
import Spinner from './ui/Spinner';

export default function VideoEmbed({ src, title }: { src: string; title: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-brand-900">
          <Spinner size="lg" className="text-white/60" />
        </div>
      )}
      <iframe
        src={src}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        onLoad={() => setLoaded(true)}
        className="absolute inset-0 h-full w-full"
      />
    </>
  );
}
