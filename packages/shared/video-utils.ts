/**
 * Create a standard video element
 */
export function createVideo({
    src,
    withCredentials,
    muted,
    autoplay,
}: {
    src: string;
    withCredentials: boolean;
    muted: boolean;
    autoplay: boolean;
}): HTMLVideoElement {
    const video = document.createElement('video');
    video.crossOrigin = withCredentials ? 'use-credentials' : 'anonymous';
    video.loop = true;
    video.playsInline = true;
    video.autoplay = autoplay;
    video.muted = muted;
    video.preload = 'metadata';
    video.src = src;
    return video;
}
