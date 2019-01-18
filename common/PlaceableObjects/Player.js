import * as THREE from 'three';

import HashableIdInterface from '../Interfaces/HashableIdInterface';
import SerializableInterface from '../Interfaces/SerializableInterface';
import PlaceableObjectInterface from '../Interfaces/PlaceableObjectInterface';
import { setDebugProperty } from '../Utils/Debug';
import { randomColor } from '../Utils/InitializeHelpers';
import CopyableInterface from '../Interfaces/CopyableInterface';
import { copy, copyInto } from '../Utils/CopyableHelpers';

const BASE_PLAYER_RADIUS = 5;

/**
 * @param {Vector2} position
 * @param {boolean} isPlaced
 * @param color
 * @param {string} predefinedHashId
 * @constructor
 */
function Player(position, isPlaced, color = null, predefinedHashId = '') {
  const parameters = {};

  this.hashableIdInterface = new HashableIdInterface(this, predefinedHashId, {
    getHashedContent: () => (
      this.placeableObjectInterface.getScene().hashableIdInterface.getHashId()
    ),
  });

  this.placeableObjectInterface = new PlaceableObjectInterface(this, {
    getType: () => 'player',

    getPosition: () => parameters.position,
    setPosition: (newPosition) => {
      parameters.position = newPosition;
      setDebugProperty(this, 'position', newPosition);
      return this;
    },

    isPlaced: () => parameters.isPlaced,
    setPlaced: (newIsPlaced) => {
      parameters.isPlaced = newIsPlaced;
      setDebugProperty(this, 'isPlaced', newIsPlaced);
      return this;
    },

    getColor: () => parameters.color,
    setColor: (newColor) => {
      parameters.color = newColor;
      setDebugProperty(this, 'color', newColor);
      return this;
    },
  });

  this.copyableInterface = new CopyableInterface(this, {
    copy: () => {
      const player = copyInto(
        Player,
        parameters.position,
        parameters.isPlaced,
        parameters.color,
        this.hashableIdInterface.getHashId(),
      );
      player.movementDirection = copy(this.movementDirection);
      return player;
    },
  });

  this.getRadius = () => BASE_PLAYER_RADIUS;

  this.movementDirection = new THREE.Vector2();

  // INITIALIZE DEFAULT PARAMETERS.
  this.placeableObjectInterface.setPosition(position);
  this.placeableObjectInterface.setPlaced(isPlaced);
  this.placeableObjectInterface.setColor(color || randomColor());
}

Player.serializableInterface = new SerializableInterface(Player, {
  serialize: player => ({
    position: () => player.placeableObjectInterface.getPosition(),
    isPlaced: () => player.placeableObjectInterface.isPlaced(),
    color: () => player.placeableObjectInterface.getColor(),
    hashId: () => player.hashableIdInterface.getHashId(),
  }),

  deserialize: object => new Player(
    object.position,
    object.isPlaced,
    object.color,
    object.hashId,
  ),
});

export default Player;
