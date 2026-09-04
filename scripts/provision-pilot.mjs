import { createClient } from "@supabase/supabase-js";

const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PILOT_SUPERADMIN_EMAIL",
  "PILOT_SUPERADMIN_PASSWORD",
  "PILOT_MERCHANT_1_EMAIL",
  "PILOT_MERCHANT_1_PASSWORD",
  "PILOT_MERCHANT_2_EMAIL",
  "PILOT_MERCHANT_2_PASSWORD",
];

for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing required environment variable: ${name}`);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findOrCreateUser(email, password, fullName, role) {
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  let user = listed.users.find(
    (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: role === "super_admin" ? "cliente" : role },
    });
    if (error || !data.user) throw error ?? new Error(`Could not create ${email}`);
    user = data.user;
  }
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, full_name: fullName, role, account_status: "activo" },
      { onConflict: "id" },
    );
  if (profileError) throw profileError;
  return user.id;
}

async function main() {
  const superAdminId = await findOrCreateUser(
    process.env.PILOT_SUPERADMIN_EMAIL,
    process.env.PILOT_SUPERADMIN_PASSWORD,
    "Superadmin Piloto Mercanta",
    "super_admin",
  );
  const { data: city, error: cityError } = await supabase
    .from("ciudades")
    .select("id")
    .eq("slug", "barranquilla")
    .single();
  if (cityError) throw cityError;
  const { data: plan, error: planError } = await supabase
    .from("planes_suscripcion")
    .select("id")
    .eq("activo", true)
    .order("precio_mes", { ascending: true })
    .limit(1)
    .single();
  if (planError)
    throw new Error("Create at least one active subscription plan before provisioning pilots.");
  const { data: category } = await supabase
    .from("categorias")
    .select("id")
    .eq("activa", true)
    .order("orden")
    .limit(1)
    .maybeSingle();

  const pilotStores = [
    {
      index: 1,
      name: "Moda Piloto Centro",
      slug: "moda-piloto-centro",
      email: process.env.PILOT_MERCHANT_1_EMAIL,
      password: process.env.PILOT_MERCHANT_1_PASSWORD,
      product: "Camiseta piloto Mercanta",
    },
    {
      index: 2,
      name: "Calzado Piloto Centro",
      slug: "calzado-piloto-centro",
      email: process.env.PILOT_MERCHANT_2_EMAIL,
      password: process.env.PILOT_MERCHANT_2_PASSWORD,
      product: "Zapato piloto Mercanta",
    },
  ];

  for (const store of pilotStores) {
    const ownerId = await findOrCreateUser(
      store.email,
      store.password,
      `Comercio Piloto ${store.index}`,
      "comercio",
    );
    const { data: commerce, error: commerceError } = await supabase
      .from("comercios")
      .upsert(
        {
          owner_id: ownerId,
          created_by: superAdminId,
          ciudad_id: city.id,
          plan_id: plan.id,
          categoria_id: category?.id ?? null,
          nombre: store.name,
          slug: store.slug,
          descripcion: "Comercio creado para validar el flujo operativo de Mercanta.",
          direccion: "Centro de Barranquilla",
          estado: "activo",
          recogida_disponible: true,
          domicilio_disponible: true,
          onboarding_completado_at: new Date().toISOString(),
          verificado_at: new Date().toISOString(),
          verificado_por: superAdminId,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (commerceError) throw commerceError;

    const { error: memberError } = await supabase.from("comercio_miembros").upsert(
      {
        comercio_id: commerce.id,
        profile_id: ownerId,
        rol: "owner",
        activo: true,
      },
      { onConflict: "comercio_id,profile_id" },
    );
    if (memberError) throw memberError;

    const subscription = {
      comercio_id: commerce.id,
      plan_id: plan.id,
      estado: "trial",
      vence_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      creada_por: superAdminId,
      notas: "Piloto operativo: sin cobro ni renovación automática.",
    };
    const { data: existingSubscription, error: existingSubscriptionError } = await supabase
      .from("comercio_suscripciones")
      .select("id")
      .eq("comercio_id", commerce.id)
      .in("estado", ["trial", "activa", "suspendida"])
      .maybeSingle();
    if (existingSubscriptionError) throw existingSubscriptionError;
    const { error: subscriptionError } = existingSubscription
      ? await supabase
          .from("comercio_suscripciones")
          .update(subscription)
          .eq("id", existingSubscription.id)
      : await supabase.from("comercio_suscripciones").insert(subscription);
    if (subscriptionError) throw subscriptionError;

    const { error: productError } = await supabase.from("productos").upsert(
      {
        comercio_id: commerce.id,
        created_by: ownerId,
        categoria_id: category?.id ?? null,
        nombre: store.product,
        slug: `${store.slug}-producto-prueba`,
        descripcion: "Producto de prueba para validar el pedido sin pago.",
        precio_base: 30000,
        disponible: true,
        stock: 20,
        imagenes: [],
        atributos: {},
      },
      { onConflict: "slug" },
    );
    if (productError) throw productError;
  }

  console.log("Pilot provisioned: 1 superadmin and 2 active pilot stores.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
