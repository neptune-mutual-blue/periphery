const veNpm = require('./0.venpm')
const gcr = require('./1.gauge-controller-registry-deploy')
const lgp = require('./2.liquidity-gauge')
const gcrSetup = require('./3.gauge-controller-registry-pool-setup')

const main = async () => {
  await veNpm.deploy()
  await gcr.deploy()
  await lgp.deploy()
  await gcrSetup.setup()
}

main().catch(console.error)
