import { Token } from "src/types";
import useBalances from "./useBalances";
import usePriceOfTokens from "./usePriceOfTokens";
import { FormEvent, useEffect, useState } from "react";
import useTransfer from "./useTransfer";
import { toWei } from "src/utils/common";
import { dismissNotify, notifyError, notifyLoading, notifySuccess } from "src/api/notify";
import { errorMessages, loadingMessages, successMessages } from "src/config/constants/notifyMessages";
import { constants } from "ethers";

export const useTransferToken = (token: Token, handleClose: Function) => {
    const { reloadBalances } = useBalances();
    const { prices } = usePriceOfTokens();
    const [reciverAddress, setReciverAddress] = useState<string>("");
    const [amount, setAmount] = useState("");
    const [showInUsd, toggleShowInUsd] = useState<boolean>(true);
    const { transfer, isLoading } = useTransfer();
    const [max, setMax] = useState(false);

    const getAmountInWei = () => {
        let amountInEthFormat = showInUsd ? (parseFloat(amount) / prices[token.address]).toString() : amount;
        return toWei(amountInEthFormat, token.decimals);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const id = notifyLoading(loadingMessages.transferingTokens());
        let response = await transfer({
            tokenAddress: token.address,
            to: reciverAddress,
            amount: getAmountInWei(),
            max,
        });

        if (response?.status) {
            notifySuccess(successMessages.tokenTransfered());
        } else {
            let err = JSON.parse(JSON.stringify(response?.error && "Error transfering tokens..."));
            notifyError(errorMessages.generalError(err.cause?.reason || err.reason || err.message));
        }
        dismissNotify(id);
        handleClose();
        reloadBalances();
    };

    const handleMaxClick = () => {
        setMax(true);
        setAmount(showInUsd ? token.usdBalance : token.balance);
    };

    const handleToggleShowInUsdc = () => {
        toggleShowInUsd((prev) => !prev);
    };

    useEffect(() => {
        if (max) handleMaxClick();
    }, [showInUsd]);

    return {
        isLoading,
        showInUsd,
        amount,
        setAmount,
        reciverAddress,
        setReciverAddress,
        setMax,
        handleSubmit,
        handleMaxClick,
        handleToggleShowInUsdc,
    };
};
