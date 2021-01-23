import { MdButton, MdCheckbox, MdField } from 'vue-material/dist/components';
import VSwatches from 'vue-swatches';
import VueSlider from 'vue-slider-component'

import 'vue-material/dist/theme/default.css'
import 'vue-material/dist/vue-material.min.css'
import 'vue-slider-component/theme/antd.css'
import 'vue-swatches/dist/vue-swatches.css';

export default ({ Vue, router }) => {
  Vue.use(MdField);
  Vue.use(MdButton);
  Vue.use(MdCheckbox);
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
