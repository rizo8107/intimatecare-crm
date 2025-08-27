import React, { useEffect, useMemo, useState } from 'react';
import LeadsList from '../components/leads/LeadsList';
import { useAppContext } from '../context/AppContext';
import { getPaymentData } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { format } from 'date-fns';

type DateQuickFilter = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom';

const LeadsPage: React.FC = () => {
  const { leads, setFilteredLeads } = useAppContext();

  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const [quickFilter, setQuickFilter] = useState<DateQuickFilter>('all');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  // Fetch payments to access accurate created_at and amount
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoadingPayments(true);
        const data = await getPaymentData();
        setPayments(data || []);
        setPaymentsError(null);
      } catch (e) {
        setPaymentsError('Failed to load payments');
      } finally {
        setLoadingPayments(false);
      }
    };
    fetch();
  }, []);

  // Map: order_id -> { created_at, amount, status }
  const paymentIndex = useMemo(() => {
    const map: Record<string, { created_at: string; amount: number; status?: string }> = {};
    payments.forEach((p: any) => {
      if (p.razorpay_order_id) {
        map[p.razorpay_order_id] = {
          created_at: p.created_at,
          amount: Number(p.amount) || 0,
          status: p.status,
        };
      }
    });
    return map;
  }, [payments]);

  // Helpers
  const inRange = (d: Date, from?: Date, to?: Date) => {
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  };

  const getRangeForQuickFilter = (filter: DateQuickFilter): { from?: Date; to?: Date } => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (filter) {
      case 'today':
        return { from: startOfToday, to: endOfToday };
      case 'yesterday': {
        const y = new Date(startOfToday);
        y.setDate(y.getDate() - 1);
        const yEnd = new Date(endOfToday);
        yEnd.setDate(yEnd.getDate() - 1);
        return { from: y, to: yEnd };
      }
      case 'this_week': {
        // Week starts on Sunday (local)
        const day = startOfToday.getDay(); // 0=Sun,1=Mon,...6=Sat
        const start = new Date(startOfToday);
        start.setDate(start.getDate() - day);
        return { from: start, to: endOfToday };
      }
      case 'this_month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: start, to: endOfToday };
      }
      case 'custom': {
        const from = customFrom ? new Date(customFrom) : undefined;
        const to = customTo ? new Date(new Date(customTo).getFullYear(), new Date(customTo).getMonth(), new Date(customTo).getDate(), 23, 59, 59, 999) : undefined;
        return { from, to };
      }
      case 'all':
      default:
        return {};
    }
  };

  // Payments filtered by the current date range (SUCCESS only)
  const filteredPayments = useMemo(() => {
    const { from, to } = getRangeForQuickFilter(quickFilter);
    return payments.filter((p) => {
      if (p.status && p.status !== 'SUCCESS') return false;
      if (!p.created_at) return false;
      const d = new Date(p.created_at);
      return inRange(d, from, to);
    });
  }, [payments, quickFilter, customFrom, customTo]);

  // Price distribution map within current range: { price: count }
  const priceDistribution = useMemo(() => {
    const map = new Map<number, number>();
    filteredPayments.forEach((p: any) => {
      const amt = Number(p.amount) || 0;
      map.set(amt, (map.get(amt) || 0) + 1);
    });
    // Sort by count desc, then price asc
    return Array.from(map.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0] - b[0];
    });
  }, [filteredPayments]);

  // Apply filter to leads displayed in list using payment.created_at
  useEffect(() => {
    const { from, to } = getRangeForQuickFilter(quickFilter);
    if (quickFilter === 'all' || (!from && !to)) {
      setFilteredLeads(leads);
      return;
    }

    const filtered = leads.filter((lead) => {
      const p = paymentIndex[lead.id];
      if (!p || !p.created_at) return false;
      const d = new Date(p.created_at);
      return inRange(d, from, to);
    });
    setFilteredLeads(filtered);
  }, [leads, quickFilter, customFrom, customTo, paymentIndex, setFilteredLeads]);

  // Purchase report aggregations (SUCCESS only)
  const summarize = (range: { from?: Date; to?: Date }) => {
    const rows = payments.filter((p) => {
      if (p.status && p.status !== 'SUCCESS') return false;
      if (!p.created_at) return false;
      const d = new Date(p.created_at);
      return inRange(d, range.from, range.to);
    });
    const count = rows.length;
    const amount = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    return { count, amount };
  };

  const todaySummary = useMemo(() => summarize(getRangeForQuickFilter('today')), [payments]);
  const yesterdaySummary = useMemo(() => summarize(getRangeForQuickFilter('yesterday')), [payments]);
  const weekSummary = useMemo(() => summarize(getRangeForQuickFilter('this_week')), [payments]);
  const monthSummary = useMemo(() => summarize(getRangeForQuickFilter('this_month')), [payments]);

  return (
    <div className="space-y-6">
      {/* Report Section */}
      <Card>
        <CardHeader>
          <CardTitle>Purchases Report</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPayments ? (
            <div className="text-sm text-gray-500">Loading payments...</div>
          ) : paymentsError ? (
            <div className="text-sm text-red-600">{paymentsError}</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-white">
                  <div className="text-xs text-gray-500">Today ({format(new Date(), 'dd MMM')})</div>
                  <div className="mt-2 text-2xl font-semibold">₹{todaySummary.amount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{todaySummary.count} purchases</div>
                </div>
                <div className="p-4 rounded-lg border bg-white">
                  <div className="text-xs text-gray-500">Yesterday</div>
                  <div className="mt-2 text-2xl font-semibold">₹{yesterdaySummary.amount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{yesterdaySummary.count} purchases</div>
                </div>
                <div className="p-4 rounded-lg border bg-white">
                  <div className="text-xs text-gray-500">This Week</div>
                  <div className="mt-2 text-2xl font-semibold">₹{weekSummary.amount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{weekSummary.count} purchases</div>
                </div>
                <div className="p-4 rounded-lg border bg-white">
                  <div className="text-xs text-gray-500">This Month</div>
                  <div className="mt-2 text-2xl font-semibold">₹{monthSummary.amount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{monthSummary.count} purchases</div>
                </div>
              </div>

              {/* Price distribution within current range */}
              <div>
                <div className="text-sm font-medium text-gray-800 mb-2">Price breakdown (current range)</div>
                {priceDistribution.length === 0 ? (
                  <div className="text-sm text-gray-500">No purchases in this range.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {priceDistribution.map(([price, count]) => (
                      <span key={price} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-sm bg-gray-50">
                        <span className="font-semibold">₹{price.toLocaleString()}</span>
                        <span className="text-gray-600">— {count}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date Filters for Leads (based on payments created_at) */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Leads by Purchase Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Quick filter pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { v: 'all', label: 'All' },
                { v: 'today', label: 'Today' },
                { v: 'yesterday', label: 'Yesterday' },
                { v: 'this_week', label: 'This Week' },
                { v: 'this_month', label: 'This Month' },
                { v: 'custom', label: 'Custom' },
              ].map((opt) => (
                <Button
                  key={opt.v}
                  size="sm"
                  variant={quickFilter === (opt.v as DateQuickFilter) ? 'primary' : 'outline'}
                  onClick={() => setQuickFilter(opt.v as DateQuickFilter)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {/* Custom range controls */}
            {quickFilter === 'custom' && (
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">From</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">To</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => setQuickFilter('custom')}
                >
                  Apply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomFrom('');
                    setCustomTo('');
                    setQuickFilter('all');
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leads table */}
      <LeadsList />
    </div>
  );
};

export default LeadsPage;