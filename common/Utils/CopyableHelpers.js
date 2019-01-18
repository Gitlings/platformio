import { assertInterface, isInterface } from './InterfaceImplementation';
import { isIterable } from './SerializationHelpers';

export function copyInto(constructor, ...args) {
  return new constructor(...args.map(arg => copy(arg)));
}

export function copy(entity) {
  if (typeof entity === 'object' && entity !== null) {
    if (isInterface(entity.copyableInterface, 'CopyableInterface')) {
      return copyCopyable(entity);
    }
    if (isIterable(entity)) {
      return copyArray(entity);
    }
    if (entity.constructor === Object) {
      return copyObjectFields(entity);
    }
    // The following line is expected to throw an exception (after assertInterface fails).
    return copyCopyable(entity);
  }
  return entity;
}

export function copyCopyable(entity) {
  assertInterface(entity.copyableInterface, 'CopyableInterface');
  return entity.copyableInterface.copy(entity);
}

export function copyObjectFields(objectMap) {
  return Object.keys(objectMap).reduce((acc, key) => {
    acc[key] = copy(objectMap[key]);
    return acc;
  }, {});
}

export function copyArray(iterable) {
  return Array.from(iterable).map(entity => copy(entity));
}
