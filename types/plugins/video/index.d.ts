import { AbstractPlugin, Viewer } from '../..';
import { Event } from 'uevent';

export const EVENTS: {
  PLAY: 'play',
  PAUSE: 'pause',
  VOLUME_CHANGE: 'volume-change',
  PROGRESS: 'progress',
  BUFFER: 'buffer',
};

export type VideoPluginOptions = {
  progressbar?: boolean;
  progressbar?: boolean;
};

/**
 * @summary Controls a video adapter
 */
export class VideoPlugin extends AbstractPlugin {

  constructor(psv: Viewer, options: VideoPluginOptions);

  getDuration(): number;

  getTime(): number;

  getProgress(): number;

  isPlaying(): boolean;

  getVolume(): number;

  playPause(): void;

  play(): void;

  pause(): void;

  setVolume(volume: number): void;

  setMute(mute?: boolean): void;

  setTime(time: number): void;

  setProgress(progress: number): void;

  /**
   * @summary Triggered when the video starts playing
   */
  on(e: 'play', cb: (e: Event) => void): this;

  /**
   * @summary Triggered when the video is paused
   */
  on(e: 'pause', cb: (e: Event) => void): this;

  /**
   * @summary Triggered when the video volume changes
   */
  on(e: 'volume-change', cb: (e: Event, volume: number) => void): this;

  /**
   * @summary  Triggered when the video play progression changes
   */
  on(e: 'progress', cb: (e: Event, data: { time: number, duration: number, progress: number }) => void): this;

  /**
   * @summary Triggered when the video buffer changes
   */
  on(e: 'buffer', cb: (e: Event, maxBuffer: number) => void): this;

}
