/**
 * Multi-Platform Distribution Builder for Bubble Pop Blast.
 * Packages native distributions for all 13 platforms:
 * 1. YouTube Playables
 * 2. Facebook Instant Games
 * 3. Poki
 * 4. CrazyGames
 * 5. Yandex Games
 * 6. GameDistribution
 * 7. Discord Activities
 * 8. JioGames
 * 9. Y8 Games
 * 10. Lagged
 * 11. Microsoft Store (PWA)
 * 12. Huawei & Xiaomi Quick Games
 * 13. MSN & Reddit Games
 */

import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const outDir = path.resolve('dist-platforms');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

// Ensure clean output directory
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

const originalIndexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

// Copy helper
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Remove default YouTube tag to get a clean base template
const cleanBaseHtml = originalIndexHtml.replace(
  /\s*<script src="https:\/\/www\.youtube\.com\/game_api\/v1"><\/script>/g,
  ''
);

const PLATFORM_CONFIGS = [
  {
    id: 'youtube',
    name: 'YouTube Playables',
    sdkTag: '<script src="https://www.youtube.com/game_api/v1"></script>',
    extraFiles: [],
  },
  {
    id: 'facebook',
    name: 'Facebook Instant Games',
    sdkTag: '<script src="https://connect.facebook.net/en_US/fbinstant.7.1.js"></script>',
    extraFiles: [
      {
        name: 'fbapp-config.json',
        content: JSON.stringify(
          {
            instant: {
              supported_orientations: ['PORTRAIT', 'LANDSCAPE'],
              navigation_menu_version: 'NAV_FLOATING',
            },
          },
          null,
          2
        ),
      },
    ],
  },
  {
    id: 'poki',
    name: 'Poki',
    sdkTag: '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>',
    extraFiles: [],
  },
  {
    id: 'crazygames',
    name: 'CrazyGames',
    sdkTag: '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>',
    extraFiles: [],
  },
  {
    id: 'yandex',
    name: 'Yandex Games',
    sdkTag: '<script src="https://yandex.ru/games/sdk/v2"></script>',
    extraFiles: [],
  },
  {
    id: 'gamedistribution',
    name: 'GameDistribution',
    sdkTag: '<script src="https://html5.api.gamedistribution.com/main.min.js"></script>',
    extraFiles: [],
  },
  {
    id: 'discord',
    name: 'Discord Activities',
    sdkTag: '<!-- Discord Embedded App SDK runtime -->',
    extraFiles: [],
  },
  {
    id: 'jiogames',
    name: 'JioGames',
    sdkTag: '<!-- JioGames Native SDK runtime -->',
    extraFiles: [],
  },
  {
    id: 'y8',
    name: 'Y8 Games',
    sdkTag: '<script src="https://cdn.y8.com/api/bi/y8-sdk.js"></script>',
    extraFiles: [],
  },
  {
    id: 'lagged',
    name: 'Lagged',
    sdkTag: '<!-- Standalone Clean HTML5 -->',
    extraFiles: [],
  },
  {
    id: 'microsoft',
    name: 'Microsoft Store (PWA)',
    sdkTag: '<link rel="manifest" href="./manifest.json">',
    extraFiles: [
      {
        name: 'manifest.json',
        content: JSON.stringify(
          {
            name: 'Bubble Pop Blast',
            short_name: 'BubblePop',
            start_url: './index.html',
            display: 'standalone',
            background_color: '#000000',
            theme_color: '#000000',
            description: 'Bubble Pop Blast for Windows 11 & Microsoft Store',
            icons: [
              {
                src: './favicon.ico',
                sizes: '64x64',
                type: 'image/x-icon',
              },
            ],
          },
          null,
          2
        ),
      },
    ],
  },
  {
    id: 'huawei',
    name: 'Huawei & Xiaomi Quick Games',
    sdkTag: '<!-- Quick Game Runtime (hbs / miapp) -->',
    extraFiles: [],
  },
  {
    id: 'msn',
    name: 'MSN & Reddit Games',
    sdkTag: '<!-- Cross-origin postMessage iFrame protocol -->',
    extraFiles: [],
  },
];

console.log('');
console.log('🫧 Building Distributions for 13 Native Gaming Platforms...');
console.log('─────────────────────────────────────────────────────────────');

for (const platform of PLATFORM_CONFIGS) {
  const targetDir = path.join(outDir, platform.id);
  copyDir(distDir, targetDir);

  // Inject platform-specific SDK tag before module scripts or closing </head>
  let platformHtml = cleanBaseHtml;
  if (platform.sdkTag) {
    if (platformHtml.includes('</head>')) {
      platformHtml = platformHtml.replace('</head>', `  ${platform.sdkTag}\n</head>`);
    } else {
      platformHtml = `${platform.sdkTag}\n${platformHtml}`;
    }
  }

  // Also pre-seed platform override query/script so it activates automatically
  platformHtml = platformHtml.replace(
    '<body>',
    `<body>\n    <script>window.__ACTIVE_PLATFORM__ = "${platform.id}"; localStorage.setItem("game_platform_override", "${platform.id}");</script>`
  );

  fs.writeFileSync(path.join(targetDir, 'index.html'), platformHtml, 'utf-8');

  // Write any platform-specific configuration files
  for (const extra of platform.extraFiles) {
    fs.writeFileSync(path.join(targetDir, extra.name), extra.content, 'utf-8');
  }

  console.log(`  ✅ ${platform.name.padEnd(28)} -> dist-platforms/${platform.id}/`);
}

console.log('─────────────────────────────────────────────────────────────');
console.log(`🎉 Successfully packaged 13 platform editions in: ${outDir}`);
console.log('');
