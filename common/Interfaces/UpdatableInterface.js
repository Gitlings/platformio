import InterfaceImplementation, {
  assertInterface,
  isInterface,
} from '../Utils/InterfaceImplementation';

/**
 * UpdatableInterface can be implemented both for instances and constructors.
 * Required methods:
 * - update
 *
 * UpdatableInterface indicates that an object processes something on a game tick. It can be not
 * used at all, but it's just more preferable for semantic reasons (easier search for classes
 * with logic on a game tick).
 *
 * @param object
 * @param interfaceImplementation
 * @constructor
 */
function UpdatableInterface(object, interfaceImplementation) {
  const implementation = new InterfaceImplementation(this, object, interfaceImplementation);

  this.update = () => implementation.callMethod('update');
}

UpdatableInterface.assert = (entity) => {
  assertInterface(entity.updatableInterface, UpdatableInterface);
};

UpdatableInterface.has = entity => isInterface(entity.updatableInterface, UpdatableInterface);

export default UpdatableInterface;
