import { useState, useEffect, useMemo } from "react";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import { BsCheckCircle } from "react-icons/bs";
import { FiExternalLink, FiCopy } from "react-icons/fi";
import "./Dashboard.css";
import Vaults from "./JoinedVaults/Vaults";
import useWallet from "src/hooks/useWallet";
import useApp from "src/hooks/useApp";
import { copyToClipboard } from "src/utils";
import useConstants from "src/hooks/useConstants";
import usePriceOfTokens from "src/hooks/usePriceOfTokens";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import useFarms from "src/hooks/farms/useFarms";
import useFarmsBalances from "src/hooks/farms/useFarmsBalances";
import { TokenBalances } from "./TokenBalances/TokenBalances";
import { TransferToken } from "src/components/modals/TransferToken/TransferToken";

let redirected = false;

function Dashboard() {
    const { lightMode } = useApp();
    const { currentWallet, displayAccount } = useWallet();
    const [copied, setCopied] = useState(false);
    const { BLOCK_EXPLORER_URL } = useConstants();
    const { farms: vaults } = useFarms();
    const { prices, isFetching } = usePriceOfTokens(vaults.map((vault) => vault.lp_address));
    const { formattedBalances, isFetching: isFetching2 } = useFarmsBalances();
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const hasDeposits = useMemo(() => {
        return Object.entries(formattedBalances).some(([key, value]) => {
            const lp_addr = vaults.find((item) => item.vault_addr === key)!.lp_address;
            return prices[lp_addr] * value > 0.01;
        });
    }, [formattedBalances, prices, vaults]);

    const copy = () => {
        setCopied(true);
        copyToClipboard(currentWallet, () => setCopied(false));
    };

    useEffect(() => {
        if (!isFetching && !isFetching2) {
            if (!hasDeposits) {
                if (params.get("redirect") === "false") redirected = true;
                if (!redirected) navigate("/farms");
                redirected = true;
            }
        }
    }, [hasDeposits, isFetching, isFetching2, navigate, params]);

    return (
        <div className={`dashboard_top_bg ${lightMode && "dashboard_top_bg--light"}`} id="dashboard">
            <div className={`dashboard_header ${lightMode && "dashboard_header--light"}`}>
                <Jazzicon diameter={100} seed={jsNumberForAddress(currentWallet)} />

                <div className={`dashboard_middle`}>
                    <div>
                        <div
                            className={`dashboard_address_header ${lightMode && "dashboard_address_header--light"}`}
                            onClick={copy}
                        >
                            <p
                                className={`dashboard_address ${lightMode && "dashboard_address--light"}`}
                                style={{ marginRight: "10px" }}
                            >
                                {displayAccount}
                            </p>
                            {!copied ? <FiCopy /> : <BsCheckCircle />}
                        </div>

                        {currentWallet ? (
                            <div
                                className={`dashboard_copy ${lightMode && "dashboard_copy--light"}`}
                                onClick={() => window.open(`${BLOCK_EXPLORER_URL}/address/${currentWallet}`, "_blank")}
                            >
                                <p style={{ marginRight: "10px" }}>View on Arbiscan</p>
                                <FiExternalLink />
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className={`dashboard_section`}>
                <p className={`dashboard_wallet_title ${lightMode && "dashboard_wallet_title--light"}`}>
                    Token Balances
                </p>
                <TokenBalances />
            </div>

            <div className={`dashboard_section`}>
                <p className={`dashboard_wallet_title ${lightMode && "dashboard_wallet_title--light"}`}>
                    Joined Vaults
                </p>
                <Vaults />
            </div>
            <TransferToken />
        </div>
    );
}

export default Dashboard;
