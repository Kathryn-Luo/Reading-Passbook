<script lang="ts" setup>
import * as locales from '@nuxt/ui/locale'

const { finalizePendingLocaleChange, locale } = useI18n()

const onBeforeEnter = async () => {
  await finalizePendingLocaleChange()
}
</script>

<template>
  <UApp :locale="locales[locale]">
    <NuxtLayout>
      <NMain>
        <NuxtPage @before-enter="onBeforeEnter" />
      </NMain>
    </NuxtLayout>
  </UApp>
</template>
