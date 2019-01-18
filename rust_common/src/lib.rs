use wasm_bindgen::prelude::*;

#[macro_use]
mod utils;
mod muddle_helpers;
mod muddle_types;
mod world;

use crate::world::{MuddleWorld, MUDDLE};

#[wasm_bindgen(js_name = addPlayer)]
pub fn add_player(player: &muddle_types::Player) {
    let world: &mut MuddleWorld = &mut *MUDDLE.lock().unwrap();
    world.add_player(player);
}

#[wasm_bindgen(js_name = addBuildableObject)]
pub fn add_buildable_object(object: &muddle_types::PlaceableObject) {
    let world: &mut MuddleWorld = &mut *MUDDLE.lock().unwrap();
    world.add_buildable_object(object);
}

#[wasm_bindgen(js_name = removeObject)]
pub fn remove_object(hash_id: &str) {
    let world: &mut MuddleWorld = &mut *MUDDLE.lock().unwrap();
    world.remove_object(hash_id);
}

#[wasm_bindgen(js_name = processPlayersMovement)]
pub fn process_players_movement(players: js_sys::Iterator, objects: js_sys::Iterator) {
    let world: &mut MuddleWorld = &mut *MUDDLE.lock().unwrap();
    world.process_players_movement(players, objects);
}
