# I Do Transportation Website Modernization Mockup

Static front-end mockup for modernizing [idotransportation.com](https://idotransportation.com/).

## What This Is

This is a dependency-free HTML/CSS/JS prototype. Open `index.html` directly in a browser to view it.

The mockup reframes the current site into a clearer booking funnel:

- Cinematic venue slideshow above the fold
- Package cards for weddings, airports, and events
- Fleet gallery using the client's current vehicle photos
- Venue familiarity section for wedding confidence
- Short quote form ready for future backend and AI planning work

## Future AI Handoff Points

The markup includes `data-ai-hook` attributes where future AI/backend features can attach:

- `data-ai-hook="package-summary"` for package recommendation or itinerary generation
- `data-ai-hook="lead-intake"` for lead capture, CRM routing, and AI trip-plan drafting

## Source Content Used

- Current homepage, fleet, packages, venues, and contact content from `idotransportation.com`
- Public client images downloaded from the existing WordPress media library
- Public phone and service details visible on the current site assets

## Design Direction

**Refined wedding-concierge.** The visual system uses venue photography, editorial serif headlines, crisp black/ivory structure, champagne accents, and restrained motion. The goal is to feel premium and organized without losing the family-owned local tone.

## Notes

The form does not submit anywhere yet. In production, wire it to the backend/CRM, add validation, event tracking, and connect the AI itinerary planner after submission.
