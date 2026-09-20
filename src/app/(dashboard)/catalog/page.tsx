"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe, Lock, Inbox, Upload, Sparkles, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DatasetCard } from "@/components/catalog/dataset-card";
import { PrivateDatasetCard } from "@/components/catalog/private-dataset-card";
import { CustomDatasetCard } from "@/components/catalog/custom-dataset-card";
import { UploadExcelModal } from "@/components/catalog/upload-excel-modal";
import { DatasetFilters } from "@/components/catalog/dataset-filters";
import { DatasetDetailView } from "@/components/catalog/dataset-detail-view";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { PromptModal } from "@/components/ui/modal-prompt";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { datasetsApi } from "@/lib/api/datasets";
import { scraperApi } from "@/lib/api/scraper";
import { configApi } from "@/lib/api/config";
import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import type { Dataset, DatasetDetail, ScraperJob, RegionsConfig } from "@/lib/types";

export default function CatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const { token, user, refreshProfile, isAdmin } = useAuth();
  const { t, lang } = useLanguage();
  const ct = t.catalog || {};
  const [catalogTab, setCatalogTab] = useState<"public" | "private">(tabParam === "private" ? "private" : "public");

  // Public datasets list state
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");

  // Config list
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [regionsConfig, setRegionsConfig] = useState<RegionsConfig | null>(null);

  // Private jobs list & demoted private datasets state
  const [scraperJobs, setScraperJobs] = useState<ScraperJob[]>([]);
  const [myPrivateDatasets, setMyPrivateDatasets] = useState<Dataset[]>([]);

  // Selected Detail View State
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [detail, setDetail] = useState<DatasetDetail | null>(null);

  // Modals & Action Targets
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; query: string } | null>(null);
  const [deletePublicTarget, setDeletePublicTarget] = useState<Dataset | null>(null);
  const [deleteCustomTarget, setDeleteCustomTarget] = useState<Dataset | null>(null);
  const [demoteTarget, setDemoteTarget] = useState<Dataset | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<{ id: number; query: string } | null>(null);
  const [promoteCustomTarget, setPromoteCustomTarget] = useState<Dataset | null>(null);
  const [adminPublishTarget, setAdminPublishTarget] = useState<Dataset | null>(null);
  const [adminPublishPrice, setAdminPublishPrice] = useState<number>(10);
  const [adminPublishName, setAdminPublishName] = useState<string>("");
  const [adminPublishCategory, setAdminPublishCategory] = useState<string>("General Business");
  const [isPublishing, setIsPublishing] = useState(false);

  const [isDemoting, setIsDemoting] = useState(false);
  const [syncingJobId, setSyncingJobId] = useState<number | null>(null);
  const [desyncingJobId, setDesyncingJobId] = useState<number | null>(null);

  // Load configs
  useEffect(() => {
    configApi
      .regions()
      .then((res) => {
        setRegionsConfig(res.data.regions);
        setCategoriesList(res.data.categories);
      })
      .catch(() => {});
  }, []);

  // Load Public Datasets
  const loadPublicDatasets = useCallback(() => {
    datasetsApi
      .list({ category, division, district, area, search })
      .then((res) => setDatasets(res.data))
      .catch(() => {});
  }, [category, division, district, area, search]);

  useEffect(() => {
    loadPublicDatasets();
  }, [loadPublicDatasets]);

  // Load Private Datasets & Done Scraper Jobs
  const loadPrivateDatasets = useCallback(() => {
    scraperApi
      .listJobs()
      .then((res) => setScraperJobs(res.data))
      .catch(() => {});

    datasetsApi
      .myPrivate()
      .then((res) => setMyPrivateDatasets(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadPrivateDatasets();
  }, [loadPrivateDatasets]);

  // Handle Demoting Public Dataset to Private
  const confirmDemoteDataset = async () => {
    if (!demoteTarget) return;
    setIsDemoting(true);
    try {
      await datasetsApi.demote(demoteTarget.id);
      toast.success(`Dataset "${demoteTarget.name}" demoted to Private Catalogue!`);
      setDemoteTarget(null);
      loadPublicDatasets();
      loadPrivateDatasets();
      setCatalogTab("private");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to demote dataset."));
    } finally {
      setIsDemoting(false);
    }
  };

  // Open dataset details
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(25);

  const handleOpenDetails = useCallback(async (
    id: string | number,
    page = 1,
    limit = pageSize,
    searchQuery = activeSearchQuery
  ) => {
    setSelectedId(id);
    setActiveSearchQuery(searchQuery);
    try {
      const res = await datasetsApi.detail(id, page, limit, searchQuery);
      setDetail(res.data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load dataset details."));
    }
  }, [pageSize, activeSearchQuery]);

  const jobParam = searchParams.get("job");
  useEffect(() => {
    if (jobParam) {
      setCatalogTab("private");
      handleOpenDetails(`job_${jobParam}`);
    }
  }, [jobParam, handleOpenDetails]);

  // Unlock dataset
  const handleUnlock = async () => {
    if (!detail || !token) return;
    try {
      const res = await datasetsApi.unlock(detail.dataset.id);
      toast.success(res.data.message || "Dataset unlocked successfully!");
      refreshProfile();
      handleOpenDetails(detail.dataset.id);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to unlock dataset."));
    }
  };

  const confirmDeletePublic = async () => {
    if (!deletePublicTarget) return;
    try {
      await datasetsApi.delete(deletePublicTarget.id);
      toast.success("Dataset deleted successfully!");
      loadPublicDatasets();
      loadPrivateDatasets();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete dataset."));
    } finally {
      setDeletePublicTarget(null);
    }
  };

  // Delete private job
  const confirmDeleteJob = async () => {
    if (!deleteTarget) return;
    try {
      await scraperApi.deleteJob(deleteTarget.id);
      toast.success("Private dataset deleted.");
      loadPrivateDatasets();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete dataset."));
    } finally {
      setDeleteTarget(null);
    }
  };

  // Sync private dataset to PostgreSQL cloud
  const handleSyncJob = async (job: ScraperJob) => {
    setSyncingJobId(job.id);
    try {
      let fileBlob: Blob | null = null;
      try {
        const downloadRes = await fetch(scraperApi.downloadJobUrl(job.id));
        if (downloadRes.ok) {
          fileBlob = await downloadRes.blob();
        } else {
          toast.error(`Could not download local scraped file (Status: ${downloadRes.status}). Please check local desktop engine.`);
          setSyncingJobId(null);
          return;
        }
      } catch (err) {
        toast.error("Could not reach local desktop scraper engine. Please ensure it is running.");
        setSyncingJobId(null);
        return;
      }

      if (!fileBlob) {
        toast.error("Scraped dataset file is empty. Please verify the scraping job results.");
        setSyncingJobId(null);
        return;
      }

      const formData = new FormData();
      formData.append("name", job.query);
      formData.append("category", "Private Scraped Leads");
      formData.append("source_job_id", String(job.id));
      formData.append("row_count", String(job.result_count || 0));
      if (job.division) formData.append("division", job.division);
      if (job.district) formData.append("district", job.district);
      if (job.area) formData.append("area", job.area);
      formData.append("file", fileBlob, `scraped_job_${job.id}.xlsx`);

      const res = await datasetsApi.syncToCloud(formData);
      toast.success(res.data.message || `Dataset "${job.query}" synced to PostgreSQL Cloud!`);
      setScraperJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, is_synced: 1 } : j))
      );
      loadPrivateDatasets();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to sync dataset to cloud."));
    } finally {
      setSyncingJobId(null);
    }
  };

  // Desync private dataset from Supabase Storage and cloud PostgreSQL
  const handleDesyncJob = async (job: ScraperJob) => {
    setDesyncingJobId(job.id);
    try {
      const res = await datasetsApi.desync(job.id);
      toast.success(res.data.message || `Dataset "${job.query}" desynced from cloud!`);
      setScraperJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, is_synced: 0 } : j))
      );
      loadPrivateDatasets();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to desync dataset from cloud."));
    } finally {
      setDesyncingJobId(null);
    }
  };

  // Request catalog promotion to PostgreSQL public catalog
  const confirmPromoteJob = async (proposedName: string) => {
    if (!promoteTarget || !proposedName) return;
    const targetJob = scraperJobs.find((j) => j.id === promoteTarget.id);
    try {
      let fileBlob: Blob | null = null;
      try {
        const downloadRes = await fetch(scraperApi.downloadJobUrl(promoteTarget.id));
        if (downloadRes.ok) {
          fileBlob = await downloadRes.blob();
        } else {
          toast.error(`Could not download local scraped file (Status: ${downloadRes.status}).`);
          return;
        }
      } catch (err) {
        toast.error("Could not reach local desktop engine to load file.");
        return;
      }

      if (!fileBlob) {
        toast.error("Scraped dataset file is empty.");
        return;
      }

      const formData = new FormData();
      formData.append("proposed_name", proposedName);
      formData.append("proposed_category", "General Business");
      formData.append("source_job_id", String(promoteTarget.id));
      if (targetJob) {
        formData.append("row_count", String(targetJob.result_count || 0));
        if (targetJob.division) formData.append("division", targetJob.division);
        if (targetJob.district) formData.append("district", targetJob.district);
        if (targetJob.area) formData.append("area", targetJob.area);
      }
      formData.append("file", fileBlob, `promote_job_${promoteTarget.id}.xlsx`);

      const res = await datasetsApi.promoteRequest(formData);
      toast.success(res.data.message || "Promotion requested! An administrator will review and publish it.");
      setScraperJobs((prev) =>
        prev.map((j) => (j.id === promoteTarget.id ? { ...j, promotion_status: "pending" } : j))
      );
      loadPrivateDatasets();
      loadPublicDatasets();
    } catch (err) {
      // Fallback to local scraper endpoint
      try {
        const res = await scraperApi.requestPromote(promoteTarget.id, proposedName, "General Business");
        toast.success(res.data.message || "Promotion requested!");
        loadPrivateDatasets();
      } catch (fallbackErr) {
        toast.error(getApiErrorMessage(fallbackErr, "Promotion failed."));
      }
    } finally {
      setPromoteTarget(null);
    }
  };

  // Sync custom uploaded dataset to cloud
  const handleSyncCustomDataset = async (dataset: Dataset) => {
    setSyncingJobId(dataset.id);
    try {
      const res = await datasetsApi.syncExistingDataset(dataset.id);
      toast.success(res.data.message || `Dataset "${dataset.name}" synced to cloud!`);
      loadPrivateDatasets();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to sync dataset to cloud."));
    } finally {
      setSyncingJobId(null);
    }
  };

  // Desync custom uploaded dataset from cloud
  const handleDesyncCustomDataset = async (dataset: Dataset) => {
    setDesyncingJobId(dataset.id);
    try {
      const res = await datasetsApi.desync(dataset.id);
      toast.success(res.data.message || `Dataset "${dataset.name}" desynced from cloud!`);
      loadPrivateDatasets();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to desync dataset from cloud."));
    } finally {
      setDesyncingJobId(null);
    }
  };

  // Delete custom uploaded dataset
  const confirmDeleteCustomDataset = async () => {
    if (!deleteCustomTarget) return;
    try {
      await datasetsApi.delete(deleteCustomTarget.id);
      toast.success(`Dataset "${deleteCustomTarget.name}" deleted successfully.`);
      loadPrivateDatasets();
      loadPublicDatasets();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete dataset."));
    } finally {
      setDeleteCustomTarget(null);
    }
  };

  // Promote custom dataset request (Regular User)
  const confirmPromoteCustomDataset = async (proposedName: string) => {
    if (!promoteCustomTarget || !proposedName) return;
    try {
      const formData = new FormData();
      formData.append("dataset_id", String(promoteCustomTarget.id));
      formData.append("proposed_name", proposedName);
      formData.append("proposed_category", promoteCustomTarget.category || "General Business");
      const res = await datasetsApi.promoteRequest(formData);
      toast.success(res.data.message || "Promotion requested! An administrator will review and publish it.");
      loadPrivateDatasets();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Promotion request failed."));
    } finally {
      setPromoteCustomTarget(null);
    }
  };

  // Admin directly publish custom dataset
  const confirmAdminPublishCustomDataset = async () => {
    if (!adminPublishTarget) return;
    setIsPublishing(true);
    try {
      const res = await datasetsApi.publish(adminPublishTarget.id, {
        price_credits: adminPublishPrice,
        proposed_name: adminPublishName || adminPublishTarget.name,
        proposed_category: adminPublishCategory || adminPublishTarget.category,
      });
      toast.success(res.data.message || `Dataset "${adminPublishTarget.name}" published to Public Catalog!`);
      setAdminPublishTarget(null);
      loadPrivateDatasets();
      loadPublicDatasets();
      setCatalogTab("public");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to publish dataset to Public Catalog."));
    } finally {
      setIsPublishing(false);
    }
  };

  // If detail view is active, render Detail View
  if (selectedId && detail) {
    return (
      <DatasetDetailView
        detail={detail}
        token={token}
        user={user}
        pageSize={pageSize}
        onBack={() => {
          setSelectedId(null);
          setDetail(null);
          setActiveSearchQuery("");
        }}
        onUnlock={handleUnlock}
        onPageChange={(page) => handleOpenDetails(selectedId, page, pageSize, activeSearchQuery)}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          handleOpenDetails(selectedId, 1, newSize, activeSearchQuery);
        }}
        onSearch={(sq) => handleOpenDetails(selectedId, 1, pageSize, sq)}
      />
    );
  }

  const customUploadedDatasets = myPrivateDatasets.filter((ds) => !ds.source_job_id);
  const doneScraperJobs = scraperJobs.filter((j) => j.status === "done" || j.status === "stopped");
  const totalPrivateCount = doneScraperJobs.length + customUploadedDatasets.length;

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{ct.title || "Datasets Catalog"}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {ct.subtitle || "Browse verified public business leads and your private scraped datasets across Bangladesh"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => setUploadModalOpen(true)}
            className="gap-2 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-500/20"
          >
            <Upload className="h-3.5 w-3.5" />
            {ct.btnUploadExcel || "Upload Excel / CSV"}
          </Button>

          <Button
            data-tour="catalog-request-btn"
            variant="outline"
            size="sm"
            onClick={() => router.push("/scraper?tab=request")}
            className="gap-2 text-xs font-bold border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
          >
            <Inbox className="h-3.5 w-3.5" />
            {lang === "bn" ? "কাস্টম ডাটার অনুরোধ" : "Request Custom Dataset"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={catalogTab} onValueChange={(v) => setCatalogTab(v as "public" | "private")} className="w-full">
        <TabsList data-tour="catalog-tabs" className="bg-card/60 border border-border/40 p-1">
          <TabsTrigger value="public" className="gap-2 text-xs font-semibold">
            <Globe className="h-4 w-4 text-cyan-400" />
            {ct.tabPublic || "Public Catalog"} ({datasets.length})
          </TabsTrigger>
          <TabsTrigger value="private" className="gap-2 text-xs font-semibold">
            <Lock className="h-4 w-4 text-amber-500" />
            {ct.tabPrivate || "My Private Leads"} ({totalPrivateCount})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PUBLIC CATALOG */}
        <TabsContent value="public" className="space-y-6 pt-4">
          <DatasetFilters
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            division={division}
            onDivisionChange={setDivision}
            district={district}
            onDistrictChange={setDistrict}
            area={area}
            onAreaChange={setArea}
            categoriesList={categoriesList}
            regionsConfig={regionsConfig}
          />

          <div data-tour="catalog-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {datasets.map((ds) => (
              <DatasetCard
                key={ds.id}
                dataset={ds}
                isAdmin={isAdmin}
                onView={(id) => handleOpenDetails(id)}
                onDelete={(target) => setDeletePublicTarget(target)}
                onDemote={(target) => setDemoteTarget(target)}
              />
            ))}

            {datasets.length === 0 && (
              <div className="col-span-full text-center py-16 text-xs text-muted-foreground glass-panel">
                {ct.noPublicMatch || "No public datasets match your active search filters."}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 2: PRIVATE LEADS, CUSTOM UPLOADS & DEMOTED DATASETS */}
        <TabsContent value="private" className="space-y-6 pt-4">
          {/* Action Banner / Upload Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl glass-panel border border-purple-500/20 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-cyan-500/5">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-purple-400" />
                {ct.btnUploadExcel || "Upload Excel / CSV Lead Files"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {ct.btnUploadExcelSub || "Import any external spreadsheet into your private catalogue. Inspect raw data, control data cleaning, and optionally sync to cloud."}
              </p>
            </div>
            <Button
              onClick={() => setUploadModalOpen(true)}
              className="gap-2 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-500/20 h-9 px-4"
            >
              <Upload className="h-4 w-4" />
              {ct.btnUploadExcel || "Upload Excel File"}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Custom Uploaded Datasets & Demoted Datasets */}
            {customUploadedDatasets.map((ds) => (
              <CustomDatasetCard
                key={`custom_ds_${ds.id}`}
                dataset={ds}
                token={token || ""}
                isAdmin={isAdmin}
                user={user}
                onView={(id) => handleOpenDetails(id)}
                onUseLeads={(id) => router.push(`/marketing?tab=whatsapp&group=dataset_${id}`)}
                onDelete={(target) => setDeleteCustomTarget(target)}
                onPromote={(target) => {
                  if (isAdmin) {
                    setAdminPublishTarget(target);
                    setAdminPublishName(target.name);
                    setAdminPublishCategory(target.category || "General Business");
                    setAdminPublishPrice(target.price_credits && target.price_credits > 0 ? target.price_credits : 10);
                  } else {
                    setPromoteCustomTarget(target);
                  }
                }}
                onSync={handleSyncCustomDataset}
                onDesync={handleDesyncCustomDataset}
                isSyncing={syncingJobId === ds.id}
                isDesyncing={desyncingJobId === ds.id}
              />
            ))}

            {/* 2. Scraped Jobs */}
            {doneScraperJobs.map((job) => (
              <PrivateDatasetCard
                key={`job_${job.id}`}
                job={job}
                onView={(id) => handleOpenDetails(`job_${id}`)}
                onUseLeads={() => router.push(`/marketing?tab=whatsapp&group=job_${job.id}`)}
                onDelete={(id, q) => setDeleteTarget({ id, query: q })}
                onPromote={(id, q) => setPromoteTarget({ id, query: q })}
                onSync={handleSyncJob}
                onDesync={handleDesyncJob}
                isSyncing={syncingJobId === job.id}
                isDesyncing={desyncingJobId === job.id}
                isAdmin={isAdmin}
                user={user}
              />
            ))}

            {totalPrivateCount === 0 && (
              <div className="col-span-full text-center py-16 text-xs text-muted-foreground glass-panel">
                {ct.noPrivateMatch || "No private datasets found. Upload an Excel file or launch a scraping job from the Scraper Console."}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Excel Modal */}
      <UploadExcelModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          loadPrivateDatasets();
          setCatalogTab("private");
        }}
        user={user}
        isAdmin={isAdmin}
        categoriesList={categoriesList}
        regionsConfig={regionsConfig}
      />

      {/* Demote Public Dataset to Private Confirmation Modal */}
      <ConfirmModal
        open={!!demoteTarget}
        onClose={() => setDemoteTarget(null)}
        onConfirm={confirmDemoteDataset}
        title={
          lang === "bn"
            ? `"${demoteTarget?.name}" প্রাইভেটে স্থানান্তর করবেন?`
            : `Demote "${demoteTarget?.name}" to Private?`
        }
        description={
          lang === "bn"
            ? "এই ডেটাসেটটি পাবলিক ক্যাটালগ থেকে প্রত্যাহার করে আপনার ব্যক্তিগত লিডস সংগ্রহে সংরক্ষণ করা হবে।"
            : "Demoting this dataset will unpublish it from the Public Catalog and store it inside your Private Catalogue."
        }
        confirmText={
          isDemoting
            ? (lang === "bn" ? "স্থানান্তর হচ্ছে..." : "Demoting...")
            : (lang === "bn" ? "প্রাইভেটে স্থানান্তর" : "Demote to Private")
        }
      />

      {/* Public Dataset Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deletePublicTarget}
        onClose={() => setDeletePublicTarget(null)}
        onConfirm={confirmDeletePublic}
        title={lang === "bn" ? "পাবলিক ডেটাসেট মুছে ফেলুন" : "Delete Public Dataset"}
        description={
          lang === "bn"
            ? `আপনি কি নিশ্চিত যে "${deletePublicTarget?.name}" পাবলিক ডেটাসেটটি মুছে ফেলতে চান? এটি ক্যাটালগ থেকে স্থায়ীভাবে মুছে যাবে।`
            : `Are you sure you want to delete the public dataset "${deletePublicTarget?.name}"? This action will permanently remove it from the public catalog.`
        }
        confirmText={lang === "bn" ? "মুছে ফেলুন" : "Delete Dataset"}
        isDanger
      />

      {/* Private Scrape Job Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteJob}
        title={lang === "bn" ? "প্রাইভেট ডেটাসেট মুছে ফেলুন" : "Delete Private Dataset"}
        description={
          lang === "bn"
            ? `আপনি কি নিশ্চিত যে "${deleteTarget?.query}" মুছে ফেলতে চান? এই কাজটি আর পূর্বাবস্থায় ফিরিয়ে আনা যাবে না।`
            : `Are you sure you want to delete "${deleteTarget?.query}"? This action cannot be undone.`
        }
        confirmText={lang === "bn" ? "মুছে ফেলুন" : "Delete Dataset"}
        isDanger
      />

      {/* Custom Dataset Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteCustomTarget}
        onClose={() => setDeleteCustomTarget(null)}
        onConfirm={confirmDeleteCustomDataset}
        title={lang === "bn" ? "কাস্টম ডেটাসেট মুছে ফেলুন" : "Delete Custom Dataset"}
        description={
          lang === "bn"
            ? `আপনি কি নিশ্চিত যে "${deleteCustomTarget?.name}" ডেটাসেটটি মুছে ফেলতে চান? এটি আপনার প্রাইভেট ক্যাটালগ থেকে মুছে যাবে।`
            : `Are you sure you want to delete the dataset "${deleteCustomTarget?.name}"? This action cannot be undone.`
        }
        confirmText={lang === "bn" ? "মুছে ফেলুন" : "Delete Dataset"}
        isDanger
      />

      {/* Promote Prompt Modal for Scraped Jobs */}
      <PromptModal
        open={!!promoteTarget}
        onClose={() => setPromoteTarget(null)}
        onConfirm={confirmPromoteJob}
        title={lang === "bn" ? "ক্যাটালগে প্রকাশের আবেদন" : "Request Catalog Promotion"}
        description={
          lang === "bn"
            ? "পাবলিক ক্যাটালগে প্রকাশের জন্য অনুমোদনের উদ্দেশ্যে প্রস্তাবিত ডেটাসেটের শিরোনাম লিখুন:"
            : "Enter the proposed dataset title for approval to publish to the public catalog:"
        }
        defaultValue={promoteTarget?.query || ""}
        placeholder={lang === "bn" ? "প্রস্তাবিত শিরোনাম লিখুন..." : "Enter proposed title..."}
        confirmText={lang === "bn" ? "আবেদন জমা দিন" : "Submit Request"}
      />

      {/* Promote Prompt Modal for Custom Uploaded Datasets */}
      <PromptModal
        open={!!promoteCustomTarget}
        onClose={() => setPromoteCustomTarget(null)}
        onConfirm={confirmPromoteCustomDataset}
        title={lang === "bn" ? "ক্যাটালগে প্রকাশের আবেদন" : "Request Catalog Promotion"}
        description={
          lang === "bn"
            ? "পাবলিক ক্যাটালগে প্রকাশের জন্য অনুমোদনের উদ্দেশ্যে প্রস্তাবিত ডেটাসেটের শিরোনাম লিখুন:"
            : "Enter the proposed dataset title for approval to publish to the public catalog:"
        }
        defaultValue={promoteCustomTarget?.name || ""}
        placeholder={lang === "bn" ? "প্রস্তাবিত শিরোনাম লিখুন..." : "Enter proposed title..."}
        confirmText={lang === "bn" ? "আবেদন জমা দিন" : "Submit Request"}
      />

      {/* Admin Publish Custom Dataset to Public Catalog Modal */}
      <Dialog
        open={!!adminPublishTarget}
        onOpenChange={(v) => !v && setAdminPublishTarget(null)}
      >
        <DialogContent className="glass-panel border-purple-500/30 sm:max-w-md">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-purple-400" />
              {lang === "bn" ? "পাবলিক ক্যাটালগে প্রকাশ করুন" : "Publish to Public Catalog"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {lang === "bn"
                ? "প্রাইভেট ডেটাসেটটি সরাসরি পাবলিক ক্যাটালগে উন্মুক্ত করুন। ব্যবহারকারীরা ক্রেডিট খরচ করে এটি আনলক করতে পারবে।"
                : "Promote and publish this private dataset to the verified Public Catalog. Users will spend credits to unlock leads from this dataset."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Dataset Title</Label>
              <Input
                value={adminPublishName}
                onChange={(e) => setAdminPublishName(e.target.value)}
                placeholder="Enter public title..."
                className="h-9 text-xs glass-input"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Category</Label>
              <Input
                value={adminPublishCategory}
                onChange={(e) => setAdminPublishCategory(e.target.value)}
                placeholder="e.g. Restaurants, Electronics, General Business..."
                className="h-9 text-xs glass-input"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Unlock Price (Credits)</Label>
              <Input
                type="number"
                min="0"
                value={adminPublishPrice}
                onChange={(e) => setAdminPublishPrice(Number(e.target.value) || 0)}
                placeholder="10"
                className="h-9 text-xs glass-input font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Set to 0 for a free public dataset, or specify the credit price for users to unlock.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAdminPublishTarget(null)}
              disabled={isPublishing}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={confirmAdminPublishCustomDataset}
              disabled={isPublishing || !adminPublishName.trim()}
              className="text-xs font-bold gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isPublishing ? "Publishing..." : "Publish to Public Catalog"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
