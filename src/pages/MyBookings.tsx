import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, Mail, Search, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router";

const STATUS_STYLES = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Pending" },
  confirmed: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Confirmed" },
  completed: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Completed" },
  cancelled: { bg: "bg-red-500/10", text: "text-red-400", label: "Cancelled" },
};

export default function MyBookings() {
  const [email, setEmail] = useState("");
  const [searched, setSearched] = useState(false);

  const { data: myBookings, isLoading } = trpc.booking.myBookings.useQuery(
    { email },
    { enabled: searched && !!email }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-[#0C0A09] text-[#FAF5EF] p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-[#C4B5A0]">View and manage your scheduled sessions</p>
        </div>

        {/* Email Search */}
        <form onSubmit={handleSearch} className="relative mb-8 max-w-md mx-auto">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A6E5F]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email to find bookings"
            className="w-full pl-11 pr-24 py-3 rounded-xl bg-[#231F1E] border border-[#29221D] text-[#FAF5EF] placeholder:text-[#7A6E5F] focus:border-[#F59E0B] focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-black text-sm font-bold hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all"
          >
            <Search className="w-4 h-4 inline mr-1" />
            Find
          </button>
        </form>

        {/* Results */}
        {isLoading && (
          <div className="text-center text-[#7A6E5F] py-10">Loading your bookings...</div>
        )}

        {searched && !isLoading && (!myBookings || myBookings.length === 0) && (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full bg-[#1C1917] border border-[#29221D] flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-[#7A6E5F]" />
            </div>
            <p className="text-[#C4B5A0] mb-4">No bookings found for {email}</p>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-black font-bold hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
            >
              Book a Session
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {myBookings && myBookings.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-[#C4B5A0] mb-4">
              Found {myBookings.length} booking{myBookings.length > 1 ? "s" : ""} for {email}
            </p>
            {myBookings.map((booking) => {
              const status = STATUS_STYLES[booking.status];
              return (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-[#29221D] bg-[#1C1917]/60 p-5 hover:border-[#3D3229] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">{booking.serviceName}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-[#C4B5A0]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-[#F59E0B]" />
                          {new Date(booking.date + "T00:00:00").toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-[#7A6E5F]" />
                          {booking.time}
                        </span>
                      </div>
                      {booking.notes && (
                        <p className="mt-2 text-sm text-[#7A6E5F]">{booking.notes}</p>
                      )}
                      <div className="mt-3 text-xs text-[#7A6E5F]">
                        Booking ID: <span className="font-mono text-[#F59E0B]">{booking.id}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center text-lg shrink-0">
                      {booking.status === "confirmed" ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                       booking.status === "cancelled" ? <XCircle className="w-5 h-5 text-red-400" /> :
                       <Calendar className="w-5 h-5 text-[#F59E0B]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
