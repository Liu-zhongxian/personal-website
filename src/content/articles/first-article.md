---
title: "如何使用 Astro 搭建个人网站"
description: "详细介绍如何使用 Astro 框架搭建个人网站并部署到 GitHub Pages。"
pubDate: 2026-04-28
originalUrl: "https://blog.csdn.net/example/article/123"
category: "前端开发"
---

## 概述

Astro 是一个现代化的静态站点生成器，非常适合构建内容驱动的网站。

## 为什么选择 Astro

1. **零 JS 默认** - 页面默认不发送 JavaScript
2. **内容集合** - 类型安全的内容管理
3. **岛屿架构** - 按需加载交互组件

## 开始使用

```bash
npm create astro@latest my-site
cd my-site
npm run dev
```

## 部署到 GitHub Pages

配置 `astro.config.mjs` 并使用 GitHub Actions 自动部署。
