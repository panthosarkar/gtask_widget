import { useContext } from "react";
import { TitlebarContext } from "./TitlebarProvider";

export const useTitlebar = () => useContext(TitlebarContext);
