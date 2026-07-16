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

// 導向至原本語言的首頁
useLoginRedirect()
</script>

<template>
  <div>
    <UButton @click="signInWithGoogle">
      Google Login
    </UButton>
  </div>
</template>
