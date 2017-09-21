import Vue from 'vue'
import OptionsApp from '../component/OptionsApp.vue'
import L10n from '../component/L10n'

Vue.use(L10n);

var app = new Vue ({
  el:'#app',
  render: h => h(OptionsApp)
});

document.title = Vue.options.filters.l10n('appName');