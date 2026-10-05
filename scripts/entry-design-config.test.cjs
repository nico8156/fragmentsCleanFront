const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { expo } = require('../app.config.js');
const splash = expo.plugins.find(item => Array.isArray(item) && item[0] === 'expo-splash-screen')[1];
const read = file => fs.readFileSync(path.join(root, file));

test('splash uses the local Fragments identity on the app background in both modes', () => {
  assert.equal(splash.backgroundColor, '#0A0705');
  assert.equal(splash.dark.backgroundColor, splash.backgroundColor);
  assert.equal(expo.backgroundColor, splash.backgroundColor);
  assert.equal(splash.image, './assets/images/icon.png');
  assert.equal(splash.dark.image, splash.image);
  assert.equal(splash.imageWidth, 112);
  assert.equal(splash.resizeMode, 'contain');
  assert.ok(read(splash.image).length > 0);
});

test('committed iOS splash resources match Expo dimensions and background', () => {
  const colors = JSON.parse(read('ios/Fragments/Images.xcassets/SplashScreenBackground.colorset/Contents.json'));
  const components = colors.colors[0].color.components;
  const rgb = ['red', 'green', 'blue'].map(key => Math.round(Number(components[key]) * 255));
  assert.deepEqual(rgb, [10, 7, 5]);
  for (const [ratio, suffix] of [[1, ''], [2, '@2x'], [3, '@3x']]) {
    const png = read(`ios/Fragments/Images.xcassets/SplashScreenLogo.imageset/image${suffix}.png`);
    assert.equal(png.readUInt32BE(16), splash.imageWidth * ratio);
    assert.equal(png.readUInt32BE(20), splash.imageWidth * ratio);
  }
  const storyboard = read('ios/Fragments/SplashScreen.storyboard').toString();
  assert.ok(storyboard.includes('name="SplashScreenLogo" width="112" height="112"'));
  assert.ok(storyboard.includes('firstAttribute="centerX"'));
  assert.ok(storyboard.includes('firstAttribute="centerY"'));
});

test('official Google raster logo is local and retains its native aspect ratio', () => {
  const png = read('assets/images/google-g.png');
  assert.equal(png.readUInt32BE(16), 200);
  assert.equal(png.readUInt32BE(20), 204);
});
