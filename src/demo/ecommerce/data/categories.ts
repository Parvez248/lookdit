import { scenes } from "./media";
import type { Category } from "./types";

/** In navigation and shop order. */
export const categories = [
  {
    slug: "tableware",
    name: "Tableware",
    description:
      "Stoneware for the table you use every day. Pieces are sized for ordinary meals, stack without fuss and are glazed to take daily washing.",
    image: scenes.tableware,
  },
  {
    slug: "textiles",
    name: "Textiles",
    description:
      "Washed linen and cotton waffle that soften with use. The colours stay close to the natural fibre, so pieces sit easily together.",
    image: scenes.textiles,
  },
  {
    slug: "lighting",
    name: "Lighting",
    description:
      "Lamps, shades and candlelight for the hours after dark. Each piece gives a warm, diffused light rather than a bright one.",
    image: scenes.lighting,
  },
  {
    slug: "objects",
    name: "Objects",
    description:
      "Small things that give a surface its order: a tray for the hallway, a vase for a single stem, a dish for the evening.",
    image: scenes.objects,
  },
] as const satisfies readonly Category[];
