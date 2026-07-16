<script setup lang="ts">
// 登入確認頁不進行語系切換
defineI18nRoute(false)

// 登入後導向至原本語言的首頁
useLoginRedirect()
</script>

<template>
  <div>Waiting for login...</div>
</template>
