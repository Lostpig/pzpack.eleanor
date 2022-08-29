const esbuild = require('esbuild')
const fs = require('fs/promises')
const modulePath = require('path')
const pkg = require("../package.json")

const optionsBase = {
  entryPoints: {
    main: './src/main/boot.ts',
    renderer: './src/renderer/entry.tsx'
  },
  outdir: './build',
  bundle: true,
  sourcemap: true,
  platform: 'node',
  mainFields: ['main'],
  loader: {
    '.js': 'tsx',
    '.ts': 'ts',
    '.tsx': 'tsx'
  },
  external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {}), 'electron', 'electron/*'],
}

const doBuild = (option) => {
  esbuild.build(option).then((result) => {
    if (option.watch) {
      console.log('build watching...')
    } else {
      console.log('build complete successed:', result)
    }
  }).catch(e => {
    console.log('build failed:')
    console.error(e)
  })
}

const replaceWithPattern = (source, pattern) => {
  let content = source.slice()
  pattern.forEach(([regex, replacer]) => {
    content = content.replaceAll(regex, replacer)
  });
  return content
}
const createReplace = (isProd) => {
  const pattern = [
    ['ENV_DEV', (!isProd) + '']
  ]

  return {
    name: 'devReplacer',
    setup(build, { transform = null } = {}) {
      if (transform) {
        const source = transform?.contents
        const contents = replaceWithPattern(source, pattern)
        return { contents };
      };

      build.onLoad({ filter: /\.(ts|tsx)/ }, async ({ path }) => {
        const source = await fs.readFile(path, "utf8")
        const ext = modulePath.extname(path).toLowerCase()
        const loader = ext === '.ts' ? 'ts' : ext === '.tsx' ? 'tsx' : undefined

        const contents = replaceWithPattern(source, pattern)
        return { contents, loader };
      })
    }
  }
}

const execute = () => {
  const argv = process.argv
  if (argv.indexOf('--watch') > 1) {
    console.log('build in watch mode')
    optionsBase.watch = {
      onRebuild(error, result) {
        if (error) console.error('watch build failed:', error)
        else console.log('watch build successed:', result)
      },
    }
  }
  if (argv.indexOf('--prod') > 1) {
    console.log('build for prod')
    optionsBase.define = { 'process.env.NODE_ENV': "'production'" }
    optionsBase.minify = true
    optionsBase.external = ['electron', 'electron/*']
  }

  optionsBase.plugins = [createReplace(argv.indexOf('--prod') > 1)]
  return doBuild(optionsBase)
}

execute()
