<template>
    <form target="_blank" :action="actionUrl" method="post">
        <template v-if="service === 'codepen'">
            <input type="hidden" name="data" :value="codepenValue" />
        </template>

        <template v-if="service === 'jsfiddle'">
            <input type="hidden" name="title" :value="jsFiddleValue.title" />
            <input type="hidden" name="js" :value="jsFiddleValue.js" />
            <input type="hidden" name="css" :value="jsFiddleValue.css" />
            <input type="hidden" name="html" :value="jsFiddleValue.html" />
        </template>

        <template v-if="service === 'codesandbox'">
            <input type="hidden" name="parameters" :value="codeSandboxValue" />
        </template>

        <button type="submit" class="service-button">
            <i class="md-icon" v-html="icon"></i>
            <md-tooltip md-direction="top">{{ tooltip }}</md-tooltip>
        </button>
    </form>
</template>

<script>
import { SERVICE_ICON, SERVICE_NAME, SERVICE_URL, SERVICES } from './constants';
import { getCodePenValue, getCodeSandboxValue, getJsFiddleValue } from './utils';

export default {
    name: 'ServiceButton',
    props: {
        title: { type: String, default: '' },
        js: { type: String, default: '' },
        css: { type: String, default: '' },
        html: { type: String, default: '' },
        packages: { type: Array, default: [] },
        service: {
            type: String,
            required: true,
            validator: (val) => SERVICES.indexOf(val) !== -1,
        },
    },
    computed: {
        icon() {
            return SERVICE_ICON[this.service];
        },
        tooltip() {
            return SERVICE_NAME[this.service];
        },
        actionUrl() {
            return SERVICE_URL[this.service];
        },

        jsFiddleValue() {
            return getJsFiddleValue({
                title: this.title,
                js: this.js,
                css: this.css,
                html: this.html,
                packages: this.packages,
            });
        },
        codepenValue() {
            return getCodePenValue({
                title: this.title,
                js: this.js,
                css: this.css,
                html: this.html,
                packages: this.packages,
            });
        },
        codeSandboxValue() {
            return getCodeSandboxValue({
                title: this.title,
                js: this.js,
                css: this.css,
                html: this.html,
                packages: this.packages,
            });
        },
    },
};
</script>

<style lang="stylus">
.service-button
  display block
  background none
  border none
  padding 0
  position absolute
  top 0
  bottom 0
  left 0
  width 100%
  cursor pointer
</style>
