"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "./user-context";
import { BUG_SEVERITIES, BUG_PRIORITIES } from "@/lib/workflow";
import { X, Plus, AlertCircle, Sparkles, RefreshCw } from "lucide-react";

interface ComponentItem {
  id: string;
  name: string;
  description?: string | null;
}

interface ProductItem {
  id: string;
  name: string;
  components: ComponentItem[];
}

interface CreateBugModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBug: any) => void;
}

export function CreateBugModal({ isOpen, onClose, onSuccess }: CreateBugModalProps) {
  const { currentUser, activeTeam } = useUser();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Input states (users can type directly OR pick from datalist dropdown)
  const [productName, setProductName] = useState("");
  const [componentName, setComponentName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("NORMAL");
  const [priority, setPriority] = useState("P3");
  const [assigneeId, setAssigneeId] = useState("");
  const [osField, setOsField] = useState("All / Cross-Platform");
  const [buildVersion, setBuildVersion] = useState("Nightly 2026.08");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI State
  const [isTriaging, setIsTriaging] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [isCheckingDedup, setIsCheckingDedup] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch products for current active team
      fetch("/api/products")
        .then((res) => res.json())
        .then((data: ProductItem[]) => {
          setProducts(data);
          if (data.length > 0 && !productName) {
            setProductName(data[0].name);
            if (data[0].components.length > 0) {
              setComponentName(data[0].components[0].name);
            }
          }
        })
        .catch((err) => console.error("Failed to load products", err));

      // Fetch ONLY team members of the active workspace for Assignee dropdown
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setTeamMembers(data);
        })
        .catch((err) => console.error("Failed to load team members", err));
    }
  }, [isOpen]);

  // Find components of selected product if product matches existing one
  const matchedProduct = products.find(
    (p) => p.name.toLowerCase() === productName.trim().toLowerCase()
  );
  const availableComponents = matchedProduct ? matchedProduct.components : [];

  useEffect(() => {
    if (!title.trim() && !description.trim()) {
      setDuplicates([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsCheckingDedup(true);
      try {
        const res = await fetch("/api/ai/dedup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        });
        if (res.ok) {
          const data = await res.json();
          setDuplicates(data.duplicates || []);
        }
      } catch (err) {
        // ignore
      } finally {
        setIsCheckingDedup(false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, description]);

  const handleSuggestTriage = async () => {
    if (!title || !description) {
      alert("Please enter title and description first.");
      return;
    }
    setIsTriaging(true);
    try {
      const res = await fetch("/api/ai/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        const data = await res.json();
        setSeverity(data.severity);
        setPriority(data.priority);
        setAiRationale(data.rationale);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTriaging(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("Please log in to file bugs.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    if (!productName.trim()) {
      setError("Product is required.");
      return;
    }
    if (!componentName.trim()) {
      setError("Component is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Resolve if product matches existing DB product ID or custom string
    const existingProd = products.find(
      (p) => p.name.toLowerCase() === productName.trim().toLowerCase()
    );
    const productId = existingProd ? existingProd.id : "CUSTOM";
    const finalProductName = productName.trim();

    const existingComp = existingProd?.components.find(
      (c) => c.name.toLowerCase() === componentName.trim().toLowerCase()
    );
    const componentId = existingComp ? existingComp.id : "CUSTOM";
    const finalComponentName = componentName.trim();

    try {
      const res = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          productId,
          productName: finalProductName,
          componentId,
          componentName: finalComponentName,
          reporterId: currentUser.id,
          assigneeId: assigneeId || null,
          severity,
          priority,
          status: "NEW",
          customFields: {
            os: osField,
            buildVersion,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create bug");
      }

      // Reset form
      setTitle("");
      setDescription("");
      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden flex flex-col max-h-[90vh] border border-ochre-300 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-forest-800 forest-gradient-frame">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-btpurple-600 text-white border border-btpurple-500">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">File a New Defect Report</h2>
              <p className="text-xs text-white/70">
                Workspace: <strong className="text-thickblue-300">{activeTeam?.name || "My Workspace"}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm bg-thickblue-50">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-300 text-ladybug-600 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product & Component (Native HTML5 Combobox with datalist - NO mode buttons!) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Input + Datalist */}
            <div>
              <label className="block text-xs font-semibold text-ochre-800 mb-1.5">
                Product <span className="text-ladybug-500">*</span>
              </label>
              <input
                type="text"
                list="product-datalist"
                placeholder=""
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-white border border-thickblue-200 rounded-xl px-3 py-2 text-ochre-950 text-xs focus:outline-none focus:border-btpurple-500 focus:ring-2 focus:ring-btpurple-500/20 transition font-medium"
              />
              <datalist id="product-datalist">
                {products.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>

            {/* Component Input + Datalist */}
            <div>
              <label className="block text-xs font-semibold text-ochre-800 mb-1.5">
                Component <span className="text-ladybug-500">*</span>
              </label>
              <input
                type="text"
                list="component-datalist"
                placeholder=""
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                className="w-full bg-white border border-thickblue-200 rounded-xl px-3 py-2 text-ochre-950 text-xs focus:outline-none focus:border-btpurple-500 focus:ring-2 focus:ring-btpurple-500/20 transition font-medium"
              />
              <datalist id="component-datalist">
                {availableComponents.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-ochre-800 mb-1.5">
              Summary / Title <span className="text-ladybug-500">*</span>
            </label>
            <input
              type="text"
              placeholder=""
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-thickblue-200 rounded-xl px-3 py-2 text-ochre-950 focus:outline-none focus:border-btpurple-500 focus:ring-2 focus:ring-btpurple-500/20 transition text-xs font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-ochre-800 mb-1.5">
              Description &amp; Steps to Reproduce <span className="text-ladybug-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder=""
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-thickblue-200 rounded-xl px-3 py-2 text-ochre-950 focus:outline-none focus:border-btpurple-500 focus:ring-2 focus:ring-btpurple-500/20 transition font-mono text-xs"
            />
          </div>

          {/* AI Dedup Banner */}
          {isCheckingDedup && (
             <div className="flex items-center gap-2 text-xs text-ochre-700 italic">
               <RefreshCw className="w-3.5 h-3.5 animate-spin text-btpurple-600" />
               Checking for potential duplicates...
             </div>
          )}
          {duplicates.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Potential Duplicates Found</span>
              </div>
              <ul className="space-y-1">
                {duplicates.map((d: any) => (
                  <li key={d.id} className="text-xs text-amber-900 flex justify-between">
                    <a href={`/bugs/${d.key}`} target="_blank" rel="noreferrer" className="hover:underline line-clamp-1">
                      <strong>{d.key}</strong>: {d.title}
                    </a>
                    <span className="shrink-0 text-amber-800 font-mono ml-2">
                      {d.similarity}% match
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Auto-Triage Action */}
          <div className="flex items-center justify-between pt-2">
            <h4 className="text-xs font-bold text-ochre-900">Triage Details</h4>
            <button
              type="button"
              onClick={handleSuggestTriage}
              disabled={isTriaging || !title || !description}
              className="px-2.5 py-1.5 rounded-xl bg-btpurple-100 text-btpurple-800 hover:bg-btpurple-200 border border-btpurple-200 text-[11px] font-bold transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isTriaging ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              <span>Auto-Suggest Triage</span>
            </button>
          </div>

          {aiRationale && (
            <div className="p-3 bg-btpurple-50 border border-btpurple-200 rounded-xl text-[11px] text-btpurple-900 font-medium">
              <span className="font-bold mr-1">AI Triage Rationale:</span>
              {aiRationale}
            </div>
          )}

          {/* Severity, Priority, Assignee */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Severity */}
            <div>
              <label className="block text-xs font-semibold text-ochre-800 mb-1.5">Severity</label>
              <input
                type="text"
                list="severity-datalist"
                placeholder=""
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-white border border-thickblue-200 rounded-xl px-3 py-2 text-ochre-950 focus:outline-none focus:border-btpurple-500 transition text-xs font-medium"
              />
              <datalist id="severity-datalist">
                {BUG_SEVERITIES.map((sev) => (
                  <option key={sev} value={sev} />
                ))}
              </datalist>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-ochre-800 mb-1.5">Priority</label>
              <input
                type="text"
                list="priority-datalist"
                placeholder=""
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-white border border-thickblue-200 rounded-xl px-3 py-2 text-ochre-950 focus:outline-none focus:border-btpurple-500 transition text-xs font-medium"
              />
              <datalist id="priority-datalist">
                {BUG_PRIORITIES.map((prio) => (
                  <option key={prio} value={prio} />
                ))}
              </datalist>
            </div>

            {/* Assignee (ONLY shows members of active workspace!) */}
            <div>
              <label className="block text-xs font-semibold text-ochre-800 mb-1.5">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-white border border-thickblue-200 rounded-xl px-3 py-2 text-ochre-950 focus:outline-none focus:border-btpurple-500 transition text-xs"
              >
                <option value="">(Unassigned)</option>
                {teamMembers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* OS & Build version */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ochre-800 mb-1.5">Operating System / Platform</label>
              <input
                type="text"
                value={osField}
                onChange={(e) => setOsField(e.target.value)}
                className="w-full bg-white border border-thickblue-200 rounded-xl px-3 py-2 text-ochre-950 focus:outline-none focus:border-btpurple-500 transition text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ochre-800 mb-1.5">Target Build / Version</label>
              <input
                type="text"
                value={buildVersion}
                onChange={(e) => setBuildVersion(e.target.value)}
                className="w-full bg-white border border-thickblue-200 rounded-xl px-3 py-2 text-ochre-950 focus:outline-none focus:border-btpurple-500 transition text-xs font-mono"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-thickblue-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-ochre-300 text-ochre-800 hover:bg-ochre-100 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-btpurple-600 hover:bg-btpurple-700 text-white font-semibold text-xs transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting ? "Filing Bug..." : "File Defect Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}