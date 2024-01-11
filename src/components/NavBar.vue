<template>
  <div>
  <nav class="navbar navbar-dark bg-dark" style="display:flex; align-content: flex-start; justify-content: flex-start; padding-left:5%">
    <router-link style="margin-right:3%" class="navbar-brand" to="/"  >Project-Manager</router-link>
<!--
    <router-link class="navbar-brand" to="/request-form">New Request Form</router-link>
-->
    <router-link class="navbar-brand" to="/">Main Dashboard</router-link>
  </nav>
  </div>
</template>

<script>
export default {
  name: 'NavBar',
};
</script>

<style scoped>
/* Hier kommt Ihr Styles-Code */
</style>
