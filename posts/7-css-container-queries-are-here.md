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
