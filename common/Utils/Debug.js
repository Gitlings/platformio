import EngineConfig from '../EngineConfig';

export function setDebugProperty(entity, property, value) {
  /* eslint-disable no-underscore-dangle */
  if (EngineConfig.debugIsEnabled()) {
    if (!entity._debug) {
      entity._debug = {};
    }
    entity._debug[property] = value;
  }
}

export function log(message) {
  if (EngineConfig.debugIsEnabled()) {
    console.log(message);
  }
}

export function serverLog(message) {
  if (EngineConfig.isServer()) {
    log(message);
  }
}

export function clientLog(message) {
  if (EngineConfig.isClient()) {
    log(message);
  }
}
