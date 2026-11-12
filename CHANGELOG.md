# Changelog

本文件记录 CampusMesh 的版本变更，格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循语义化版本。

## [Unreleased]

### Added

- 项目初始化：pnpm workspace、Vue 3 前端、Node.js 服务端
- 匿名身份与本地密钥
- 信令服务：房间创建、加入、SDP/ICE 转发
- 校园墙信息流与发帖
- WebRTC 1v1 私聊与本地消息存储
- AI 网关与流式对话

### Changed

- 无

### Fixed

- 无

### Security

- 私聊消息不落库；LLM 密钥仅服务端持有

## [0.1.0] - 2026-XX-XX

### Added

- Alpha 版本：匿名身份、校园墙 MVP、1v1 私聊、AI 对话、CI 流水线

### Known Limitations

- 未实现群聊与音视频
- 二课抓取仅覆盖公开页面
- 管理端仅支持基础审核

## [0.2.0] - 2026-XX-XX

### Added

- 评论、点赞、热度排序
- 举报与内容过滤
- AI 人设与技能配置
- 二课活动抓取、总结生成与导出
- 测试覆盖率 ≥40%

## [1.0.0] - 2026-XX-XX

### Added

- 安全与性能加固
- 完整文档与答辩材料
- 已知问题清单
