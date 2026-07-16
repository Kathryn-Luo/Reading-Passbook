<script lang="ts" setup>
// 登入頁不進行語系切換
defineI18nRoute(false)

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
    <UButton @click="signInWithGoogle">
      Google Login
    </UButton>
  </div>
</template>
