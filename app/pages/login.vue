<script lang="ts" setup>
useHead({ meta: [{ name: 'robots', content: 'noindex' }] })

const supabase = useSupabaseClient()
const localePath = useLocalePath()

async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${localePath('/confirm')}`,
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
