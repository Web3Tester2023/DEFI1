import useFarmDetails from "src/hooks/farms/useFarmDetails";
import useApp from "src/hooks/useApp";
import { Vault } from "src/types";
import { toFixedFloor } from "src/utils/common";
import "./VaultItem.css";
import { GoArrowUp, GoArrowDown } from "react-icons/go";
import { useAppSelector } from "src/state";

interface Props {
    vault: Vault;
}

const VaultItem: React.FC<Props> = ({ vault }) => {
    const { lightMode } = useApp();
    const { earnings } = useFarmDetails();

    const {
        userVaultBalance,
        priceOfSingleToken,
        apys: { apy },
        id,
    } = vault;

    const oldPrice = useAppSelector((state) => state.prices.oldPrices[vault.lp_address]);

    return (
        <div className={`vaults`}>
            <div>
                <div className={`vault_item ${lightMode && "vault_item--light"}`}>
                    <div className={`vault_item_images`}>
                        {vault.alt1 ? <img className={`vault_item_logo1`} alt={vault.alt1} src={vault.logo1} /> : null}

                        {vault.alt2 ? <img className={`vault_item_logo2`} alt={vault.alt2} src={vault.logo2} /> : null}

                        <p className={`vault_item_name`}>{vault.name}</p>
                    </div>

                    <div className={`vault_items_bottom_header`}>
                        <div className={`vault_items_bottom_row`}>
                            <div className={`vault_items_bottom_categories`}>
                                <p className={`vault_items_title ${lightMode && "vault_items_title--light"}`}>
                                    Your Stake
                                </p>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <p style={{ margin: 0 }}>
                                        {(userVaultBalance * priceOfSingleToken).toLocaleString("en-US", {
                                            style: "currency",
                                            currency: "USD",
                                        })}
                                    </p>
                                    {oldPrice &&
                                        (oldPrice[0].price > priceOfSingleToken ? (
                                            <span
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    transform: "translateY(2px)",
                                                }}
                                            >
                                                <GoArrowDown style={{ color: "red", transform: "translateY(1px)" }} />
                                                <p style={{ margin: 0, fontSize: 10 }}>
                                                    {Math.abs(
                                                        userVaultBalance * priceOfSingleToken -
                                                            userVaultBalance * oldPrice[0].price
                                                    ).toLocaleString("en-US", {
                                                        style: "currency",
                                                        currency: "USD",
                                                    })}
                                                </p>
                                            </span>
                                        ) : (
                                            <span
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    transform: "translateY(2px)",
                                                }}
                                            >
                                                <GoArrowUp style={{ color: "lime" }} />
                                                <p style={{ margin: 0, fontSize: 10 }}>
                                                    {Math.abs(
                                                        userVaultBalance * oldPrice[0].price -
                                                            userVaultBalance * priceOfSingleToken
                                                    ).toLocaleString("en-US", {
                                                        style: "currency",
                                                        currency: "USD",
                                                    })}
                                                </p>
                                            </span>
                                        ))}
                                </div>
                            </div>

                            <div className={`vault_items_bottom_categories`}>
                                <p className={`vault_items_title ${lightMode && "vault_items_title--light"}`}>APY</p>
                                <p>{apy < 0.01 ? apy.toPrecision(2).slice(0, -1) : toFixedFloor(apy, 2).toString()}%</p>
                            </div>
                            <div className={`vault_items_bottom_categories`}>
                                <p className={`vault_items_title ${lightMode && "vault_items_title--light"}`}>
                                    Earning
                                </p>
                                <p>
                                    {(earnings[id] ?? 0).toLocaleString("en-US", {
                                        style: "currency",
                                        currency: "USD",
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VaultItem;
