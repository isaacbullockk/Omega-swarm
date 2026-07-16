import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, User, Mail, Building2, CheckCircle, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router";

const STEPS = ["Select Service", "Pick Date", "Your Details", "Confirmed"];

const FALLBACK_SERVICES = [
  { id: "social-media-mgmt", name: "Social Media Management", description: "Full-service social media strategy, content creation, and community management across all major platforms.", price: "€850/mo", duration: "Ongoing", icon: "📱", features: ["Content calendar", "Daily posting", "Community engagement", "Analytics reporting", "Ad management"], popular: true },
  { id: "seo-optimization", name: "SEO Optimization", description: "Complete SEO audit, keyword strategy, on-page optimization, and link building to rank higher.", price: "€1,200/mo", duration: "3-month minimum", icon: "🔍", features: ["Keyword research", "On-page SEO", "Technical audit", "Link building", "Monthly reports"] },
  { id: "content-creation", name: "Content Creation", description: "High-quality blog posts, video scripts, email campaigns, and ad copy tailored to your brand voice.", price: "€500/project", duration: "1-2 weeks", icon: "✍️", features: ["Blog posts", "Video scripts", "Email sequences", "Ad copy", "Brand storytelling"], popular: true },
  { id: "ad-campaigns", name: "Ad Campaign Management", description: "Data-driven paid advertising across Meta, Google, TikTok with continuous optimization.", price: "€950/mo + ad spend", duration: "Ongoing", icon: "🎯", features: ["Meta Ads", "Google Ads", "TikTok Ads", "A/B testing", "ROI optimization"] },
  { id: "brand-strategy", name: "Brand Strategy", description: "Comprehensive brand positioning, messaging framework, visual identity guidance, and market research.", price: "€2,500", duration: "4-6 weeks", icon: "🎨", features: ["Brand audit", "Positioning strategy", "Messaging framework", "Visual direction", "Competitive analysis"] },
  { id: "viral-video", name: "Viral Video Production", description: "Short-form video content designed for maximum engagement and shareability on TikTok, Reels, Shorts.", price: "€750/video", duration: "1 week", icon: "🎬", features: ["Script writing", "Video editing", "Trend research", "Hashtag strategy", "Posting schedule"] },
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];

