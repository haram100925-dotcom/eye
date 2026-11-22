/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "402b66900e731ca748771b6fc5e7a068"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "869d13125e7d67d1c6dec4bb0a3e901d"
  }, {
    "url": "pwa-512x512.png",
    "revision": "3a14ccd1ac21aeee90b06bee2dae5855"
  }, {
    "url": "pwa-192x192.png",
    "revision": "f16095d589505baff4c7de01245349d6"
  }, {
    "url": "index.html",
    "revision": "471e4dc1a11ae89c22729361ab702a99"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "0a3ac1c58f40b082f13688b8ba27f24f"
  }, {
    "url": "screenshots/tablet_7inch_dark.png",
    "revision": "d9a05cf7b9d7442cd4de8d80f635cae0"
  }, {
    "url": "screenshots/phone_4_stats_dark.png",
    "revision": "8aff42838a7d973f7f18b7fa9130a589"
  }, {
    "url": "screenshots/phone_3_vision_test_dark.png",
    "revision": "578556e5760e70a2be8e0b1b6ea584ff"
  }, {
    "url": "screenshots/phone_2_gabor_dark.png",
    "revision": "13d46ea164612740d50e76d5546e5d4f"
  }, {
    "url": "screenshots/phone_1_routine_dark.png",
    "revision": "d7f6950bfc82f8f7e9e9b34b48e51bee"
  }, {
    "url": "screenshots/feature_graphic_1024x500_dark.png",
    "revision": "eb5ce3fcd91e838f087590cbd30a285f"
  }, {
    "url": "screenshots/desktop_16x9_dark.png",
    "revision": "43d646a1756a5c7bb60413a56a732ee3"
  }, {
    "url": "assets/web-XCXZHmQe.js",
    "revision": null
  }, {
    "url": "assets/index-DfVcie9B.css",
    "revision": null
  }, {
    "url": "assets/index-D7lIGkX2.js",
    "revision": null
  }, {
    "url": "assets/aistudio/file_00000000276c8206b29f620ce16948f9_4e78bef6.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_20261112-082439_d78b7dca.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "0a3ac1c58f40b082f13688b8ba27f24f"
  }, {
    "url": "pwa-192x192.png",
    "revision": "f16095d589505baff4c7de01245349d6"
  }, {
    "url": "pwa-512x512.png",
    "revision": "3a14ccd1ac21aeee90b06bee2dae5855"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "869d13125e7d67d1c6dec4bb0a3e901d"
  }, {
    "url": "manifest.webmanifest",
    "revision": "aef6f46065129d23d122d07933ecf8f8"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
