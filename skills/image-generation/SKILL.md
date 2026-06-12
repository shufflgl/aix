---
name: image-generation
description: Use when generating, refining, or comparing images with an available image-generation MCP server.
---

# Image Generation

Use the configured image-generation MCP server when the user asks to create, refine, rerank, or compare images.

## Workflow

1. Clarify the desired subject, style, aspect ratio, and output format when missing.
2. Prefer `rewrite_image_prompt` for vague prompts before generation.
3. Use `generate_image` for standard generation.
4. Use `generate_image_with_reference` when a reference image is provided.
5. Save generated files and return the path to the user.
