// Metro config for the CAA Tracker app (07-implementation-plan.md §4, ARCH-1; spike V6).
// - Pure TypeScript libraries live in ../packages/*/src and are bundled from source.
// - The root tooling node_modules is NOT watched or resolved.
// - zod is always resolved as if imported from app/, so files under ../packages never pick up
//   ../node_modules/zod and the bundle holds exactly one zod copy (WP0 acceptance (e)).
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const root = path.resolve(__dirname, '..');

config.watchFolders = [path.join(root, 'packages')];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];
// Not disableHierarchicalLookup: that would also break npm's nested node_modules inside app/.
config.resolver.resolveRequest = (context, moduleName, platform) =>
  moduleName === 'zod' || moduleName.startsWith('zod/')
    ? context.resolveRequest(
        { ...context, originModulePath: path.join(__dirname, 'package.json') },
        moduleName,
        platform,
      )
    : context.resolveRequest(context, moduleName, platform);
config.resolver.extraNodeModules = {
  '@caa/data-schemas': path.join(root, 'packages/data-schemas/src'),
  '@caa/estimator': path.join(root, 'packages/estimator/src'),
  '@caa/case-rules': path.join(root, 'packages/case-rules/src'),
  '@caa/i18n-core': path.join(root, 'packages/i18n-core/src'),
};

module.exports = config;
