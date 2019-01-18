/**
 * IMPORTANT!!!
 *
 * If editing this file, remember to apply the same changes to
 * frontend/game/Utils/ThreeInterfaceImplementations.js.
 */

/* eslint-disable no-mixed-operators,no-bitwise */
import * as THREE from 'three';
import SerializableInterface from '../Interfaces/SerializableInterface';
import CopyableInterface from '../Interfaces/CopyableInterface';

THREE.Vector2.serializableInterface = new SerializableInterface(THREE.Vector2, {
  serialize: object => ({
    x: () => object.x,
    y: () => object.y,
  }),

  deserialize: object => new THREE.Vector2(object.x, object.y),
});

THREE.Vector2.prototype.copyableInterface = new CopyableInterface({}, {});

THREE.Vector2.copyableInterface = new CopyableInterface(THREE.Vector2, {
  copy: object => object.clone(),
});

THREE.Color.serializableInterface = new SerializableInterface(THREE.Color, {
  serialize: object => ({
    value: () => colorToArray(object),
  }),

  deserialize: object => new THREE.Color(arrayToColor(object.value)),
});

THREE.Color.prototype.copyableInterface = new CopyableInterface({}, {});

THREE.Color.copyableInterface = new CopyableInterface(THREE.Color, {
  copy: object => object.clone(),
});

/**
 * @param color
 */
function colorToArray(color) {
  const rgbArray = new Uint8Array(3);
  const colorHex = color.getHex();
  rgbArray[0] = colorHex >> 16 & 255;
  rgbArray[1] = colorHex >> 8 & 255;
  rgbArray[2] = colorHex & 255;
  return rgbArray;
}

function arrayToColor(rgbArray) {
  return rgbArray[0] << 16 ^ rgbArray[1] << 8 ^ rgbArray[2] << 0;
}
