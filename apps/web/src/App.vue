<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header class="topbar">
      <RouterLink class="brand" to="/wall">CampusMesh</RouterLink>
      <nav class="nav">
        <RouterLink to="/wall">校园墙</RouterLink>
        <RouterLink to="/chat">私聊</RouterLink>
        <RouterLink to="/ai">AI 配置</RouterLink>
        <RouterLink to="/activities">二课</RouterLink>
      </nav>
      <span class="badge">匿名模式</span>
    </header>

    <main class="main">
      <RouterView />
    </main>

    <footer class="footer">CampusMesh · 第 8 组 · 2026</footer>
  </div>
</template>
