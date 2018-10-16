import Vue from 'vue'
import CalendarApp from '../component/CalendarApp.vue'
import YT from '../component/YT'
import L10n from '../component/L10n'
import VueChartkick from 'vue-chartkick'
import Chart from 'chart.js'

Vue.use(VueChartkick, {adapter: Chart});
Vue.use(L10n);

var app = new Vue ({
  el:'#app',
  provide: {
    YT: new YT()
  },
  render: h => h(CalendarApp)
});