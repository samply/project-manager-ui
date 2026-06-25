<template>
  <div id="app">
   <NavBar/>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
 import NavBar from "@/components/NavBar.vue";

export default defineComponent({
  components:{
  NavBar,
  }
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 300;
  src: url(assets/OpenSans-Light.woff2) format("woff2");
}

:root {
  background-color: #eaecef;
}

*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

#app {
  background-color: #eaecef;
  font-family: 'IBM Plex Sans', 'Open Sans', system-ui, sans-serif;
}
</style>
