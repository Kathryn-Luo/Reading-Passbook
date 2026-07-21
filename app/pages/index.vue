<script setup>
const user = useSupabaseUser()
watch(user, () => {
  console.log(user.value)
  console.log(user.value?.sub)
}, { immediate: true })

const supabase = useSupabaseClient()
const localePath = useLocalePath()

const logout = async () => {
  await supabase.auth.signOut()
  navigateTo(localePath('/login'))
}
</script>

<template>
  <div>
    <div>
      Name: {{ user?.user_metadata?.name }}<br>
      Email: {{ user?.email }}<br>
      ID: {{ user?.sub }}
    </div>

    <div v-if="user">
      <button @click="logout">
        登出
      </button>
    </div>
    <div v-else>
      <button @click="navigateTo(localePath('/login'))">
        登入
      </button>
    </div>
  </div>
</template>
