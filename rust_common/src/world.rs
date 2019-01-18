use lazy_static::lazy_static;
use nalgebra::{self, Isometry2};
use ncollide2d::{
    shape::{Ball, Cuboid, Shape, ShapeHandle},
    world::CollisionGroups,
};
use nphysics2d::{
    algebra::Velocity2,
    object::{BodyHandle, BodyStatus, ColliderHandle, Material},
    volumetric::Volumetric,
    world::World,
};
use wasm_bindgen::JsCast;

use std::{collections::HashMap, sync::Mutex};

use crate::muddle_helpers::object_debug;
use crate::muddle_types;
use crate::utils::*;

lazy_static! {
    pub static ref MUDDLE: Mutex<MuddleWorld> = Mutex::new(MuddleWorld::new());
}

type Vector2 = nalgebra::Vector2<f64>;
type ObjectsMap = HashMap<String, BodyHandle>;

const PLAYER_SPEED: f64 = 50.0;
const PLAYERS_GRP: usize = 1;
const BUILDABLE_OBJECTS_GRP: usize = 2;

pub struct MuddleWorld {
    world: World<f64>,
    objects: ObjectsMap,
    buildable_objects: ObjectsMap,
    players: ObjectsMap,
    players_collision_groups: CollisionGroups,
    buildable_objects_collision_groups: CollisionGroups,
}

impl MuddleWorld {
    pub fn new() -> Self {
        let world = World::new();
        let mut players_collision_groups = CollisionGroups::new();
        let mut buildable_objects_collision_groups = CollisionGroups::new();

        players_collision_groups.set_membership(&[PLAYERS_GRP]);
        players_collision_groups.set_whitelist(&[BUILDABLE_OBJECTS_GRP]);
        buildable_objects_collision_groups.set_membership(&[BUILDABLE_OBJECTS_GRP]);
        buildable_objects_collision_groups.set_whitelist(&[PLAYERS_GRP]);

        MuddleWorld {
            world,
            objects: HashMap::new(),
            buildable_objects: HashMap::new(),
            players: HashMap::new(),
            players_collision_groups,
            buildable_objects_collision_groups,
        }
    }

    pub fn add_player(&mut self, player: &muddle_types::Player) {
        let player_hash_id = player.hashable_id_interface().get_hash_id();

        let player_position: Vector2 = player.placeable_object_interface().get_position().into();
        let player_shape = Ball::new(player.get_radius());
        let (body_handle, collider_handle) = self.add_object(player_shape, player_position);

        let body = self.world.rigid_body_mut(body_handle).unwrap();
        body.set_status(BodyStatus::Dynamic);
        self.world
            .collision_world_mut()
            .set_collision_groups(collider_handle, self.players_collision_groups);

        self.players.insert(player_hash_id.clone(), body_handle);
        self.objects.insert(player_hash_id, body_handle);
    }

    pub fn add_buildable_object(&mut self, object: &muddle_types::PlaceableObject) {
        let object_hash_id = object.hashable_id_interface().get_hash_id();
        let position: Vector2 = object.placeable_object_interface().get_position().into();

        let (body_handle, collider_handle) =
            if let Some(ref circle) = object.dyn_ref::<muddle_types::Circle>() {
                let shape = Ball::new(circle.get_radius());
                self.add_object(shape, position)
            } else if let Some(ref rectangle) = object.dyn_ref::<muddle_types::Rectangle>() {
                let rectangle_size: Vector2 = rectangle.get_size().into();
                let shape = Cuboid::new(rectangle_size * 0.5);
                self.add_object(shape, position)
            } else {
                muddle_panic!(
                    "Reached unknown buildable object type: {:?}",
                    object_debug(object)
                );
            };

        let body = self.world.rigid_body_mut(body_handle).unwrap();
        body.set_status(BodyStatus::Kinematic);
        self.world
            .collision_world_mut()
            .set_collision_groups(collider_handle, self.buildable_objects_collision_groups);

        self.buildable_objects
            .insert(object_hash_id.clone(), body_handle);
        self.objects.insert(object_hash_id, body_handle);
    }

    pub fn remove_object(&mut self, hash_id: &str) {
        self.buildable_objects.remove(hash_id);
        self.players.remove(hash_id);
        let object = self.objects.remove(hash_id).unwrap();
        self.world.remove_bodies(&[object]);
    }

    pub fn process_players_movement(
        &mut self,
        players: js_sys::Iterator,
        _objects: js_sys::Iterator,
    ) {
        let players = players.into_iter().collect::<Vec<_>>();

        for player_object in players.iter().cloned() {
            let player_object = player_object.unwrap();
            let player = player_object.dyn_ref::<muddle_types::Player>();
            if player.is_none() {
                continue;
            }

            let player = player.unwrap();
            let player_direction: Vector2 = player.get_movement_direction().into();
            let player_id = player.hashable_id_interface().get_hash_id();

            let player_body_handle = self.players[&player_id];
            let player_body = self.world.rigid_body_mut(player_body_handle).unwrap();

            let player_velocity = player_direction * PLAYER_SPEED;
            player_body.set_velocity(Velocity2::linear(player_velocity.x, player_velocity.y));
        }

        self.world.step();

        for player_object in players.iter().cloned() {
            let player_object = player_object.unwrap();
            let player = player_object.dyn_ref::<muddle_types::Player>();
            if player.is_none() {
                continue;
            }

            let player = player.unwrap();
            let player_id = player.hashable_id_interface().get_hash_id();
            let player_body_handle = self.players[&player_id];
            let player_body = self.world.rigid_body_mut(player_body_handle).unwrap();

            let position = player_body.position().translation.vector;
            player
                .placeable_object_interface()
                .set_position(position.into());
        }
    }

    fn add_object(
        &mut self,
        shape: impl Shape<f64>,
        position: Vector2,
    ) -> (BodyHandle, ColliderHandle) {
        let shape_handle = ShapeHandle::new(shape);
        let local_inertia = shape_handle.inertia(1.0);
        let local_center_of_mass = shape_handle.center_of_mass();
        let body_handle = self.world.add_rigid_body(
            Isometry2::new(position, 0.0),
            local_inertia,
            local_center_of_mass,
        );
        let collider_handle = self.world.add_collider(
            0.,
            shape_handle,
            body_handle,
            Isometry2::new(nalgebra::zero(), 0.0),
            Material::default(),
        );
        (body_handle, collider_handle)
    }
}
