const esbuild = require('esbuild')
const pkg = require("./package.json")

const optionsBase = {
  entryPoints: {
    main: './src/main/boot.ts',
    renderer: './src/renderer/entry.tsx'
  },
  outdir: './dist',
  bundle: true,
  sourcemap: true,
  platform: 'node',
  mainFields: ['main'],
  external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {}), 'electron', 'electron/*'],
}

const doBuild = (option) => {
  esbuild.build(option).then((result) => {
    if (option.watch) {
      console.log('build watching...')
    } else {
      console.log('build complete succeeded:', result)
    }
  }).catch(e => {
    console.log('build failed:')
    console.error(e)
  })
}
const execute = () => {
  const argv = process.argv
  if (argv.indexOf('--watch') > 1) {
    console.log('build in watch mode')
    optionsBase.watch = {
      onRebuild(error, result) {
        if (error) console.error('watch build failed:', error)
        else console.log('watch build succeeded:', result)
      },
    }
  }
  if (argv.indexOf('--prod') > 1) {
    console.log('build for prod')
    optionsBase.minify = true
  }

  return doBuild(optionsBase)
}

execute()
