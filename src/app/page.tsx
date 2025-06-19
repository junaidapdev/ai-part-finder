'use client';
import React, { useState, useRef } from "react";
import { FiLoader, FiCheckCircle, FiRefreshCw, FiShoppingCart, FiEye, FiXCircle } from "react-icons/fi";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

function getRandomStockStatus() {
  return Math.random() > 0.5 ? "In Stock" : "Out of Stock";
}

type PartAlternative = {
  part_number: string;
  brand: string;
  description: string;
  specs: string[];
  application?: string;
  stock?: string;
};
type PartResult = {
  part_number: string;
  brand: string;
  description: string;
  specs: string[];
  application: string;
  stock: string;
  alternatives: PartAlternative[];
};

function extractFirstJsonObject(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<{
    partNumber: string;
    brand: string;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<PartResult | null>(null);

  // Modal form refs for focus trap
  const nameRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        alert("OpenAI API key not set");
        setLoading(false);
        return;
      }
      const prompt = `You are an industrial automation part finder AI. Extract the most likely part number, brand, description, specs (as a list), application, and stock status from the following user query. Also, always suggest at least 3 alternative part numbers with brand, description, specs, application, and stock. Return your response as JSON in this format:\n{\n  \"part_number\": \"...\",\n  \"brand\": \"...\",\n  \"description\": \"...\",\n  \"specs\": [\"...\"],\n  \"application\": \"...\",\n  \"stock\": \"In Stock\" or \"Out of Stock\",\n  \"alternatives\": [ { \"part_number\": \"...\", \"brand\": \"...\", \"description\": \"...\", \"specs\": [\"...\"], \"application\": \"...\", \"stock\": \"In Stock\" or \"Out of Stock\" }, ... ]\n}`;
      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: query },
          ],
          temperature: 0.2,
        }),
      });
      const data = await response.json();
      let parsed: PartResult;
      try {
        const jsonStr = extractFirstJsonObject(data.choices[0].message.content);
        if (!jsonStr) throw new Error("No JSON found in response");
        parsed = JSON.parse(jsonStr);
      } catch {
        alert("Could not parse AI response. Try again.");
        setLoading(false);
        return;
      }
      setResult(parsed);
    } catch {
      alert("Failed to search part. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (partNumber: string, brand: string) => {
    setSelectedPart({ partNumber, brand });
    setModalOpen(true);
    setTimeout(() => nameRef.current?.focus(), 100); // Focus name field
  };
  const closeModal = () => {
    setModalOpen(false);
    setSelectedPart(null);
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submit
    closeModal();
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-gray-100">
      {/* Hero Section */}
      <div className="w-full max-w-2xl mt-12 rounded-3xl shadow-2xl bg-white px-6 sm:px-12 pt-10 pb-8 flex flex-col items-center text-center border border-primary/20">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black mb-3 font-sans">AI Part Finder</h1>
        <p className="text-lg sm:text-xl text-gray-700 font-normal mb-6 font-sans">Describe your part. We&apos;ll find it using AI.</p>
        <form className="w-full max-w-xl flex flex-col gap-4 mx-auto mt-4" onSubmit={handleSubmit}>
          <textarea
            className="w-full min-h-[110px] sm:min-h-[120px] rounded-2xl border border-primary/30 bg-gray-50 p-5 text-lg text-black shadow focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-gray-400 font-sans"
            placeholder="Enter part number or product description..."
            disabled={loading}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className={`w-full mt-2 py-4 rounded-full bg-black hover:bg-gray-900 text-white text-lg font-semibold shadow-lg border border-black focus:outline-none focus:ring-2 focus:ring-black active:scale-95 disabled:bg-gray-700 disabled:text-white/80 disabled:cursor-not-allowed transform-gpu hover:scale-[1.03] active:scale-95 font-sans flex items-center justify-center gap-2 transition-transform`}
            disabled={loading || !query.trim()}
          >
            {loading ? (<FiLoader className="animate-spin" />) : (<FiRefreshCw />)}
            {loading ? "Searching…" : "Search Part"}
          </button>
        </form>
      </div>
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <FiLoader className="w-12 h-12 text-primary animate-spin mb-4" />
          <span className="text-gray-700 text-lg font-medium animate-pulse">Searching parts with AI…</span>
        </div>
      )}
      {/* Product Result Card (from AI) */}
      {!loading && result && (
        <div className="w-full max-w-3xl mt-12 px-4 sm:px-0">
          <div className="w-full bg-white rounded-2xl shadow-2xl p-8 flex flex-col sm:flex-row gap-8 border-2 border-primary/20 relative">
            {/* Left: Image & Specs */}
            <div className="flex-1 flex flex-col gap-4 items-start">
              <div className="text-2xl font-bold text-black font-sans mb-1">{result.part_number}</div>
              <div className="text-base text-black font-medium font-sans mb-1">{result.brand}</div>
              <div className="text-base text-black font-sans mb-2">{result.description}</div>
              {result.specs && result.specs.length > 0 && (
                <div className="mt-1">
                  <div className="text-base font-bold text-black mb-1">Specs:</div>
                  <ul className="list-disc list-inside text-black text-base">
                    {result.specs.map((spec, i) => (
                      <li key={i}>{spec}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="text-base text-black font-sans mt-2"><span className="font-bold">Application:</span> {result.application}</div>
            </div>
            {/* Right: Actions & Status */}
            <div className="flex flex-col gap-4 items-end justify-between min-w-[180px] sm:min-w-[220px]">
              <div className="flex items-center gap-2 mb-2">
                {result.stock === 'In Stock' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-sm"><FiCheckCircle /> In Stock</span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-sm"><FiXCircle /> Out of Stock</span>
                )}
              </div>
              <div className="text-2xl font-bold text-black mb-2">$89.50</div>
              <div className="flex flex-col gap-2 w-full">
                <button className="w-full py-3 rounded-full bg-black hover:bg-gray-900 text-white font-semibold shadow transition-all focus:outline-none focus:ring-2 focus:ring-black flex items-center justify-center gap-2 text-base transition-transform hover:scale-[1.03] active:scale-95 disabled:bg-gray-700 disabled:text-white/80 disabled:cursor-not-allowed" disabled={false}><FiEye /> View Product</button>
                <button className="w-full py-3 rounded-full bg-black hover:bg-gray-900 text-white font-semibold shadow transition-all focus:outline-none focus:ring-2 focus:ring-black flex items-center justify-center gap-2 text-base transition-transform hover:scale-[1.03] active:scale-95 disabled:bg-gray-700 disabled:text-white/80 disabled:cursor-not-allowed" disabled={false}><FiShoppingCart /> Add to Quote</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Alternative Parts Section (from AI) */}
      {!loading && result && result.alternatives && result.alternatives.length > 0 && (
        <div className="w-full max-w-3xl mt-10 px-4 sm:px-0 pb-10">
          <div className="flex items-center gap-2 mb-3 mt-8">
            <FiRefreshCw className="text-primary w-5 h-5" />
            <h2 className="text-base font-bold text-black">Suggested Alternatives</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible">
            {result.alternatives.map((alt, i) => (
              <div
                key={i}
                className="min-w-[85vw] max-w-full sm:min-w-0 sm:w-full bg-white rounded-2xl shadow-card border-2 border-primary/10 p-5 flex flex-col gap-3 transition-all flex-shrink-0 font-sans"
              >
                <div className="text-lg font-bold text-black mb-1">{alt.part_number}</div>
                <div className="text-base text-black font-medium mb-1">{alt.brand}</div>
                <div className="text-sm text-black mb-2">{alt.description}</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {alt.specs && alt.specs.length > 0 && alt.specs.slice(0, 2).map((spec: string, j: number) => (
                    <span key={j} className="bg-primary/5 border border-primary/20 rounded-xl px-3 py-1 text-xs font-semibold text-black">{spec}</span>
                  ))}
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <button className="w-full py-2 rounded-full bg-black hover:bg-gray-900 text-white font-semibold shadow transition-all focus:outline-none focus:ring-2 focus:ring-black flex items-center justify-center gap-2 text-xs transition-transform hover:scale-[1.03] active:scale-95 disabled:bg-gray-700 disabled:text-white/80 disabled:cursor-not-allowed" disabled={false}><FiEye /> View</button>
                  <button className="w-full py-2 rounded-full bg-black hover:bg-gray-900 text-white font-semibold shadow transition-all focus:outline-none focus:ring-2 focus:ring-black flex items-center justify-center gap-2 text-xs transition-transform hover:scale-[1.03] active:scale-95 disabled:bg-gray-700 disabled:text-white/80 disabled:cursor-not-allowed" disabled={false}><FiShoppingCart /> Quote</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Enquiry Modal */}
      {modalOpen && selectedPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md mx-2 sm:mx-4 relative flex flex-col gap-6 animate-modal-pop font-sans">
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans">Enquire about a part</h3>
            <form className="flex flex-col gap-4" onSubmit={handleEnquirySubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input ref={nameRef} required className="rounded-xl border border-gray-200 p-3 text-base focus:ring-2 focus:ring-blue-400 outline-none font-sans" type="text" placeholder="Your Name" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input required className="rounded-xl border border-gray-200 p-3 text-base focus:ring-2 focus:ring-blue-400 outline-none font-sans" type="email" placeholder="you@email.com" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Mobile Number</label>
                <input required className="rounded-xl border border-gray-200 p-3 text-base focus:ring-2 focus:ring-blue-400 outline-none font-sans" type="tel" placeholder="Mobile Number" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Part Number</label>
                <input className="rounded-xl border border-gray-100 p-3 text-base bg-gray-50 text-gray-700 font-sans" type="text" value={selectedPart.partNumber} readOnly />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Brand</label>
                <input className="rounded-xl border border-gray-100 p-3 text-base bg-gray-50 text-gray-700 font-sans" type="text" value={selectedPart.brand} readOnly />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Message</label>
                <textarea className="rounded-xl border border-gray-200 p-3 text-base focus:ring-2 focus:ring-blue-400 outline-none min-h-[80px] w-full font-sans" placeholder="Your message (optional)" />
              </div>
              <div className="flex gap-3 mt-2 flex-col sm:flex-row">
                <button type="submit" className="flex-1 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 transform-gpu hover:scale-[1.02] active:scale-95 font-sans">Submit Enquiry</button>
                <button type="button" className="flex-1 py-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-semibold shadow transition-all focus:outline-none focus:ring-2 focus:ring-gray-300 transform-gpu hover:scale-[1.02] active:scale-95 font-sans" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
