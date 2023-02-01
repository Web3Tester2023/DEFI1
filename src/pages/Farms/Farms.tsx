import "./Farms.css";
import useApp from "src/hooks/useApp";
import useFarms, { useFarmDetails } from "src/hooks/farms/useFarms";
import FarmItem from "src/components/FarmItem/FarmItem";

function Farms() {
    const { lightMode } = useApp();
    const { farms } = useFarms();
    const { farmDetails } = useFarmDetails();

    return (
        <div className={`farms ${lightMode && "farms--light"}`}>
            <div className={`farm_header ${lightMode && "farm_header--light"}`}>
                <p>Farms</p>
            </div>
            <div className={`farm__title ${lightMode && "farm__title--light"}`}>
                <p className={`farm__asset`}>ASSET</p>
                <div className={`farm__second__title`}>
                    <p className="farm__second__title__deposite">DEPOSITED</p>
                    <p className="farm__second__title__tvl__desktop">TOTAL LIQUIDITY</p>
                    <p className="farm__second__title__tvl__mobile">TVL</p>
                    <p className="farm__second__title__apy">APY</p>
                </div>
            </div>

            <div className="pools_list">
                {farmDetails.map((farm) => (
                    <FarmItem key={farm.id} farm={farm} />
                ))}
            </div>
        </div>
    );
}

export default Farms;
