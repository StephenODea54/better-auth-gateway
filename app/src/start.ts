import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

import { serverFnNameMiddleware, wideEventMiddleware } from "@/lib/wide-event.ts";

export const startInstance = createStart(() => ({
  functionMiddleware: [serverFnNameMiddleware],
  requestMiddleware: [
    wideEventMiddleware,
    createCsrfMiddleware({ filter: ctx => ctx.handlerType === "serverFn" }),
  ],
}));
