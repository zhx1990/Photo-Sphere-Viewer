import { Position, TypedEvent } from '@photo-sphere-viewer/core';
import { VirtualTourLink, VirtualTourNode } from './model';
import type { VirtualTourPlugin } from './VirtualTourPlugin';

/**
 * @event Triggered when the current node changes
 */
export class NodeChangedEvent extends TypedEvent<VirtualTourPlugin> {
    static override readonly type = 'node-changed';
    override type: 'node-changed';

    constructor(
        public readonly node: VirtualTourNode,
        public readonly data: {
            fromNode: VirtualTourNode;
            fromLink: VirtualTourLink;
            fromLinkPosition: Position;
        }
    ) {
        super(NodeChangedEvent.type);
    }
}

export type VirtualTourEvents = NodeChangedEvent;
