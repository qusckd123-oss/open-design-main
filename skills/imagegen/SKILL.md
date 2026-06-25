---
name: "imagegen"
description: "Project-local image generation prompt reviewer and execution policy. Use this skill whenever the user mentions imagegen, $imagegen, Image 2.0, asks to generate or edit raster images, wants a prompt checked/improved before image creation, asks for product/editorial/fashion/marketing visuals, transparent-background cutouts, thumbnails, posters, mockups, or image assets for a web/app project. Review and strengthen the prompt first, then use only the built-in image_gen tool through the current authenticated Codex session. Do not use API/CLI fallback, OPENAI_API_KEY, ima2, or local ComfyUI in this project."
---

# Project Imagegen Skill

Use this skill whenever the user mentions `imagegen`, `$imagegen`, "Image 2.0",
asks to generate/edit raster imagery in this project, or asks to inspect,
rewrite, improve, or validate an image prompt.

This skill has two jobs:

1. Turn rough user intent into a clear image-generation prompt.
2. Enforce this project's built-in-only generation path.

## Hard rule for this project

Use only the built-in `image_gen` tool through the current authenticated Codex
session.

Do **not** use:

- OpenAI API calls, SDK runners, or `OPENAI_API_KEY`
- `scripts/image_gen.py` CLI fallback
- `ima2`, the OD imagegen daemon bridge, or `ima2` CLI
- local ComfyUI / SD / SDXL / Flux HTTP workflows
- one-off shell scripts that call image APIs

If a user explicitly asks for API, CLI, `ima2`, or ComfyUI, say that this
project is configured for built-in authenticated image generation only, then
ask for confirmation before using any other path.

## Operating modes

Choose the mode from the user's request:

- **Prompt review only**: If the user asks to check, audit, fix, improve, or
  rewrite a prompt, return the reviewed prompt plus a short issue list. Do not
  generate an image unless the user also asks to generate.
- **Generate from prompt**: If the user asks to create an image, silently repair
  minor prompt gaps and call the built-in `image_gen` tool.
- **Edit existing image**: If the user provides or references an existing
  raster image and asks for changes, use the built-in `image_gen` editing path.
- **Project asset**: If the image will be used in HTML, CSS, docs, slides, or
  app UI, generate first, then copy the selected output into the project and
  reference the project-local copy.

Ask a follow-up only when a missing detail would materially change the result:
subject identity, product type, required aspect ratio, text that must appear,
brand/legal constraints, or whether the output should be transparent.

## Model wording

The built-in tool does not expose a model-selection parameter. If the user says
`gpt-image-2`, `gpt-image-2.0`, or "Image 2.0", treat it as a quality target in
the prompt rather than as permission to use API/CLI.

## Save-path policy

Built-in outputs are saved under `$CODEX_HOME/generated_images/...` by default.
For project-bound work:

1. Generate with built-in `image_gen`.
2. Copy the selected output into the project, usually under `images/`.
3. Leave the original generated file in place.
4. Reference only the project-local copy from HTML/CSS/docs.

Do not reference `$CODEX_HOME`, temp paths, external image URLs, or base64 blobs
from final project artifacts.

## Prompt review checklist

Before generating, check whether the prompt has enough information in these
areas. Add reasonable defaults when the user did not specify them.

- **Purpose**: Where the image will be used: hero image, product card, poster,
  social post, thumbnail, slide, mockup, icon, texture, cutout, reference image.
- **Subject**: Main object/person/scene, important attributes, pose/action,
  garment/product details, scale, and relationship between subjects.
- **Context**: Background, environment, surface, time of day, season, culture,
  market, or campaign setting.
- **Style**: Photo, editorial, fashion lookbook, 3D render, illustration,
  cinematic, catalog, flat lay, UI asset, isometric, pixel art, etc.
- **Composition**: Aspect ratio, crop, camera angle, focal length feel, margins,
  negative space, centered/off-center layout, safe space for text.
- **Lighting and color**: Mood, contrast, color palette, material response,
  shadows, reflections, and texture visibility.
