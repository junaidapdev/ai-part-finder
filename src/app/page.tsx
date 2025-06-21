'use client';
import React, { useState, useRef } from "react";
import { FiLoader, FiCheckCircle, FiRefreshCw, FiShoppingCart, FiEye, FiXCircle, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

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
      const prompt = `You are an advanced AI assistant that specializes in identifying and cross-referencing industrial automation parts, including but not limited to PLCs, sensors, drives, HMIs, relays, connectors, and control components. Your primary goal is to help procurement engineers and maintenance technicians quickly identify the correct part and suitable alternatives.

Given a user's natural language query, perform the following tasks:

1. **Extract the following fields for the most relevant part mentioned or implied**:
   - "part_number": Official or most likely part number
   - "brand": Manufacturer or recognized brand
   - "description": Functional description of the part
   - "specs": Exactly **12 key technical specifications** as a bullet-point array (e.g., voltage, current, power, input type, output type, temperature range, mounting type, dimensions, communication protocol, response time, IP rating, housing material)
   - "application": Common or typical use-case context of the part
   - "stock": Use either "In Stock" or "Out of Stock" based on availability cues in the query

2. **Generate at least 3 high-quality alternative part suggestions**, following these strict rules:
   - Alternatives must be **functionally equivalent or compatible** with the original part
   - Prefer alternatives that are **drop-in replacements** or require **minimal modification**
   - Use only **real, industry-recognized brands** (e.g., Siemens, Allen-Bradley, Omron, Schneider Electric, Mitsubishi, etc.)
   - Include a mix of **premium and cost-effective options**, where applicable
   - Each alternative must also include **exactly 12 technical specifications**, distinct and relevant
   - Ensure the alternatives vary in terms of **brand, stock availability, or performance trade-offs**
   - Do not suggest outdated, discontinued, or generic placeholder parts

3. **Return the full response in this exact JSON format only** (no explanations, markdown, or commentary):

{
  "part_number": "string",
  "brand": "string",
  "description": "string",
  "specs": [
    "spec 1",
    "spec 2",
    "spec 3",
    "spec 4",
    "spec 5",
    "spec 6",
    "spec 7",
    "spec 8",
    "spec 9",
    "spec 10",
    "spec 11",
    "spec 12"
  ],
  "application": "string",
  "stock": "In Stock" | "Out of Stock",
  "alternatives": [
    {
      "part_number": "string",
      "brand": "string",
      "description": "string",
      "specs": [
        "spec 1",
        "spec 2",
        "spec 3",
        "spec 4",
        "spec 5",
        "spec 6",
        "spec 7",
        "spec 8",
        "spec 9",
        "spec 10",
        "spec 11",
        "spec 12"
      ],
      "application": "string",
      "stock": "In Stock" | "Out of Stock"
    },
    ...
  ]
}

**Important Behavior Rules**:
- Never provide fewer or more than **12 specifications** per part.
- Use only realistic, verified part information — no imaginary or placeholder data.
- Alternatives must be based on meaningful equivalence or improvements, not duplicates.
- Match the **application context** when suggesting alternatives.
`;
      
      

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
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-gray-100 px-2 sm:px-0">
      <div className="w-full flex flex-col items-center gap-8 sm:gap-10 mt-8 sm:mt-12">
        {/* Hero/Search Card */}
        <div className="w-full max-w-2xl rounded-2xl shadow-card border border-gray-200 bg-white px-4 sm:px-8 py-8 flex flex-col items-center text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black mb-2 font-sans">AI Part Finder</h1>
          <p className="text-base sm:text-lg text-gray-700 font-normal mb-4 font-sans">Describe your part. We&apos;ll find it using AI.</p>
          <form className="w-full flex flex-col gap-3 sm:gap-4 mx-auto mt-2" onSubmit={handleSubmit}>
            <textarea
              className="w-full min-h-[90px] sm:min-h-[110px] rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5 text-base sm:text-lg text-black shadow focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-gray-400 font-sans"
              placeholder="Enter part number or product description..."
              disabled={loading}
              value={query}
              onChange={e => setQuery(e.target.value)}
        />
            <button
              type="submit"
              className={`w-full mt-2 py-3 sm:py-4 rounded-full bg-black hover:bg-gray-900 text-white text-base sm:text-lg font-semibold shadow-lg border border-black focus:outline-none focus:ring-2 focus:ring-black active:scale-95 disabled:bg-gray-700 disabled:text-white/80 disabled:cursor-not-allowed transform-gpu hover:scale-[1.03] active:scale-95 font-sans flex items-center justify-center gap-2 transition-transform`}
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
            <FiLoader className="w-12 h-12 text-black animate-spin mb-4" />
            <span className="text-black text-lg font-medium animate-pulse">Searching parts with AI…</span>
          </div>
        )}
        {/* Product Result Card (from AI) */}
        {!loading && result && (
          <div className="w-full max-w-2xl mx-auto rounded-2xl shadow-card border border-gray-200 bg-white px-6 py-8 flex flex-col gap-6">
            {/* Header Row: Part Number, Brand, Stock */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-2xl sm:text-3xl font-bold text-black font-sans">{result.part_number}</span>
                <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-semibold border border-gray-200">{result.brand}</span>
              </div>
              <span className={`inline-flex items-center gap-1 px-4 py-1 rounded-full text-sm font-bold ${result.stock === 'In Stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{result.stock === 'In Stock' ? <FiCheckCircle /> : <FiXCircle />}{result.stock}</span>
            </div>
            {/* Description */}
            <div className="text-lg sm:text-xl text-gray-800 font-normal mb-2 leading-relaxed">{result.description}</div>
            {/* Specs */}
            {result.specs && result.specs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {result.specs.map((spec, i) => (
                  <span key={i} className="bg-gray-50 border border-gray-200 rounded-full px-4 py-1 text-sm font-medium text-gray-800 whitespace-nowrap">{spec}</span>
                ))}
              </div>
            )}
            {/* Application */}
            <div className="border-t border-gray-100 pt-4 mt-2">
              <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Application</div>
              <div className="text-base text-gray-700">{result.application}</div>
            </div>
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button className="flex-1 py-3 rounded-full bg-black hover:bg-gray-900 text-white font-semibold shadow transition-all focus:outline-none focus:ring-2 focus:ring-black flex items-center justify-center gap-2 text-base transition-transform hover:scale-[1.03] active:scale-95 disabled:bg-gray-700 disabled:text-white/80 disabled:cursor-not-allowed" disabled={false}><FiEye /> View Product</button>
              <button className="flex-1 py-3 rounded-full bg-black hover:bg-gray-900 text-white font-semibold shadow transition-all focus:outline-none focus:ring-2 focus:ring-black flex items-center justify-center gap-2 text-base transition-transform hover:scale-[1.03] active:scale-95 disabled:bg-gray-700 disabled:text-white/80 disabled:cursor-not-allowed" disabled={false}><FiShoppingCart /> Add to Quote</button>
            </div>
          </div>
        )}
        {/* Alternative Parts Section (from AI) */}
        {!loading && result && result.alternatives && result.alternatives.length > 0 && (
          <AlternativesSlider alternatives={result.alternatives} />
        )}
      </div>
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

function AlternativesSlider({ alternatives }: { alternatives: PartAlternative[] }) {
  const [index, setIndex] = React.useState(0);
  const touchStartX = React.useRef<number | null>(null);
  const touchEndX = React.useRef<number | null>(null);

  const goTo = (i: number) => {
    if (i < 0) setIndex(alternatives.length - 1);
    else if (i >= alternatives.length) setIndex(0);
    else setIndex(i);
  };

  // Touch/swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const onTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const dx = touchEndX.current - touchStartX.current;
      if (dx > 50) goTo(index - 1);
      else if (dx < -50) goTo(index + 1);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="w-full pb-12">
      <div className="flex flex-col items-center gap-2 mb-5 mt-8">
        <FiRefreshCw className="text-primary w-5 h-5" />
        <h2 className="text-base font-bold text-black">Suggested Alternatives</h2>
      </div>
      {/* Slider Row: arrows + card */}
      <div className="relative flex justify-center items-center w-full max-w-2xl mx-auto px-2 sm:px-6">
        {/* Left Arrow */}
        <button
          aria-label="Previous alternative"
          onClick={() => goTo(index - 1)}
          className="absolute left-2 sm:-left-6 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full shadow p-2 border border-gray-200 hover:bg-gray-100 active:scale-95 transition disabled:opacity-30"
          style={{ boxShadow: '0 2px 8px 0 rgba(27,39,51,0.08)' }}
          disabled={alternatives.length <= 1}
        >
          <FiChevronLeft className="w-6 h-6 text-black" />
        </button>
        {/* Card */}
        <div
          className="w-full flex justify-center items-center"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="mx-auto w-full max-w-2xl">
            <AlternativeCard alt={alternatives[index]} />
          </div>
        </div>
        {/* Right Arrow */}
        <button
          aria-label="Next alternative"
          onClick={() => goTo(index + 1)}
          className="absolute right-2 sm:-right-6 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full shadow p-2 border border-gray-200 hover:bg-gray-100 active:scale-95 transition disabled:opacity-30"
          style={{ boxShadow: '0 2px 8px 0 rgba(27,39,51,0.08)' }}
          disabled={alternatives.length <= 1}
        >
          <FiChevronRight className="w-6 h-6 text-black" />
        </button>
      </div>
      {/* Slide Count Indicator */}
      <div className="mt-4 text-xs text-gray-500 font-semibold tracking-wide text-center">
        {index + 1} / {alternatives.length}
      </div>
      {/* Dots Indicator */}
      <div className="flex gap-3 mt-2 justify-center mb-6">
        {alternatives.map((_, i) => (
          <span
            key={i}
            className={`w-3 h-3 rounded-full border-2 ${i === index ? 'bg-primary border-primary shadow-lg' : 'bg-gray-200 border-gray-300'} transition-all duration-200`}
          />
        ))}
      </div>
    </div>
  );
}

function AlternativeCard({ alt }: { alt: PartAlternative }) {
  return (
    <div
      className="bg-white rounded-2xl shadow-card border border-gray-200 p-5 flex flex-col gap-4 transition-all font-sans hover:shadow-2xl hover:border-primary/40 focus-within:shadow-2xl focus-within:border-primary/60 duration-200"
    >
      {/* Header: Part Number, Brand, Stock */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-lg sm:text-xl font-bold text-black">{alt.part_number}</span>
          <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold w-fit border border-gray-200">{alt.brand}</span>
        </div>
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${alt.stock === 'In Stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{alt.stock === 'In Stock' ? <FiCheckCircle /> : <FiXCircle />}{alt.stock}</span>
      </div>
      {/* Description */}
      <div className="text-sm sm:text-base text-gray-700 mb-1">{alt.description}</div>
      {/* Specs as horizontal pill list */}
      {alt.specs && alt.specs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-1">
          {alt.specs.map((spec: string, j: number) => (
            <span key={j} className="bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-xs font-medium text-gray-800 whitespace-nowrap">{spec}</span>
          ))}
        </div>
      )}
      {/* Application Section */}
      <div className="text-xs sm:text-sm text-gray-600 mb-2"><span className="font-semibold text-gray-800">Application:</span> {alt.application}</div>
      {/* Actions: horizontal on desktop, stacked on mobile */}
      <div className="flex flex-col sm:flex-row gap-2 mt-1">
        <button className="flex-1 py-2 rounded-full bg-black hover:bg-gray-900 text-white font-semibold shadow transition-all focus:outline-none focus:ring-2 focus:ring-black flex items-center justify-center gap-2 text-xs transition-transform hover:scale-[1.03] active:scale-95 disabled:bg-gray-700 disabled:text-white/80 disabled:cursor-not-allowed" disabled={false}><FiEye /> View</button>
        <button className="flex-1 py-2 rounded-full bg-black hover:bg-gray-900 text-white font-semibold shadow transition-all focus:outline-none focus:ring-2 focus:ring-black flex items-center justify-center gap-2 text-xs transition-transform hover:scale-[1.03] active:scale-95 disabled:bg-gray-700 disabled:text-white/80 disabled:cursor-not-allowed" disabled={false}><FiShoppingCart /> Quote</button>
      </div>
    </div>
  );
}
