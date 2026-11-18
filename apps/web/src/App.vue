<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import logo from './assets/jxnu-logo.png'

const route = useRoute()
</script>

<template>
  <div class="app">
    <header class="topbar">
      <RouterLink class="brand" to="/wall" title="CampusMesh 首页">
        <img :src="logo" class="brand-logo" alt="江西师范大学校徽" />
      </RouterLink>
      <nav class="nav">
        <RouterLink to="/wall">校园墙</RouterLink>
        <RouterLink to="/chat">私聊</RouterLink>
        <RouterLink to="/ai">AI 配置</RouterLink>
        <RouterLink to="/activities">二课</RouterLink>
      </nav>
      <span class="avatar" title="当前为匿名身份">匿</span>
    </header>

    <main class="main" :class="{ wide: ['/activities', '/chat'].includes(route.path) }">
      <RouterView />
    </main>

    <footer class="footer">CampusMesh · 第 8 组 · 2026</footer>
  </div>
</template>
