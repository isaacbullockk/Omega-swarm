import { useState } from "react";
import { UserPlus, Mail, Send, Sparkles, CheckCircle, AlertTriangle, Loader2, Users, Zap, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function LeadNurturing() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [source, setSource] = useState("");
  const [behavior, setBehavior] = useState("");
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [nurtureResult, setNurtureResult] = useState<any>(null);
  const [sending, setSending] = useState(false);

  const utils = trpc.useUtils();
  const leads = trpc.lead.list.useQuery();
  const createLead = trpc.lead.create.useMutation({
    onSuccess: () => { utils.lead.list.invalidate(); setName(""); setEmail(""); setCompany(""); setSource(""); setBehavior(""); },
  });
  const nurture = trpc.lead.nurture.useMutation({
    onSuccess: (data) => { setNurtureResult(data); utils.lead.list.invalidate(); },
  });
  const sendToCrm = trpc.lead.sendToCrm.useMutation({
    onSuccess: () => { utils.lead.list.invalidate(); setSending(false); },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    createLead.mutate({ name, email, company: company || undefined, source: source || undefined, behavior: behavior || undefined });
  };

  const handleNurture = (leadId: string) => {
    setSelectedLead(leadId);
    setNurtureResult(null);
    nurture.mutate({ leadId, targetPlatform: "generic" });
  };

  const handleSend = (leadId: string, platform: "hubspot" | "activecampaign" | "generic") => {
    setSending(true);
    sendToCrm.mutate({ leadId, platform });
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-7 h-7 text-orange-400" />
            <h1 className="text-3xl font-bold">Lead Nurturing</h1>
          </div>
          <p className="text-gray-400">Nemotron + Kimi Symbiosis: 3-step AI workflow for converting leads</p>
        </div>

        {/* Workflow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: "1. Nemotron Planner", desc: "Analyzes lead data, CRM history, and determines strategy + urgency", color: "text-blue-400" },
            { icon: Mail, title: "2. Kimi Copywriter", desc: "Writes deeply personal, converting email matching brand voice", color: "text-orange-400" },
            { icon: Shield, title: "3. Nemotron Validator", desc: "Checks logic, errors, compliance. Formats for CRM webhook", color: "text-green-400" },
          ].map((step, i) => (
            <div key={i} className="bg-[#252542] rounded-xl p-5 border border-white/5">
              <step.icon className={`w-6 h-6 ${step.color} mb-3`} />
              <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Create Lead Form */}
        <div className="bg-[#252542] rounded-xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-orange-400" /> New Lead</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} className="bg-[#1a1a2e] border-white/10" />
            <Input placeholder="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-[#1a1a2e] border-white/10" />
            <Input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} className="bg-[#1a1a2e] border-white/10" />
            <Input placeholder="Source (e.g. website, referral, ad)" value={source} onChange={(e) => setSource(e.target.value)} className="bg-[#1a1a2e] border-white/10" />
            <Textarea placeholder="Behavior / Notes (e.g. visited pricing page 3x, downloaded guide)" value={behavior} onChange={(e) => setBehavior(e.target.value)} className="bg-[#1a1a2e] border-white/10 md:col-span-2" />
            <Button type="submit" disabled={createLead.isPending} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white md:w-fit">
              {createLead.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Add Lead
            </Button>
          </form>
        </div>

        {/* Leads List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-orange-400" /> Leads ({leads.data?.length || 0})</h2>
          {leads.data?.map((lead) => (
            <div key={lead.id} className="bg-[#252542] rounded-xl p-5 border border-white/5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{lead.name}</h3>
                  <p className="text-sm text-gray-400">{lead.email} {lead.company && `· ${lead.company}`}</p>
                  {lead.source && <p className="text-xs text-gray-500 mt-1">Source: {lead.source}</p>}
                  {lead.behavior && <p className="text-xs text-gray-500">{lead.behavior}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${lead.status === "converted" ? "bg-green-500/20 text-green-400" : lead.status === "sent" ? "bg-blue-500/20 text-blue-400" : lead.status === "nurtured" ? "bg-purple-500/20 text-purple-400" : "bg-gray-500/20 text-gray-400"}`}>
                    {lead.status}
                  </span>
                  <span className="text-xs text-gray-500">Score: {lead.score}/100</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-white/5">
                {lead.status === "new" || lead.status === "review" ? (
                  <Button size="sm" variant="outline" onClick={() => handleNurture(lead.id)} disabled={nurture.isPending && selectedLead === lead.id} className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
                    {nurture.isPending && selectedLead === lead.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Nurture
                  </Button>
                ) : null}
                {lead.status === "nurtured" || lead.status === "review" ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleSend(lead.id, "hubspot")} disabled={sending} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                      <Send className="w-3 h-3 mr-1" /> HubSpot
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSend(lead.id, "activecampaign")} disabled={sending} className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                      <Send className="w-3 h-3 mr-1" /> ActiveCampaign
                    </Button>
                  </>
                ) : null}
              </div>

              {/* Nurture Result */}
              {nurtureResult && selectedLead === lead.id && (
                <div className="mt-3 bg-[#1a1a2e] rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {nurtureResult.validation?.valid ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                    <span className="text-sm font-medium">{nurtureResult.validation?.valid ? "Validated & Ready" : "Needs Review"}</span>
                    <span className="text-xs text-gray-500 ml-auto">Urgency: {nurtureResult.strategy?.urgency}</span>
                  </div>
                  <div className="border-l-2 border-orange-500/30 pl-3">
                    <p className="text-xs text-gray-400 mb-1">Subject</p>
                    <p className="text-sm font-medium text-orange-300">{nurtureResult.email?.subject}</p>
                  </div>
                  <div className="border-l-2 border-orange-500/30 pl-3">
                    <p className="text-xs text-gray-400 mb-1">Body</p>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{nurtureResult.email?.body}</p>
                  </div>
                  {nurtureResult.email?.cta && (
                    <div className="border-l-2 border-orange-500/30 pl-3">
                      <p className="text-xs text-gray-400 mb-1">CTA</p>
                      <p className="text-sm text-blue-300">{nurtureResult.email?.cta}</p>
                    </div>
                  )}
                  {nurtureResult.validation?.issues?.length > 0 && (
                    <div className="bg-yellow-500/10 rounded-lg p-3">
                      <p className="text-xs text-yellow-400 font-medium mb-1">Issues found:</p>
                      {nurtureResult.validation.issues.map((issue: string, i: number) => (
                        <p key={i} className="text-xs text-yellow-300/70">• {issue}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {(!leads.data || leads.data.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No leads yet. Add your first lead above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
