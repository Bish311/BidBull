"use client";

import { useEffect, useState } from "react";
import NavigationBar from "../components/NavigationBar";
import AuctionCard from "../components/AuctionCard";
import { Item } from "../lib/types";
import { fetchItems } from "../lib/api";

const STATUS_FILTERS = ["ALL", "ACTIVE", "EXTENDED", "CLOSED"];

export default function CatalogPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    const apiFilter = filter === "ALL" ? undefined : filter;
    fetchItems(apiFilter)
      .then((data) => {
        setItems(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [filter]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0d11]">
      <NavigationBar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="mb-8 flex items-center justify-between border-b border-[#252836] pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-wide text-white">
              LIVE AUCTION CATALOG
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              Deterministic proxy bidding and anti-sniping soft-close protection.
            </p>
          </div>

          <div className="flex space-x-1 rounded bg-[#161822] p-1 border border-[#252836]">
            {STATUS_FILTERS.map((statusName) => (
              <button
                key={statusName}
                type="button"
                onClick={() => setFilter(statusName)}
                className={`rounded px-3 py-1 text-xs font-semibold tracking-wider transition ${
                  filter === statusName
                    ? "bg-[#2563eb] text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {statusName}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center font-mono text-xs text-gray-500">
            LOADING CATALOG...
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-64 items-center justify-center font-mono text-xs text-gray-500">
            NO LISTINGS FOUND IN THIS STATUS.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <AuctionCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
