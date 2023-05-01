# Neptune Mutual Periphery

Neptune Mutual's peripheral smart contracts are auxiliary components that function in conjunction with the core protocol. Although not inherent to the core system, these contracts interface with it to augment its functionality or furnish additional features. It is important to note that this list of peripheral smart contracts is not exhaustive, and future iterations may encompass more contracts and features.


## Vote Escrow Token

veNpm, short for Vote-Escrow NPM token, is a special type of token within the Neptune Mutual ecosystem that represents users' locked NPM tokens. By locking their NPM tokens for a specified duration, users receive veNpm tokens, which grant them various benefits and governance rights. The primary advantages of holding veNpm tokens are as follows:

1. **Boosted Voting Rights**: veNpm token holders receive enhanced voting rights based on the duration for which they lock their NPM tokens. The lock duration can range from a minimum of 4 weeks to a maximum of 208 weeks. The longer the lock period, the more voting power they obtain, with a maximum boost of up to 4 times. As time passes, the boost gradually declines, and users may choose to extend their lock duration to maintain the maximum 4x boost.
2. **Governance Participation**: veNpm token holders can participate in the governance process of the Neptune Mutual ecosystem. They have the collective power to make decisions, such as the allocation of NPM emissions to various liquidity gauge pools and the amounts to be redirected every week. This decentralized and community-driven approach ensures that the platform's decisions align with the interests of its most committed users.
3. **Boosted NPM Rewards**: In addition to standard NPM rewards earned by liquidity providers, veNpm token holders receive increased NPM rewards as an incentive for their long-term commitment to the platform. The longer they lock their NPM tokens, the higher the rewards boost they receive, up to a maximum of 4 times.
4. **Long-term Alignment**: By locking their NPM tokens and receiving veNpm tokens, users demonstrate their long-term commitment to the Neptune Mutual ecosystem. This alignment of interests helps promote a more stable and thriving environment, as users are more likely to make decisions that benefit the platform's overall health and growth.
5. **Influence over Platform Development**: As veNpm token holders possess boosted voting rights and governance participation, they can influence the future development and direction of the Neptune Mutual platform. This level of involvement empowers users to actively shape the ecosystem, contributing to its ongoing success and evolution.


## Liquidity Gauge

### Registry

The LiquidityGaugeRegistry serves as a central registry for all Liquidity Gauge Pools streamlining the organization, management, and interaction with various liquidity gauge pools. By keeping track of all active Liquidity Gauge Pools, the registry provides users with an up-to-date, comprehensive list of available pools to participate in. This transparency enables users to make informed decisions about which pools to contribute liquidity to and stake in, based on their preferences and potential rewards.

Additionally, the registry plays a role in the governance process, as veNpm token holders can collectively decide on the allocation of weekly NPM emissions to various pools and the amounts to be allocated every week. By providing a single source of truth for all Liquidity Gauge Pools, the LiquidityGaugeRegistry simplifies the decision-making process for veNpm token holders, allowing them to efficiently manage the platform's resources and reward distribution.

### Pools


LiquidityGaugePool contracts play a crucial role in the Neptune Mutual ecosystem by managing the distribution of NPM token rewards to users who contribute liquidity to the protocol and engage in staking. Users stake their Proof of Deposit (POD) tokens in these pools, which represent their share of the supplied liquidity. By staking PODs in LiquidityGaugePool contracts, users not only help maintain the protocol's stability and enhance its liquidity but also accrue rewards for their contribution. These rewards serve as an incentive for users to continue supporting the platform, ultimately fostering a healthy and robust ecosystem. In addition to the standard NPM rewards for liquidity providers, veNpm token holders receive boosted NPM rewards. The veNpm tokens represent users' locked NPM tokens, and holding them indicates a long-term commitment to the platform. As a result, these users are rewarded with higher NPM rewards to acknowledge their ongoing support and loyalty to the Neptune Mutual ecosystem.

Through the combination of LiquidityGaugePool contracts, NPM token rewards, and veNpm token incentives, the Neptune Mutual platform encourages users to actively participate in providing liquidity and staking, ultimately creating a thriving, sustainable, and decentralized ecosystem.

## NFT Contracts

The NFT Contract supervises the generation, ownership, and transfer of non-fungible tokens (NFTs) within the Neptune Mutual ecosystem.  The Provable NFT Distribution contracts guarantee a just and transparent dissemination of NFTs to users. These contracts ascertain the fair allocation of NFTs, engendering a secure and unbiased process that users can rely on.


## Installation

### Checklist

- [ ] Install [foundry](https://book.getfoundry.sh/getting-started/installation)
- [ ] Install [lcov](https://formulae.brew.sh/formula/lcov) on Mac OS or [genhtml](https://manpages.ubuntu.com/manpages/xenial/man1/genhtml.1.html) on Linux


```
git submodule update --init --recursive
forge install
```

### Commands

**Build**

```
forge build
```

**Test**

```
forge test
```

or

```
forge test -vvvvv
```

**Coverage**

```
forge coverage
```

or

```
forge coverage --report lcov && genhtml lcov.info --branch-coverage --output-dir coverage

open ./coverage/index.html
```

**Deploy**


```
chmod +x ./deploy.sh
./deploy.sh
```

---

[comment]: #solidoc Start
[comment]: #solidoc End
