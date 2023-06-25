const factory = require('./index')
const helper = require('../helper')

const forceSendEther = async (toAddress, signer) => {
  // Send eth to `toAddress` using `destruct` on ForceEther contract
  const forceEther = await factory.deploy('ForceEther')
  await signer.sendTransaction({
    to: forceEther.address,
    value: helper.ether(1)
  })

  let balance = await signer.provider.getBalance(forceEther.address)
  balance.should.equal(helper.ether(1))

  await forceEther.destruct(toAddress)
  balance = await signer.provider.getBalance(toAddress)
  balance.should.equal(helper.ether(1))
}

module.exports = {
  forceSendEther
}
