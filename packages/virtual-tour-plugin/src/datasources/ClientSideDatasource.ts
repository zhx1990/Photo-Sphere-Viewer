import { PSVError, utils } from '@photo-sphere-viewer/core';
import { VirtualTourNode } from '../model';
import { AbstractDatasource } from './AbstractDataSource';

export class ClientSideDatasource extends AbstractDatasource {
    loadNode(nodeId: string) {
        if (this.nodes[nodeId]) {
            return Promise.resolve(this.nodes[nodeId]);
        } else {
            return Promise.reject(new PSVError(`Node ${nodeId} not found`));
        }
    }

    setNodes(rawNodes: VirtualTourNode[]) {
        if (!rawNodes?.length) {
            throw new PSVError('No nodes provided');
        }

        const nodes: Record<string, VirtualTourNode> = {};
        const linkedNodes: Record<string, boolean> = {};

        rawNodes.forEach((node) => {
            this.checkNode(node);

            if (nodes[node.id]) {
                throw new PSVError(`Duplicate node ${node.id}`);
            }
            if (!node.links) {
                utils.logWarn(`Node ${node.id} has no links`);
                node.links = [];
            }

            nodes[node.id] = node;
        });

        rawNodes.forEach((node) => {
            node.links.forEach((link) => {
                if (!nodes[link.nodeId]) {
                    throw new PSVError(`Target node ${link.nodeId} of node ${node.id} does not exists`);
                }

                // copy essential data
                link.gps = link.gps || nodes[link.nodeId].gps;
                link.name = link.name || nodes[link.nodeId].name;

                this.checkLink(node, link);

                linkedNodes[link.nodeId] = true;
            });
        });

        rawNodes.forEach((node) => {
            if (!linkedNodes[node.id]) {
                utils.logWarn(`Node ${node.id} is never linked to`);
            }
        });

        this.nodes = nodes;
    }
}
