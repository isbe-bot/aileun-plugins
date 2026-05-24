import path from 'node:path';

export function loadConfig(overrides = {}) {
  const cwd = process.cwd();
  const runtimeDir =
    overrides.runtimeDir || process.env.AILEUN_PLUGINS_RUNTIME || path.join(cwd, 'runtime');

  return {
    runtimeDir,
    dbPath: path.join(runtimeDir, 'plugins.sqlite'),
    availableDir: path.join(runtimeDir, 'available'),
    installedDir: path.join(runtimeDir, 'installed'),
    enabledDir: path.join(runtimeDir, 'enabled'),
    customDir: path.join(runtimeDir, 'custom'),
    manifestsDir: path.join(runtimeDir, 'manifests'),
    packagesDir: path.join(runtimeDir, 'packages'),
    revisionsDir: path.join(runtimeDir, 'revisions'),
    exportsDir: path.join(runtimeDir, 'exports'),
    auditDir: path.join(runtimeDir, 'audit'),
    healthDir: path.join(runtimeDir, 'health'),
  };
}
