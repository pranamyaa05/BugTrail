"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/status-badge';
import { SeverityBadge, PriorityBadge } from '@/components/severity-badge';
import { BUG_STATUSES, BUG_SEVERITIES } from '@/lib/workflow';
import { Search, Bug, CheckCircle2, AlertTriangle, Flame, MessageSquare, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [bugs, setBugs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [bugsRes, productsRes] = await Promise.all([
        fetch('/api/bugs'),
        fetch('/api/products')
      ]);
      if (bugsRes.ok) {
        const bugsData = await bugsRes.json();
        setBugs(bugsData);
      }
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredBugs = bugs.filter(bug => {
    const matchesSearch = bug.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          bug.key?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProduct = selectedProduct ? bug.productId === selectedProduct : true;
    const matchesStatus = selectedStatus ? bug.status === selectedStatus : true;
    const matchesSeverity = selectedSeverity ? bug.severity === selectedSeverity : true;
    
    return matchesSearch && matchesProduct && matchesStatus && matchesSeverity;
  });

  // Calculate metrics
  const totalTracked = bugs.length;
  const activeBugs = bugs.filter(b => b.status === 'open' || b.status === 'in_progress').length;
  const blockers = bugs.filter(b => b.severity === 'critical' || b.severity === 'blocker').length;
  const resolved = bugs.filter(b => b.status === 'resolved' || b.status === 'closed').length;

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex items-center space-x-4">
            <div className="p-3 bg-slate-50 rounded-lg text-slate-500">
              <Bug className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Tracked</p>
              <h3 className="text-2xl font-bold text-slate-800">{totalTracked}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-500">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active / In-Flight</p>
              <h3 className="text-2xl font-bold text-slate-800">{activeBugs}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex items-center space-x-4">
            <div className="p-3 bg-rose-50 rounded-lg text-rose-500">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Blockers & Critical</p>
              <h3 className="text-2xl font-bold text-slate-800">{blockers}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Resolved / Closed</p>
              <h3 className="text-2xl font-bold text-slate-800">{resolved}</h3>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search bugs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
          
          <select 
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full md:w-48 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          >
            <option value="">All Products</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-48 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          >
            <option value="">All Statuses</option>
            {BUG_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full md:w-48 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          >
            <option value="">All Severities</option>
            {BUG_SEVERITIES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button 
            onClick={fetchDashboardData}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Bug Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="px-6 py-4">Issue</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Severity/Priority</th>
                  <th className="px-6 py-4">Assignee</th>
                  <th className="px-6 py-4 text-right">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-violet-500 mx-auto" />
                      <p className="mt-2 text-sm text-slate-500">Loading bugs...</p>
                    </td>
                  </tr>
                ) : filteredBugs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No bugs found</p>
                      <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredBugs.map(bug => (
                    <tr key={bug.id} className="hover:bg-violet-50/50 transition group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <Link href={`/bugs/${bug.key}`} className="font-mono text-sm text-violet-600 hover:underline font-medium">
                            {bug.key}
                          </Link>
                          <span className="text-slate-800 font-medium text-sm mt-1">{bug.title}</span>
                          <span className="text-[11px] font-mono text-slate-500 mt-1">
                            {bug.product?.name || bug.productId}{bug.component ? ` / ${bug.component}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={bug.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <SeverityBadge severity={bug.severity} />
                          {bug.priority && <PriorityBadge priority={bug.priority} />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {bug.assignee ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-medium">
                              {bug.assignee.name ? bug.assignee.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <span className="text-sm text-slate-600">{bug.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1 text-slate-400 group-hover:text-violet-500 transition">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-xs font-medium">{bug.commentsCount || 0}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}