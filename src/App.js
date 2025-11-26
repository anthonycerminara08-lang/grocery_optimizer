import React, { useState } from "react";

const STORES = ["Giant Eagle", "Kuhn's", "Aldi", "Shop 'n Save"];

// Fake price table
const PRICE_TABLE = {
  milk: {
    "Giant Eagle": 3.49,
    "Kuhn's": 3.19,
    Aldi: 2.69,
    "Shop 'n Save": 3.09,
  },
  eggs: {
    "Giant Eagle": 2.99,
    "Kuhn's": 2.79,
    Aldi: 1.89,
    "Shop 'n Save": 2.49,
  },
  "boneless chicken breast": {
    "Giant Eagle": 4.99,
    "Kuhn's": 4.79,
    Aldi: 3.99,
  },
  apples: {
    "Giant Eagle": 1.79,
    "Kuhn's": 1.69,
    Aldi: 1.49,
    "Shop 'n Save": 1.59,
  },
  cereal: {
    "Giant Eagle": 3.99,
    "Kuhn's": 3.59,
    Aldi: 2.49,
  },
  pasta: {
    "Giant Eagle": 1.49,
    "Kuhn's": 1.39,
    Aldi: 1.09,
    "Shop 'n Save": 1.29,
  },
  "ground beef": {
    "Giant Eagle": 5.49,
    "Kuhn's": 5.19,
    Aldi: 4.79,
  },
  rice: {
    "Giant Eagle": 2.99,
    Aldi: 2.49,
    "Shop 'n Save": 2.69,
  },
  salmon: {
    "Giant Eagle": 9.99,
    "Kuhn's": 9.49,
    "Shop 'n Save": 8.99,
  },
};

// Simple fake “sale” metadata
const SALE_FLAGS = {
  milk: { Aldi: "Weekly sale" },
  eggs: { Aldi: "Weekly sale" },
  "boneless chicken breast": { Aldi: "Manager's special" },
  cereal: { "Kuhn's": "Card price" },
  salmon: { "Shop 'n Save": "3-day sale" },
};

function parseGroceryList(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines
    .map((line) => {
      // pattern: "name xN" or just "name"
      const match = line.match(/^(.*?)(?:\s*x(\d+))?$/i);
      let name = match && match[1] ? match[1].trim().toLowerCase() : "";
      let qty = match && match[2] ? parseInt(match[2], 10) : 1;
      if (!Number.isFinite(qty) || qty <= 0) qty = 1;
      return { raw: line, name, qty };
    })
    .filter((item) => item.name.length > 0);
}

function assignItemsToStores(items, selectedStores) {
  const perStore = {};
  selectedStores.forEach((store) => {
    perStore[store] = { items: [], total: 0 };
  });

  const unknown = [];

  items.forEach((item) => {
    const priceEntry = PRICE_TABLE[item.name];
    if (!priceEntry) {
      unknown.push(item);
      return;
    }

    const candidates = selectedStores
      .filter((store) => priceEntry[store] != null)
      .map((store) => ({ store, price: priceEntry[store] }));

    if (candidates.length === 0) {
      unknown.push(item);
      return;
    }

    candidates.sort((a, b) => a.price - b.price);
    const best = candidates[0];

    const lineTotal = best.price * item.qty;
    perStore[best.store].items.push({
      name: item.name,
      qty: item.qty,
      unitPrice: best.price,
      lineTotal,
      saleTag: SALE_FLAGS[item.name]?.[best.store] || null,
    });
    perStore[best.store].total += lineTotal;
  });

  let grandTotal = 0;
  let usedStores = 0;
  Object.values(perStore).forEach((storeData) => {
    if (storeData.items.length > 0) {
      usedStores++;
      grandTotal += storeData.total;
    }
  });

  return { perStore, unknown, grandTotal, usedStores };
}

function formatCurrency(value) {
  return "$" + value.toFixed(2);
}

