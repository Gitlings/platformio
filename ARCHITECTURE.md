## Common
Everything related to game logic that is shared between frontend and backend suits here.

### Concepts

#### Interfaces
Our interfaces seem to be reinvented traits and mixtures. They can have default implementations
and they also can store their own data. Basically, they are just entities that were born
because of following composition pattern. From ECS perspective interfaces can be called components.

##### Why?
No inheritance. Better isolation (namespaces). And we can have registries of classes implementing
specific interfaces.

##### How?
Interfaces can be implemented both for objects and constructors.

A good example of an interface that is implemented for constructors is `SerializableInterface`
([see its documentation](./common/Interfaces/SerializableInterface)). Every class implementing
`SerializableInterface` is be able to be serialized and used in messages.

#### Systems
Usually systems process actions and messages, but basically they can process any entity
implementing some specific interface, or they just execute some logic on every game tick. Every
system should implement `SystemInterface` or `UpdatableInterface` (at least one of those).
`SystemInterface` has two essential methods: `canProcess` and `process`. Systems are manually
called inside controllers, where execution order and logic are defined imperatively.

#### Actions
Actions define how the game keeps going. Actions can be triggered and sent by players
(like `PlayerSetMovingAction`), but some actions are also server authorized
(`DespawnClientPlayerAction`). They are managed by `ActionController`, which delegates them
to Systems to be processed.

#### Messages
Messages are the essential instrument of communication between clients and server. One of the most
important messages is `BroadcastActionMessage`, which tells server and other clients what actions
to play. There is also `GameStateMessage`, telling new clients what current game state is, it's sent
once on authentication. All the other messages (such as `PingMessage`, `PongMessage`,
`AuthenticationRequestMessage`) are used for network part to be functional.

### Engine parts

#### Gameloop
Gameloop is implemented on backend and frontend separately. In order to process game logic
method `Engine::tick` is executed. All the game logic is played with Systems, and what exactly
happens during a tick is defined by Actions presented in the action queue.
Inside `tick` method `ActionController` is called - this is where all the magic happens.

#### ActionController
`ActionController` is the main entity that manages all the game actions. `ActionController` has
two action queues: one for executing and one for broadcasting (`broadcastedActionsQueue` is
a subset of `actionsQueue`).

`ActionController` makes calls to systems, that process certain actions, and to `networkController`
in order to broadcast actions.

#### Network
All network communication is done with [messages](./common/NetworkMessages). Every message
implements `SerializableInterface`. Messages are handled with network systems. There's a common
network system `NetworkMessageSystem` (handling actions) and network systems for frontend
and backend as well (handling authentication, pinging and other messages for maintaining
connection).

#### Bottle of Muddle (dependency injection)
In order to maintain dependency injection easier, bottle.js library is used. In muddle.run
constructor dependency injection is preferred. Though in some places, where initializing with
bottle.js isn't possible, `ClientMuddle` or `ServerMuddle` may be used as service locators.
See `common/Muddle.js` (or `ServerMuddle.js` for backend, `ClientMuddle.js` for frontend) for
services and their dependencies declarations.

### Testing
Tests are organized the following way: unit tests are always located next to tested file (in the
same folder), and integrational ones (as well as other types) are placed inside
`./common/integrational` folder (or `./backend/functional` etc). Every test has to have
`*.test.js` extension in order to be detected by jest framework.

## Backend
Separately implemented gameloop, its own network controller and system - that's basically all
what makes backend. Everything important that relates to game logic is implemented in Common
module, so the only thing that is left for backend to do is to maintain connection with client
and send/receive messages. In future it will be also important to work with database in order to
handle registration, saving game data etc. Maybe that'll be a task for separate microservices.

## Frontend
Besides running game logic, frontend has several more responsibilities: rendering game state,
user interface, communicating with server and listening and handling user input - that's what else
happens in order for the game to be playable.

### GUI
Game GUI is drawn with HTML+CSS and it overlays the canvas. Vue.js framework is used and all the
global data that is shared between several components (except for the components with parent-child
relationship) are located in Store.

### Store
For implementing Store vuex framework is used. Using namespaced modules is strongly encouraged.
It is also best to avoid using global store, where possible. In many cases data can still be left
local for specific component. If you have to pass something to child components, use props.
See `./frontend/store`.
