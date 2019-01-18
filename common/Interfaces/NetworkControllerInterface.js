import InterfaceImplementation, {
  assertInterface,
  isInterface,
} from '../Utils/InterfaceImplementation';

/**
 * @param networkController
 * @param interfaceImplementation
 * @constructor
 */
function NetworkControllerInterface(networkController, interfaceImplementation) {
  const implementation = new InterfaceImplementation(
    this,
    networkController,
    interfaceImplementation,
  );

  this.broadcastAction = (action) => {
    action.actionInterface.hasBeenBroadcasted = true;
    implementation.callMethod('broadcastAction', action);
  };
}

NetworkControllerInterface.assert = (entity) => {
  assertInterface(entity.networkControllerInterface, NetworkControllerInterface);
};

NetworkControllerInterface.has = entity => (
  isInterface(entity.networkControllerInterface, NetworkControllerInterface)
);

export default NetworkControllerInterface;
