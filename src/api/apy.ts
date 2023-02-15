import {
    SUSHUISWAP_GRAPH_URL,
    SHUSHISWAP_CHEF_GRAPH_URL,
    DODO_GRAPH_URL,
    FRAX_APR_API_URL,
} from "src/config/constants/index";
import { FarmOriginPlatform } from "src/types/enums";
import { Apys, Farm } from "src/types";
import axios from "axios";
import { addressesByChainId } from "src/config/constants/contracts";
import { getPrice } from "./token";
import { BigNumber, providers, Contract } from "ethers";
import { erc20ABI } from "wagmi";
import { calcCompoundingApy, toEth } from "src/utils/common";
import { getGmxApyArbitrum } from "./getGmxApy";
import dodoMineAbi from "src/assets/abis/dodoMine.json";

interface GraphResponse {
    apr: string;
    feesUSD: string;
    id: string;
    liquidityUSD: string;
    name: string;
}

interface ChefResponse {
    id: string;
    sushiPerSecond: string;
    totalAllocPoint: string;
    pools: {
        allocPoint: string;
        pair: string;
        rewarder: {
            id: string;
            rewardToken: string;
            rewardPerSecond: string;
            totalAllocPoint: string;
        };
    }[];
}

export const getSushiswapApy = async (pairAddress: string, chainId: number, provider: providers.Provider) => {
    const priceOfSushi = await getPrice(addressesByChainId[chainId].sushiAddress, chainId);

    let query = `{
    pair(id: "${pairAddress}") {
      name
      liquidityUSD
      apr
      feesUSD
      id
    }
  }`;
    let res = await axios.post(SUSHUISWAP_GRAPH_URL, { query });
    let pairData: GraphResponse = res.data.data.pair;
    query = ` {
          miniChefs {
            id
            sushi
            sushiPerSecond
            totalAllocPoint
            pools(where: {pair: "${pairAddress}"}){
              allocPoint
              pair
              rewarder{
                id
                rewardToken
                rewardPerSecond
                totalAllocPoint
              }
            }
          }
        }`;
    res = await axios.post(SHUSHISWAP_CHEF_GRAPH_URL, { query });
    const chefData: ChefResponse = res.data.data.miniChefs[0];

    let obj = {
        allocPoint: chefData.pools[0] ? Number(chefData.pools[0].allocPoint) : 0,
        totalAllocPoint: chefData ? Number(chefData.totalAllocPoint) : 0,
        sushiPerSecond: chefData ? BigNumber.from(chefData.sushiPerSecond) : BigNumber.from(0),
        sushiPerDay: chefData ? BigNumber.from(chefData.sushiPerSecond).mul(60).mul(60).mul(24) : BigNumber.from(0),
        feeApr: Number(pairData.apr) * 100,
        liquidityUSD: Number(pairData.liquidityUSD),
    };
    const sushiRewardPerDay = obj.sushiPerDay;
    const sushiRewardPerYear = sushiRewardPerDay.mul(365);

    const sushiRewardPerYearUSD =
        (Number(toEth(sushiRewardPerYear.toString())) * priceOfSushi * obj.allocPoint) / obj.totalAllocPoint;
    let rewardsApr = (sushiRewardPerYearUSD / obj.liquidityUSD) * 100;
    if (chefData.pools[0] && Number(chefData.pools[0].rewarder.id) !== 0) {
        const rewarder = chefData.pools[0].rewarder;
        const rewardTokenContract = new Contract(pairAddress, erc20ABI, provider);
        const rewardTokenPrice = await getPrice(rewarder.rewardToken, chainId);
        const balance = await rewardTokenContract.balanceOf(chefData.id);
        const decimals = await rewardTokenContract.decimals();
        const totalSupply = await rewardTokenContract.totalSupply();
        const stakedLiquidityUSD =
            (Number(toEth(balance, decimals)) * obj.liquidityUSD) / Number(toEth(totalSupply, decimals));
        const rewardPerSecond = BigNumber.from(rewarder.rewardPerSecond);
        const rewardPerDay = rewardPerSecond.mul(60).mul(60).mul(24);
        const rewardPerYear = rewardPerDay.mul(365);
        const rewardPerYearUSD = Number(toEth(rewardPerYear.toString(), decimals)) * rewardTokenPrice;
        const rewarderApr = (rewardPerYearUSD / stakedLiquidityUSD) * 100;
        rewardsApr += rewarderApr;
    }
    const feeApr = obj.feeApr;
    const compounding = calcCompoundingApy(rewardsApr);

    const apy = feeApr + compounding + rewardsApr; // RewardsApr is included in compounding

    return {
        feeApr,
        rewardsApr,
        apy,
        compounding,
    };
};

