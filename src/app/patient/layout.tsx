import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { ChatProvider } from "@/context/ChatContext";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5">

<div className="flex h-[calc(100vh-40px)] overflow-hidden rounded-[36px] bg-white shadow-[0_25px_80px_rgba(124,58,237,0.08)]">

        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">

<ChatProvider>
          <Topbar />

<main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-violet-50 p-8">
                {children}
          </main>
</ChatProvider>
        </div>

      </div>

    </div>
  );
}