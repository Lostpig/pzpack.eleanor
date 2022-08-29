import * as fsp from 'fs/promises'
import { PZSubscription, PZHash, PZUtils, type PZCrypto, createKey, createKeyHash, createPZCrypto, PZExceptions } from 'pzpack'
import { errorCodes } from '../../lib/exceptions'
import { lazyValue } from '../../lib/utils'
import { ensureFileDirAsync } from './io'

interface PWRecord {
  hash: Buffer
  key: Buffer
  hashHex: string
}
const pwBookSign = lazyValue(() => {
  const sign = PZHash.sha256('PZ-PasswordBook')
  const signHex = PZUtils.bytesToHex(sign)
  return { sign, signHex }
})
const { PZSubject } = PZSubscription

class PasswordBook {
  readonly filename: string
  private crypto: PZCrypto
  private map = new Map<string, PWRecord>()
  private subject = new PZSubject<string[]>()
  observer () {
    return this.subject.toObservable()
  }
  private initBook(data?: Buffer) {
    const bookMap = new Map<string, PWRecord>()
    if (!data) return bookMap

    let i = 0
    while (i < data.length) {
      const hash = data.slice(i, i + 32)
      const key = data.slice(i + 32, i + 64)
      const hashHex = PZUtils.bytesToHex(hash)

      bookMap.set(hashHex, { hash, key, hashHex })
      i += 64
    }
    return bookMap
  }
  private updateFlag: boolean = false
  private update() {
    if (this.updateFlag) return

    this.updateFlag = true
    PZUtils.nextTick().then(() => {
      this.subject.next(this.items())
      this.updateFlag = false
    })
  }

  constructor(filename: string, crypto: PZCrypto, data?: Buffer) {
    this.filename = filename
    this.crypto = crypto
    this.map = this.initBook(data)
  }
  add(password: string) {
    const key = createKey(password)
    const hash = createKeyHash(key)

    if (this.map.has(hash.hex)) {
      throw new PZExceptions.PZError(errorCodes.PasswordBookPasswordExists)
    }
    this.map.set(hash.hex, { key, hash: hash.hash, hashHex: hash.hex })
    this.update()
  }
  delete(hashHex: string) {
    const deleted = this.map.delete(hashHex)
    if (deleted) this.update()
    return deleted
  }
  items() {
    const items: string[] = []
    for (const v of this.map.values()) {
      items.push(v.hashHex)
    }
    return items
  }
  has(hash: string) {
    return this.map.has(hash)
  }
  get(hash: string) {
    return this.map.get(hash)
  }

  private buildData() {
    if (this.map.size === 0) return Buffer.alloc(0)

    const data = Buffer.alloc(this.map.size * 64)
    let position = 0

    for (const [, record] of this.map) {
      record.hash.copy(data, position, 0, 32)
      record.key.copy(data, position + 32, 0, 32)
      position += 64
    }

    const encrypted = this.crypto.encrypt(data)
    return encrypted
  }
  private encode() {
    const header = Buffer.alloc(64)
    pwBookSign.value.sign.copy(header, 0, 0, 32)
    this.crypto.pwHash.copy(header, 32, 0, 32)

    const data = this.buildData()

    return Buffer.concat([header, data])
  }
  async save() {
    const fileData = this.encode()
    await ensureFileDirAsync(this.filename)
    await fsp.writeFile(this.filename, fileData)
  }
  async close() {
    await this.save()
    this.subject.complete()
  }
}

const checkPwBook = async (filename: string, fh: fsp.FileHandle, key: Buffer) => {
  const fstat = await fh.stat()
  if (!fstat.isFile()) {
    throw new PZExceptions.PZError(PZExceptions.errorCodes.FileNotFound, { path: filename }, 'password book')
  }

  const tempBuffer = Buffer.alloc(32)

  const sign = pwBookSign.value.signHex
  const signRes = await fh.read(tempBuffer, 0, 32, 0)
  const fileSign = PZUtils.bytesToHex(signRes.buffer)
  if (fileSign !== sign) {
    throw new PZExceptions.PZError(errorCodes.PasswordBookCheckInvalid, { path: filename })
  }

  const { hex } = createKeyHash(key)
  const pwRes = await fh.read(tempBuffer, 0, 32, 32)
  const fileHex = PZUtils.bytesToHex(pwRes.buffer)
  if (fileHex !== hex) {
    throw new PZExceptions.PZError(errorCodes.PasswordBookKeyInvalid, { path: filename })
  }
}
export const createPasswordBook = async (filename: string, masterPw: string) => {
  const crypto = createPZCrypto(masterPw)
  return new PasswordBook(filename, crypto)
}
export const openPasswordBook = async (filename: string, masterPw: string) => {
  const fh = await fsp.open(filename, 'r')
  const masterKey = createKey(masterPw)
  await checkPwBook(filename, fh, masterKey)

  let data: Buffer | undefined = undefined
  const fullBookBuffer = await fh.readFile()
  const crypto = createPZCrypto(masterKey)

  if (fullBookBuffer.length > 64) {
    const encrypted = fullBookBuffer.slice(64)
    data = crypto.decryptBlock(encrypted)
  }
  await fh.close()

  if (data && data.length % 64 !== 0) {
    throw new PZExceptions.PZError(errorCodes.PasswordBookFileSizeIncorrect)
  }

  return new PasswordBook(filename, crypto, data)
}
export type { PasswordBook }
