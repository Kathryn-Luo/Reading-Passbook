<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { t } = useI18n()
const localePath = useLocalePath()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: t('navbar.bookshelf'),
    to: localePath('index'),
    icon: 'i-lucide-square-menu',
  },
  {
    label: t('navbar.deposit'),
    to: localePath('finished'),
    icon: 'i-lucide-circle-plus',
  },
  {
    label: t('navbar.myBooks'),
    to: localePath('bookshelf'),
    icon: 'i-lucide-library',
  },
  {
    label: t('navbar.stats'),
    to: localePath('statistics'),
    icon: 'i-lucide-trending-up',
  },
  {
    label: t('navbar.profile'),
    to: localePath('profile'),
    icon: 'i-lucide-user-round',
  },
])
</script>

<template>
  <div>
    <USidebar
      rail
      variant="inset"
      :ui="{
        container: 'border-r-sand-300 bg-paper-canvas px-5 py-8',
      }"
    >
      <template #header>
        <BaseWordmark />
      </template>
      <UNavigationMenu
        orientation="vertical"
        :items="items"
        class="data-[orientation=vertical]:w-48"
      />
    </USidebar>
  </div>
</template>
