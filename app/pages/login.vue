<script lang="ts" setup>
const supabase = useSupabaseClient()

async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/confirm`,
    },
  })
  if (error) console.error(error)
}

// 如果已登入，導向至首頁
const user = useSupabaseUser()
watch(user, () => {
  if (user.value) {
    navigateTo('/')
  }
}, { immediate: true })
</script>

<template>
  <div>
    <button @click="signInWithGoogle">Google Login</button>
  </div>
</template>
