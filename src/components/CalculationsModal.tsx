import React, { useRef } from 'react';
import { PondBOMSummary } from '../utils/calculations';
import { PondProject, ThemeMode } from '../types';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Waves, 
  Trees, 
  CircleDot, 
  Share2, 
  FileSpreadsheet
} from 'lucide-react';

interface CalculationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bom: PondBOMSummary;
  project: PondProject;
  theme?: ThemeMode;
  onLoadProjectJson: (json: string) => void;
}

export const CalculationsModal: React.FC<CalculationsModalProps> = ({
  isOpen,
  onClose,
  bom,
  project,
  theme = 'graph_paper',
  onLoadProjectJson,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isGraphPaper = theme === 'graph_paper';
  const isDark = theme !== 'graph_paper';

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${project.title.toLowerCase().replace(/\s+/g, '_')}_blueprint.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        onLoadProjectJson(text);
        onClose();
      } catch (err) {
        alert('Invalid JSON blueprint file.');
      }
    };
    reader.readAsText(file);
  };

  // Filtration health status
  const bogHealth = bom.bogToPondRatioPercent >= 20 
    ? {
        status: 'Optimal Natural Filtration',
        color: isGraphPaper ? 'text-black' : 'text-emerald-400',
        bg: isGraphPaper ? 'bg-neutral-100 border-neutral-400' : 'bg-emerald-950/40 border-emerald-500/40',
        icon: CheckCircle2
      }
    : bom.bogToPondRatioPercent >= 12
    ? {
        status: 'Adequate Biological Filtration',
        color: isGraphPaper ? 'text-black' : 'text-cyan-400',
        bg: isGraphPaper ? 'bg-neutral-100 border-neutral-400' : 'bg-cyan-950/40 border-cyan-500/40',
        icon: CheckCircle2
      }
    : {
        status: 'Under-filtered (Recommend 20% Bog Ratio)',
        color: isGraphPaper ? 'text-black' : 'text-amber-400',
        bg: isGraphPaper ? 'bg-neutral-100 border-neutral-400' : 'bg-amber-950/40 border-amber-500/40',
        icon: AlertTriangle
      };

  const BogIcon = bogHealth.icon;

  const modalBg = isGraphPaper ? 'bg-white border-black text-black' : 'bg-slate-900 border-cyan-500/60 text-slate-100';
  const headerBg = isGraphPaper ? 'bg-neutral-50 border-neutral-300' : 'bg-slate-950/70 border-slate-800';
  const cardBg = isGraphPaper ? 'bg-neutral-50 border-neutral-300' : 'bg-slate-950/60 border-slate-800';
  const sectionBg = isGraphPaper ? 'bg-white border-neutral-300' : 'bg-slate-950/40 border-slate-800';
  const subCardBg = isGraphPaper ? 'bg-neutral-50 border-neutral-300' : 'bg-slate-900/60 border-slate-800';
  const tableBorder = isGraphPaper ? 'border-neutral-300' : 'border-slate-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        id="bom-modal"
        className={`w-full max-w-4xl max-h-[90vh] rounded-xs shadow-2xl flex flex-col overflow-hidden font-sans border-2 ${modalBg}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${headerBg}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-xs border flex items-center justify-center ${
              isGraphPaper ? 'bg-neutral-100 border-black text-black' : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
            }`}>
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono tracking-tight">
                Pond Specification &amp; Bill of Materials (BOM)
              </h2>
              <p className={`text-xs font-mono ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                Project: {project.title} • Scale: 40&apos; × 30&apos; Grid • {project.date}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportJson}
              className={`px-3 py-1.5 rounded-xs text-xs font-mono font-bold flex items-center gap-1.5 border transition-colors ${
                isGraphPaper
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-black border-neutral-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Download Project Blueprint JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-1.5 rounded-xs text-xs font-mono font-bold flex items-center gap-1.5 border transition-colors ${
                isGraphPaper
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-black border-neutral-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Import Project Blueprint JSON"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Import JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={handlePrint}
              className={`px-3 py-1.5 rounded-xs text-xs font-mono font-bold flex items-center gap-1.5 border transition-colors ${
                isGraphPaper
                  ? 'bg-black hover:bg-neutral-800 text-white border-black'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 border-cyan-500'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Spec</span>
            </button>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-xs ml-2 transition-colors ${
                isGraphPaper ? 'text-black hover:bg-neutral-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Top Quick Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3 rounded-xs border ${cardBg}`}>
              <span className={`text-[11px] font-mono uppercase block ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                Surface Area
              </span>
              <div className="text-xl font-bold font-mono mt-0.5">
                {bom.surfaceAreaSqFt} <span className="text-xs font-normal">sq ft</span>
              </div>
              <span className={`text-[10px] ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                Perimeter: {bom.perimeterFeet} linear ft
              </span>
            </div>

            <div className={`p-3 rounded-xs border ${cardBg}`}>
              <span className={`text-[11px] font-mono uppercase block ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                Water Volume
              </span>
              <div className="text-xl font-bold font-mono mt-0.5">
                {bom.estimatedVolumeGallons.toLocaleString()} <span className="text-xs font-normal">Gal</span>
              </div>
              <span className={`text-[10px] ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                ~{Math.round(bom.estimatedVolumeGallons * 3.785).toLocaleString()} Liters
              </span>
            </div>

            <div className={`p-3 rounded-xs border ${cardBg}`}>
              <span className={`text-[11px] font-mono uppercase block ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                EPDM Pond Liner
              </span>
              <div className="text-xl font-bold font-mono mt-0.5">
                {bom.linerSize.widthFt}&apos; × {bom.linerSize.lengthFt}&apos;
              </div>
              <span className={`text-[10px] ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                {bom.linerSize.totalSqFt} sq ft (incl. 3&apos; overlap)
              </span>
            </div>

            <div className={`p-3 rounded-xs border ${cardBg}`}>
              <span className={`text-[11px] font-mono uppercase block ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                Flagstone Rocks
              </span>
              <div className="text-xl font-bold font-mono mt-0.5">
                {bom.totalRockCount} <span className="text-xs font-normal">pcs</span>
              </div>
              <span className={`text-[10px] ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                ~{bom.totalRockWeightTons} Tons total weight
              </span>
            </div>
          </div>

          {/* Section 1: Pipe & Hose Sizing and Amounts Needed */}
          <div className={`rounded-xs border p-4 ${sectionBg}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Waves className="w-4 h-4" />
                <h3 className="font-bold text-xs uppercase tracking-wider font-mono">
                  1. Hose &amp; Pipe Plumbing Schedule (Amounts Needed)
                </h3>
              </div>
              <div className="text-xs font-mono font-semibold">
                Total Required: {bom.totalPipeFeet}&apos; (~${bom.totalPipeCost} est.)
              </div>
            </div>

            {bom.pipeSummary.length === 0 ? (
              <p className={`text-xs italic py-2 ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                No pipes or hoses drawn yet. Use &quot;Draw Pipe&quot; in the top toolbar to connect pumps, skimmers, and bog filter manifolds.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className={`border-b ${tableBorder} text-[10px] uppercase ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                      <th className="pb-2">Pipe Type</th>
                      <th className="pb-2">Runs</th>
                      <th className="pb-2">2D Plan</th>
                      <th className="pb-2">Vertical Rise</th>
                      <th className="pb-2 font-bold">Total (+12% Buffer)</th>
                      <th className="pb-2">Recommended Rolls</th>
                      <th className="pb-2 text-right">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isGraphPaper ? 'divide-neutral-200' : 'divide-slate-800/60'}`}>
                    {bom.pipeSummary.map((item) => (
                      <tr key={item.pipeType} className={isGraphPaper ? 'hover:bg-neutral-50' : 'hover:bg-slate-900/40'}>
                        <td className="py-2.5 font-bold">
                          {item.name}
                        </td>
                        <td className="py-2.5">{item.count}</td>
                        <td className="py-2.5">{item.linearFeet2D}&apos;</td>
                        <td className="py-2.5">+{item.verticalRiseFeet}&apos;</td>
                        <td className="py-2.5 font-bold">{item.totalWithBufferFeet}&apos;</td>
                        <td className="py-2.5">
                          {item.recommendedRolls50ft} × 50-ft roll{item.recommendedRolls50ft > 1 ? 's' : ''}
                        </td>
                        <td className="py-2.5 text-right font-bold">
                          ${item.estimatedCost}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className={`text-[11px] mt-2 font-mono ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
              * Calculations automatically add vertical rise (e.g. from basin floor to elevated spillway) + 12% allowance for bends and solvent joints.
            </p>
          </div>

          {/* Section 2: Auto-scaled Flagstones & Boulders */}
          <div className={`rounded-xs border p-4 ${sectionBg}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <CircleDot className="w-4 h-4" />
                <h3 className="font-bold text-xs uppercase tracking-wider font-mono">
                  2. Auto-Scaled Flagstone Rocks &amp; Coping Schedule
                </h3>
              </div>
              <div className="text-xs font-mono font-semibold">
                Perimeter Coping Coverage: {bom.copingCoveragePercent}%
              </div>
            </div>

            {bom.rockSummary.length === 0 ? (
              <p className={`text-xs italic py-2 ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                No flagstones placed yet. Use the Rocks palette to drag stones or click &quot;Auto-Coping&quot; to ring the perimeter with stones.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className={`border-b ${tableBorder} text-[10px] uppercase ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                      <th className="pb-2">Stone Size</th>
                      <th className="pb-2">Count</th>
                      <th className="pb-2">Linear Coverage</th>
                      <th className="pb-2">Total Weight (Lbs)</th>
                      <th className="pb-2 font-bold">Total Weight (Tons)</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isGraphPaper ? 'divide-neutral-200' : 'divide-slate-800/60'}`}>
                    {bom.rockSummary.map((item) => (
                      <tr key={item.sizeInches} className={isGraphPaper ? 'hover:bg-neutral-50' : 'hover:bg-slate-900/40'}>
                        <td className="py-2.5 font-bold">{item.label}</td>
                        <td className="py-2.5">{item.count} pcs</td>
                        <td className="py-2.5">~{item.estCoverageLinearFeet}&apos;</td>
                        <td className="py-2.5">{item.totalWeightLbs.toLocaleString()} lbs</td>
                        <td className="py-2.5 font-bold">{item.weightTons} Tons</td>
                      </tr>
                    ))}
                    <tr className={`font-bold ${isGraphPaper ? 'bg-neutral-100' : 'bg-slate-950/40'}`}>
                      <td className="py-2.5">Grand Total</td>
                      <td className="py-2.5">{bom.totalRockCount} pcs</td>
                      <td className="py-2.5">-</td>
                      <td className="py-2.5">
                        {bom.rockSummary.reduce((a, b) => a + b.totalWeightLbs, 0).toLocaleString()} lbs
                      </td>
                      <td className="py-2.5">{bom.totalRockWeightTons} Tons</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Filtration Bog Biological Sizing */}
          <div className={`rounded-xs border p-4 ${sectionBg}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Trees className="w-4 h-4" />
                <h3 className="font-bold text-xs uppercase tracking-wider font-mono">
                  3. Wetland Bog Filter &amp; Biological Filtration Ratio
                </h3>
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs border text-xs font-mono font-bold ${bogHealth.bg} ${bogHealth.color}`}>
                <BogIcon className="w-3.5 h-3.5" />
                <span>{bogHealth.status} ({bom.bogToPondRatioPercent}%)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className={`p-2.5 rounded-xs border ${subCardBg}`}>
                <span className={`text-[10px] uppercase block ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                  Bog Filter Surface Area
                </span>
                <span className="text-base font-bold">{bom.bogAreaSqFt} sq ft</span>
                <p className={`text-[10px] mt-0.5 ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                  Target: 15%–30% of pond surface ({Math.round(bom.surfaceAreaSqFt * 0.2)} sq ft recommended)
                </p>
              </div>

              <div className={`p-2.5 rounded-xs border ${subCardBg}`}>
                <span className={`text-[10px] uppercase block ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                  Washed Pea Gravel Needed
                </span>
                <span className="text-base font-bold">{bom.bogGravelTonsNeeded} Tons</span>
                <p className={`text-[10px] mt-0.5 ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                  3/8&quot; to 1/2&quot; rounded river pea gravel matrix for beneficial nitrifying bacteria.
                </p>
              </div>

              <div className={`p-2.5 rounded-xs border ${subCardBg}`}>
                <span className={`text-[10px] uppercase block ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                  Recirculation Pump Flow
                </span>
                <span className="text-base font-bold">
                  {Math.max(2500, Math.round(bom.estimatedVolumeGallons * 1.2))} GPH
                </span>
                <p className={`text-[10px] mt-0.5 ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                  Complete water body turnover every 45–60 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-3 border-t flex items-center justify-between text-xs font-mono ${headerBg}`}>
          <span className={isGraphPaper ? 'text-neutral-600' : 'text-slate-400'}>
            Architectural Standard: 40&apos; × 30&apos; Grid Layout
          </span>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xs font-semibold border transition-colors ${
              isGraphPaper
                ? 'bg-black text-white hover:bg-neutral-800 border-black'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            Close Specification
          </button>
        </div>
      </div>
    </div>
  );
};
