<template>
    <md-tabs md-elevation="1" md-alignment="left" class="demo-tabs md-primary">
        <template slot="md-tab" slot-scope="{ tab }">
            <span class="md-tab-label" v-if="tab.label">{{ tab.label }}</span>
            <ServiceButton
                v-if="tab.data.service"
                :service="tab.data.service"
                :title="title"
                :js="js"
                :css="css"
                :html="html"
                :packages="packages"
            >
            </ServiceButton>
        </template>

        <md-tab md-label="Result">
            <div v-if="!show" class="demo-loader">
                <button v-on:click="show = true">Load demo</button>
            </div>

            <iframe
                class="demo-runner"
                v-if="show && srcdoc"
                v-bind:srcdoc="srcdoc"
                allowfullscreen="allowfullscreen"
                allow="vr; xr; accelerometer; gyroscope; webvr; webxr;"
                frameborder="0"
            ></iframe>
        </md-tab>

        <md-tab md-label="Source">
            <div class="demo-source">
                <slot name="demo"></slot>
            </div>
        </md-tab>

        <md-tab
            v-for="service in SERVICES"
            :key="service"
            :md-template-data="{ service: service }"
            v-on:click="$event.stopImmediatePropagation()"
        >
        </md-tab>
    </md-tabs>
</template>

<script>
import { SERVICES } from './constants';
import ServiceButton from './ServiceButton';
import { getFullCss, getFullHtml, getFullJs, getFullPackages, getIframeContent } from './utils';

export default {
    name: 'CodeDemo',
    components: { ServiceButton },
    props: {
        autoload: { type: String, default: 'false' },
        title: { type: String, default: '' },
        version: { type: String, default: '' },
        rawHtml: { type: String, default: '' },
        rawJs: { type: String, default: '' },
        rawCss: { type: String, default: '' },
        rawPackages: { type: String, default: '' },
    },
    data() {
        return {
            SERVICES: SERVICES,
            show: false,
        };
    },
    created() {
        this.show = this.autoload === 'true';
    },
    computed: {
        html() {
            return getFullHtml(decodeURIComponent(this.rawHtml));
        },
        js() {
            return getFullJs(decodeURIComponent(this.rawJs));
        },
        css() {
            return getFullCss(decodeURIComponent(this.rawCss));
        },
        packages() {
            return getFullPackages(this.version, JSON.parse(decodeURIComponent(this.rawPackages)));
        },
        srcdoc() {
            return getIframeContent({
                title: this.title,
                html: this.html,
                js: this.js,
                css: this.css,
                packages: this.packages,
            });
        },
    },
};
</script>

<style lang="stylus">
$height = 540px

.demo-tabs
  .md-tab
    padding 0

  .md-tab-nav-button:nth-child(3)
    margin-left auto

  [class^=language-]
    margin 1rem

  .language-yaml
    display none

  pre
    margin 0 !important

.demo-runner
  width 100%
  height $height !important

.demo-source
  height $height
  overflow auto

.demo-loader
  width 100%
  height $height
  display flex
  justify-content center
  align-items center
  background radial-gradient(#fff 0%, #fdfdfd 16%, #fbfbfb 33%, #f8f8f8 49%, #efefef 66%, #dfdfdf 82%, #bfbfbf 100%)

  button
    font-size 1.2rem
    text-transform uppercase
    padding 0.5em 1em
    background #448aff
    color white
    border none
    border-radius 6px
    cursor pointer
    box-shadow 0 0 20px rgba(0, 0, 0, 0.5)
    transition background ease-in-out .2s

    &:hover
      background #5494ff
</style>
