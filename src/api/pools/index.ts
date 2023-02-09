// @ts-nocheck
import * as wethUsdt from "./weth-usdt";
import * as wethMagic from "./weth-magic";
import * as wethDai from "./weth-dai";
import * as wethUsdc from "./weth-usdc";
import * as wethWbtc from "./weth-wbtc";
import * as plsWeth from "./pls-weth";
import * as gmx from "./gmx";

const farmFunctions: { [key: number]: typeof wethUsdt } = {
    3: wethUsdt,
    10: wethMagic,
    1: wethDai,
    2: wethUsdc,
    4: wethWbtc,
    8: plsWeth,
    5: gmx,
};

export default farmFunctions;
