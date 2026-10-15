"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ActivePersona } from "../lib/types";
import { loginPersona } from "../lib/api";

const PERSONAS = ["Bish1", "Bish2", "Bishwayan1"];

export default function NavigationBar({
  onPersonaChange,
}: {
  onPersonaChange?: (persona: ActivePersona) => void;
}) {
  const [selectedPersona, setSelectedPersona] = useState<string>("Bish1");
  const [activePersona, setActivePersona] = useState<ActivePersona | null>(null);

  useEffect(() => {
    loginPersona(selectedPersona).then((auth) => {
      const personaData: ActivePersona = {
        username: auth.username,
        token: auth.access_token,
        userId: auth.user_id,
      };
      setActivePersona(personaData);
      if (onPersonaChange) {
        onPersonaChange(personaData);
      }
    });
  }, [selectedPersona, onPersonaChange]);

  return (
    <header className="border-b border-[#252836] bg-[#12141a] px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-xl font-bold tracking-wider text-white">
            BIDBULL
          </Link>
          <span className="rounded bg-[#1e2230] px-2.5 py-0.5 text-xs font-medium text-emerald-400">
            ENGINE ONLINE
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <label htmlFor="persona-select" className="text-xs text-gray-400">
            PERSONA:
          </label>
          <select
            id="persona-select"
            value={selectedPersona}
            onChange={(e) => setSelectedPersona(e.target.value)}
            className="rounded border border-[#2e3344] bg-[#1a1d26] px-3 py-1.5 text-sm font-medium text-gray-200 outline-none focus:border-blue-500"
          >
            {PERSONAS.map((persona) => (
              <option key={persona} value={persona}>
                {persona}
              </option>
            ))}
          </select>
          {activePersona && (
            <span className="text-xs text-gray-400">
              ID: {activePersona.userId.slice(0, 8)}...
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
