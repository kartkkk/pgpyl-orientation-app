export default function RootLoading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#003366",
        zIndex: 9999,
      }}
    >
      {/* Plain img so it renders without JS hydration */}
      <img
        src="/icons/icon-512.png"
        alt="Inside The Atrium"
        width={96}
        height={96}
        style={{ borderRadius: 20 }}
      />
      <p
        style={{
          marginTop: 16,
          color: "#ffffff",
          fontSize: 18,
          fontWeight: 600,
          fontFamily:
            "Inter, system-ui, -apple-system, sans-serif",
          letterSpacing: "-0.01em",
          opacity: 0.9,
        }}
      >
        Inside The Atrium
      </p>
    </div>
  );
}
