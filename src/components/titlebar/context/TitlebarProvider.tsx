import {
  createContext,
  FC,
  ReactNode,
  //   useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type TContext = {
  windowState: WindowState;
  handlePinnedToggle: () => Promise<void>;
  handleAlwaysOnTopToggle: () => Promise<void>;
  handleMinimize: () => Promise<void>;
  handleMaximize: () => Promise<void>;
  handleClose: () => Promise<void>;
};

type WindowState = {
  pinned: boolean;
  alwaysOnTop: boolean;
  maximized: boolean;
};

const TitlebarContext = createContext<TContext>({} as TContext);

type TProps = {
  children: ReactNode;
};

const TitlebarProvider: FC<TProps> = ({ children }) => {
  const [windowState, setWindowState] = useState<WindowState>({
    pinned: false,
    alwaysOnTop: false,
    maximized: false,
  });

  useEffect(() => {
    window.windowControls
      .getState()
      .then(setWindowState)
      .catch(() => undefined);
  }, []);

  //   useEffect(() => {
  //     if (reloadKey !== -2) {
  //       get("/blood/request")
  //         .then(({ data }) => {
  //           setData(data);
  //         })
  //         .catch((err: Error) => {
  //           console.log(err.message);
  //         })
  //         .finally(() => {
  //           setReloadKey(-2);
  //         });
  //     }
  //   }, [reloadKey]);

  const value = useMemo(() => {
    // const reload = () => {
    //   setReloadKey(-1);
    // };
    const updateWindowState = async (nextState: Partial<WindowState>) => {
      setWindowState((current) => ({ ...current, ...nextState }));
    };

    const handlePinnedToggle = async () => {
      const nextPinned = !windowState.pinned;
      await window.windowControls.setPinned(nextPinned);
      await updateWindowState({ pinned: nextPinned });
    };

    const handleAlwaysOnTopToggle = async () => {
      const nextAlwaysOnTop = !windowState.alwaysOnTop;
      await window.windowControls.setAlwaysOnTop(nextAlwaysOnTop);
      await updateWindowState({ alwaysOnTop: nextAlwaysOnTop });
    };

    const handleMinimize = async () => {
      await window.windowControls.minimize();
    };

    const handleMaximize = async () => {
      const result = await window.windowControls.toggleMaximize();
      await updateWindowState({ maximized: result.maximized });
    };

    const handleClose = async () => {
      await window.windowControls.close();
    };

    return {
      //   data: data,
      //   loading: reloadKey === -1,
      //   reload,
      windowState,
      handlePinnedToggle,
      handleAlwaysOnTopToggle,
      handleMinimize,
      handleMaximize,
      handleClose,
    };
  }, [windowState]);

  return (
    <TitlebarContext.Provider value={value}>
      {children}
    </TitlebarContext.Provider>
  );
};

export default TitlebarProvider;
export { TitlebarContext };
