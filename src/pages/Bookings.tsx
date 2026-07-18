import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, User, Mail, Building2, CheckCircle, XCircle, Clock3, Search, Filter, ChevronDown, Trash2 } from "lucide-react";

const STATUS_STYLES = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Pending" },
  confirmed: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Confirmed" },
  completed: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Completed" },
  cancelled: { bg: "bg-red-500/10", text: "text-red-400", label: "Cancelled" },
};

export default function Bookings() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const utils = trpc.useUtils();

  const { data: bookings, isLoading } = trpc.booking.list.useQuery();

  const updateStatus = trpc.booking.updateStatus.useMutation({
    onSuccess: () => utils.booking.list.invalidate(),
  });

  const deleteBooking = trpc.booking.delete.useMutation({
    onSuccess: () => utils.booking.list.invalidate(),
  });

  const filteredBookings = bookings?.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.clientName.toLowerCase().includes(q) ||
        b.clientEmail.toLowerCase().includes(q) ||
        b.serviceName.toLowerCase().includes(q) ||
        (b.clientCompany && b.clientCompany.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const stats = {
    total: bookings?.length ?? 0,
    pending: bookings?.filter((b) => b.status === "pending").length ?? 0,
    confirmed: bookings?.filter((b) => b.status === "confirmed").length ?? 0,
    completed: bookings?.filter((b) => b.status === "completed").length ?? 0,
  };

  return (
    <div className="min-h-screen bg-[#0C0A09] text-[#FAF5EF] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Booking Dashboard</h1>
            <p className="text-[#C4B5A0] mt-1">Manage all client bookings and appointments</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Bookings", value: stats.total, icon: Calendar, color: "text-[#F59E0B]" },
            { label: "Pending", value: stats.pending, icon: Clock3, color: "text-amber-400" },
            { label: "Confirmed", value: stats.confirmed, icon: CheckCircle, color: "text-emerald-400" },
            { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-blue-400" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-[#29221D] bg-[#1C1917]/60 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#7A6E5F]">{stat.label}</span>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6E5F]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, service..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#231F1E] border border-[#29221D] text-[#FAF5EF] placeholder:text-[#7A6E5F] focus:border-[#F59E0B] focus:outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6E5F]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 rounded-xl bg-[#231F1E] border border-[#29221D] text-[#FAF5EF] appearance-none focus:border-[#F59E0B] focus:outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6E5F] pointer-events-none" />
          </div>
        </div>

        {/* Bookings Table */}
        <div className="rounded-2xl border border-[#29221D] bg-[#1C1917]/60 overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-[#7A6E5F]">Loading bookings...</div>
          ) : filteredBookings?.length === 0 ? (
            <div className="p-10 text-center text-[#7A6E5F]">
              No bookings found. <a href="/book" className="text-[#F59E0B] hover:underline">Create one</a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#29221D] text-left text-xs text-[#7A6E5F] uppercase tracking-wider">
                    <th className="px-5 py-4">Client</th>
                    <th className="px-5 py-4">Service</th>
                    <th className="px-5 py-4">Date & Time</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings?.map((booking) => {
                    const status = STATUS_STYLES[booking.status];
                    return (
                      <tr key={booking.id} className="border-b border-[#29221D]/50 hover:bg-[#231F1E]/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B] font-bold text-sm">
                              {booking.clientName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{booking.clientName}</div>
                              <div className="text-xs text-[#7A6E5F] flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {booking.clientEmail}
                              </div>
                              {booking.clientCompany && (
                                <div className="text-xs text-[#7A6E5F] flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {booking.clientCompany}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-medium">{booking.serviceName}</span>
                          {booking.notes && (
                            <div className="text-xs text-[#7A6E5F] mt-1 max-w-[200px] truncate">{booking.notes}</div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="w-3.5 h-3.5 text-[#F59E0B]" />
                            {new Date(booking.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-[#C4B5A0]">
                            <Clock className="w-3.5 h-3.5 text-[#7A6E5F]" />
                            {booking.time}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {booking.status === "pending" && (
                              <button
                                onClick={() => updateStatus.mutate({ id: booking.id, status: "confirmed" })}
                                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                title="Confirm"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {booking.status !== "cancelled" && booking.status !== "completed" && (
                              <button
                                onClick={() => updateStatus.mutate({ id: booking.id, status: "cancelled" })}
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Cancel"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => { if (confirm("Delete this booking?")) deleteBooking.mutate({ id: booking.id }); }}
                              className="p-1.5 rounded-lg text-[#7A6E5F] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
