import { createClient } from "@supabase/supabase-js";

const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PILOT_SUPERADMIN_EMAIL",
  "PILOT_SUPERADMIN_PASSWORD",
  "PILOT_MERCHANT_EMAIL",
  "PILOT_MERCHANT_PASSWORD",
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

async function getOrCreatePilotPlan() {
  const { data: existing, error: existingError } = await supabase
    .from("planes_suscripcion")
    .select("id")
    .eq("nombre", "Piloto operativo Mercanta")
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("planes_suscripcion")
    .insert({
      nombre: "Piloto operativo Mercanta",
      descripcion: "Plan interno de pruebas, sin cobro ni renovacion automatica.",
      precio_mes: 0,
      max_productos: 100,
      destacados_mes: 10,
      activo: true,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertPromotion(comercioId, productoId, promotion) {
  const { data: existing, error: existingError } = await supabase
    .from("promociones")
    .select("id")
    .eq("comercio_id", comercioId)
    .eq("titulo", promotion.titulo)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;

  const payload = { ...promotion, comercio_id: comercioId, producto_id: productoId };
  const { error } = existing
    ? await supabase.from("promociones").update(payload).eq("id", existing.id)
    : await supabase.from("promociones").insert(payload);
  if (error) throw error;
}

async function main() {
  const superAdminId = await findOrCreateUser(
    process.env.PILOT_SUPERADMIN_EMAIL,
    process.env.PILOT_SUPERADMIN_PASSWORD,
    "Administrador Piloto Mercanta",
    "super_admin",
  );
  const merchantId = await findOrCreateUser(
    process.env.PILOT_MERCHANT_EMAIL,
    process.env.PILOT_MERCHANT_PASSWORD,
    "Comercio Piloto Mercanta",
    "comercio",
  );

  const { data: city, error: cityError } = await supabase
    .from("ciudades")
    .select("id")
    .eq("slug", "barranquilla")
    .single();
  if (cityError) throw cityError;

  const planId = await getOrCreatePilotPlan();
  const { data: categories, error: categoriesError } = await supabase
    .from("categorias")
    .select("id")
    .eq("activa", true)
    .order("orden")
    .limit(20);
  if (categoriesError || !categories?.length) {
    throw categoriesError ?? new Error("No active categories available for pilot provisioning.");
  }
  const categoryByIndex = (index) => categories[index % categories.length].id;

  const now = new Date();
  const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const stores = [
    {
      name: "Moda Piloto Centro",
      slug: "moda-piloto-centro",
      categoryId: categoryByIndex(0),
      product: {
        nombre: "Camisa lino Caribe",
        slug: "camisa-lino-caribe",
        descripcion: "Prenda piloto para validar catalogo, busqueda y pedido.",
        precio_base: 89000,
        precio_oferta: 69000,
      },
      promotionTitle: "Estreno piloto: 20% en moda",
    },
    {
      name: "Calzado Piloto Centro",
      slug: "calzado-piloto-centro",
      categoryId: categoryByIndex(1),
      product: {
        nombre: "Tenis urbano Centro",
        slug: "tenis-urbano-centro",
        descripcion: "Calzado piloto para validar disponibilidad y recogida.",
        precio_base: 159000,
        precio_oferta: 129000,
      },
      promotionTitle: "Piloto calzado: descuento activo",
    },
    {
      name: "Hogar Piloto Centro",
      slug: "hogar-piloto-centro",
      categoryId: categoryByIndex(2),
      product: {
        nombre: "Set hogar Barranquilla",
        slug: "set-hogar-barranquilla",
        descripcion: "Producto piloto para validar entrega a domicilio.",
        precio_base: 76000,
        precio_oferta: 62000,
      },
      promotionTitle: "Piloto hogar: oferta de lanzamiento",
    },
  ];

  for (const store of stores) {
    const { data: commerce, error: commerceError } = await supabase
      .from("comercios")
      .upsert(
        {
          owner_id: merchantId,
          created_by: superAdminId,
          ciudad_id: city.id,
          plan_id: planId,
          categoria_id: store.categoryId,
          nombre: store.name,
          slug: store.slug,
          descripcion: "Comercio creado para validar el flujo operativo de Mercanta.",
          direccion: "Centro de Barranquilla, Atlántico",
          estado: "activo",
          recogida_disponible: true,
          domicilio_disponible: true,
          disponibilidad_notas: "Disponible para pruebas de recogida y domicilio.",
          onboarding_completado_at: now.toISOString(),
          verificado_at: now.toISOString(),
          verificado_por: superAdminId,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (commerceError) throw commerceError;

    const { error: memberError } = await supabase
      .from("comercio_miembros")
      .upsert(
        { comercio_id: commerce.id, profile_id: merchantId, rol: "owner", activo: true },
        { onConflict: "comercio_id,profile_id" },
      );
    if (memberError) throw memberError;

    const { data: subscription, error: subscriptionError } = await supabase
      .from("comercio_suscripciones")
      .select("id")
      .eq("comercio_id", commerce.id)
      .in("estado", ["trial", "activa", "suspendida"])
      .limit(1)
      .maybeSingle();
    if (subscriptionError) throw subscriptionError;

    const subscriptionPayload = {
      comercio_id: commerce.id,
      plan_id: planId,
      estado: "trial",
      vence_at: inThirtyDays,
      creada_por: superAdminId,
      notas: "Piloto operativo: sin cobro ni renovación automática.",
    };
    const { error: subscriptionWriteError } = subscription
      ? await supabase
          .from("comercio_suscripciones")
          .update(subscriptionPayload)
          .eq("id", subscription.id)
      : await supabase.from("comercio_suscripciones").insert(subscriptionPayload);
    if (subscriptionWriteError) throw subscriptionWriteError;

    const { data: product, error: productError } = await supabase
      .from("productos")
      .upsert(
        {
          comercio_id: commerce.id,
          created_by: merchantId,
          categoria_id: store.categoryId,
          ...store.product,
          disponible: true,
          stock: 20,
          destacado: true,
          imagenes: [],
          atributos: { entorno: "piloto" },
        },
        { onConflict: "comercio_id,slug" },
      )
      .select("id")
      .single();
    if (productError) throw productError;

    await upsertPromotion(commerce.id, product.id, {
      titulo: store.promotionTitle,
      descripcion: "Promoción de prueba para validar el catálogo y el tablero comercial.",
      tipo: "descuento_pct",
      valor: 20,
      fecha_inicio: now.toISOString(),
      fecha_fin: inThirtyDays,
      activa: true,
      destacada: true,
    });
  }

  console.log("Pilot provisioned: 1 superadmin, 1 merchant owner, 3 active pilot stores.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
