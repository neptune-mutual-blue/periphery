const { ethers } = require('hardhat')

const PERSONA = {
  GUARDIAN: 1,
  BEAST: 2
}

const nfts = [
  {
    level: 1,
    family: ethers.utils.formatBytes32String('Delphinus'),
    persona: PERSONA.GUARDIAN,
    min: 100001,
    max: 100000 + 1000
  },
  {
    level: 1,
    family: ethers.utils.formatBytes32String('Sabersquatch'),
    persona: PERSONA.BEAST,
    min: 110001,
    max: 110000 + 1000
  },
  {
    level: 2,
    family: ethers.utils.formatBytes32String('Epic Delphinus'),
    persona: PERSONA.GUARDIAN,
    min: 120001,
    max: 120000 + 500
  },
  {
    level: 2,
    family: ethers.utils.formatBytes32String('Diabolic Sabersquatch'),
    persona: PERSONA.BEAST,
    min: 121001,
    max: 121000 + 500
  },
  {
    level: 3,
    family: ethers.utils.formatBytes32String('Aquavallo'),
    persona: PERSONA.GUARDIAN,
    min: 130001,
    max: 130000 + 250
  },
  {
    level: 3,
    family: ethers.utils.formatBytes32String('Gargantuworm'),
    persona: PERSONA.BEAST,
    min: 131001,
    max: 131000 + 250
  },
  {
    level: 4,
    family: ethers.utils.formatBytes32String('Epic Aquavallo'),
    persona: PERSONA.GUARDIAN,
    min: 140001,
    max: 140000 + 200
  },
  {
    level: 4,
    family: ethers.utils.formatBytes32String('Diabolic Gargantuworm'),
    persona: PERSONA.BEAST,
    min: 141001,
    max: 141000 + 200
  },
  {
    level: 5,
    family: ethers.utils.formatBytes32String('Salacia'),
    persona: PERSONA.GUARDIAN,
    min: 150001,
    max: 150000 + 100
  },
  {
    level: 5,
    family: ethers.utils.formatBytes32String('Merman Serpent'),
    persona: PERSONA.BEAST,
    min: 151001,
    max: 151000 + 100
  },
  {
    level: 6,
    family: ethers.utils.formatBytes32String('Epic Salacia'),
    persona: PERSONA.GUARDIAN,
    min: 160001,
    max: 160000 + 50
  },
  {
    level: 6,
    family: ethers.utils.formatBytes32String('Diabolic Merman Serpent'),
    persona: PERSONA.BEAST,
    min: 161001,
    max: 161000 + 50
  },
  {
    level: 7,
    family: ethers.utils.formatBytes32String('Legendary Neptune'),
    persona: PERSONA.GUARDIAN,
    min: 170001,
    max: 170000 + 25
  }
]

const boundaries = [nfts.map(x => x.level), nfts.map(x => x.family), nfts]

module.exports = { boundaries }
