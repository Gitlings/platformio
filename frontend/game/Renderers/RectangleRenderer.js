import * as THREE from 'three';

import ObjectRendererInterface from '../Interfaces/ObjectRendererInterface';

/**
 * @constructor
 */
function RectangleRenderer() {
  let mesh = null;

  this.objectRendererInterface = new ObjectRendererInterface(this, {

    initialize: (renderedObject) => {
      const rectangleGeometry = new THREE.PlaneGeometry(
        renderedObject.getSize().x,
        renderedObject.getSize().y,
        1,
        1,
      );
      const rectangleMaterial = new THREE.MeshBasicMaterial({
        color: renderedObject.placeableObjectInterface.getColor().getHex(),
        side: THREE.DoubleSide,
      });
      mesh = new THREE.Mesh(rectangleGeometry, rectangleMaterial);
    },

    getRootMesh: () => mesh,

    renderUpdate: (renderedObject) => {
      const position = renderedObject.placeableObjectInterface.getPosition();
      mesh.position.x = position.x;
      mesh.position.y = position.y;
      mesh.material.color = renderedObject.placeableObjectInterface.getColor();
    },

  });
}

export default RectangleRenderer;
