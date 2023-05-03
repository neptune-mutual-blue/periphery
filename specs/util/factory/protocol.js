const key = require('../key')
const { deploy } = require('./deployer')

const deployProtocol = async (signer) => {
  const store = await deploy('Store', [signer.address], signer.address)

  const npm = await deploy('FakeToken', 'Fake Neptune Mutual Token', 'NPM')
  const protocol = await deploy('FakeProtocol', store.address)

  await store.setBool(key.qualify(protocol.address), true)
  await store.setBool(key.qualifyMember(protocol.address), true)
  await store.setAddress(key.PROTOCOL.CNS.CORE, protocol.address)
  await store.setAddress(key.PROTOCOL.CNS.NPM, npm.address)

  return { npm, store, protocol }
}

module.exports = { deployProtocol }
