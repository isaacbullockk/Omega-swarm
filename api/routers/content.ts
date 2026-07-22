import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { postedContent } from "./post";

export const contentRouter = router({
  list: publicProcedure.query(() => {
    // Returns REAL posted content — empty array until something is actually posted
    return postedContent;
  }),
});
