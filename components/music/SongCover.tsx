import React, { useState, useEffect, memo } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { getEmbeddedArt, getMemoryCachedArt, cancelEmbeddedArt } from '../utils/getEmbeddedArt';

interface SongCoverProps {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  fallbackSource?: any;
}

export const SongCover = memo(function SongCover({
  uri,
  style,
  fallbackSource = require('@/assets/images/music.png'),
}: SongCoverProps) {
  // FAST PATH: Try synchronous memory cache first.
  // If we already extracted this, we skip the initial `null` state and the `useEffect` overhead!
  const [artworkUri, setArtworkUri] = useState<string | null>(() => getMemoryCachedArt(uri));
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let debounceTimer: NodeJS.Timeout;
    let didFire = false;
    setImageError(false);

    if (!uri) {
      setArtworkUri(null);
      return;
    }

    if (artworkUri && getMemoryCachedArt(uri) === artworkUri) {
      return;
    }

    debounceTimer = setTimeout(() => {
      didFire = true;
      getEmbeddedArt(uri)
        .then((art) => {
          if (isMounted) {
            setArtworkUri(art);
          }
        })
        .catch(() => {
          if (isMounted) {
            setArtworkUri(null);
          }
        });
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
      if (didFire && uri) {
        cancelEmbeddedArt(uri);
      }
    };
  }, [uri]);

  return (
    <Image
      source={artworkUri && !imageError ? { uri: artworkUri } : fallbackSource}
      style={style}
      resizeMode="cover"
      onError={() => {
        if (artworkUri) {
          console.log(`[SongCover] Image failed to render. Song: ${uri?.split('/').pop()} | Path: ${artworkUri}`);
          setImageError(true);
        }
      }}
    />
  );
});
