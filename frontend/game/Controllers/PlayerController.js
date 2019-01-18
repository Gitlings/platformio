import * as THREE from 'three';

import Player from 'common/PlaceableObjects/Player';
import { log } from 'common/Utils/Debug';
import UpdatableInterface from 'common/Interfaces/UpdatableInterface';

import SpawnPlayerAction from 'common/Actions/SpawnPlayerAction';
import DespawnPlayerAction from 'common/Actions/DespawnPlayerAction';
import PlayerSetMovingAction from 'common/Actions/PlayerSetMovingAction';

import MovementDirections from '../Utils/MovementDirections';

/**
 * @param {ActionController} actionController
 * @param {CameraWrapper} cameraWrapper
 * @param {PlayerModel} playerModel
 * @constructor
 */
function PlayerController(actionController, cameraWrapper, playerModel) {
  let activated = false;
  /**
   * @type {Player}
   */
  let player = null;

  // INTERFACES IMPLEMENTATION.

  this.updatableInterface = new UpdatableInterface(this, {
    update: () => {
      if (!activated) {
        return;
      }
      cameraWrapper.setPosition(player.placeableObjectInterface.getPosition());
    },
  });

  // CLASS IMPLEMENTATION.

  this.activatePlayerMode = () => {
    activated = true;
    log('Player mode activated.');
    addPlayer(new THREE.Vector2());
  };

  this.deactivatePlayerMode = () => {
    activated = false;
    removePlayer();
  };

  const movementDirections = new MovementDirections();

  this.setMovementDirection = (direction, enable) => {
    movementDirections[direction] = enable;
    actionController.addAction(new PlayerSetMovingAction(
      player.hashableIdInterface.getHashId(),
      player.placeableObjectInterface.getPosition(),
      movementDirections.getDirectionVector(),
    ));
  };

  /**
   * @param {Vector2} position
   */
  function addPlayer(position) {
    player = new Player(position, true);
    const { clientId } = playerModel;
    actionController.addAction(new SpawnPlayerAction(player, clientId));
  }

  function removePlayer() {
    if (player) {
      actionController.addAction(new DespawnPlayerAction(player.hashableIdInterface.getHashId()));
      player = null;
    }
  }
}

export default PlayerController;
