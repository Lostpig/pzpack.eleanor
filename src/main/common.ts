import { app } from 'electron'
import * as path from 'path'
import { PackageInfo } from '../lib/declares'

export const ROOT = app.getAppPath()
export const PACKAGE = require(path.join(ROOT, 'package.json')) as PackageInfo
export const EntryPage = `file://${ROOT}/index.html`


