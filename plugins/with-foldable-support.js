const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Folding or unfolding a phone changes the screen size *and* the smallest
 * screen width. Unless the activity declares it handles both, Android
 * destroys and recreates it — which reloads the JS app and throws away the
 * signed-in web session mid-task. Declaring them lets React Native simply
 * re-layout (useWindowDimensions updates) so the fold is seamless.
 */
const CONFIG_CHANGES = [
  'keyboard',
  'keyboardHidden',
  'orientation',
  'screenSize',
  'smallestScreenSize',
  'screenLayout',
  'uiMode',
  'density',
];

module.exports = function withFoldableSupport(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;
    app.$['android:resizeableActivity'] = 'true';
    for (const activity of app.activity ?? []) {
      if (activity.$['android:name'] !== '.MainActivity') continue;
      const existing = (activity.$['android:configChanges'] ?? '').split('|').filter(Boolean);
      activity.$['android:configChanges'] = [...new Set([...existing, ...CONFIG_CHANGES])].join(
        '|',
      );
      activity.$['android:resizeableActivity'] = 'true';
    }
    return cfg;
  });
};
