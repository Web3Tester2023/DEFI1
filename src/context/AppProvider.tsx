import React from "react";

export const AppContext = React.createContext({
    lightMode: true,
    toggleLight: () => {},
});

interface Props {
    children: React.ReactNode;
}

const AppProvider: React.FC<Props> = ({ children }) => {
    const [lightMode, setLightMode] = React.useState(() => {
        const data = window.sessionStorage.getItem("lightMode");
        if (data != null) {
            return JSON.parse(data) as boolean;
        } else {
            return true;
        }
    });

    const toggleLight = () => {
        setLightMode((prev) => !prev);
    };

    React.useEffect(() => {
        window.sessionStorage.setItem("lightMode", JSON.stringify(lightMode));
        document.documentElement.setAttribute("data-lightMode", `${lightMode}`);
    }, [lightMode]);

    return (
        <AppContext.Provider
            value={{
                lightMode,
                toggleLight,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
export default AppProvider;
