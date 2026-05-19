import Titlebar from "./components/titlebar/Titlebar";
import TitlebarProvider from "./components/titlebar/context/TitlebarProvider";

function App() {
  return (
    <main className="min-h-screen p-4 bg-black text-slate-100">
      <TitlebarProvider>
        <Titlebar />
      </TitlebarProvider>
    </main>
  );
}

export default App;
