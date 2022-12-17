export type GyroscopePluginConfig = {
    /**
     * allows to pan horizontally when the gyroscope is enabled (requires global `mousemove=true`)
     * @default true
     */
    touchmove?: boolean;
    /**
     * when true the view will ignore the current direction when enabling gyroscope control
     * @default false
     */
    absolutePosition?: boolean;
    /**
     * how the gyroscope data is used to rotate the panorama
     * @default 'smooth'
     */
    moveMode?: 'smooth' | 'fast';
};
