import Vue from 'vue'
import axios from 'axios'
import App from '../component/App.vue'
import YT from '../component/YT'
import Messaging from '../component/Messaging'
import options from './options'

window.$ = window.jQuery = require('jquery');
require('bootstrap');

Vue.filter("issueURL", (id) => options.baseURL + "/issue/" + id);

Vue.filter('highlight', function(words, query) {
  let regex = new RegExp(query, "ig");
  return words.replace(regex, '<span class="highlight">' + query + '</span>')
});

var app = new Vue ({
  el:'#app',
  provide: {
    options: options,
    YT: new YT(options.baseURL),
    bus: new Messaging()
  },
  render: h => h(App)
});

window.app = app;