function App() {
  const [selectedStores, setSelectedStores] = useState(STORES.slice(0, 2));
  const [groceryText, setGroceryText] = useState(`milk x2
eggs x12
boneless chicken breast x3
apples x6
cereal
pasta x4
salmon x2
rice x2
ice cream`);
  const [results, setResults] = useState(null);

  const handleStoreToggle = (store) => {
    setSelectedStores((prev) =>
      prev.includes(store) ? prev.filter((s) => s !== store) : [...prev, store]
    );
  };

  const handleOptimize = () => {
    if (selectedStores.length === 0) {
      alert("Select at least one store first.");
      return;
    }

    const items = parseGroceryList(groceryText);
    if (items.length === 0) {
      alert("Enter at least one grocery item.");
      return;
    }

    const assignment = assignItemsToStores(items, selectedStores);
    setResults(assignment);
  };

  const handleFillExample = () => {
    setGroceryText(`milk x2
eggs x12
boneless chicken breast x3
apples x6
cereal
pasta x4
salmon x2
rice x2
ice cream`);
  };

  return (
    <div className="app">
      <h1>Grocery Deal Optimizer (Demo)</h1>
      <p className="subtitle">
        Fake data. Real logic. Enter a list, pick your stores, and see how the
        app might split your items to minimize cost.
      </p>

      <div className="layout">
        {/* Left: Controls */}
        <div className="card">
          <h2>1. Choose your stores</h2>
          <p className="hint">
            Only selected stores will be used when assigning items.
          </p>
          <div className="stores-list">
            {STORES.map((store) => (
              <label key={store} className="store-pill">
                <input
                  type="checkbox"
                  checked={selectedStores.includes(store)}
                  onChange={() => handleStoreToggle(store)}
                />
                <span>{store}</span>
              </label>
            ))}
          </div>

          <h2 style={{ marginTop: 16 }}>2. Paste your grocery list</h2>
          <p className="hint">
            One item per line. Optional quantity with <code>xN</code>, e.g.{" "}
            <code>milk x2</code>.
          </p>
          <textarea
            value={groceryText}
            onChange={(e) => setGroceryText(e.target.value)}
            placeholder={`Examples:
milk x2
eggs x12
boneless chicken breast x3
apples x6
cereal`}
          />

          <div className="btn-row">
            <button className="btn-primary" onClick={handleOptimize}>
              Optimize List
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={handleFillExample}
            >
              Fill Example List
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div>
          <div className="card">
            <h2>3. Recommended per-store lists</h2>
            <p className="hint">
              This is a prototype. Prices are fake, but the assignment logic is
              close to what a real app could do.
            </p>

            <div className="results">
              {results &&
                Object.entries(results.perStore).map(([store, storeData]) => {
                  if (!storeData.items || storeData.items.length === 0)
                    return null;
                  return (
                    <div className="result-card" key={store}>
                      <div className="result-header">
                        <h3>{store}</h3>
                        <span className="tag">Optimized</span>
                      </div>
                      <div className="result-total">
                        Store total: {formatCurrency(storeData.total)}
                      </div>
                      <ul className="result-items">
                        {storeData.items.map((it, idx) => (
                          <li key={idx}>
                            <div className="item-main">
                              <span>{`${it.name} x${it.qty}`}</span>
                              <span className="price">
                                {formatCurrency(it.lineTotal)}
                              </span>
                            </div>
                            <div className="meta">
                              @ {formatCurrency(it.unitPrice)}/ea
                              {it.saleTag ? ` • ${it.saleTag}` : ""}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
            </div>

            {results && results.grandTotal > 0 && (
              <div className="overall">
                Estimated spend across <span>{results.usedStores}</span>{" "}
                store(s): <span>{formatCurrency(results.grandTotal)}</span>
              </div>
            )}

            {results && results.unknown.length > 0 && (
              <div className="warning">
                No price data for:{" "}
                {results.unknown.map((u) => u.raw).join(", ")}. A real app would
                try to match these to items in the circulars or let you input
                prices.
              </div>
            )}

            {results &&
              results.unknown.length === 0 &&
              results.grandTotal > 0 && (
                <div className="badge">
                  <strong>Nice!</strong> Every item was matched to at least one
                  store.
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

