// import './jquery';

import Vue from 'vue';
import Vuelidate from 'vuelidate';
import Vuikit from 'vuikit';
import VuikitIcons from '@vuikit/icons';

// eslint-disable-next-line import/extensions
import '@vuikit/theme';

import store from './store';
import App from './gui/App.vue';

import Game from './game/Game';

const game = new Game();

// eslint-disable-next-line no-new
new Vue({
  el: '#app',
  store,
  render: h => h(App),
});
Vue.use(Vuelidate);
Vue.use(Vuikit);
Vue.use(VuikitIcons);

// Not my proudest hack.
require('./game/Utils/ThreeInterfaceImplementations');

game.startGameLoop();
