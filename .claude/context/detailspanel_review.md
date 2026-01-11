First: the core UX truth (important)

You are designing for two reading modes:

Visual intrigue → “Whoa, what is this?”

Analytical deep dive → “Tell me everything.”

Your media hierarchy should serve both, without forcing vertical scrolling too early.

🥇 Strong recommendation: Split hero layout (horizontal)

Hero image on the left, content on the right

Then supporting media below, not inline.

This is the pattern used by:

Museum exhibit kiosks

Documentary platforms

High-end editorial layouts

Knowledge exploration tools

Why this beats pure vertical

Uses horizontal space efficiently (especially desktop)

Instantly cinematic

Reduces perceived scroll length

Feels intentional and premium

Recommended layout structure
🧩 Top section (above the fold)
```
┌──────────────────────────────────────────────┐
│  ┌───────────────┐  ┌─────────────────────┐ │
│  │               │  │ Codex Gigas          │ │
│  │   HERO IMAGE  │  │ Partially Resolved   │ │
│  │               │  │ Confidence ▓▓▓▓░░░  │ │
│  │               │  │ AD1200 – AD1220      │ │
│  │               │  │                     │ │
│  │               │  │ “Why this matters”  │ │
│  │               │  │ short hook text     │ │
│  └───────────────┘  └─────────────────────┘ │
└──────────────────────────────────────────────┘
```

Hero image rules

16:9 or 4:3

No carousel here

One iconic image only

Subtle gradient overlay bottom-left (for text safety)

Metadata placement (important UX detail)
❌ Don’t overlay everything on the image

That feels “travel website”.

✅ Do this instead:

Title + badges on the right

Optional tiny caption overlay on image bottom-left:

“Illustration from the Codex Gigas manuscript”

This keeps the image sacred.

Supporting images: carousel strip

Place this directly below the hero row.

Media
```
┌────────┬────────┬────────┬────────┐
│ thumb  │ thumb  │ thumb  │ thumb  │ → scroll
└────────┴────────┴────────┴────────┘
```

Clicking a thumbnail:

Expands to lightbox

Or temporarily replaces hero image

Keyboard navigation (← →) is a nice touch

This keeps the main layout stable.

Video section: collapsed by default (pro move)

Instead of embedding immediately:

▶ Watch Analysis Videos (2)


On expand:

One embedded video at a time

Others as selectable thumbnails

Why:

Prevents iframe overload

Keeps the page feeling light

Respects users who don’t want autoplay noise

Content flow after media

Once the visual hook is done, then go vertical:

Description

Locations / Time / Categories (chips)

Similar Mysteries

At this point, scrolling feels earned.

Alternative (good, but second best): Vertical with hero

If you want a simpler version:

[ HERO IMAGE ]
Title + metadata
Carousel
Details
Similar


This is fine — but:

Feels more blog-like

Less “tool”, more “article”

Longer scroll

Still acceptable, just not as premium.

Why NOT full-width hero inside modal

Avoid:

Full-bleed image pushing content down

Title overlay centered

That reads as:

Marketing page

Article header

Less interactive

Your app is exploratory, not editorial.

Small details that scream “high quality”
✨ Micro-interactions

Hero image fades in

Carousel snaps smoothly

Confidence bar animates

🎨 Visual consistency

Same corner radius for:

Images

Cards

Modal

Same spacing rhythm (8 / 16 / 24)

🧠 Information density control

Collapse secondary sections

Progressive disclosure

Never show everything at once

One subtle but powerful idea
“Focus Mode” toggle (optional)

A small icon near the top:

Default: hero + content

Focus mode: hero image expands, content dims

This lets users just look before reading.

Final recommendation (clear answer)

Yes, go with:

Horizontal split hero

Supporting image carousel below

Videos collapsed

Vertical content after

This will:

Shorten perceived length

Increase visual impact

Feel professional, not experimental

Scale beautifully as content grows

If you want, next I can:

Sketch a React component breakdown

Suggest Tailwind / CSS Grid values

Help you decide modal max-width

Review spacing & typography choices

You’re very close to something that feels museum-grade rather than “cool side project”.