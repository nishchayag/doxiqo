import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "@/lib/uploadThing";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
