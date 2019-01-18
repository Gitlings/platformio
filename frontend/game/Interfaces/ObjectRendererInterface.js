import InterfaceImplementation, {
  assertInterface,
  isInterface,
} from 'common/Utils/InterfaceImplementation';

/**
 * @param renderer
 * @param interfaceImplementation
 * @constructor
 */
function ObjectRendererInterface(renderer, interfaceImplementation) {
  const implementation = new InterfaceImplementation(this, renderer, interfaceImplementation);

  this.initialize = renderedObject => implementation.callMethod('initialize', renderedObject);

  this.getRootMesh = () => implementation.callMethod('getRootMesh');

  this.renderUpdate = renderedObject => implementation.callMethod('renderUpdate', renderedObject);
}

ObjectRendererInterface.assert = (entity) => {
  assertInterface(entity.objectRendererInterface, ObjectRendererInterface);
};

ObjectRendererInterface.has = entity => (
  isInterface(entity.objectRendererInterface, ObjectRendererInterface)
);

export default ObjectRendererInterface;
