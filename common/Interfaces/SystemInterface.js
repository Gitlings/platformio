import InterfaceImplementation, {
  assertInterface,
  isInterface,
} from '../Utils/InterfaceImplementation';

/**
 * SystemInterface can be implemented both for instances and constructors.
 * Required methods:
 * - canProcess
 * - process
 *
 * SystemInterface should be implemented for systems that process some limited set of entities.
 *
 * For example, there is `ActionController` that owns systems that process actions. When
 * `ActionController` iterates through them it checks whether a system can process an action
 * and then delegates the action to it.
 *
 * @example
 * function SomeSystem() {
 *   const entityProcessors = new Map([
 *     [EntityA, processEntityA],
 *     [EntityB, processEntityB],
 *   ]);
 *
 *   this.systemInterface = new SystemInterface(this, {
 *     canProcess: entity => entityProcessors.has(entity.constructor),
 *
 *     process: entity => entityProcessors.has(entity.constructor)(entity),
 *   });
 *
 *   function processEntityA(entity) {
 *     // do something with EntityA...
 *   }
 *
 *   function processEntityB(entity) {
 *     // do something witn EntityB...
 *   }
 * }
 *
 * @param entity
 * @param interfaceImplementation
 * @constructor
 */
function SystemInterface(entity, interfaceImplementation) {
  const implementation = new InterfaceImplementation(this, entity, interfaceImplementation);

  /**
   * @param {Function} processedEntity
   * @returns {boolean}
   */
  this.canProcess = processedEntity => implementation.callMethod('canProcess', processedEntity);

  /**
   * @param processedEntity
   */
  this.lagCompensate =
    processedEntity => implementation.callMethod('lagCompensate', processedEntity);

  /**
   * @param processedEntity
   */
  this.process = processedEntity => implementation.callMethod('process', processedEntity);
}

SystemInterface.assert = (entity) => {
  assertInterface(entity.systemInterface, SystemInterface);
};

SystemInterface.has = entity => isInterface(entity.systemInterface, SystemInterface);

export default SystemInterface;
