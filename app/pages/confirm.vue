<script setup lang="ts">
// 登入確認頁不進行語系切換
defineI18nRoute(false)

const user = useSupabaseUser()

watch(user, () => {
  console.log(user.value)
  if (user.value) navigateTo('/')
}, { immediate: true })
</script>

<template>
  <div>Waiting for login...</div>
</template>
