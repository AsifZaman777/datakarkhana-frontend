"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  Check,
  X,
  AlertCircle,
  Cloud,
  Lock,
  Layers,
  Sparkles,
  Table as TableIcon,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { datasetsApi } from "@/lib/api/datasets";
import { useLanguage } from "@/providers/language-provider";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import type { RegionsConfig, User } from "@/lib/types";

interface UploadExcelModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
  isAdmin: boolean;
  categoriesList: string[];
  regionsConfig: RegionsConfig | null;
}

export function UploadExcelModal({
  open,
  onClose,
  onSuccess,
  user,
  isAdmin,
  categoriesList,
  regionsConfig,
}: UploadExcelModalProps) {
  const { lang } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Corporate Directory");
  const [customCategory, setCustomCategory] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [selectedSheet, setSelectedSheet] = useState<string>("");

  // Formatting Options (User has full control with checkmarks)
  const [stripZero, setStripZero] = useState(true);
  const [trimSpaces, setTrimSpaces] = useState(true);
  const [dropEmptyRows, setDropEmptyRows] = useState(true);
  const [normalizeHeaders, setNormalizeHeaders] = useState(false);
  const [syncNow, setSyncNow] = useState(false);

  // Inspection / Preview State
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectData, setInspectData] = useState<{
    sheet_names: string[];
    total_rows: number;
    total_raw_rows: number;
    columns: string[];
    raw_columns: string[];
    raw_preview: Record<string, any>[];
    cleaned_preview: Record<string, any>[];
  } | null>(null);

  const [activePreviewTab, setActivePreviewTab] = useState<"clean" | "raw">("clean");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Sync eligibility
  const canSync =
    isAdmin ||
    user?.allow_sync === 1 ||
    user?.plan_tier === "pro" ||
    user?.plan_tier === "enterprise";

  // Regions hierarchy
  const divisions = regionsConfig ? Object.keys(regionsConfig) : [];
  const districts =
    regionsConfig && division && regionsConfig[division]
      ? Object.keys(regionsConfig[division])
      : [];
  const areas =
    regionsConfig && division && district && regionsConfig[division]?.[district]
      ? regionsConfig[division][district]
      : [];

  const defaultCategories = [
    "Corporate Directory",
    "Retail & Wholesale",
    "E-commerce Clients",
    "Real Estate Leads",
    "Schools & Education",
    "Doctors & Healthcare",
    "IT & Software",
    "General Business",
    "Other",
  ];
  const combinedCategories = Array.from(new Set([...defaultCategories, ...categoriesList]));

  // Reset when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFile(null);
      setName("");
      setCategory("Corporate Directory");
      setCustomCategory("");
      setDivision("");
      setDistrict("");
      setArea("");
      setSelectedSheet("");
      setInspectData(null);
      setSyncNow(false);
      setIsSubmitting(false);
    }
  }, [open]);

  // Inspect file whenever file, sheet, or checkboxes change
  const runInspection = useCallback(async (
    targetFile: File,
    sheet = selectedSheet,
    sz = stripZero,
    ts = trimSpaces,
    der = dropEmptyRows,
    nh = normalizeHeaders
  ) => {
    setIsInspecting(true);
    try {
      const fd = new FormData();
      fd.append("file", targetFile);
      if (sheet) fd.append("sheet_name", sheet);
      fd.append("strip_zero", String(sz));
      fd.append("trim_spaces", String(ts));
      fd.append("drop_empty_rows", String(der));
      fd.append("normalize_headers", String(nh));

      const res = await datasetsApi.inspectFile(fd);
      setInspectData(res.data);
      if (res.data.sheet_names && res.data.sheet_names.length > 0 && !sheet) {
        setSelectedSheet(res.data.sheet_names[0]);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to inspect Excel file."));
    } finally {
      setIsInspecting(false);
    }
  }, [selectedSheet, stripZero, trimSpaces, dropEmptyRows, normalizeHeaders]);

  const handleFileSelect = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      toast.error("Please upload a valid spreadsheet file (.xlsx, .xls, .csv)");
      return;
    }

    setFile(selectedFile);
    // Auto-fill dataset name from file name
    const rawTitle = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    setName(rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1));
    setSelectedSheet("");
    runInspection(selectedFile, "");
  };

  const handleCheckboxToggle = (
    setter: (val: boolean) => void,
    newVal: boolean,
    optionKey: "stripZero" | "trimSpaces" | "dropEmptyRows" | "normalizeHeaders"
  ) => {
    setter(newVal);
    if (file) {
      runInspection(
        file,
        selectedSheet,
        optionKey === "stripZero" ? newVal : stripZero,
        optionKey === "trimSpaces" ? newVal : trimSpaces,
        optionKey === "dropEmptyRows" ? newVal : dropEmptyRows,
        optionKey === "normalizeHeaders" ? newVal : normalizeHeaders
      );
    }
  };

  const handleSheetChange = (sheet: string) => {
    setSelectedSheet(sheet);
    if (file) {
      runInspection(file, sheet);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.warning("Please choose a file to upload.");
      return;
    }
    if (!name.trim()) {
      toast.warning("Please enter a dataset name.");
      return;
    }

    const finalCategory = category === "Other" && customCategory.trim() ? customCategory.trim() : category;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name.trim());
    fd.append("category", finalCategory || "Private Custom Dataset");
    if (division) fd.append("division", division);
    if (district) fd.append("district", district);
    if (area) fd.append("area", area);
    if (selectedSheet) fd.append("sheet_name", selectedSheet);
    fd.append("strip_zero", String(stripZero));
    fd.append("trim_spaces", String(trimSpaces));
    fd.append("drop_empty_rows", String(dropEmptyRows));
    fd.append("normalize_headers", String(normalizeHeaders));
    fd.append("sync_now", String(syncNow && canSync));

    setIsSubmitting(true);
    try {
      const res = await datasetsApi.uploadPrivate(fd);
      toast.success(res.data.message || `Dataset "${name}" imported to your Private Catalogue!`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to upload dataset."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewRecords =
    activePreviewTab === "clean"
      ? inspectData?.cleaned_preview || []
      : inspectData?.raw_preview || [];
  const previewColumns =
    activePreviewTab === "clean"
      ? inspectData?.columns || []
      : inspectData?.raw_columns || [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto glass-panel border-cyan-500/30 p-6 space-y-5">
        <DialogHeader className="border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {lang === "bn" ? "প্রাইভেট এক্সেল ফাইল আপলোড করুন" : "Upload Excel to Private Catalogue"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {lang === "bn"
                  ? "যেকোনো বিটুবি এক্সেল ফাইল আপলোড করুন। সহজে পড়ার জন্য ডাটা ফরম্যাটিংয়ের অপশন চেক করুন।"
                  : "Import any Excel or CSV spreadsheet. You can inspect raw data and choose formatting options."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Drag & Drop Zone */}
          {!file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? "border-cyan-400 bg-cyan-500/10 scale-[1.01]"
                  : "border-border/60 hover:border-cyan-500/40 hover:bg-card/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                }}
              />
              <div className="h-12 w-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3">
                <Upload className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-foreground mb-1">
                {lang === "bn" ? "এক্সেল বা সিএসভি ফাইল সিলেক্ট করুন" : "Click to upload or drag and drop"}
              </h4>
              <p className="text-xs text-muted-foreground">
                {lang === "bn" ? "সমর্থিত ফরম্যাট: .xlsx, .xls, .csv" : "Supported formats: .xlsx, .xls, .csv"}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="h-9 w-9 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-foreground truncate">{file.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.name.split(".").pop()?.toUpperCase()}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setInspectData(null);
                }}
                className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1 shrink-0"
              >
                <X className="h-3.5 w-3.5" />
                {lang === "bn" ? "পরিবর্তন" : "Change File"}
              </Button>
            </div>
          )}

          {/* 2. Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                {lang === "bn" ? "ডেটাসেটের নাম *" : "Dataset Name *"}
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bangladesh IT Companies 2026"
                required
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                {lang === "bn" ? "ক্যাটাগরি" : "Category"}
              </Label>
              <Select value={category} onValueChange={(v) => setCategory(v || "General Business")}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {combinedCategories.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {category === "Other" && (
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  {lang === "bn" ? "কাস্টম ক্যাটাগরির নাম" : "Custom Category Name"}
                </Label>
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category..."
                  className="text-xs h-9"
                />
              </div>
            )}
          </div>

          {/* Multi-Sheet Selection */}
          {inspectData?.sheet_names && inspectData.sheet_names.length > 1 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                {lang === "bn" ? "ওয়ার্কবুক শিট নির্বাচন করুন" : "Select Sheet to Import"}
              </Label>
              <Select value={selectedSheet} onValueChange={(s) => s && handleSheetChange(s)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose Sheet" />
                </SelectTrigger>
                <SelectContent>
                  {inspectData.sheet_names.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Location Filters (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{lang === "bn" ? "বিভাগ (ঐচ্ছিক)" : "Division (Optional)"}</Label>
              <Select
                value={division}
                onValueChange={(val) => {
                  setDivision(val === "all" || !val ? "" : val);
                  setDistrict("");
                  setArea("");
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={lang === "bn" ? "সকল বিভাগ" : "All Divisions"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Divisions</SelectItem>
                  {divisions.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{lang === "bn" ? "জেলা (ঐচ্ছিক)" : "District (Optional)"}</Label>
              <Select
                value={district}
                disabled={!division}
                onValueChange={(val) => {
                  setDistrict(val === "all" || !val ? "" : val);
                  setArea("");
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={lang === "bn" ? "সকল জেলা" : "All Districts"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Districts</SelectItem>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{lang === "bn" ? "এলাকা (ঐচ্ছিক)" : "Area (Optional)"}</Label>
              <Select
                value={area}
                disabled={!district}
                onValueChange={(val) => setArea(val === "all" || !val ? "" : val)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={lang === "bn" ? "সকল এলাকা" : "All Areas"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Areas</SelectItem>
                  {areas.map((a) => (
                    <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3. User Formatting Options (Checkboxes as requested: strip .0, trim, drop empty) */}
          <div className="rounded-lg border border-border/50 bg-card/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>{lang === "bn" ? "ডাটা ফরম্যাটিং ও ক্লিনিং অপশন" : "Data Formatting & Cleaning Options"}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {lang === "bn" ? "প্রয়োজনমতো চেক বা আনচেক করুন" : "Check what you want to apply"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
              <label className="flex items-start gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={stripZero}
                  onChange={(e) => handleCheckboxToggle(setStripZero, e.target.checked, "stripZero")}
                  className="mt-0.5 rounded border-border text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <span className="font-semibold text-foreground block">
                    {lang === "bn" ? "নাম্বারের শেষের .0 বাদ দিন" : "Strip trailing .0"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {lang === "bn" ? "ফোন নম্বর ও আইডির শেষে আসা .0 পরিষ্কার করে" : "Fixes 017...0, IDs, and years from float conversions"}
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={trimSpaces}
                  onChange={(e) => handleCheckboxToggle(setTrimSpaces, e.target.checked, "trimSpaces")}
                  className="mt-0.5 rounded border-border text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <span className="font-semibold text-foreground block">
                    {lang === "bn" ? "অতিরিক্ত স্পেস ট্রিম করুন" : "Trim extra whitespace"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {lang === "bn" ? "শুরু বা শেষের ফাঁকা জায়গাগুলো মুছে ফেলে" : "Cleans leading and trailing space in texts and emails"}
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={dropEmptyRows}
                  onChange={(e) => handleCheckboxToggle(setDropEmptyRows, e.target.checked, "dropEmptyRows")}
                  className="mt-0.5 rounded border-border text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <span className="font-semibold text-foreground block">
                    {lang === "bn" ? "খালি সারি ও কলাম বাদ দিন" : "Remove empty rows & columns"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {lang === "bn" ? "সম্পূর্ণ খালি সারিগুলো বাদ দেয়" : "Drops completely blank spreadsheet rows"}
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={normalizeHeaders}
                  onChange={(e) => handleCheckboxToggle(setNormalizeHeaders, e.target.checked, "normalizeHeaders")}
                  className="mt-0.5 rounded border-border text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <span className="font-semibold text-foreground block">
                    {lang === "bn" ? "হেডার নাম পরিপাটি করুন" : "Normalize header names"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {lang === "bn" ? "নামহীন কলামগুলোতে Column_1 নাম দেয়" : "Fixes blank or Unnamed: 0 headers automatically"}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 4. Interactive Live Preview (Raw vs Formatted Tabs) */}
          {file && (
            <div className="space-y-2 border border-border/40 rounded-lg p-3 bg-background/50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TableIcon className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-bold text-foreground">
                    {lang === "bn" ? "ডাটা প্রিভিউ" : "Data Preview Inspection"}
                  </span>
                  {inspectData && (
                    <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-400">
                      {inspectData.total_rows} {lang === "bn" ? "টি রো" : "rows detected"} • {inspectData.columns?.length || 0} cols
                    </Badge>
                  )}
                </div>

                <Tabs value={activePreviewTab} onValueChange={(v) => setActivePreviewTab(v as "clean" | "raw")}>
                  <TabsList className="h-7 bg-card/60 border border-border/40 p-0.5">
                    <TabsTrigger value="clean" className="text-[11px] h-6 px-2.5 font-semibold">
                      {lang === "bn" ? "ফরম্যাট করা ভিউ" : "Formatted View"}
                    </TabsTrigger>
                    <TabsTrigger value="raw" className="text-[11px] h-6 px-2.5 font-semibold text-muted-foreground">
                      {lang === "bn" ? "মূল র' ভিউ" : "Raw Data View"}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {isInspecting ? (
                <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                  <span>Inspecting spreadsheet contents...</span>
                </div>
              ) : previewRecords.length > 0 ? (
                <div className="overflow-x-auto max-h-48 border border-border/30 rounded text-[11px] font-mono">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-card/70 border-b border-border/40">
                        {previewColumns.slice(0, 7).map((col) => (
                          <th key={col} className="p-2 font-bold text-foreground whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRecords.map((row, idx) => (
                        <tr key={idx} className="border-b border-border/20 hover:bg-card/30">
                          {previewColumns.slice(0, 7).map((col) => (
                            <td key={col} className="p-2 text-muted-foreground whitespace-nowrap max-w-[200px] truncate">
                              {String(row[col] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No preview rows available.
                </div>
              )}
            </div>
          )}

          {/* 5. Cloud Sync Option (Pro/Enterprise vs Local DB) */}
          <div className="rounded-lg border border-border/40 bg-card/30 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`h-8 w-8 rounded-md flex items-center justify-center ${
                  canSync ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"
                }`}
              >
                {canSync ? <Cloud className="h-4 w-4" /> : <Lock className="h-4 w-4 text-amber-500" />}
              </div>
              <div>
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>{lang === "bn" ? "ক্লাউড সিঙ্ক্রোনাইজেশন" : "Cloud Sync to PostgreSQL"}</span>
                  {canSync ? (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] py-0">
                      PRO / ENTERPRISE
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[9px] py-0">
                      LOCAL ONLY
                    </Badge>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {canSync
                    ? lang === "bn"
                      ? "পোস্টগ্রেসকিউএল ক্লাউডে সিঙ্ক হবে এবং সব ডিভাইস থেকে ব্যবহার করা যাবে।"
                      : "Directly sync this dataset to PostgreSQL cloud storage."
                    : lang === "bn"
                      ? "আপনার পিসির লোকাল ডাটাবেসে সুরক্ষিতভাবে সংরক্ষিত থাকবে।"
                      : "Will be kept securely in local DB. Pro & Enterprise users can sync to cloud."}
                </div>
              </div>
            </div>

            {canSync ? (
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-cyan-400">
                <input
                  type="checkbox"
                  checked={syncNow}
                  onChange={(e) => setSyncNow(e.target.checked)}
                  className="rounded border-border text-cyan-500 focus:ring-cyan-500"
                />
                <span>{lang === "bn" ? "এখনই সিঙ্ক করুন" : "Sync Now"}</span>
              </label>
            ) : (
              <span className="text-[11px] font-mono text-muted-foreground italic">Local DB</span>
            )}
          </div>

          <DialogFooter className="border-t border-border/40 pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              {lang === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!file || isSubmitting}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold gap-1.5 min-w-[130px]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>{lang === "bn" ? "আপলোড হচ্ছে..." : "Importing..."}</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{lang === "bn" ? "ক্যাটালগে যুক্ত করুন" : "Import to Catalogue"}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
