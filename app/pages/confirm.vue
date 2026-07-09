<script setup lang="ts">
const user = useSupabaseUser()

watch(user, () => {
  console.log(user.value)
  if (user.value) navigateTo('/')
}, { immediate: true })
</script>

<template>
  <div>Waiting for login...</div>
</template>
