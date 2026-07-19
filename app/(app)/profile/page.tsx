import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Mon profil de mobilité</h1>
      <p className="text-neutral-600 text-sm mb-8">
        Ces préférences personnalisent les itinéraires proposés.
      </p>

      <ProfileForm profile={profile} />
    </div>
  );
}
