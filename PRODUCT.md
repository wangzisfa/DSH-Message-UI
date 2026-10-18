# Agentarium

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
依据 PRD 与本次技术调研：React + TypeScript + Vite + ascii.rest。用户已选择独立网页 demo，附 dsh 插件入口。

## Users
使用 dsh 执行复杂任务的开发者；需要看清谁在做什么、哪里失败、证据在哪里。

## Product Purpose
将真实会话事实投影到 ASCII 智能体基地，以事件列表和检查器提供可追溯证据。

## Capabilities and Constraints
以 docs/PRD.md 为需求真源。只读观察，不改变 Agent 执行；不虚构百分比、依赖或子任务内部活动。演示数据必须持续标注 DEMO。外部任务未知、部分历史、连接失效必须明确呈现。此次交付是原型，不宣称已通过真实 dsh MVP 验收。

## Brand Commitments
PRD 已指定 Terminal Colony、深色 ASCII 基地、无图片、中文 HTML 标签与半角字符场景。

## Accessibility & Inclusion
键盘可访问 DOM 交互层；尊重减少动效；状态同时使用文字，不依赖颜色。

## Evidence on Hand
docs/PRD.md；官方 dsh 源码与 ascii.rest 文档；合成 fixture 只用于明确标记的演示。
