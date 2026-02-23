"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Calendar, Receipt, LogOut, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Home() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [hourlyRate, setHourlyRate] = useState(150);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const handleGenerateInvoice = async () => {
    setLoading(true);
    setInvoice(null);
    try {
      const res = await fetch("/api/invoice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourlyRate, demoMode: isDemoMode }),
      });
      const data = await res.json();
      if (res.ok && data.invoice) {
        setInvoice(data.invoice);
      } else {
        console.error("Failed to fetch invoice", data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text("Meeting Invoice", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Billed to: The Universe (and your calendar)`, 14, 35);
    
    // Summary Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, 45, 180, 25, 3, 3, 'FD');
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Meetings: ${invoice.totalMeetings}`, 20, 53);
    doc.text(`Time Wasted: ${invoice.totalHours} hrs`, 20, 60);
    doc.text(`Hourly Rate: $${invoice.hourlyRate}`, 100, 53);
    
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text(`Total Owed: $${invoice.calculatedCost.toLocaleString()}`, 100, 62);

    // Meetings Table
    if (invoice.meetings && invoice.meetings.length > 0) {
      const tableData = invoice.meetings.map((m: any) => [
        new Date(m.date).toLocaleDateString(),
        m.summary,
        `${m.durationHours} hrs`,
        `$${(m.durationHours * invoice.hourlyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ]);

      autoTable(doc, {
        startY: 80,
        head: [['Date', 'Meeting Title', 'Duration', 'Cost']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
      });
    }

    doc.save("meeting-invoice.pdf");
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center py-20 px-4">
      <div className="max-w-3xl w-full space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-full mb-4">
            <Receipt className="h-8 w-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            The Meeting Invoice Generator
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Revenge for your calendar. Calculate the exact monetary cost of all your
            "quick syncs" and generate fake invoices to soothe your soul.
          </p>
        </div>

        {!session && !isDemoMode ? (
          <div className="flex flex-col items-center justify-center mt-12 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl w-full max-w-md text-center shadow-xl">
              <Calendar className="h-12 w-12 text-zinc-500 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold mb-2">Connect Your Calendar</h2>
              <p className="text-zinc-400 mb-8 text-sm">
                We need read-only access to your Google Calendar to calculate your meeting times.
              </p>
              <button
                onClick={() => signIn("google")}
                className="w-full py-3 px-4 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                Sign in with Google
              </button>
              
              <div className="pt-4 mt-6 border-t border-zinc-800">
                <p className="text-zinc-500 text-xs mb-3">No API Keys? Try out the UI.</p>
                <button
                  onClick={() => setIsDemoMode(true)}
                  className="w-full py-2 px-4 bg-zinc-800 text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  Enter Demo Mode
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 mt-12">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-6 mb-8">
              <div className="flex items-center gap-4">
                {session?.user?.image ? (
                  <img src={session.user.image} alt="Profile" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                    {isDemoMode ? "D" : "?"}
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{isDemoMode ? "Demo User" : session?.user?.name}</h3>
                  <p className="text-sm text-zinc-400">{isDemoMode ? "demo@example.com" : session?.user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => isDemoMode ? setIsDemoMode(false) : signOut()}
                className="text-sm text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                <h3 className="text-lg font-medium mb-4">Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                      Your Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleGenerateInvoice}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Generate My Invoice
                  </button>
                </div>
              </div>

              {invoice ? (
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
                  <h3 className="text-lg font-medium">Invoice Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <span className="text-zinc-400">Total Meetings</span>
                      <span className="font-medium">{invoice.totalMeetings}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <span className="text-zinc-400">Time Wasted</span>
                      <span className="font-medium">{invoice.totalHours} hrs</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-xl pt-2 text-indigo-400">
                      <span>Total Owed</span>
                      <span>${invoice.calculatedCost.toLocaleString()}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleDownloadPDF}
                    className="w-full py-2 px-4 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    Download PDF Draft
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-900/50 border border-zinc-800/50 p-6 rounded-2xl border-dashed flex flex-col items-center justify-center text-center min-h-[250px]">
                  <Receipt className="h-8 w-8 text-zinc-600 mb-3" />
                  <p className="text-zinc-500 text-sm">
                    Click "Generate My Invoice" to analyze your calendar and calculate the damage.
                  </p>
                </div>
              )}
            </div>

            {invoice && invoice.meetings && invoice.meetings.length > 0 && (
              <div className="mt-8 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl">
                <h3 className="text-xl font-medium mb-6 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-400" />
                  Analyzed Meetings
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {invoice.meetings.map((m: any) => (
                    <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-950 border border-zinc-800/60 rounded-xl hover:border-zinc-700 transition-colors gap-3">
                      <div>
                        <p className="font-medium text-zinc-200">{m.summary}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {new Date(m.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span className="text-sm font-medium text-zinc-400">{m.durationHours} hrs</span>
                        <span className="text-sm font-bold text-indigo-400 min-w-[80px] text-right bg-indigo-500/10 py-1 px-2 rounded-md">
                          ${(m.durationHours * invoice.hourlyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
