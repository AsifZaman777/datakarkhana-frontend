"use client";

import { useState, type FormEvent } from "react";
import { Upload, Plus, FileSpreadsheet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminApi } from "@/lib/api/admin";
import { toast } from "sonner";
import { useLanguage } from "@/providers/language-provider";
import type { RegionsConfig } from "@/lib/types";

interface DatasetUploadFormProps {
  categoriesList: string[];
  regionsConfig: RegionsConfig | null;
  onSuccess: () => void;
}

export function DatasetUploadForm({
  categoriesList,
  regionsConfig,
  onSuccess,
}: DatasetUploadFormProps) {
  const { lang } = useLanguage();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(10);
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const divisions = regionsConfig ? Object.keys(regionsConfig) : [];
  const districts =
    regionsConfig && division && regionsConfig[division]
      ? Object.keys(regionsConfig[division])
      : [];
  const areas =
    regionsConfig && division && district && regionsConfig[division]?.[district]
      ? regionsConfig[division][district]
      : [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.warning(
        lang === "bn"
          ? "অনুগ্রহ করে একটি CSV বা Excel ফাইল নির্বাচন করুন।"
          : "Please upload a CSV or Excel file."
      );
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("price_credits", price.toString());
    if (division) formData.append("division", division);
    if (district) formData.append("district", district);
    if (area) formData.append("area", area);
    formData.append("file", file);

    setIsSubmitting(true);
    try {
      await adminApi.uploadDataset(formData);
      toast.success(
        lang === "bn"
          ? "ডাটাবেস সফলভাবে তৈরি ও ক্যাটালগে প্রকাশিত হয়েছে!"
          : "Dataset created and published to public catalog!"
      );
      setName("");
      setCategory("");
      setPrice(10);
      setDivision("");
      setDistrict("");
      setArea("");
      setFile(null);
      onSuccess();
    } catch (err: any) {
      toast.error(
        err.response?.data?.detail ||
          (lang === "bn" ? "আপলোড ব্যর্থ হয়েছে।" : "Upload failed.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-panel p-6 border-cyan-500/30">
      <CardContent className="p-0 space-y-6">
        <div className="flex items-center gap-2 border-b border-border/40 pb-3">
          <Upload className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-foreground">
            {lang === "bn"
              ? "পাবলিক ডাটাবেস আপলোড করুন (CSV / Excel)"
              : "Upload Public Dataset (CSV / Excel)"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {lang === "bn" ? "ডাটাবেসের নাম *" : "Dataset Title *"}
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={
                  lang === "bn"
                    ? "যেমন: কোচিং সেন্টার ঢাকা ২০২৬"
                    : "e.g. Coaching Centers Dhaka 2026"
                }
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {lang === "bn" ? "ক্যাটাগরি *" : "Category *"}
              </Label>
              <Select value={category} onValueChange={(val) => setCategory(val || "")} required>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue
                    placeholder={
                      lang === "bn"
                        ? "-- ক্যাটাগরি বেছে নিন --"
                        : "-- Choose Category --"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categoriesList.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price & File */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {lang === "bn"
                  ? "ক্রেডিট মূল্য (০ = ফ্রি)"
                  : "Price in Credits (0 = FREE)"}
              </Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                required
                min={0}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {lang === "bn"
                  ? "ফাইল নির্বাচন (.csv, .xlsx) *"
                  : "Target File (.csv, .xlsx) *"}
              </Label>
              <Input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Location Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{lang === "bn" ? "বিভাগ" : "Division"}</Label>
              <Select value={division} onValueChange={(val) => setDivision(val || "")}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue
                    placeholder={
                      lang === "bn" ? "সকল বিভাগ" : "All Divisions"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{lang === "bn" ? "জেলা" : "District"}</Label>
              <Select value={district} disabled={!division} onValueChange={(val) => setDistrict(val || "")}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue
                    placeholder={
                      lang === "bn" ? "সকল জেলা" : "All Districts"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{lang === "bn" ? "এলাকা / শহর" : "Area / City"}</Label>
              <Select value={area} disabled={!district} onValueChange={(val) => setArea(val || "")}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue
                    placeholder={
                      lang === "bn" ? "সকল এলাকা" : "All Areas"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full font-bold gap-2 py-5">
            <FileSpreadsheet className="h-4 w-4" />
            {isSubmitting
              ? lang === "bn"
                ? "আপলোড ও প্রসেসিং হচ্ছে..."
                : "Uploading & Processing..."
              : lang === "bn"
              ? "আপলোড ও পাবলিক ডাটা তৈরি করুন"
              : "Upload & Create Public Dataset"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
