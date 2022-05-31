import VueMaterial from 'vue-material';
import VSwatches from 'vue-swatches';
import VueSlider from 'vue-slider-component/dist-css/vue-slider-component.umd.min';

import 'vue-material/dist/theme/default.css'
import 'vue-material/dist/vue-material.min.css'
import 'vue-slider-component/dist-css/vue-slider-component.css';
import 'vue-slider-component/theme/material.css'
import 'vue-swatches/dist/vue-swatches.css';

window.global = window;

export default ({ Vue, router }) => {
  Vue.use(VueMaterial);
  Vue.component('v-swatches', VSwatches);
  Vue.component('vue-slider', VueSlider);

  router.beforeEach((to, from, next) => {
    if (/^\/api/.test(to.fullPath)) {
      window.location.href  = `${to.path}.html${to.hash}`;
      next(false);
    } else {
      next();
    }
  });
};
