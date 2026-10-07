import type { DemoImage } from "./types";

// Shared scenes. Each one is used in more than one place (category tile, product
// galleries, the storefront), which keeps the asset plan small. A scene only appears in a
// product's gallery when that product is actually in the picture.

export const heroImage: DemoImage = {
  id: "hero-room",
  alt: "A sunlit living room with a linen throw on an oak bench, a ceramic lamp and a stoneware bowl on a low table.",
  ratio: "16/9",
  kind: "hero",
};

export const scenes = {
  tableware: {
    id: "scene-tableware",
    alt: "A breakfast table set with stoneware mugs, a low serving bowl and dinner plates in oat glaze.",
    ratio: "4/5",
    kind: "context",
  },
  textiles: {
    id: "scene-textiles",
    alt: "A washed linen throw folded over the arm of a sofa beside a linen cushion.",
    ratio: "4/5",
    kind: "context",
  },
  lighting: {
    id: "scene-lighting",
    alt: "A ceramic table lamp glowing on a sideboard at dusk, next to a brass candle holder.",
    ratio: "4/5",
    kind: "context",
  },
  objects: {
    id: "scene-objects",
    alt: "An oak tray on a hallway console holding a glazed bud vase with one stem and a small incense dish.",
    ratio: "4/5",
    kind: "context",
  },
  glazeDetail: {
    id: "detail-glaze",
    alt: "Close-up of the inside of the low serving bowl, showing the soft variation in the moss glaze.",
    ratio: "4/5",
    kind: "detail",
  },
  paperDetail: {
    id: "detail-paper",
    alt: "The paper pendant shade lit from inside, showing the texture of the paper.",
    ratio: "4/5",
    kind: "detail",
  },
} as const satisfies Record<string, DemoImage>;
