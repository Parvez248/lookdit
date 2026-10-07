import { scenes } from "./media";
import type { DemoImage, Product } from "./types";

// Twelve fictional products. Every fact here (materials, sizes, prices) is invented for the
// LOOKDIT concept demo; none of it describes a real product or supplier.

const eur = (euros: number) => ({ amount: euros * 100, currency: "EUR" }) as const;

const packshot = (id: string, alt: string): DemoImage => ({ id, alt, ratio: "4/5", kind: "packshot" });

const mugOat = packshot("mug-oat", "Stoneware mug in oat glaze, three-quarter view.");
const mugSlate = packshot("mug-slate", "Stoneware mug in slate glaze, three-quarter view.");
const bowlOat = packshot("bowl-oat", "Low serving bowl in oat glaze, three-quarter view.");
const bowlMoss = packshot("bowl-moss", "Low serving bowl in moss glaze, three-quarter view.");
const lampChalk = packshot("lamp-chalk", "Ceramic table lamp with a chalk base and linen shade.");
const lampClay = packshot("lamp-clay", "Ceramic table lamp with a clay base and linen shade.");

export const products = [
  {
    slug: "stoneware-mug",
    title: "Stoneware Mug",
    category: "tableware",
    summary: "A straight-sided mug that holds a proper cup and sits well in the hand.",
    description:
      "The mug uses a substantial stoneware body for a steady feel in the hand and on the table. The handle leaves room for three fingers, and the unglazed foot ring keeps the base visually simple. It holds 300 ml, enough for a full cup of tea or a milky coffee, and the straight sides make it easy to stack two or three in a cupboard. The glaze breaks slightly at the rim, so no two are exactly alike.",
    details: {
      materials: "Stoneware with a satin glaze inside and out. Unglazed foot ring.",
      dimensions: "Height 9.5 cm, diameter 8.5 cm. Holds 300 ml.",
      care: "Dishwasher and microwave safe.",
    },
    price: eur(24),
    label: "New",
    images: [mugOat, scenes.tableware],
    options: [
      {
        name: "Colour",
        values: [
          { id: "oat", label: "Oat", swatch: "#D8CBB4", image: mugOat },
          { id: "slate", label: "Slate", swatch: "#5F6368", image: mugSlate },
        ],
      },
    ],
    metaDescription:
      "A 300 ml straight-sided stoneware mug with a satin glaze, in oat or slate. A fictional product from the Nidery concept demo.",
  },
  {
    slug: "low-serving-bowl",
    title: "Low Serving Bowl",
    category: "tableware",
    summary: "A wide, shallow bowl for salads, fruit or a shared dish in the middle of the table.",
    description:
      "Wide and low, the bowl is made for the middle of the table: a salad for four, roasted vegetables, or a pile of fruit on the counter between meals. The shallow curve makes serving easy, and the gently rolled rim gives your fingers something to hold when you pass it along. The glaze pools in the centre, where it turns slightly deeper in colour, and the outside is left matt for grip.",
    details: {
      materials: "Stoneware, glazed inside, matt exterior.",
      dimensions: "Diameter 30 cm, height 7 cm.",
      care: "Dishwasher safe. Avoid sudden temperature changes.",
    },
    price: eur(58),
    images: [bowlOat, scenes.glazeDetail, scenes.tableware],
    options: [
      {
        name: "Colour",
        values: [
          { id: "oat", label: "Oat", swatch: "#D8CBB4", image: bowlOat },
          { id: "moss", label: "Moss", swatch: "#6E7357", image: bowlMoss },
        ],
      },
    ],
    metaDescription:
      "A 30 cm low stoneware serving bowl for salads and shared dishes, in oat or moss glaze. A fictional product from the Nidery concept demo.",
  },
  {
    slug: "dinner-plate-pair",
    title: "Dinner Plates, Set of Two",
    category: "tableware",
    summary: "Two everyday dinner plates with a low lip that keeps sauces on the plate.",
    description:
      "These are plates for ordinary dinners rather than occasions. The 27 cm diameter fits a full meal without crowding the table, and a low lip around the edge keeps sauces where they belong. They are glazed in the same oat tone as the mug and bowl, so the pieces sit together without looking like a matched set. The plates stack flat and evenly, which matters more than it sounds when they live in the same cupboard every day.",
    details: {
      materials: "Stoneware with a satin oat glaze. Unglazed foot ring.",
      dimensions: "Diameter 27 cm, height 2.5 cm. Sold as a pair.",
      care: "Dishwasher and microwave safe.",
    },
    price: eur(46),
    images: [
      packshot("plates-oat", "Two stoneware dinner plates in oat glaze, stacked."),
      scenes.tableware,
    ],
    metaDescription:
      "A pair of 27 cm stoneware dinner plates in oat glaze, with a low lip for sauces. A fictional product from the Nidery concept demo.",
  },
  {
    slug: "linen-throw",
    title: "Washed Linen Throw",
    category: "textiles",
    summary: "A generous linen throw, washed until soft, for the sofa or the end of a bed.",
    description:
      "The throw is woven from a mid-weight linen and washed before it is finished, so it arrives soft and slightly creased rather than stiff. It is large enough to cover two people on a sofa, light enough to use in summer, and warm enough to layer over a duvet in winter. The edges are finished with a narrow hem instead of fringing, which keeps it neat after washing. Linen softens further with use, and creasing is part of the look.",
    details: {
      materials: "100% linen, stonewashed.",
      dimensions: "130 × 180 cm.",
      care: "Machine wash at 40 °C. Tumble dry low or line dry.",
    },
    price: eur(140),
    label: "New",
    images: [
      packshot("throw-sand", "Washed linen throw in a sand colour, folded."),
      scenes.textiles,
    ],
    metaDescription:
      "A 130 × 180 cm stonewashed linen throw in sand, soft from the first use. A fictional product from the Nidery concept demo.",
  },
  {
    slug: "linen-cushion-cover",
    title: "Linen Cushion Cover",
    category: "textiles",
    summary: "A plain linen cover with a hidden zip, in two sizes.",
    description:
      "A plain cover in the same washed linen as the throw, so the two can share a sofa without competing. The zip is hidden along the bottom seam, and the corners are cut to sit square rather than point outwards like ears. It comes in two common sizes so it fits the cushions you already have. The cover is sold on its own; the inner cushion is not included, which keeps it simple to replace or wash.",
    details: {
      materials: "100% linen, stonewashed. Concealed zip.",
      dimensions: "45 × 45 cm or 50 × 50 cm. Inner cushion not included.",
      care: "Machine wash at 40 °C inside out. Iron while damp if you prefer it smooth.",
    },
    price: eur(38),
    images: [
      packshot("cushion-sand", "Square linen cushion cover in sand, standing upright."),
      scenes.textiles,
    ],
    options: [
      {
        name: "Size",
        values: [
          { id: "45", label: "45 × 45 cm" },
          { id: "50", label: "50 × 50 cm" },
        ],
      },
    ],
    metaDescription:
      "A washed linen cushion cover in sand with a concealed zip, in 45 or 50 cm. A fictional product from the Nidery concept demo.",
  },
  {
    slug: "waffle-towel-set",
    title: "Waffle Hand Towels, Set of Two",
    category: "textiles",
    summary: "Light cotton waffle towels that dry quickly between uses.",
    description:
      "Waffle weave gives the towels a lighter, more open structure than terry towelling and lets them dry readily between uses. Each towel has a cotton loop sewn into one corner for hanging. The weave tightens a little after the first few washes, which gives it a denser feel. They come as a pair in a warm off-white.",
    details: {
      materials: "100% cotton waffle weave.",
      dimensions: "50 × 90 cm each. Sold as a pair.",
      care: "Machine wash at 60 °C. Avoid fabric softener, which reduces absorbency.",
    },
    price: eur(32),
    images: [
      packshot("towels-ecru", "Two folded cotton waffle hand towels in off-white with hanging loops."),
    ],
    metaDescription:
      "Two 50 × 90 cm cotton waffle hand towels in off-white that dry quickly. A fictional product from the Nidery concept demo.",
  },
  {
    slug: "ceramic-table-lamp",
    title: "Ceramic Table Lamp",
    category: "lighting",
    summary: "A rounded ceramic base with a linen shade that gives a soft, warm light.",
    description:
      "The lamp pairs a rounded ceramic base with a pale linen drum shade. The shade diffuses the bulb so the light falls evenly on a side table or a desk without glare. It is tall enough to read by from an armchair and compact enough for a bedside. The fabric cable is two metres long with an inline switch, so it can reach a socket behind a sofa. The base is glazed in one of two colours; the shade stays the same.",
    details: {
      materials: "Glazed ceramic base, linen shade, braided fabric cable.",
      dimensions: "Height 48 cm, shade diameter 30 cm. Cable 2 m.",
      care: "Dust with a dry cloth. Use an E27 LED bulb up to 8 W.",
    },
    price: eur(210),
    label: "New",
    images: [lampChalk, scenes.lighting],
    options: [
      {
        name: "Colour",
        values: [
          { id: "chalk", label: "Chalk", swatch: "#EEE8DD", image: lampChalk },
          { id: "clay", label: "Clay", swatch: "#B07455", image: lampClay },
        ],
      },
    ],
    metaDescription:
      "A 48 cm ceramic table lamp with a linen drum shade, in chalk or clay. A fictional product from the Nidery concept demo.",
  },
  {
    slug: "paper-pendant-shade",
    title: "Paper Pendant Shade",
    category: "lighting",
    summary: "A light paper shade that turns a bare ceiling bulb into a soft glow.",
    description:
      "A round paper shade on a thin wire frame, sized for a living room or hallway. The paper softens the light while keeping the form visually light. It folds flat for delivery and opens into shape for hanging. The shade is designed to pair with a separate pendant cable set and an LED bulb up to 8 W.",
    details: {
      materials: "Paper on a steel wire frame.",
      dimensions: "Diameter 50 cm. Folds flat.",
      care: "Dust gently with a soft brush. Keep away from moisture.",
    },
    price: eur(86),
    label: "Seasonal",
    images: [
      packshot("pendant-paper", "Round white paper pendant shade, unlit."),
      scenes.paperDetail,
    ],
    metaDescription:
      "A 50 cm round paper pendant shade that softens a ceiling light and folds flat. A fictional product from the Nidery concept demo.",
  },
  {
    slug: "brass-candle-holder",
    title: "Brass Candle Holder",
    category: "lighting",
    summary: "A small, heavy brass holder for a standard dinner candle.",
    description:
      "A solid brass holder with a wide, weighted base, so a tall dinner candle stands securely on a table or a windowsill. It is left unlacquered, which means it will slowly darken and take on a warmer tone over time; it can be polished back to bright if you prefer. The cup fits standard 2.2 cm dinner candles, and the low profile works on its own or as a pair at either end of a table.",
    details: {
      materials: "Solid unlacquered brass.",
      dimensions: "Height 6 cm, base diameter 9 cm. Fits 2.2 cm candles.",
      care: "Wipe with a dry cloth. Polish with brass cleaner if you want it bright.",
    },
    price: eur(34),
    images: [
      packshot("candle-brass", "Low solid brass candle holder with a white dinner candle."),
      scenes.lighting,
    ],
    metaDescription:
      "A solid, unlacquered brass holder for standard dinner candles, with a weighted base. A fictional product from the Nidery concept demo.",
  },
  {
    slug: "oak-serving-tray",
    title: "Oak Serving Tray",
    category: "objects",
    summary: "A rectangular oak tray with cut-out handles, for carrying or for keeping things together.",
    description:
      "The tray is cut from solid oak with shallow raised edges and two cut-out handles, so it can carry breakfast to the table or hold keys and post on a hallway console. The oil finish keeps the grain visible and is easy to refresh. Because it is solid wood, each tray has its own grain pattern and small colour differences. It is a useful size: large enough for two cups and a pot, small enough to clear away.",
    details: {
      materials: "Solid oak, oil finish.",
      dimensions: "45 × 30 cm, height 3 cm.",
      care: "Wipe clean and dry straight away. Re-oil occasionally. Not for the dishwasher.",
    },
    price: eur(72),
    label: "New",
    images: [
      packshot("tray-oak", "Rectangular oak serving tray with cut-out handles, empty."),
      scenes.objects,
    ],
    metaDescription:
      "A 45 × 30 cm solid oak serving tray with cut-out handles and an oil finish. A fictional product from the Nidery concept demo.",
  },
  {
    slug: "bud-vase",
    title: "Glazed Bud Vase",
    category: "objects",
    summary: "A small vase with a narrow neck that holds a single stem upright.",
    description:
      "A small vase for one or two stems: a branch from the garden, a single tulip or a few grasses. The narrow neck holds stems upright without arranging, and the weighted base keeps it steady on a windowsill or a shelf. The inside is fully glazed, so it holds water, and the outside has a soft speckled glaze that changes slightly from piece to piece. It is small enough to group two or three together.",
    details: {
      materials: "Stoneware, glazed inside and out.",
      dimensions: "Height 14 cm, diameter 7 cm.",
      care: "Rinse and dry after use. Hand wash.",
    },
    price: eur(28),
    label: "Seasonal",
    images: [
      packshot("vase-speckle", "Small speckled stoneware bud vase with a narrow neck."),
      scenes.objects,
    ],
    metaDescription:
      "A 14 cm speckled stoneware bud vase with a narrow neck for single stems. A fictional product from the Nidery concept demo.",
  },
  {
    slug: "incense-dish",
    title: "Stoneware Incense Dish",
    category: "objects",
    summary: "A small dish with a central hole that holds a stick of incense and catches the ash.",
    description:
      "A low, round dish with a small hole in the centre that holds a standard incense stick at an angle, and a wide surface that catches the ash as it burns. It doubles as a place for rings or a single candle when it is not in use. The glaze is a soft matt that is easy to wipe clean, and the unglazed base sits flat on a shelf or a windowsill.",
    details: {
      materials: "Stoneware with a matt glaze. Unglazed base.",
      dimensions: "Diameter 11 cm, height 2 cm.",
      care: "Wipe clean once cool. Hand wash.",
    },
    price: eur(18),
    images: [
      packshot("dish-matt", "Small round matt stoneware incense dish with a central hole."),
      scenes.objects,
    ],
    metaDescription:
      "An 11 cm matt stoneware incense dish that holds a stick and catches the ash. A fictional product from the Nidery concept demo.",
  },
] as const satisfies readonly Product[];
