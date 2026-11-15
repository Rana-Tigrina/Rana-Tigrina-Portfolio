import type { NextConfig } from "next";

const config: NextConfig = {
  // The oracle reads /content at request time; make sure those files ship with the serverless function.
  outputFileTracingIncludes: { "/api/frog": ["./content/**/*"] },
};

export default config;