- **Constraints**: What must remain, what must be excluded, text/logo rules,
  brand safety, hands/limbs/anatomy risks, transparency needs.
- **Deliverable handling**: Whether to generate only, edit an existing image,
  or copy into a project asset folder after generation.

When reviewing a prompt for the user, use this compact format:

```text
Prompt status: Ready / Needs clarification / Risky
Main issues:
- <issue and why it matters>

Improved prompt:
<structured image prompt>

Optional variants:
- <variant direction, if useful>
```

Keep the review short. Do not turn prompt review into a long design essay.

## Prompt shape

Use compact structured prompts:

```text
Use case: <asset taxonomy slug>
Asset type: <where this asset will be used>
Primary request: <main request>
Scene/backdrop: <environment>
Subject: <main subject>
Style/medium: <photo / illustration / 3D / etc>
Composition/framing: <crop, camera, margins>
Lighting/mood: <lighting and mood>
Color palette: <palette notes>
Materials/textures: <surface and garment details>
Constraints: <must keep / must avoid>
Avoid: <negative constraints>
```

Prefer concrete visual nouns over abstract adjectives. For example, replace
"premium mood" with visible cues such as brushed aluminum, sharp rim light,
subtle shadows, restrained palette, or gallery-like spacing.

For fashion/editorial images, always include `no logos, no readable text, no
watermark, no distorted hands, no extra limbs` unless the user explicitly wants
text or branding.

For product or ecommerce images, include clean product silhouette, accurate
materials, readable shape, controlled reflections, no fake labels, no brand
marks unless provided by the user, and enough margin for cropping.

For web/app assets, include the intended aspect ratio or layout role, safe
negative space, and avoid tiny unreadable UI text in the generated image.

## Quality guardrails

Strengthen prompts to reduce common generation failures:

- Specify "no readable text" unless exact text is explicitly requested.
- Avoid asking for many small objects that must be individually accurate.
- Avoid contradictory style instructions such as "minimalist maximalist" unless
  the contrast is intentional and explained.
- Do not request living artists' exact styles. Use medium, era, composition,
  lighting, and material language instead.
- For people, specify natural anatomy, realistic hands when visible, no extra
  fingers, no extra limbs, and believable eye direction.
- For transparent assets, avoid white-on-white subjects and use a chroma-key
  background workflow.

## Transparent images

For transparent-background requests, use the built-in-first chroma-key workflow:

1. Generate the subject on a flat chroma-key background.
2. Copy the generated source image into the project or `tmp/imagegen/`.
3. Run
   `$CODEX_HOME/skills/.system/imagegen/scripts/remove_chroma_key.py`.
4. Validate alpha, transparent corners, and edge quality.

Do not switch to CLI true-transparent output unless the user explicitly
confirms a policy exception.

## Examples

**Rough user request**

```text
make a cool image for a fashion landing page, black jacket
```

**Improved prompt**

```text
Use case: fashion-landing-hero
Asset type: website hero image, wide desktop crop with mobile-safe center
Primary request: editorial fashion image featuring a black technical jacket
Scene/backdrop: quiet urban studio set with concrete floor and soft gray wall
Subject: one model wearing an oversized black technical jacket, clean silhouette,
front three-quarter pose, jacket texture and seams clearly visible
Style/medium: high-end editorial photography
Composition/framing: 16:9, subject slightly right of center, generous negative
space on left for headline, waist-up crop, no text in image
Lighting/mood: softbox key light, subtle rim light, calm premium mood
Color palette: black, charcoal, cool gray, small silver hardware accents
Materials/textures: matte nylon shell, taped seams, brushed metal zipper pulls
Constraints: no logos, no readable text, no watermark, natural hands
Avoid: distorted hands, extra limbs, fake brand marks, cluttered background
```

**Prompt review response**

```text
Prompt status: Ready
Main issues:
- The original prompt did not define layout, crop, or brand/text constraints.

Improved prompt:
<structured prompt>
```
