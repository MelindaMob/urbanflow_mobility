import { fetchBikeStations } from "@/lib/adapters/fetchBikeStations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stations = await fetchBikeStations();
    return Response.json({ stations });
  } catch (err) {
    return Response.json({ stations: [], error: String(err) }, { status: 502 });
  }
}
