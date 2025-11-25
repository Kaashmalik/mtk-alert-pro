import { ImageResponse } from "next/og";

export const alt = "Shakir Super League - Pakistan Ka Apna Cricket League Platform";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Shakir Super League
          </div>
          <div
            style={{
              fontSize: 40,
              textAlign: "center",
              opacity: 0.9,
            }}
          >
            Pakistan Ka Apna Cricket League Platform
          </div>
          <div
            style={{
              fontSize: 28,
              textAlign: "center",
              opacity: 0.8,
              marginTop: "20px",
            }}
          >
            Lahore Qalandars se le kar gali cricket tak — SSL sab manage karta hai
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

