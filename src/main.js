import Vue from 'vue'
import axios from 'axios'
import VueTimeago from 'vue-timeago'
import App from './App'
import router from './router'
import store from './store'
import Vuetify from 'vuetify'
require('material-design-icons/iconfont/material-icons.css')
require('typeface-roboto/index.css')
require('vuetify/dist/vuetify.min.css')

Vue.use(VueTimeago, {
  name: 'timeago',
  locale: 'en-US',
  locales: {
    'en-US': require('vue-timeago/locales/en-US.json')
  }
})

Vue.use(Vuetify)

Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
Vue.config.keyCodes.enter = null
/* eslint-disable no-new */
new Vue({
  components: {
    App
  },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
