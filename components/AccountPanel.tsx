"use client";
import { useState } from "react";
import { Account } from "./Account";
import { Authority } from "./Authority";

export function AccountPanel() {
  const [activeTab, setActiveTab] = useState<"account" | "authority">("account");

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="bg-white border-b border-[#E5E7EB] px-8">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("account")}
            className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "account"
                ? "border-[#0076BC] text-[#0076BC]"
                : "border-transparent text-[#4B5563] hover:text-[#111827]"
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab("authority")}
            className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "authority"
                ? "border-[#0076BC] text-[#0076BC]"
                : "border-transparent text-[#4B5563] hover:text-[#111827]"
            }`}
          >
            Authority
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "account" && <Account />}
        {activeTab === "authority" && <Authority />}
      </div>
    </div>
  );
}

