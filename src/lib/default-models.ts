import type { ModelSpec } from "./api/models";

/**
 * Fallback curated catalog of lightweight GGUF models.
 * Used on the frontend as an offline/initial fallback so the UI never displays "0"
 * while the local backend engine is starting up or in case of temporary connectivity delay.
 */
export const DEFAULT_RECOMMENDED_MODELS: ModelSpec[] = [
  {
    id: "qwen2.5-0.5b-instruct",
    name: "Qwen 2.5 0.5B Instruct (Q4_K_M)",
    author: "Qwen / Alibaba Cloud",
    filename: "qwen2.5-0.5b-instruct-q4_k_m.gguf",
    file_size_bytes: 397746176,
    file_size_formatted: "379 MB",
    ram_required_mb: 750,
    context_window: 4096,
    inference_speed_tok_s: "28–42 tok/s",
    tags: ["marketing_variants", "spam_detection", "multilingual", "bengali"],
    download_url:
      "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf",
    description_en:
      "⭐ Highly Recommended! Outstanding Bengali & English multilingual capability. Perfect for rewriting promotional WhatsApp copy into conversational, ban-proof variations.",
    description_bn:
      "⭐ বিশেষভাবে সুপারিশকৃত! বাংলা ও ইংরেজি উভয় ভাষায় পারদর্শী। সাধারণ বা স্প্যামি মেসেজকে ব্যান-প্রতিরোধী প্রাকৃতিক মেসেজে রূপান্তর করতে সবচেয়ে কার্যকর।",
    recommended: true,
    is_installed: false,
    is_active: false,
  },
  {
    id: "smollm2-135m-instruct",
    name: "SmolLM2 135M Instruct (Q4_K_M)",
    author: "Hugging Face TB",
    filename: "smollm2-135m-instruct-q4_k_m.gguf",
    file_size_bytes: 98631680,
    file_size_formatted: "94 MB",
    ram_required_mb: 280,
    context_window: 2048,
    inference_speed_tok_s: "55–70 tok/s",
    tags: ["marketing_variants", "spam_detection", "ultra_fast"],
    download_url:
      "https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct-GGUF/resolve/main/smollm2-135m-instruct-q4_k_m.gguf",
    description_en:
      "Ultra-lightweight and lightning fast. Runs on virtually any laptop with negligible RAM usage (<300MB). Ideal for fast variant generation and promotional keyword scrubbing.",
    description_bn:
      "অত্যন্ত হালকা এবং অবিশ্বাস্য দ্রুত। ৩০০ মেগাবাইটের কম র‍্যামে যেকোনো ল্যাপটপে চলে। দ্রুত ভেরিয়েন্ট তৈরি ও স্প্যাম শব্দ প্রতিস্থাপনে অত্যন্ত উপযোগী।",
    recommended: false,
    is_installed: false,
    is_active: false,
  },
  {
    id: "smollm2-360m-instruct",
    name: "SmolLM2 360M Instruct (Q4_K_M)",
    author: "Hugging Face TB",
    filename: "smollm2-360m-instruct-q4_k_m.gguf",
    file_size_bytes: 229376000,
    file_size_formatted: "219 MB",
    ram_required_mb: 480,
    context_window: 2048,
    inference_speed_tok_s: "40–55 tok/s",
    tags: ["marketing_variants", "spam_detection", "balanced"],
    download_url:
      "https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct-GGUF/resolve/main/smollm2-360m-instruct-q4_k_m.gguf",
    description_en:
      "Balanced sweet-spot model offering higher syntactic diversity than 135M while remaining very compact (<250MB).",
    description_bn:
      "গতি ও বুদ্ধিমত্তার নিখুঁত ভারসাম্য। ২৫০ মেগাবাইটের কম সাইজে বৈচিত্র্যময় মেসেজ ভেরিয়েন্ট তৈরির জন্য চমৎকার।",
    recommended: false,
    is_installed: false,
    is_active: false,
  },
  {
    id: "llama-3.2-1b-instruct",
    name: "Llama 3.2 1B Instruct (Q4_K_M)",
    author: "Meta AI / bartowski",
    filename: "Llama-3.2-1B-Instruct-Q4_K_M.gguf",
    file_size_bytes: 771751936,
    file_size_formatted: "736 MB",
    ram_required_mb: 1400,
    context_window: 4096,
    inference_speed_tok_s: "18–28 tok/s",
    tags: ["copywriting", "marketing_variants", "spam_detection", "reasoning"],
    download_url:
      "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
    description_en:
      "Deep copywriting intelligence from Meta's Llama 3.2 family. Creates persuasive marketing narratives and comprehensive spam risk analysis.",
    description_bn:
      "মেটার অত্যাধুনিক Llama 3.2 মডেল। গ্রাহক আকর্ষক কপিরাইটিং এবং নিখুঁত অ্যান্টি-স্প্যাম বিশ্লেষণের জন্য আদর্শ।",
    recommended: false,
    is_installed: false,
    is_active: false,
  },
];
