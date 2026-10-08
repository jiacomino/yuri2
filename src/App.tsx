import { Toast } from "@heroui/react";
import { AppShell } from "@/components/app/AppShell";

function App() {
  return (
    <>
      <AppShell />
      <Toast.Provider placement="bottom end" />
    </>
  );
}

export default App;
