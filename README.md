# 🧠 Paper Mind

A RAG-powered document chatbot. Upload company files (PDF, DOCX, XLSX, PPTX, images) and ask questions — answers are grounded entirely in your documents.

---

- Document text is sent to the API on each request (stateless) — nothing is stored
- Max document context per request: ~8,000 characters per file
- Supported files: PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, CSV, TXT, MD, JSON, PNG, JPG, WEBP, BMP, TIFF
- Scanned PDFs and images use Claude Vision OCR automatically
