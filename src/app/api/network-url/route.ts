import { NextRequest, NextResponse } from "next/server";
import { networkInterfaces } from "os";

// Retourne une URL de base joignable depuis le réseau local (téléphone
// sur le même Wi-Fi). En production, définir NEXT_PUBLIC_APP_URL.
export async function GET(request: NextRequest) {
  try {
    const configured = process.env.NEXT_PUBLIC_APP_URL;
    if (configured) {
      return NextResponse.json({
        success: true,
        lanUrl: configured.replace(/\/$/, ""),
      });
    }

    const port = new URL(request.url).port || "3000";
    const nets = networkInterfaces();
    let ip = "";
    for (const list of Object.values(nets)) {
      for (const net of list || []) {
        if (net.family === "IPv4" && !net.internal) {
          ip = net.address;
          break;
        }
      }
      if (ip) break;
    }

    if (!ip) {
      return NextResponse.json(
        { success: false, error: "No LAN address found." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lanUrl: `http://${ip}:${port}`,
    });
  } catch (error) {
    console.error("GET /api/network-url error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to resolve LAN url." },
      { status: 500 }
    );
  }
}
