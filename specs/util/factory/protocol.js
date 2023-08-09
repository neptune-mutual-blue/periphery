const key = require('../key')
const { deployUpgradeable } = require('./deployer')

const deployProtocol = async (signer) => {
  const store = await deployUpgradeable('Store', [signer.address], signer.address)

  const cxToken = await deployUpgradeable('FakeCxToken', 'Fake CxToken', 'cxUSD', '3894077181')
  const npm = await deployUpgradeable('FakeToken', 'Fake Neptune Mutual Token', 'NPM')

  await store.setBool(key.qualifyCxToken(cxToken.address), true)
  await store.setAddress(key.PROTOCOL.CNS.NPM, npm.address)

  return { cxToken, npm, store }
}

module.exports = { deployProtocol }
