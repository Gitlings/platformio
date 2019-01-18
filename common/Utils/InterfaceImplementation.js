import InterfacesRegistry from '../Registries/InterfacesRegistry';

export class NotImplementedMethodError extends Error {
  constructor(interfaceImplementer, interfaceClass, method, message) {
    super();
    this.name = 'NotImplementedMethodError';
    this.interfaceImplementer = interfaceImplementer;
    this.interfaceClass = interfaceClass;
    this.method = method;

    const implementerClassName = getImplementerClassName(interfaceImplementer);
    const methodName = `${interfaceClass.constructor.name}::${method}`;
    this.message = message
      || `'${methodName}' method is not implemented in ${implementerClassName}`;
    Error.captureStackTrace(this, NotImplementedMethodError);
  }
}

export class NotImplementedInterfaceError extends Error {
  constructor(interfaceImplementer, interfaceClass, message) {
    const constructor = typeof interfaceClass === 'function'
      ? interfaceClass
      : InterfacesRegistry.getInterface(interfaceClass);

    super();
    this.name = 'NotImplementedMethodError';
    this.interfaceImplementer = interfaceImplementer;
    this.interfaceClass = constructor;

    const implementerClassName = getImplementerClassName(interfaceImplementer);
    this.message = message
      || `'${constructor.name}' interface is not implemented for ${implementerClassName}`;
    Error.captureStackTrace(this, NotImplementedInterfaceError);
  }
}

function getImplementerClassName(interfaceImplementer) {
  const type = typeof interfaceImplementer;
  if (type === 'function') {
    return interfaceImplementer.name;
  }
  if (type === 'object') {
    return interfaceImplementer.constructor.name;
  }
  return type;
}

/**
 * @param {object} interfaceInstance
 * @param {Function|string} InterfaceConstructor - May contain either a constructor or its name.
 * @returns {boolean}
 */
export function isInterface(interfaceInstance, InterfaceConstructor) {
  if (!interfaceInstance) {
    return false;
  }
  const constructor = typeof InterfaceConstructor === 'function'
    ? InterfaceConstructor
    : InterfacesRegistry.getInterface(InterfaceConstructor);

  if (!constructor) {
    throw new Error(`Interface '${InterfaceConstructor}' doesn't exist`);
  }

  return interfaceInstance.constructor === constructor;
}

/**
 * @param {object} interfaceInstance
 * @param {Function|string} InterfaceConstructor - May contain either a constructor or its name.
 */
export function assertInterface(interfaceInstance, InterfaceConstructor) {
  if (!isInterface(interfaceInstance, InterfaceConstructor)) {
    throw new NotImplementedInterfaceError(interfaceInstance, InterfaceConstructor);
  }
}

/**
 * Every interface constructor must create its own instance of InterfaceImplementation.
 * It's important because it adds interfaces to InterfaceRegistry, which is needed for
 * `assertInterface` and `isInterface` to work.
 *
 * InterfaceImplementation is a wrapper for the passed object (`interfaceImplementation`),
 * containing defined methods. It provides `callMethod` and `callMethodOr` helpers that should be
 * used when declaring an interface method.
 *
 * InterfaceImplementation of an interface shouldn't be accessible outside,
 * so the best way to go is to define it as `const` inside a constructor local scope.
 *
 * @example
 * function MyInterface(implementingObject, interfaceImplementation) {
 *   const implementation
 *     = new InterfaceImplementation(this, implementingObject, interfaceImplementation);
 *
 *   this.someMethod = () => implementation.callMethod('someMethod');
 *
 *   // A method with default implementation.
 *   this.anotherMethod = () => implementation.callMethodOr('defaultReturnValue', 'anotherMethod');
 * }
 *
 * @param interfaceClass - Interface itself, passed with `this` reference.
 * @param implementerClass - Entity implementing the interface.
 * @param implementation - Object containing method implementations { methodName: implementation }.
 * @constructor
 */
function InterfaceImplementation(interfaceClass, implementerClass, implementation) {
  if (!InterfacesRegistry.hasInterface(interfaceClass.constructor.name)) {
    InterfacesRegistry.registerInterface(interfaceClass.constructor);
  }

  this.callMethod = (method, ...args) => {
    if (methodIsImplemented(implementation, method)) {
      return implementation[method].call(interfaceClass, ...args);
    }
    throw new NotImplementedMethodError(implementerClass, interfaceClass, method);
  };

  this.callMethodOr = (defaultValue, method, ...args) => {
    if (methodIsImplemented(implementation, method)) {
      return implementation[method].call(interfaceClass, ...args);
    }
    return defaultValue;
  };

  this.callMethodOrElse = (defaultValueFunction, method, ...args) => {
    if (methodIsImplemented(implementation, method)) {
      return implementation[method].call(interfaceClass, ...args);
    }
    return defaultValueFunction();
  };

  function methodIsImplemented(interfaceImplementation, method) {
    return typeof interfaceImplementation[method] === 'function';
  }
}

export default InterfaceImplementation;
