"use client";
import { useState } from "react";
import { CheckCircle2, AlertCircle, Edit2, Archive, Plus, Shield, Send, Zap, ChevronDown } from "lucide-react";

export function Authority() {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [changedItems, setChangedItems] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const handleEdit = (item: string) => {
    if (!changedItems.includes(item)) {
      setChangedItems([...changedItems, item]);
    }
    setShowSubmitModal(true);
  };

  const handlePushToAgents = () => {
    setShowPushModal(true);
  };

  const toggleSection = (sectionNum: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionNum)) {
      newExpanded.delete(sectionNum);
    } else {
      newExpanded.add(sectionNum);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="p-8">
      {/* Admin Indicator & Push to Agents */}
      <div className="mb-6 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0076BC] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#111827]">Ashley&apos;s Individual Authority</div>
            <div className="text-xs text-[#4B5563]">Authority limits relative to standard guidelines. Push changes to your AI agents.</div>
          </div>
        </div>
        <button
          onClick={handlePushToAgents}
          className="flex items-center gap-2 px-4 py-2 bg-[#0076BC] text-white rounded-lg hover:bg-[#0076BC] transition-colors"
        >
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">Push to AI Agents</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* 1. Overall Appetite & Program Structure */}
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
          <button
            onClick={() => toggleSection(1)}
            className="w-full p-6 flex items-center justify-between hover:bg-[#F7F8FA] transition-colors"
          >
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold text-[#111827]">1. Overall Appetite & Program Structure</h3>
              <p className="text-sm text-[#4B5563] mt-1">Ashley&apos;s authority vs. standard guidelines</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-[#4B5563] transition-transform ${expandedSections.has(1) ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.has(1) && (
            <div className="p-6 border-t border-[#E5E7EB]">
            <div className="grid grid-cols-2 gap-4">
              <AuthorityCard
                title="Coverage Type"
                yourAuthority="All Risk Commercial Property"
                standardGuideline="All Risk Commercial Property"
                status="match"
                onEdit={() => handleEdit("coverage-type")}
              />
              <AuthorityCard
                title="Total Insurable Value"
                yourAuthority="$5M - $150M"
                standardGuideline="$500M minimum, No Maximum"
                status="restricted"
                onEdit={() => handleEdit("tiv")}
              />
              <AuthorityCard
                title="Geography"
                yourAuthority="U.S. (Exc. FL, CA Coastal)"
                standardGuideline="U.S. Domiciled Risks + PR/USVI"
                status="restricted"
                onEdit={() => handleEdit("geography")}
              />
              <AuthorityCard
                title="Perils Written"
                yourAuthority="All Perils Only"
                standardGuideline="All Perils Only"
                status="match"
                onEdit={() => handleEdit("perils")}
              />
            </div>
            <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg hover:bg-[#E5E7EB] transition-colors text-sm font-medium text-[#111827]">
              <Plus className="w-4 h-4" />
              Add Authority Parameter
            </button>
            </div>
          )}
        </div>

        {/* 2. Territory & Structure */}
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
          <button
            onClick={() => toggleSection(2)}
            className="w-full p-6 flex items-center justify-between hover:bg-[#F7F8FA] transition-colors"
          >
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold text-[#111827]">2. Territory & Structure</h3>
              <p className="text-sm text-[#4B5563] mt-1">Territorial and structural authority</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-[#4B5563] transition-transform ${expandedSections.has(2) ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.has(2) && (
            <div className="p-6 border-t border-[#E5E7EB]">
            <div className="space-y-3">
              <AuthorityItem
                text="Domestic policy (U.S.)"
                yourStatus="approved"
                standardStatus="approved"
                onEdit={() => handleEdit("domestic-policy")}
              />
              <AuthorityItem
                text="Fronted international exposure with MURA"
                yourStatus="referral"
                standardStatus="approved"
                onEdit={() => handleEdit("international")}
              />
              <AuthorityItem
                text="Florida & Gulf Coast Territory"
                yourStatus="excluded"
                standardStatus="approved"
                onEdit={() => handleEdit("florida")}
              />
            </div>
            <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg hover:bg-[#E5E7EB] transition-colors text-sm font-medium text-[#111827]">
              <Plus className="w-4 h-4" />
              Add Authority Parameter
            </button>
            </div>
          )}
        </div>

        {/* 3. Capacity by Peril */}
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
          <button
            onClick={() => toggleSection(3)}
            className="w-full p-6 flex items-center justify-between hover:bg-[#F7F8FA] transition-colors"
          >
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold text-[#111827]">3. Capacity by Peril</h3>
              <p className="text-sm text-[#4B5563] mt-1">Maximum net limits - your authority vs. guidelines</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-[#4B5563] transition-transform ${expandedSections.has(3) ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.has(3) && (
            <div className="p-6 border-t border-[#E5E7EB]">
            <div className="space-y-4">
              <AuthorityCapacityBar
                label="Fire"
                yourValue={50}
                standardValue={50}
                max={50}
                yourDisplay="$50M"
                standardDisplay="$50M"
                onEdit={() => handleEdit("fire-capacity")}
              />
              <AuthorityCapacityBar
                label="Earthquake / Earth Movement"
                yourValue={5}
                standardValue={10}
                max={50}
                yourDisplay="$5M"
                standardDisplay="$10M"
                onEdit={() => handleEdit("eq-capacity")}
              />
              <AuthorityCapacityBar
                label="Named Windstorm (Tier 1)"
                yourValue={5}
                standardValue={10}
                max={50}
                yourDisplay="$5M"
                standardDisplay="$10M"
                onEdit={() => handleEdit("wind-capacity")}
              />
              <AuthorityCapacityBar
                label="Flood (SFHA)"
                yourValue={10}
                standardValue={10}
                max={50}
                yourDisplay="$10M"
                standardDisplay="$10M"
                onEdit={() => handleEdit("flood-capacity")}
              />
            </div>
            <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg hover:bg-[#E5E7EB] transition-colors text-sm font-medium text-[#111827]">
              <Plus className="w-4 h-4" />
              Add Authority Parameter
            </button>
            </div>
          )}
        </div>

        {/* 4. Deductible Spectrum by Hazard */}
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
          <button
            onClick={() => toggleSection(4)}
            className="w-full p-6 flex items-center justify-between hover:bg-[#F7F8FA] transition-colors"
          >
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold text-[#111827]">4. Deductible Spectrum by Hazard</h3>
              <p className="text-sm text-[#4B5563] mt-1">Acceptable deductible ranges</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-[#4B5563] transition-transform ${expandedSections.has(4) ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.has(4) && (
            <div className="p-6 border-t border-[#E5E7EB]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F7F8FA] border-b border-[#E5E7EB]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase">Peril</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase">Your Range</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase">Standard Range</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#4B5563] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  <AuthorityDeductibleRow
                    peril="Non-CAT"
                    yourRange="$25K – $100K+"
                    standardRange="$25K – $100K+"
                    match={true}
                    onEdit={() => handleEdit("deduct-noncat")}
                  />
                  <AuthorityDeductibleRow
                    peril="Earthquake"
                    yourRange="$100K or 3–5%"
                    standardRange="$100K or 2–5%"
                    match={false}
                    onEdit={() => handleEdit("deduct-eq")}
                  />
                  <AuthorityDeductibleRow
                    peril="Named Windstorm"
                    yourRange="$100K or 3–5%"
                    standardRange="$100K or 3–5%"
                    match={true}
                    onEdit={() => handleEdit("deduct-wind")}
                  />
                  <AuthorityDeductibleRow
                    peril="Flood"
                    yourRange="$100K (Excess NFIP)"
                    standardRange="$100K (Excess NFIP)"
                    match={true}
                    onEdit={() => handleEdit("deduct-flood")}
                  />
                </tbody>
              </table>
            </div>
            <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg hover:bg-[#E5E7EB] transition-colors text-sm font-medium text-[#111827]">
              <Plus className="w-4 h-4" />
              Add Authority Parameter
            </button>
            </div>
          )}
        </div>

        {/* 5. Occupancy Appetite Classification */}
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
          <button
            onClick={() => toggleSection(5)}
            className="w-full p-6 flex items-center justify-between hover:bg-[#F7F8FA] transition-colors"
          >
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold text-[#111827]">5. Occupancy Appetite Classification</h3>
              <p className="text-sm text-[#4B5563] mt-1">Your occupancy authority relative to standard</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-[#4B5563] transition-transform ${expandedSections.has(5) ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.has(5) && (
            <div className="p-6 border-t border-[#E5E7EB]">
            <div className="grid grid-cols-3 gap-4">
              <AuthorityOccupancyCard
                title="Your In Scope"
                items={[
                  "Office & Professional Services",
                  "Healthcare (Non-Hazardous)",
                  "Retail / Wholesale",
                ]}
                badge="in"
                difference="Standard +1"
                onEdit={() => handleEdit("occ-inscope")}
              />
              <AuthorityOccupancyCard
                title="Your Limited"
                items={[
                  "Habitational (Partial)",
                  "Hotels, Restaurants",
                  "Light Manufacturing",
                  "Education & Municipal",
                ]}
                badge="limited"
                difference="More restrictive"
                onEdit={() => handleEdit("occ-limited")}
              />
              <AuthorityOccupancyCard
                title="Your Out of Scope"
                items={[
                  "Chemicals & Energy",
                  "Mining, Rail, Agriculture",
                  "Builders Risk / Construction",
                ]}
                badge="out"
                difference="Matches standard"
                onEdit={() => handleEdit("occ-out")}
              />
            </div>
            <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg hover:bg-[#E5E7EB] transition-colors text-sm font-medium text-[#111827]">
              <Plus className="w-4 h-4" />
              Add Authority Parameter
            </button>
            </div>
          )}
        </div>

        {/* 6. Pricing & Commission Guidance */}
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
          <button
            onClick={() => toggleSection(6)}
            className="w-full p-6 flex items-center justify-between hover:bg-[#F7F8FA] transition-colors"
          >
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold text-[#111827]">6. Pricing & Commission Guidance</h3>
              <p className="text-sm text-[#4B5563] mt-1">Your pricing authority</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-[#4B5563] transition-transform ${expandedSections.has(6) ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.has(6) && (
            <div className="p-6 border-t border-[#E5E7EB]">
            <div className="space-y-3">
              <AuthorityPricingItem
                label="Minimum Premium"
                yourValue="$50,000"
                standardValue="$50,000"
                match={true}
                onEdit={() => handleEdit("min-premium")}
              />
              <AuthorityPricingItem
                label="Retail Commission"
                yourValue="10% – 15%"
                standardValue="10% – 15%"
                match={true}
                onEdit={() => handleEdit("retail-comm")}
              />
              <AuthorityPricingItem
                label="Wholesale Commission"
                yourValue="15% – 17.5%"
                standardValue="15% – 17.5%"
                match={true}
                onEdit={() => handleEdit("wholesale-comm")}
              />
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-xs text-[#111827]">
                  Deviations beyond your range require referral to Head of Commercial Property.
                </div>
              </div>
            </div>
            <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg hover:bg-[#E5E7EB] transition-colors text-sm font-medium text-[#111827]">
              <Plus className="w-4 h-4" />
              Add Authority Parameter
            </button>
            </div>
          )}
        </div>

        {/* 7. Coverage Forms & Endorsements */}
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
          <button
            onClick={() => toggleSection(7)}
            className="w-full p-6 flex items-center justify-between hover:bg-[#F7F8FA] transition-colors"
          >
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold text-[#111827]">7. Coverage Forms & Endorsements</h3>
              <p className="text-sm text-[#4B5563] mt-1">Forms you can approve</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-[#4B5563] transition-transform ${expandedSections.has(7) ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.has(7) && (
            <div className="p-6 border-t border-[#E5E7EB]">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-[#111827] mb-2">Your Acceptable Forms</div>
                <div className="space-y-2">
                  <AuthorityItem
                    text="Manuscript / Broker Form"
                    yourStatus="approved"
                    standardStatus="approved"
                    onEdit={() => handleEdit("form-manuscript")}
                  />
                  <AuthorityItem
                    text="Carrier Form"
                    yourStatus="approved"
                    standardStatus="approved"
                    onEdit={() => handleEdit("form-carrier")}
                  />
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#111827] mb-2">Mandatory Endorsements</div>
                <div className="space-y-2">
                  <AuthorityItem
                    text="LMA 5393"
                    yourStatus="approved"
                    standardStatus="approved"
                    onEdit={() => handleEdit("lma5393")}
                  />
                  <AuthorityItem
                    text="LMA 5400 / 5401 (No amendments)"
                    yourStatus="approved"
                    standardStatus="approved"
                    onEdit={() => handleEdit("lma5400")}
                  />
                </div>
              </div>
            </div>
            <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg hover:bg-[#E5E7EB] transition-colors text-sm font-medium text-[#111827]">
              <Plus className="w-4 h-4" />
              Add Authority Parameter
            </button>
            </div>
          )}
        </div>
      </div>

      {/* Ready to Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-[#E5E7EB]">
              <h3 className="text-lg font-semibold text-[#111827]">Ready to Submit</h3>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-[#111827] mb-2">
                    Ashley, your authority changes will trigger a review & approval workflow before being activated.
                  </p>
                  <p className="text-xs text-[#4B5563]">
                    Senior underwriters will be notified and must approve this authority update before it takes effect.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#E5E7EB] flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors text-sm font-medium text-[#111827]"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 bg-[#0076BC] text-white rounded-lg hover:bg-[#0076BC] transition-colors text-sm font-medium"
              >
                Submit for Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Push to AI Agents Modal */}
      {showPushModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-[#E5E7EB]">
              <h3 className="text-lg font-semibold text-[#111827]">Push to AI Agents</h3>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-[#0076BC]" />
                </div>
                <div>
                  <p className="text-sm text-[#111827] mb-3">
                    Sync your authority parameters to your personal AI underwriting agents:
                  </p>
                  <ul className="text-sm text-[#4B5563] space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Ingestion Agent will apply your TIV and territory limits during intake</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Intelligence & Reasoning Agent will use your capacity thresholds</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Document Summarization Agent will align quotes to your commission bands</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>All 4 agents will auto-refer when you exceed authority</span>
                    </li>
                  </ul>
                  <p className="text-xs text-[#4B5563] mt-3">
                    Updated rules take effect immediately for all new submissions.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#E5E7EB] flex gap-3">
              <button
                onClick={() => setShowPushModal(false)}
                className="flex-1 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors text-sm font-medium text-[#111827]"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowPushModal(false)}
                className="flex-1 px-4 py-2 bg-[#0076BC] text-white rounded-lg hover:bg-[#0076BC] transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Push to Agents
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function AuthorityCard({ title, yourAuthority, standardGuideline, status, onEdit }: any) {
  const isDifferent = status === "restricted" || status === "expanded";
  return (
    <div className={`p-4 border rounded-lg ${isDifferent ? "bg-yellow-50 border-yellow-200" : "bg-[#F7F8FA] border-[#E5E7EB]"}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm font-semibold text-[#111827]">{title}</div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-1 hover:bg-white rounded transition-colors">
            <Edit2 className="w-4 h-4 text-[#4B5563]" />
          </button>
          <button className="p-1 hover:bg-white rounded transition-colors">
            <Archive className="w-4 h-4 text-[#9CA3AF]" />
          </button>
        </div>
      </div>
      <div className="text-xs text-[#4B5563] mb-1">Ashley&apos;s Authority:</div>
      <div className="text-sm text-[#111827] font-medium mb-2">{yourAuthority}</div>
      <div className="text-xs text-[#4B5563] mb-1">Standard Guideline:</div>
      <div className="text-xs text-[#4B5563]">{standardGuideline}</div>
    </div>
  );
}

function AuthorityItem({ text, yourStatus, standardStatus, onEdit }: any) {
  const statusColor =
    yourStatus === "approved"
      ? "text-green-600"
      : yourStatus === "referral"
      ? "text-yellow-600"
      : "text-red-600";
  const isDifferent = yourStatus !== standardStatus;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${isDifferent ? "bg-yellow-50" : "bg-[#F7F8FA]"}`}>
      <div className="flex items-center gap-2">
        <CheckCircle2 className={`w-4 h-4 ${statusColor}`} />
        <span className="text-sm text-[#111827]">{text}</span>
        {isDifferent && <span className="text-xs text-yellow-600 font-medium">({yourStatus})</span>}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onEdit} className="p-1 hover:bg-white rounded transition-colors">
          <Edit2 className="w-3 h-3 text-[#4B5563]" />
        </button>
        <button className="p-1 hover:bg-white rounded transition-colors">
          <Archive className="w-3 h-3 text-[#9CA3AF]" />
        </button>
      </div>
    </div>
  );
}

function AuthorityCapacityBar({ label, yourValue, standardValue, max, yourDisplay, standardDisplay, onEdit }: any) {
  const yourPercentage = (yourValue / max) * 100;
  const standardPercentage = (standardValue / max) * 100;
  const isDifferent = yourValue !== standardValue;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[#111827]">{label}</span>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-1 hover:bg-[#F3F4F6] rounded transition-colors">
            <Edit2 className="w-3 h-3 text-[#4B5563]" />
          </button>
          <button className="p-1 hover:bg-[#F3F4F6] rounded transition-colors">
            <Archive className="w-3 h-3 text-[#9CA3AF]" />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <div className="text-xs text-[#4B5563] mb-1">Your Authority:</div>
          <div className="bg-[#E5E7EB] rounded-full h-6 overflow-hidden">
            <div
              className={`h-6 flex items-center justify-end pr-2 text-white text-xs font-medium transition-all ${
                isDifferent ? "bg-yellow-600" : "bg-[#0076BC]"
              }`}
              style={{ width: `${yourPercentage}%` }}
            >
              {yourDisplay}
            </div>
          </div>
        </div>
        {isDifferent && (
          <div>
            <div className="text-xs text-[#4B5563] mb-1">Standard Guideline:</div>
            <div className="bg-[#E5E7EB] rounded-full h-4 overflow-hidden">
              <div
                className="bg-[#9CA3AF] h-4 flex items-center justify-end pr-2 text-white text-xs transition-all"
                style={{ width: `${standardPercentage}%` }}
              >
                {standardDisplay}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthorityDeductibleRow({ peril, yourRange, standardRange, match, onEdit }: any) {
  return (
    <tr className={`transition-colors ${!match ? "bg-yellow-50" : "hover:bg-[#F7F8FA]"}`}>
      <td className="px-6 py-4 text-sm text-[#111827]">{peril}</td>
      <td className="px-6 py-4 text-sm text-[#111827] font-medium">{yourRange}</td>
      <td className="px-6 py-4 text-sm text-[#4B5563]">{standardRange}</td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button onClick={onEdit} className="p-1 hover:bg-white rounded transition-colors">
            <Edit2 className="w-4 h-4 text-[#4B5563]" />
          </button>
          <button className="p-1 hover:bg-white rounded transition-colors">
            <Archive className="w-4 h-4 text-[#9CA3AF]" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function AuthorityOccupancyCard({ title, items, badge, difference, onEdit }: any) {
  const badgeClass =
    badge === "in"
      ? "bg-green-100 text-green-800"
      : badge === "limited"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";

  return (
    <div className="p-4 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>{title}</span>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1 hover:bg-[#E5E7EB] rounded transition-colors">
            <Edit2 className="w-3 h-3 text-[#4B5563]" />
          </button>
          <button className="p-1 hover:bg-[#E5E7EB] rounded transition-colors">
            <Archive className="w-3 h-3 text-[#9CA3AF]" />
          </button>
        </div>
      </div>
      <ul className="space-y-2 mb-3">
        {items.map((item: string, idx: number) => (
          <li key={idx} className="text-xs text-[#111827] flex items-start">
            <span className="mr-2">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="text-xs text-[#4B5563] italic border-t border-[#E5E7EB] pt-2">{difference}</div>
    </div>
  );
}

function AuthorityPricingItem({ label, yourValue, standardValue, match, onEdit }: any) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${!match ? "bg-yellow-50" : "bg-[#F7F8FA]"}`}>
      <div>
        <div className="text-xs text-[#4B5563] mb-1">{label}</div>
        <div className="text-sm font-semibold text-[#111827]">{yourValue}</div>
        {!match && <div className="text-xs text-[#4B5563] mt-1">Standard: {standardValue}</div>}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onEdit} className="p-1 hover:bg-white rounded transition-colors">
          <Edit2 className="w-4 h-4 text-[#4B5563]" />
        </button>
        <button className="p-1 hover:bg-white rounded transition-colors">
          <Archive className="w-4 h-4 text-[#9CA3AF]" />
        </button>
      </div>
    </div>
  );
}

