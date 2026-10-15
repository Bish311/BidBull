"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import NavigationBar from "../../../components/NavigationBar";
import AuctionRoom from "../../../components/AuctionRoom";
import { ActivePersona } from "../../../lib/types";

export default function AuctionRoomPage() {
  const params = useParams();
  const itemId = typeof params.id === "string" ? params.id : "";
  const [activePersona, setActivePersona] = useState<ActivePersona>({
    username: "Bish1",
    token: "",
    userId: "",
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0d11]">
      <NavigationBar onPersonaChange={setActivePersona} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {itemId ? (
          <AuctionRoom itemId={itemId} activePersona={activePersona} />
        ) : (
          <div className="font-mono text-xs text-red-500">
            INVALID AUCTION ITEM IDENTIFIER
          </div>
        )}
      </main>
    </div>
  );
}
