import { fetchVehiclePositions } from "@/lib/adapters/fetchVehiclePositions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const positions = await fetchVehiclePositions();
    return Response.json({ positions });
  } catch (err) {
    return Response.json({ positions: [], error: String(err) }, { status: 502 });
  }
}