function getNext7Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function Book() {
  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingId, setBookingId] = useState("");

  const { data: apiServices } = trpc.booking.services.useQuery();
  const services = apiServices ?? FALLBACK_SERVICES;
  const createBooking = trpc.booking.create.useMutation({
    onSuccess: (data) => {
      setBookingId(data.id);
      setStep(3);
    },
  });

  const selectedServiceData = services?.find((s) => s.id === selectedService);
  const next7Days = getNext7Days();

  const handleSubmit = () => {
    if (!selectedService || !selectedDate || !selectedTime || !name || !email) return;
    createBooking.mutate({
      clientName: name,
      clientEmail: email,
      clientCompany: company || undefined,
      serviceId: selectedService,
      date: selectedDate,
      time: selectedTime,
      notes: notes || undefined,
    });
  };

  const canProceed = () => {
    if (step === 0) return !!selectedService;
    if (step === 1) return !!selectedDate && !!selectedTime;
    if (step === 2) return !!name && !!email;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#0C0A09] text-[#FAF5EF] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">Book a Session</h1>
          <p className="text-[#C4B5A0]">Schedule your marketing consultation with Omega Swarm</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i < step ? "bg-[#F59E0B] text-black" :
                  i === step ? "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]" :
                  "bg-[#1C1917] text-[#7A6E5F] border border-[#29221D]"
                }`}
              >
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i <= step ? "text-[#FAF5EF]" : "text-[#7A6E5F]"}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px ${i < step ? "bg-[#F59E0B]" : "bg-[#29221D]"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Service Selection */}
        {step === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services?.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service.id)}
                className={`relative text-left p-5 rounded-2xl border transition-all ${
                  selectedService === service.id
                    ? "border-[#F59E0B] bg-[#F59E0B]/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                    : "border-[#29221D] bg-[#1C1917]/60 hover:border-[#3D3229] hover:bg-[#1C1917]"
                }`}
              >
                {service.popular && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F59E0B] text-black uppercase">
                    Popular
                  </span>
                )}
                <div className="text-3xl mb-3">{service.icon}</div>
                <h3 className="text-lg font-bold mb-1">{service.name}</h3>
                <p className="text-sm text-[#C4B5A0] mb-3">{service.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[#F59E0B] font-bold">{service.price}</span>
                  <span className="text-xs text-[#7A6E5F]">{service.duration}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {service.features.map((f) => (
                    <span key={f} className="px-2 py-0.5 rounded-full text-[10px] bg-[#231F1E] text-[#C4B5A0] border border-[#29221D]">
                      {f}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Date & Time */}
        {step === 1 && selectedServiceData && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#29221D] bg-[#1C1917]/60 p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{selectedServiceData.icon}</span>
                <div>
                  <h3 className="font-bold">{selectedServiceData.name}</h3>
                  <p className="text-sm text-[#C4B5A0]">{selectedServiceData.price} · {selectedServiceData.duration}</p>
                </div>
              </div>
            </div>

            {/* Date picker */}
            <div>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#F59E0B]" />
                Select Date
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {next7Days.map((date) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`p-3 rounded-xl text-center border transition-all ${
                      selectedDate === date
                        ? "border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]"
                        : "border-[#29221D] bg-[#1C1917]/40 text-[#FAF5EF] hover:border-[#3D3229]"
                    }`}
                  >
                    <div className="text-[10px] uppercase text-[#7A6E5F]">
                      {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div className="text-lg font-bold">{new Date(date + "T00:00:00").getDate()}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time picker */}
            {selectedDate && (
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#F59E0B]" />
                  Select Time — {formatDate(selectedDate)}
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {TIME_SLOTS.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        selectedTime === time
                          ? "border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]"
                          : "border-[#29221D] bg-[#1C1917]/40 text-[#C4B5A0] hover:border-[#3D3229]"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Personal Details */}
        {step === 2 && (
          <div className="max-w-lg mx-auto space-y-4">
            <div className="rounded-2xl border border-[#29221D] bg-[#1C1917]/60 p-5 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedServiceData?.icon}</span>
                <div>
                  <h3 className="font-bold">{selectedServiceData?.name}</h3>
                  <p className="text-sm text-[#C4B5A0]">
                    {selectedDate && formatDate(selectedDate)} at {selectedTime}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#C4B5A0] mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-xl bg-[#231F1E] border border-[#29221D] text-[#FAF5EF] placeholder:text-[#7A6E5F] focus:border-[#F59E0B] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#C4B5A0] mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl bg-[#231F1E] border border-[#29221D] text-[#FAF5EF] placeholder:text-[#7A6E5F] focus:border-[#F59E0B] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#C4B5A0] mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Company (optional)
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Your company name"
                className="w-full px-4 py-3 rounded-xl bg-[#231F1E] border border-[#29221D] text-[#FAF5EF] placeholder:text-[#7A6E5F] focus:border-[#F59E0B] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#C4B5A0] mb-2">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tell us about your project goals..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[#231F1E] border border-[#29221D] text-[#FAF5EF] placeholder:text-[#7A6E5F] focus:border-[#F59E0B] focus:outline-none transition-colors resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canProceed() || createBooking.isPending}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                canProceed() && !createBooking.isPending
                  ? "bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-black hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-[1.02]"
                  : "bg-[#1C1917] border border-[#29221D] text-[#7A6E5F] cursor-not-allowed"
              }`}
            >
              {createBooking.isPending ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="text-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-full bg-[#22C55E]/10 border-2 border-[#22C55E] flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-[#22C55E]" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-[#C4B5A0] mb-6">
              Your session has been scheduled. We've sent a confirmation to {email}.
            </p>

            <div className="rounded-2xl border border-[#29221D] bg-[#1C1917]/60 p-6 text-left mb-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#7A6E5F]">Booking ID</span>
                  <span className="font-mono text-[#F59E0B]">{bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A6E5F]">Service</span>
                  <span>{selectedServiceData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A6E5F]">Date</span>
                  <span>{selectedDate && formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A6E5F]">Time</span>
                  <span>{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A6E5F]">Status</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400">Pending</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Link
                to="/"
                className="px-6 py-3 rounded-xl bg-[#1C1917] border border-[#29221D] text-[#FAF5EF] hover:border-[#F59E0B] transition-colors"
              >
                Back to Dashboard
              </Link>
              <Link
                to="/my-bookings"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-black font-bold hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
              >
                View My Bookings
              </Link>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        {step < 3 && (
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                step === 0
                  ? "border-[#1C1917] text-[#3D3229] cursor-not-allowed"
                  : "border-[#29221D] text-[#C4B5A0] hover:border-[#F59E0B] hover:text-[#F59E0B]"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                canProceed()
                  ? "bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-black hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  : "bg-[#1C1917] border border-[#29221D] text-[#7A6E5F] cursor-not-allowed"
              }`}
            >
              {step === 2 ? "Review & Confirm" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
