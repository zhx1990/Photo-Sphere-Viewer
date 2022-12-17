export type Resolution = {
    id: string;
    label: string;
    panorama: any;
};

export type ResolutionPluginConfig = {
    /**
     * list of available resolutions
     */
    resolutions: Resolution[];
    /**
     * the default resolution if no panorama is configured on the viewer
     */
    defaultResolution?: string;
    /**
     * show the resolution id as a badge on the settings button
     * @default true
     */
    showBadge?: boolean;
};
