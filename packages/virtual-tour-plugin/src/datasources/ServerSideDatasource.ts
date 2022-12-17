import type { Viewer } from '@photo-sphere-viewer/core';
import { PSVError, utils } from '@photo-sphere-viewer/core';
import { VirtualTourPluginConfig } from '../model';
import { VirtualTourPlugin } from '../VirtualTourPlugin';
import { AbstractDatasource } from './AbstractDataSource';

export class ServerSideDatasource extends AbstractDatasource {
    private readonly nodeResolver: VirtualTourPluginConfig['getNode'];

    constructor(plugin: VirtualTourPlugin, viewer: Viewer) {
        super(plugin, viewer);

        if (!plugin.config.getNode) {
            throw new PSVError('Missing getNode() option.');
        }

        this.nodeResolver = plugin.config.getNode;
    }

    loadNode(nodeId: string) {
        if (this.nodes[nodeId]) {
            return Promise.resolve(this.nodes[nodeId]);
        } else {
            return Promise.resolve(this.nodeResolver(nodeId)).then((node) => {
                this.checkNode(node);
                if (!node.links) {
                    utils.logWarn(`Node ${node.id} has no links`);
                    node.links = [];
                }

                node.links.forEach((link) => {
                    // copy essential data
                    if (this.nodes[link.nodeId]) {
                        link.gps = link.gps || this.nodes[link.nodeId].gps;
                        link.name = link.name || this.nodes[link.nodeId].name;
                    }

                    this.checkLink(node, link);
                });

                this.nodes[nodeId] = node;
                return node;
            });
        }
    }
}
