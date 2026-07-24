<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <div>
    <BaseSidebar />
    <div>
      locale: {{ locale }}<br>
      <NuxtLink
        v-for="l in locales"
        :key="l.code"
        :to="switchLocalePath(l.code)"
        :class="{ 'text-primary font-bold': l.code === locale }"
      >
        {{ l.name }}
      </NuxtLink>
    </div>
    <div>
      <slot />
    </div>
  </div>
</template>
