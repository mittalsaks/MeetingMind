"use client"

export default function InstallExtensionPage() {
  const downloadUrl =
    (process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000") +
    "/downloads/extension.zip"

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        🧠 MeetingMind Extension Setup
      </h1>
      <p style={{ color: "#999", marginBottom: 24 }}>
        One-time setup, takes about 2 minutes.
      </p>

      <a
        href={downloadUrl}
        download
        style={{
          display: "inline-block",
          padding: "12px 24px",
          borderRadius: 8,
          background: "#6366f1",
          color: "#fff",
          fontWeight: 600,
          textDecoration: "none",
          marginBottom: 32,
        }}
      >
        ⬇ Download Extension
      </a>

      <ol style={{ lineHeight: 2, fontSize: 14, color: "#ccc" }}>
        <li>Click the download button above — a ZIP file will be downloaded.</li>
        <li>Go to your Downloads folder, right-click the ZIP file, and select "Extract All".</li>
        <li>
          Open Chrome and type this in the address bar:{" "}
          <code style={{ background: "#1e1e1e", padding: "2px 6px", borderRadius: 4 }}>
            chrome://extensions
          </code>{" "}
          then press Enter.
        </li>
        <li>Turn on "Developer mode" using the toggle in the top-right corner.</li>
        <li>Click the "Load unpacked" button in the top-left.</li>
        <li>Select the extracted folder, then click "Select Folder".</li>
        <li>The "MeetingMind" extension will be added, and its icon will appear in your toolbar.</li>
      </ol>

      <p style={{ marginTop: 24, fontSize: 13, color: "#f59e0b" }}>
        ⚠️ Do not delete or move the extracted folder — the extension runs directly from it.
      </p>
    </div>
  )
}