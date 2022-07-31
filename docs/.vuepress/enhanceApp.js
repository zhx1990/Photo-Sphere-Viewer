import VueMaterial from 'vue-material';
import VSwatches from 'vue-swatches';
import VueSlider from 'vue-slider-component/dist-css/vue-slider-component.umd.min';
import NoSSR from 'vue-no-ssr';

import 'vue-material/dist/theme/default.css'
import 'vue-material/dist/vue-material.min.css'
import 'vue-slider-component/dist-css/vue-slider-component.css';
import 'vue-slider-component/theme/material.css'
import 'vue-swatches/dist/vue-swatches.css';

export default ({ Vue, router }) => {
  Vue.use(VueMaterial);
  Vue.component('v-swatches', VSwatches);
  Vue.component('vue-slider', VueSlider);
  Vue.component('no-ssr', NoSSR);

  router.beforeEach((to, from, next) => {
    if (/^\/api/.test(to.fullPath)) {
      window.location.href  = `${to.path}.html${to.hash}`;
      next(false);
    } else {
      next();
    }
  });
};
