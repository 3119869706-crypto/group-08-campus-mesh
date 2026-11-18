<template>
  <section class="card">
    <h1>二课工具</h1>
    <p class="muted">
      这里将展示二课活动列表、活动详情与 AI 总结生成。当前为脚手架占位页，功能在 Issue #16 / #17 实现。
    </p>
    <div class="placeholder">
      <p>活动列表：待接入 GET /api/v1/activities</p>
      <p>总结生成：待接入 POST /api/v1/summaries</p>
    </div>
  </section>
</template>

<style scoped>
.placeholder {
  margin-top: 16px;
  padding: 20px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  color: var(--gray);
  font-size: 14px;
}
</style>
