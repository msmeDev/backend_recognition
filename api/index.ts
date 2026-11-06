// TypeScript import would fail at build time because dist/ does not exist yet
// when nest build runs. require() is resolved at runtime (after dist/ exists),
// so tsc accepts it without resolving the path.
// eslint-disable-next-line @typescript-eslint/no-var-requires
export default require('../dist/main').default;
