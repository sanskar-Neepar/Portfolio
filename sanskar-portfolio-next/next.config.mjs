/** @type {import('next').NextConfig} */
const nextConfig = {
  // The ported experience (lib/experience.js) is a large imperative Three.js/DOM
  // script with no idempotent teardown (rAF loop, raw addEventListener calls,
  // no THREE.dispose()). React 19 Strict Mode double-invokes effects in dev,
  // which would mount it twice (duplicate canvases/listeners). Turned off here;
  // this only affects the dev server, not the production build.
  reactStrictMode: false,
};

export default nextConfig;
