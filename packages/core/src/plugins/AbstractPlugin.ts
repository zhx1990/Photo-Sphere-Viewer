import { TypedEvent, TypedEventTarget } from '../lib/TypedEventTarget';
import type { Viewer } from '../Viewer';

/**
 * Base class for plugins
 * @template TEvents union of dispatched events
 */
export abstract class AbstractPlugin<
    TEvents extends TypedEvent<AbstractPlugin> = never
> extends TypedEventTarget<TEvents> {
    /**
     * Unique identifier of the plugin
     */
    static readonly id: string;

    constructor(protected viewer: Viewer) {
        super();
    }

    /**
     * Initializes the plugin
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    init() {}

    /**
     * Destroys the plugin
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    destroy() {}
}

export type PluginConstructor = (new (viewer: Viewer, config?: any) => AbstractPlugin<any>);

/**
 * Returns the plugin constructor from the imported object
 * @internal
 */
export function pluginInterop(plugin: any): PluginConstructor & typeof AbstractPlugin {
    if (plugin) {
        for (const [, p] of [['_', plugin], ...Object.entries(plugin)]) {
            if (p.prototype instanceof AbstractPlugin) {
                return p;
            }
        }
    }
    return null;
}
