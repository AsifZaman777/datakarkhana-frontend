"use client";

import { useState, type FormEvent } from "react";
import { Inbox, Plus, Trash2, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requestsApi } from "@/lib/api/requests";
import { toast } from "sonner";
import type { RegionsConfig } from "@/lib/types";
import { useLanguage } from "@/providers/language-provider";

interface DatasetRequestFormProps {
  regionsConfig: RegionsConfig | null;
  onRequestSubmitted: () => void;
}

export function DatasetRequestForm({
  regionsConfig,
  onRequestSubmitted,
}: DatasetRequestFormProps) {
  const { lang } = useLanguage();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [division, setDivision] = useState("");
  const [customDivision, setCustomDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [customDistrict, setCustomDistrict] = useState("");
  const [area, setArea] = useState("");
  const [customArea, setCustomArea] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const divisions = regionsConfig ? Object.keys(regionsConfig) : [];
  const districts =
    regionsConfig && division && division !== "Other" && regionsConfig[division]
      ? Object.keys(regionsConfig[division])
      : regionsConfig
      ? Array.from(new Set(Object.values(regionsConfig).flatMap((d) => Object.keys(d))))
      : [];
  const areas =
    regionsConfig && division && division !== "Other" && district && district !== "Other" && regionsConfig[division]?.[district]
      ? regionsConfig[division][district]
      : regionsConfig
      ? Array.from(new Set(Object.values(regionsConfig).flatMap((d) => Object.values(d).flat())))
      : [];

  const handleDivisionChange = (val: string) => {
    setDivision(val || "");
    setCustomDivision("");
    setDistrict("");
    setCustomDistrict("");
    setArea("");
    setCustomArea("");
  };

  const handleDistrictChange = (val: string) => {
    setDistrict(val || "");
    setCustomDistrict("");
    setArea("");
    setCustomArea("");
  };

  const handleAreaChange = (val: string) => {
    setArea(val || "");
    setCustomArea("");
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const allQueries = [...tags];
    if (tagInput.trim() && !allQueries.includes(tagInput.trim())) {
      allQueries.push(tagInput.trim());
    }

    if (allQueries.length === 0) {
      toast.warning(lang === "bn" ? "অনুগ্রহ করে অন্তত একটি কুয়েরি ট্যাগ যোগ করুন।" : "Please add at least one query tag.");
      return;
    }
    if (!phone.trim()) {
      toast.warning(lang === "bn" ? "অনুগ্রহ করে যোগাযোগের ফোন নম্বর লিখুন।" : "Please enter your contact phone number.");
      return;
    }

    const finalDivision = division === "Other" ? customDivision.trim() : division;
    const finalDistrict = district === "Other" ? customDistrict.trim() : district;
    const finalArea = area === "Other" ? customArea.trim() : area;

    setIsSubmitting(true);
    try {
      const res = await requestsApi.submit({
        category_query: allQueries.join(", "),
        division: finalDivision,
        district: finalDistrict,
        area: finalArea,
        business_name: businessName,
        phone,
        additional_notes: notes,
      });

      toast.success(res.data.message || (lang === "bn" ? "ডেটাসেট রিকোয়েস্ট জমা হয়েছে!" : "Dataset request submitted!"));
      setTags([]);
      setTagInput("");
      setDivision("");
      setCustomDivision("");
      setDistrict("");
      setCustomDistrict("");
      setArea("");
      setCustomArea("");
      setBusinessName("");
      setPhone("");
      setNotes("");
      onRequestSubmitted();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || (lang === "bn" ? "রিকোয়েস্ট জমা দিতে সমস্যা হয়েছে।" : "Failed to submit request."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-panel p-6 border-amber-500/30">
      <CardContent className="p-0 space-y-6">
        <div className="flex items-center gap-2 border-b border-border/40 pb-3">
          <Inbox className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-foreground">
            {lang === "bn" ? "কাস্টম ডেটাসেট রিকোয়েস্ট জমা দিন" : "Submit Dataset Custom Request"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Query tags input */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              {lang === "bn" ? "ডেটা ক্যাটাগরি / সার্চ কুয়েরি *" : "Data Category / Search Queries *"}
            </Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder={lang === "bn" ? "যেমনঃ রেস্তোরাঁ, গার্মেন্টস, কোচিং..." : "e.g. Restaurants, Garments, Coaching..."}
                className="text-xs h-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag} className="h-9 gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> {lang === "bn" ? "ট্যাগ যোগ করুন" : "Add Tag"}
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-medium"
                  >
                    {t}
                    <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Location Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{lang === "bn" ? "বিভাগ" : "Division"}</Label>
              <Select value={division} onValueChange={(val) => handleDivisionChange(val || "")}>
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue placeholder={lang === "bn" ? "সকল বিভাগ" : "All Divisions"} />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">{lang === "bn" ? "অন্যান্য" : "Other"}</SelectItem>
                </SelectContent>
              </Select>
              {division === "Other" && (
                <Input
                  value={customDivision}
                  onChange={(e) => setCustomDivision(e.target.value)}
                  placeholder={lang === "bn" ? "কাস্টম বিভাগ লিখুন..." : "Type custom division..."}
                  className="text-xs h-9 mt-1.5 border-amber-500/50"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{lang === "bn" ? "জেলা" : "District"}</Label>
              <Select value={district} disabled={!division} onValueChange={(val) => handleDistrictChange(val || "")}>
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue placeholder={lang === "bn" ? "সকল জেলা" : "All Districts"} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">{lang === "bn" ? "অন্যান্য" : "Other"}</SelectItem>
                </SelectContent>
              </Select>
              {district === "Other" && (
                <Input
                  value={customDistrict}
                  onChange={(e) => setCustomDistrict(e.target.value)}
                  placeholder={lang === "bn" ? "কাস্টম জেলা লিখুন..." : "Type custom district..."}
                  className="text-xs h-9 mt-1.5 border-amber-500/50"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{lang === "bn" ? "এলাকা / শহর" : "Area / City"}</Label>
              <Select value={area} disabled={!district} onValueChange={(val) => handleAreaChange(val || "")}>
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue placeholder={lang === "bn" ? "সকল এলাকা" : "All Areas"} />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">{lang === "bn" ? "অন্যান্য" : "Other"}</SelectItem>
                </SelectContent>
              </Select>
              {area === "Other" && (
                <Input
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                  placeholder={lang === "bn" ? "কাস্টম এলাকা লিখুন..." : "Type custom area..."}
                  className="text-xs h-9 mt-1.5 border-amber-500/50"
                />
              )}
            </div>
          </div>

          {/* Business & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{lang === "bn" ? "ব্যবসার নাম" : "Business Name"}</Label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={lang === "bn" ? "আপনার প্রতিষ্ঠানের নাম" : "Your Company Name"}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{lang === "bn" ? "যোগাযোগের ফোন *" : "Contact Phone *"}</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1XXXXXXXXX"
                required
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs">{lang === "bn" ? "অতিরিক্ত নির্দেশনা বা চাহিদা" : "Additional Instructions / Requirements"}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === "bn" ? "কাঙ্ক্ষিত লিড সংখ্যা, বিশেষ শর্ত..." : "Target row counts, specific criteria..."}
              rows={3}
              className="text-xs"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full font-bold gap-2 py-5 bg-amber-500 text-black hover:bg-amber-600">
            <Send className="h-4 w-4" />
            {isSubmitting 
              ? (lang === "bn" ? "রিকোয়েস্ট জমা হচ্ছে..." : "Submitting Request...") 
              : (lang === "bn" ? "ডেটাসেট রিকোয়েস্ট পাঠান" : "Submit Dataset Request")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
