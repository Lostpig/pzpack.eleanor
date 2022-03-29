const files = [
  './index.html',
  './main.cjs',
  './build/**/*',
  './assets/**/*',
  '!**/node_modules/**/*'
]

module.exports = {
  appId: 'pzpack.eleanor',
  asar: false,
  npmRebuild: false,
  copyright: `Copyright ©2022 lostpigz`,
  files,
  win: {
    publish: [],
    target: [
      { target: 'dir', arch: 'x64' },
    ]
  },
  electronDownload: {
    mirror: "https://npmmirror.com/mirrors/electron/"
  }
}