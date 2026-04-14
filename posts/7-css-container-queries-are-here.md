---
id: 7
title: "CSS Container Queries Are Here"
date: 2026-04-12
excerpt: "Responsive design just got a lot more powerful. Learn how container queries let components adapt to their own size, not just the viewport."
coverImage: "https://images.unsplash.com/photo-1507721999472-7471a7c967f3?w=800&h=400&fit=crop"
categories: ["Tutorials", "Design"]
tags: ["css", "responsive-design", "container-queries", "components"]
---

For over a decade, responsive design has meant media queries — adapting layouts based on the viewport width. It works, but it has a fundamental flaw: components don't know about their own container's size.

## The Problem with Media Queries

A sidebar widget and a main-content widget might use the same component, but if the sidebar is only 250px wide, the component designed for 800px breaks. We've solved this with hacks like JavaScript resize listeners or duplicating components with different modifier classes.

## Enter Container Queries

Container queries let a component respond to the size of its parent container instead of the viewport. You define a containment context with `container-type: inline-size`, then query it with `@container (min-width: 400px)`.

## Real-World Example

A card component can show a horizontal layout in a wide container and stack vertically in a narrow one — all without knowing where it's placed in the page. This makes components truly reusable across different layouts.

Container queries are now supported in all major browsers. If you're still relying solely on media queries, you're leaving responsive power on the table.

<!-- cn -->

十多年来，响应式设计一直意味着媒体查询——根据视口宽度调整布局。它有效，但有一个根本性缺陷：组件不知道自己容器的大小。

## 媒体查询的问题

侧边栏和主内容区可能使用同一个组件，但如果侧边栏只有 250px 宽，为 800px 设计的组件就会崩溃。我们一直用 JavaScript resize 监听器或复制不同修饰类名的组件来变通解决。

## 容器查询来了

容器查询让组件根据父容器的大小来响应，而不是视口。你用 `container-type: inline-size` 定义容器上下文，然后用 `@container (min-width: 400px)` 来查询。

## 实际例子

一个卡片组件可以在宽容器中显示水平布局，在窄容器中堆叠垂直布局——完全不需要知道它在页面中的位置。这让组件在不同布局中真正可复用。

容器查询现在已被所有主流浏览器支持。如果你仍然只依赖媒体查询，你就浪费了响应式设计的更多能力。
