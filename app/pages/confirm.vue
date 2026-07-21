<script setup lang="ts">
useHead({ meta: [{ name: 'robots', content: 'noindex' }] })

// 登入後導向至原本語言的首頁
useLoginRedirect()
</script>

<template>
  <div>Waiting for login...</div>
</template>
