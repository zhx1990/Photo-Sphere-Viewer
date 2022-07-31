<template>
  <a class="demo-gallery-item" :href="link">
    <img v-if="image" :src="image">
    <video v-if="video" :src="video" autoplay loop mute></video>
    <div class="demo-gallery-item-content">
      <slot></slot>
    </div>
  </a>
</template>

<script>
  export default {
    props: ['image', 'video', 'link'],
  };
</script>

<style lang="stylus">
  .demo-gallery-item
    width 280px
    margin-right 10px
    margin-bottom 10px
    box-shadow 0 0 10px rgba(0, 0, 0, 0.5)
    transition box-shadow .2s ease-in-out !important
    color inherit !important

    &:hover
      box-shadow 0 0 20px rgba(0, 0, 0, 0.8)
      text-decoration none !important

  .demo-gallery-item-content
    h3, p
      margin 1rem

    .header-anchor
      display none
</style>
