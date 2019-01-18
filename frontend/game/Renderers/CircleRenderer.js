import * as THREE from 'three';

import ObjectRendererInterface from '../Interfaces/ObjectRendererInterface';

/**
 * @constructor
 */
function CircleRenderer() {
  let mesh = null;

  this.objectRendererInterface = new ObjectRendererInterface(this, {

    initialize: (renderedObject) => {
      const circleGeometry = new THREE.CircleBufferGeometry(renderedObject.getRadius(), 32);
      const circleMaterial = new THREE.MeshBasicMaterial({
        color: renderedObject.placeableObjectInterface.getColor(),
        side: THREE.DoubleSide,
      });
      mesh = new THREE.Mesh(circleGeometry, circleMaterial);
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

export default CircleRenderer;
