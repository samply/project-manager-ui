<template>
  <div>
    <nav class="navbar navbar-dark bg-dark" style="display:flex; align-content: flex-start; justify-content: space-between; padding-left:5%">
      <router-link style="margin-right:3%" class="navbar-brand" to="/">Project-Manager</router-link>
      <button @click="toggleSidebar" class="btn btn-dark" style="padding-right:2%"><i class="bi bi-chat-right-text-fill"></i></button>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'NavBar',
  methods: {
    toggleSidebar() {
      this.$store.commit('toggleSidebar');
    },
  },
};
</script>

<style scoped>
</style>
