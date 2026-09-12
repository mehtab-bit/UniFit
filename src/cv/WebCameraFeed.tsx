import React, { useEffect, useRef } from 'react';

import { CameraType } from 'expo-camera';

type WebCameraFeedProps = {

  facing: CameraType;

  onReady: (video: HTMLVideoElement | null) => void;

  onError: (error: Error) => void;

};

export function WebCameraFeed({

  facing,

  onReady,

  onError

}: WebCameraFeedProps) {

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {

    let stream: MediaStream | null = null;

    let cancelled = false;

    async function startCamera() {

      try {

        stream = await navigator.mediaDevices.getUserMedia({

          audio: false,

          video: {

            facingMode: facing === 'front' ? 'user' : 'environment'

          }

        });

        if (cancelled) {

          stream.getTracks().forEach((track) => track.stop());

          return;

        }

        const video = videoRef.current;

        if (!video) {

          return;

        }

        video.srcObject = stream;

        video.muted = true;

        video.playsInline = true;

await video.play();

console.warn(

  '[WEB CAMERA READY]',

  video.videoWidth,

  video.videoHeight

);

onReady(video);

console.warn('[WEB CAMERA onReady SENT]');
      } catch (error) {

        onError(

          error instanceof Error

            ? error

            : new Error('Unable to start web camera.')

        );

      }

    }

    startCamera();

    return () => {

      cancelled = true;

      onReady(null);

      if (stream) {

        stream.getTracks().forEach((track) => track.stop());

      }

    };

  }, [facing, onError, onReady]);

  return React.createElement('video', {

    ref: videoRef,

    autoPlay: true,

    muted: true,

    playsInline: true,

    style: {

      width: '100%',

      height: '100%',

      objectFit: 'cover',

      transform: facing === 'front' ? 'scaleX(-1)' : 'none'

    }

  });

}
