/** Integrate the pinned, self-contained SuperSplat export without its stock UI.
 * Exact anchors fail closed if the export changes; interiors keep the original export.
 * No copy of the 3 MB engine, no iframe, and no second rendering engine.
 */
export function prepareHudEngine(source) {
  const patches = [
    ['const initUI = (global) => {\n    const { config, events, state } = global;',
     'const initUI = (global) => {\n    if (global.config.headless) return;\n    const { config, events, state } = global;'],
    ["deviceTypes: useWebGPU ? ['webgpu'] : [],\n        antialias: false,",
     "deviceTypes: useWebGPU ? ['webgpu'] : [],\n        alpha: !!config.transparent,\n        premultipliedAlpha: true,\n        antialias: false,"],
    ["xrCompatible: true,\n        powerPreference: 'high-performance'",
     "xrCompatible: !config.headless,\n        powerPreference: config.headless ? 'default' : 'high-performance'"],
    ['this.inputController.update(deltaTime, this.cameraManager.camera.distance);\n                // update cameras\n                this.cameraManager.update(deltaTime, this.inputController.frame);',
     'if (!global.config.lockedCamera) {\n                    this.inputController.update(deltaTime, this.cameraManager.camera.distance);\n                    this.cameraManager.update(deltaTime, this.inputController.frame);\n                }'],
    ['this.cameraManager = new CameraManager(global, sceneBound, collision);\n            applyCamera(this.cameraManager.camera);',
     "this.cameraManager = new CameraManager(global, sceneBound, collision);\n            events.fire('camera:ready');\n            applyCamera(this.cameraManager.camera);"],
    ['    initXr(global);\n    // Initialize user interface',
     '    if (!config.headless) initXr(global);\n    // Initialize user interface'],
  ];
  for (const [anchor, replacement] of patches) {
    if (source.split(anchor).length !== 2) throw new Error('SuperSplat HUD integration: export anchor changed');
    source = source.replace(anchor, replacement);
  }
  return source.replace(/\/\/# sourceMappingURL=index.js.map\s*$/, '');
}

export async function loadHudEngine() {
  const response = await fetch(new URL('../viewers/exterior-382a1520/index.js', import.meta.url));
  if (!response.ok) throw new Error(`SuperSplat engine: HTTP ${response.status}`);
  const moduleUrl = URL.createObjectURL(new Blob([prepareHudEngine(await response.text())], { type: 'text/javascript' }));
  try { return await import(moduleUrl); }
  finally { URL.revokeObjectURL(moduleUrl); }
}
