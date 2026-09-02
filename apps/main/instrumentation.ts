import type { Instrumentation } from "next";

import {
  readErrorDigest,
  readSafeCorrelationId,
  reportOperationalError,
} from "@darb/config/observability";

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  reportOperationalError({
    application: "main",
    context: {
      method: request.method,
      route: context.routePath,
      routeType: context.routeType,
    },
    digest: readErrorDigest(error),
    event: "request.failed",
    requestId: readSafeCorrelationId(request.headers),
  });
};
