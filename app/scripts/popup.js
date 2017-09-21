import Vue from 'vue'
import App from '../component/App.vue'
import YT from '../component/YT'
import Messaging from '../component/Messaging'
import L10n from '../component/L10n'

Vue.use(L10n);

var app = new Vue ({
  el:'#app',
  provide: {
    YT: new YT(),
    bus: new Messaging()
  },
  render: h => h(App)
});