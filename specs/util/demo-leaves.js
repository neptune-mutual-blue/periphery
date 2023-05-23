const { parseLeaf } = require('./tree')

const getDemoLeavesRaw = (accounts) => {
  return [
    // [account, level, family, persona]
    [accounts[0], 1, 'Delphinus', 1],
    [accounts[1], 1, 'Sabersquatch', 2],
    [accounts[2], 1, 'Delphinus', 1],
    [accounts[3], 1, 'Sabersquatch', 2],
    [accounts[4], 1, 'Delphinus', 1],
    [accounts[5], 1, 'Sabersquatch', 2],
    [accounts[6], 1, 'Delphinus', 1],
    [accounts[7], 1, 'Sabersquatch', 2]
  ]
}

const getDemoLeaves = (accounts) => {
  const leaves = getDemoLeavesRaw(accounts)
  return leaves.map(parseLeaf)
}

module.exports = { getDemoLeaves, getDemoLeavesRaw }
