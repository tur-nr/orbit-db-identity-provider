'use strict'
const IdentityProvider = require('./identity-provider-interface')
const Keystore = require('orbit-db-keystore')
const signingKeysPath = './orbitdb/identity/signingkeys'
const type = 'orbitdb'

class OrbitDBIdentityProvider extends IdentityProvider {
  constructor (options = {}) {
    super()
    this._keystore = options.keystore
  }

  // Returns the type of the identity provider
  static get type () { return type }

  async getId (options = {}) {
    const id = options.id
    if (!id) {
      throw new Error('id is required')
    }
    if (!this._keystore) {
      this._keystore = await Keystore.create(options.signingKeysPath || signingKeysPath)
    }
    const keystore = this._keystore
    const key = await keystore.getKey(id) || await keystore.createKey(id)
    return key.public.marshal().toString('hex')
  }

  async signIdentity (data, options = {}) {
    const id = options.id
    if (!id) {
      throw new Error('id is required')
    }
    const keystore = this._keystore
    const key = await keystore.getKey(id)
    if (!key) {
      throw new Error(`Signing key for '${id}' not found`)
    }

    return keystore.sign(key, data)
  }

  static async verifyIdentity (identity) {
    // Verify that identity was signed by the ID
    return Keystore.verify(
      identity.signatures.publicKey,
      identity.id,
      identity.publicKey + identity.signatures.id
    )
  }
}

module.exports = OrbitDBIdentityProvider
