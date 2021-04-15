import { PSVError, utils } from 'photo-sphere-viewer';
import { AbstractDatasource } from './AbstractDatasource';
import { checkLink, checkNode } from './utils';

/**
 * @memberOf PSV.plugins.VirtualTourPlugin
 * @private
 */
export class ServerSideDatasource extends AbstractDatasource {

  constructor(plugin) {
    super(plugin);

    if (!plugin.config.getNode) {
      throw new PSVError('Missing getNode() option.');
    }

    this.nodeResolver = plugin.config.getNode;
    this.linksResolver = plugin.config.getLinks;
  }

  loadNode(nodeId) {
    if (this.nodes[nodeId]) {
      return Promise.resolve(this.nodes[nodeId]);
    }
    else {
      return Promise.resolve(this.nodeResolver(nodeId))
        .then((node) => {
          checkNode(node, this.plugin.isGps());
          this.nodes[nodeId] = node;
          return node;
        });
    }
  }

  loadLinkedNodes(nodeId) {
    if (!this.nodes[nodeId]) {
      return Promise.reject(new PSVError(`Node ${nodeId} not found`));
    }
    else if (this.nodes[nodeId].links) {
      return Promise.resolve();
    }
    else {
      if (!this.linksResolver) {
        this.nodes[nodeId].links = [];
        return Promise.resolve();
      }

      utils.logWarn(`getLinks() option is deprecated, instead make getNode() also return the node' links.`);

      return Promise.resolve(this.linksResolver(nodeId))
        .then(links => links || [])
        .then((links) => {
          const node = this.nodes[nodeId];

          links.forEach((link) => {
            checkLink(node, link, this.plugin.isGps());

            // copy essential data
            if (this.nodes[link.nodeId]) {
              link.position = link.position || this.nodes[link.nodeId].position;
              link.name = link.name || this.nodes[link.nodeId].name;
            }

            if (this.plugin.isGps() && !link.position) {
              throw new PSVError(`No GPS position provided for link ${link.nodeId} of node ${node.id}`);
            }
          });

          // store links
          node.links = links;
        });
    }
  }

}
