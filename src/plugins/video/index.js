import { AbstractPlugin, CONSTANTS, DEFAULTS, PSVError, registerButton } from '../..';
import { EVENTS } from './constants';
import { PauseOverlay } from './PauseOverlay';
import { PlayPauseButton } from './PlayPauseButton';
import { ProgressBar } from './ProgressBar';
import { TimeCaption } from './TimeCaption';
import { VolumeButton } from './VolumeButton';
import './style.scss';


/**
 * @typedef {Object} PSV.plugins.VideoPlugin.Options
 * @property {boolean} [progressbar=true] - displays a progressbar on top of the navbar
 * @property {boolean} [bigbutton=true] - displays a big "play" button in the center of the viewer
 */


// add video buttons
DEFAULTS.lang[PlayPauseButton.id] = 'Play/Pause';
DEFAULTS.lang[VolumeButton.id] = 'Volume';
registerButton(PlayPauseButton);
registerButton(VolumeButton);
registerButton(TimeCaption);
DEFAULTS.navbar.unshift(PlayPauseButton.groupId);


export { EVENTS } from './constants';


/**
 * @summary Controls a video adapter
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export class VideoPlugin extends AbstractPlugin {

  static id = 'video';

  /**
   * @param {PSV.Viewer} psv
   * @param {PSV.plugins.VideoPlugin.Options} options
   */
  constructor(psv, options) {
    super(psv);

    if (this.psv.adapter.constructor.id.indexOf('video') === -1) {
      throw new PSVError('VideoPlugin can only be used with a video adapter.');
    }

    /**
     * @member {Object}
     * @private
     */
    this.prop = {};

    /**
     * @member {PSV.plugins.VideoPlugin.Options}
     * @private
     */
    this.config = {
      progressbar: true,
      bigbutton  : true,
      ...options,
    };

    if (this.config.progressbar) {
      this.progressbar = new ProgressBar(this);
    }

    if (this.config.bigbutton) {
      this.overlay = new PauseOverlay(this);
    }
  }

  /**
   * @package
   */
  init() {
    super.init();

    this.psv.on(CONSTANTS.EVENTS.PANORAMA_LOADED, this);
    this.psv.on(CONSTANTS.EVENTS.KEY_PRESS, this);
  }

  /**
   * @package
   */
  destroy() {
    this.psv.off(CONSTANTS.EVENTS.PANORAMA_LOADED, this);
    this.psv.off(CONSTANTS.EVENTS.KEY_PRESS, this);

    this.progressbar?.destroy();
    this.overlay?.destroy();

    delete this.progressbar;
    delete this.overlay;

    super.destroy();
  }

  /**
   * @private
   */
  handleEvent(e) {
    /* eslint-disable */
    // @formatter:off
    switch (e.type) {
      case CONSTANTS.EVENTS.PANORAMA_LOADED:
        this.__bindVideo(e.args[0]);
        this.progressbar?.show();
        break;
      case CONSTANTS.EVENTS.KEY_PRESS:
        this.__onKeyPress(e, e.args[0]);
        break;
      case 'play':         this.trigger(EVENTS.PLAY); break;
      case 'pause':        this.trigger(EVENTS.PAUSE); break;
      case 'progress':     this.trigger(EVENTS.BUFFER, this.getBufferProgress()); break;
      case 'volumechange': this.trigger(EVENTS.VOLUME_CHANGE, this.getVolume()); break;
      case 'timeupdate':
        this.trigger(EVENTS.PROGRESS, {
          time    : this.getTime(),
          duration: this.getDuration(),
          progress: this.getProgress(),
        });
        break;
    }
    // @formatter:on
    /* eslint-enable */
  }

  /**
   * @private
   */
  __bindVideo(textureData) {
    this.video = textureData.texture.image;

    this.video.addEventListener('play', this);
    this.video.addEventListener('pause', this);
    this.video.addEventListener('progress', this);
    this.video.addEventListener('volumechange', this);
    this.video.addEventListener('timeupdate', this);
  }

  /**
   * @private
   */
  __onKeyPress(e, key) {
    if (key === CONSTANTS.KEY_CODES.Space) {
      this.playPause();
      e.preventDefault();
    }
  }

  /**
   * @summary Returns the durection of the video
   * @returns {number}
   */
  getDuration() {
    return this.video?.duration ?? 0;
  }

  /**
   * @summary Returns the current time of the video
   * @returns {number}
   */
  getTime() {
    return this.video?.currentTime ?? 0;
  }

  /**
   * @summary Returns the play progression of the video
   * @returns {number} 0-1
   */
  getProgress() {
    return this.video ? this.video.currentTime / this.video.duration : 0;
  }

  /**
   * @summary Returns if the video is playing
   * @returns {boolean}
   */
  isPlaying() {
    return this.video ? !this.video.paused : false;
  }

  /**
   * @summary Returns the video volume
   * @returns {number}
   */
  getVolume() {
    return this.video?.muted ? 0 : this.video?.volume ?? 0;
  }

  /**
   * @summary Starts or pause the video
   */
  playPause() {
    if (this.video) {
      if (this.video.paused) {
        this.video.play();
      }
      else {
        this.video.pause();
      }
    }
  }

  /**
   * @summary Starts the video if paused
   */
  play() {
    if (this.video && this.video.paused) {
      this.video.play();
    }
  }

  /**
   * @summary Pauses the cideo if playing
   */
  pause() {
    if (this.video && !this.video.paused) {
      this.video.pause();
    }
  }

  /**
   * @summary Sets the volume of the video
   * @param {number} volume
   */
  setVolume(volume) {
    if (this.video) {
      this.video.muted = false;
      this.video.volume = volume;
    }
  }

  /**
   * @summary (Un)mutes the video
   * @param {boolean} [mute] - toggle if undefined
   */
  setMute(mute) {
    if (this.video) {
      this.video.muted = mute === undefined ? !this.video.muted : mute;
      if (!this.video.muted && this.video.volume === 0) {
        this.video.volume = 0.1;
      }
    }
  }

  /**
   * @summary Changes the current time of the video
   * @param {number} time
   */
  setTime(time) {
    if (this.video) {
      this.video.currentTime = time;
    }
  }

  /**
   * @summary Changes the progression of the video
   * @param {number} progress 0-1
   */
  setProgress(progress) {
    if (this.video) {
      this.video.currentTime = this.video.duration * progress;
    }
  }

  getBufferProgress() {
    if (this.video) {
      let maxBuffer = 0;

      const buffer = this.video.buffered;

      for (let i = 0, l = buffer.length; i < l; i++) {
        if (buffer.start(i) <= this.video.currentTime && buffer.end(i) >= this.video.currentTime) {
          maxBuffer = buffer.end(i);
          break;
        }
      }

      return Math.max(this.video.currentTime, maxBuffer) / this.video.duration;
    }
    else {
      return 0;
    }
  }

}
