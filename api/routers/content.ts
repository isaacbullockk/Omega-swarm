import { z } from "zod";
import { router, publicProcedure } from "../trpc";

// Isaac's real content — pre-seeded from uploaded Instagram photos
const contentStore: {
  id: string;
  title: string;
  caption: string;
  type: "social" | "video" | "ad" | "blog" | "asset";
  status: "published" | "draft" | "scheduled";
  date: string;
  account: string;
  imageUrl: string;
  tags: string[];
}[] = [
  {
    id: "real_1",
    title: "Vivid Sessions Portrait",
    caption: "o.l.v Isaac Bullock — live at Vivid Sessions. Photo by C. Merkwerk.",
    type: "asset",
    status: "published",
    date: "2024-03-15",
    account: "@isaacbullockk",
    imageUrl: "/content/102345027_2939870029443504_7778214376430821399_n.jpg",
    tags: ["live", "portrait", "vivid-sessions"],
  },
  {
    id: "real_2",
    title: "Beach Sessions",
    caption: "Golden hour vibes with the guitar. Wildnoff Collective.",
    type: "asset",
    status: "published",
    date: "2024-06-22",
    account: "@isaacbullockk",
    imageUrl: "/content/130910013_3463854663711702_5608475546025676349_n.jpg",
    tags: ["beach", "guitar", "golden-hour"],
  },
  {
    id: "real_3",
    title: "Acoustic Live",
    caption: "Stripped back, raw energy. Acoustic set with the crew.",
    type: "asset",
    status: "published",
    date: "2024-08-10",
    account: "@wildnoff",
    imageUrl: "/content/463594155_8363408677089585_6726992817739484624_n.jpg",
    tags: ["acoustic", "live", "performance"],
  },
  {
    id: "real_4",
    title: "P60 Live — Paul Gabel",
    caption: "On stage at P60. Photo by Paul Gabel. Full band energy.",
    type: "asset",
    status: "published",
    date: "2024-09-05",
    account: "@isaacbullockk",
    imageUrl: "/content/475277015_2834959010016146_3360754744358761085_n.jpg",
    tags: ["p60", "stage", "band", "paul-gabel"],
  },
  {
    id: "real_5",
    title: "Wildnoff Street",
    caption: "City lights, wild heart. Wildnoff Collective on the streets.",
    type: "asset",
    status: "published",
    date: "2024-10-12",
    account: "@wildnoff",
    imageUrl: "/content/484860228_1263783455752744_821357805307192301_n.jpg",
    tags: ["street", "urban", "wildnoff"],
  },
  {
    id: "real_6",
    title: "Studio Flow",
    caption: "Late night studio session. Creating the next drop.",
    type: "asset",
    status: "published",
    date: "2024-11-01",
    account: "@isaacbullockk",
    imageUrl: "/content/494264234_9490990980998010_4389825739228080940_n.jpg",
    tags: ["studio", "creation", "behind-the-scenes"],
  },
  {
    id: "real_7",
    title: "Festival Season",
    caption: "Festival vibes with the Wildnoff family. Summer memories.",
    type: "asset",
    status: "published",
    date: "2024-11-20",
    account: "@wildnoff",
    imageUrl: "/content/495950848_1315078160623273_3870021180125711426_n.jpg",
    tags: ["festival", "summer", "wildnoff"],
  },
  {
    id: "real_8",
    title: "Backstage Moments",
    caption: "The calm before the storm. Backstage at the show.",
    type: "asset",
    status: "published",
    date: "2024-12-05",
    account: "@isaacbullockk",
    imageUrl: "/content/495954509_9581565538607220_2548566597555350232_n.jpg",
    tags: ["backstage", "prep", "show"],
  },
  {
    id: "real_9",
    title: "Kyakuwa Vivid Sessions",
    caption: "Kyakuwa live at Vivid Sessions. Soulful energy.",
    type: "asset",
    status: "published",
    date: "2025-01-15",
    account: "@kyakuwamusic",
    imageUrl: "/content/498573410_9639326146164492_3875691503188222251_n.jpg",
    tags: ["kyakuwa", "vivid-sessions", "soul"],
  },
  {
    id: "real_10",
    title: "Sunday Release",
    caption: "New drop every Sunday. This week: something special.",
    type: "social",
    status: "published",
    date: "2025-01-26",
    account: "@isaacbullockk",
    imageUrl: "/content/499641519_9716939095069863_1362685228979336819_n.jpg",
    tags: ["sunday-release", "new-music", "drop"],
  },
  {
    id: "real_11",
    title: "Crowd Love",
    caption: "The energy you bring feeds the performance. #IsaacNfriends",
    type: "asset",
    status: "published",
    date: "2025-02-14",
    account: "@isaacbullockk",
    imageUrl: "/content/500543489_2953634418148604_2691035163556873162_n.jpg",
    tags: ["crowd", "energy", "isaacnfriends"],
  },
  {
    id: "real_12",
    title: "Live at the Venue",
    caption: "Nothing beats a live room. Full band, full energy.",
    type: "asset",
    status: "published",
    date: "2025-03-01",
    account: "@wildnoff",
    imageUrl: "/content/502558342_2959660104212702_8711408145109245567_n.jpg",
    tags: ["live", "venue", "band"],
  },
  {
    id: "real_13",
    title: "Acoustic Set",
    caption: "Stripped back to the essentials. Guitar, voice, truth.",
    type: "asset",
    status: "published",
    date: "2025-03-20",
    account: "@isaacbullockk",
    imageUrl: "/content/503279212_2959473650898014_6092272511217681774_n.jpg",
    tags: ["acoustic", "guitar", "intimate"],
  },
  {
    id: "real_14",
    title: "Band Chemistry",
    caption: "When the band clicks, magic happens. Wildnoff Collective.",
    type: "asset",
    status: "published",
    date: "2025-04-10",
    account: "@wildnoff",
    imageUrl: "/content/505713754_2970334459811933_6156804978235562556_n.jpg",
    tags: ["band", "chemistry", "wildnoff"],
  },
  {
    id: "real_15",
    title: "IsaacNfriends — C. Merkwerk",
    caption: "The crowd is the show. #IsaacNfriends. Photo by C. Merkwerk.",
    type: "asset",
    status: "published",
    date: "2025-05-01",
    account: "@isaacbullockk",
    imageUrl: "/content/508273428_9858224254274679_5118662679010924975_n.jpg",
    tags: ["isaacnfriends", "crowd", "c-merkwerk"],
  },
  {
    id: "real_16",
    title: "Stage Presence",
    caption: "Command the stage. Own the moment. Wildnoff.",
    type: "asset",
    status: "published",
    date: "2025-05-15",
    account: "@wildnoff",
    imageUrl: "/content/508552121_9864148427015595_5031226928046188374_n.jpg",
    tags: ["stage", "presence", "performance"],
  },
  {
    id: "real_17",
    title: "Intimate Sessions",
    caption: "Up close and personal. The stories behind the songs.",
    type: "asset",
    status: "published",
    date: "2025-06-01",
    account: "@isaacbullockk",
    imageUrl: "/content/508702915_9858223770941394_7049139336361484613_n.jpg",
    tags: ["intimate", "story", "songs"],
  },
  {
    id: "real_18",
    title: "Vivid Sessions — Isaac Bullock",
    caption: "o.l.v Isaac Bullock at Vivid Sessions. Photo by C. Merkwerk.",
    type: "asset",
    status: "published",
    date: "2025-06-20",
    account: "@isaacbullockk",
    imageUrl: "/content/509196612_9857628274334277_8077923658842616958_n.jpg",
    tags: ["vivid-sessions", "isaac-bullock", "c-merkwerk"],
  },
];

export const contentRouter = router({
  list: publicProcedure.query(() => {
    return contentStore;
  }),

  add: publicProcedure
    .input(z.object({
      title: z.string(),
      caption: z.string(),
      type: z.enum(["social", "video", "ad", "blog", "asset"]),
      account: z.string(),
      imageUrl: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(({ input }) => {
      const item = {
        id: `user_${Date.now()}`,
        ...input,
        status: "published" as const,
        date: new Date().toISOString().split("T")[0],
        tags: input.tags || [],
        imageUrl: input.imageUrl || "",
      };
      contentStore.unshift(item);
      return item;
    }),
});
