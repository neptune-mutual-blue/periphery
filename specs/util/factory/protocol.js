const key = require('../key')
const { deployUpgradeable } = require('./deployer')

const deployProtocol = async (signer) => {
  const store = await deployUpgradeable('Store', [signer.address], signer.address)

  const npm = await deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
  const protocol = await deployUpgradeable('FakeProtocol', store.address)

  await store.setBool(key.qualify(protocol.address), true)
  await store.setBool(key.qualifyMember(protocol.address), true)
  await store.setAddress(key.PROTOCOL.CNS.CORE, protocol.address)
  await store.setAddress(key.PROTOCOL.CNS.NPM, npm.address)

  return { npm, store, protocol }
}

module.exports = { deployProtocol }
