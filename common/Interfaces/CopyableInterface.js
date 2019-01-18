import InterfaceImplementation, {
  assertInterface,
  isInterface,
} from '../Utils/InterfaceImplementation';

/**
 * @param entity
 * @param interfaceImplementation
 * @param {boolean} delegatesToConstructor
 * @constructor
 */
function CopyableInterface(entity, interfaceImplementation) {
  const implementation = new InterfaceImplementation(this, entity, interfaceImplementation);

  this.copy = obj => implementation.callMethodOrElse(() => callFromConstructor(obj), 'copy', obj);

  function callFromConstructor(obj) {
    CopyableInterface.assert(obj.constructor);
    return obj.constructor.copyableInterface.copy(obj);
  }
}

CopyableInterface.assert = (entity) => {
  assertInterface(entity.copyableInterface, CopyableInterface);
};

CopyableInterface.has = entity => (
  isInterface(entity.copyableInterface, CopyableInterface)
);

export default CopyableInterface;