const getDodoApy = async (pairAddress: string, provider: providers.Provider, chainId: number) => {
    const res = await axios.post(DODO_GRAPH_URL, {
        query: `
    {
        pools(where: {lpToken:"${pairAddress.toLowerCase()}"}) {
            id
            staked
            lpToken
          },
        lpToken(id: "${pairAddress.toLowerCase()}") {
          pair {
            feeUSD
            volumeUSD
            quoteReserve
            baseReserve
          }
        }
      }
    `,
    });
    const pairData = res.data.data.lpToken.pair as {
        feeUSD: string;
        volumeUSD: string;
        quoteReserve: string;
        baseReserve: string;
    };
    const data = {
        ...pairData,
        staked: Number(res.data.data.pools[0].staked),
    };
    const feeApr = Number(data.feeUSD) / (Number(data.quoteReserve) + Number(data.baseReserve));

    const latestBlock = await provider.getBlockNumber();
    const latestBlockTimestamp = (await provider.getBlock(latestBlock)).timestamp;
    const oldBlockTimestamp = (await provider.getBlock(latestBlock - 200000)).timestamp;
    const mineContract = new Contract(addressesByChainId[chainId].dodoMineAddress, dodoMineAbi, provider);
    const price = await getPrice(addressesByChainId[chainId].dodoTokenAddress, chainId);
    const rewardPerBlock = Number(toEth(await mineContract.dodoPerBlock()));

    const difference = latestBlockTimestamp - oldBlockTimestamp;
    const blocksPerDay = (difference / 200000) * 86400;
    const numOfBlocksPerDay = blocksPerDay;
    const rewardPerDay = rewardPerBlock * numOfBlocksPerDay;
    const rewardPerYear = rewardPerDay * 365;
    let { allocPoint } = await mineContract.poolInfos(4);
    let totalAlloc = await mineContract.totalAllocPoint();
    let alloc = allocPoint.mul(100000).div(totalAlloc);

    const rewardPerYearUsd = rewardPerYear * price * (alloc.toNumber() / 100000);
    const constant = 3.93;

    let apr = (rewardPerYearUsd / data.staked) * 100;
    apr /= constant;

    const compounding = calcCompoundingApy(apr);
    const apy = compounding + apr;
    return {
        feeApr: 0,
        rewardsApr: apr,
        apy,
        compounding,
    };
};

const getFraxApy = async () => {
    const res = await axios.get(`https://api.allorigins.win/get?url=${FRAX_APR_API_URL}`);
    const apr =
        JSON.parse(res.data.contents).find(
            (item: any) => item.pid === 3 && item.token === "FRAX" && item.chainId === 110
        ).apr * 100;

    return {
        feeApr: 0,
        rewardsApr: 0,
        apy: apr,
        compounding: 0,
    };
};

export const getApy = async (
    farm: Pick<Farm, "originPlatform" | "lp_address" | "rewards_apy" | "total_apy">,
    chainId: number,
    provider: providers.Provider,
    currentWallet?: string
): Promise<Apys> => {
    switch (farm.originPlatform) {
        case FarmOriginPlatform.Shushiswap:
            return getSushiswapApy(farm.lp_address.toLowerCase(), chainId, provider);
        case FarmOriginPlatform.GMX:
            return getGmxApyArbitrum(provider, currentWallet);
        case FarmOriginPlatform.Dodo:
            return getDodoApy(farm.lp_address, provider, chainId);
        case FarmOriginPlatform.Frax:
            return getFraxApy();

        default:
            return {
                feeApr: 0,
                rewardsApr: Number(farm.rewards_apy || 0),
                apy: Number(farm.total_apy || 0),
                compounding: 0,
            };
    }
};