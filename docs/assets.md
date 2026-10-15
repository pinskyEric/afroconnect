# Bundled asset provenance

No remote assets are fetched by the running frontend. Original image downloads were resized locally to 96px, 350px, and 700px WebP derivatives; `Photo` chooses a source using `srcset` and `sizes`. Original JPEGs are retained as development sources.

## Sample portraits

Source host: `images.unsplash.com` (downloaded for this prototype).

| Local file                 | Source image ID                    |
| -------------------------- | ---------------------------------- |
| `amina.jpg`                | `photo-1531123897727-8f129e1688ce` |
| `kwame.jpg`                | `photo-1531384441138-2736e62e0919` |
| `zuri.jpg`                 | `photo-1534751516642-a1af1ef26a56` |
| `david.jpg`                | `photo-1506277886164-e25aa3f4ef7f` |
| `nia.jpg`                  | `photo-1524504388940-b1c1722653e1` |
| `james.jpg`                | `photo-1506794778202-cad84cf45f1d` |
| `amara.jpg`                | `photo-1526510747491-58f928ec870f` |
| `leo.jpg` (Sophie fixture) | `photo-1517841905240-472988babdf9` |

Example source URL: `https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=700&q=85`.

All profile identities and activity are fictional; no relationship to the photographed individuals is asserted. Review stock licensing, model-release and product-context suitability before any public/commercial launch, or replace with commissioned/consented assets. The photos do not substantiate ages, locations, affiliations or endorsement.

## Fonts

- **Manrope variable**, from the Google Fonts repository, `ofl/manrope/Manrope[wght].ttf`.
- **DM Sans variable**, from `ofl/dmsans/DMSans[opsz,wght].ttf`.
- Locally converted WOFF2 for delivery. SIL Open Font License texts are bundled in `public/fonts/licenses/`.

## Icons and marks

- Lucide React icons supplied through the npm dependency.
- The linked-conversation-bubble logo is an original CSS placeholder in `ui.tsx`; configurable local `brand.logo.asset` can replace it.
- SVG/PNG app icons are original placeholder marks, not a finalized brand identity. Recreate them from the final approved mark.
- Country flags use Unicode emoji; appearance depends on the user's OS. No precise location mapping is used.
