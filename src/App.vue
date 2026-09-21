<template>
  <div id="app">
    <NavBar/>
    <ActionFeedbackToast/>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import ActionFeedbackToast from '@/components/ActionFeedbackToast.vue';
import NavBar from '@/components/NavBar.vue';

export default defineComponent({
  components: {
    ActionFeedbackToast,
    NavBar,
  },
});
</script>

<style>
#app {
  background-color: #EEEEEE;
  font-family: Open Sans, sans-serif;
}
@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 300;
  src: url(assets/OpenSans-Light.woff2) format("woff2");
}

:root {
  background-color: #EEEEEE;
  /* Shared, subdued status palette - used wherever red/green/yellow signal
     success/warning/danger, so the meaning reads consistently across the app. */
  --status-success-color: #3f8f45;
  --status-warning-color: #e0ab18;
  --status-danger-color: #c0504d;
}
*, *::before, *::after {
  box-sizing: border-box;
}
html, body {
  margin: 0;
  padding: 0;
}
</style>
