import { createClient } from "@supabase/supabase-js";

const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PILOT_SUPERADMIN_EMAIL",
  "PILOT_SUPERADMIN_PASSWORD",
  "PILOT_MERCHANT_EMAIL",
  "PILOT_MERCHANT_PASSWORD",
  "PILOT_SECOND_MERCHANT_EMAIL",
  "PILOT_SECOND_MERCHANT_PASSWORD",
  "PILOT_CLIENT_EMAIL",
  "PILOT_CLIENT_PASSWORD",
];

for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing required environment variable: ${name}`);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const image = (photo, width = 1200) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${width}&q=82`;

const categoryMedia = {
  alimentos: ["photo-1504674900247-0877df9cc836", "photo-1498837167922-ddd27525d352"],
  bebidas: ["photo-1513558161293-cdaf765ed2fd", "photo-1515003197210-e0cd71810b5f"],
  ropa: ["photo-1521572163474-6864f9cf17ab", "photo-1485968579580-b6d095142e6e"],
  hogar: ["photo-1616486338812-3dadae4b4ace", "photo-1618220179428-22790b461013"],
  tecnologia: ["photo-1511707171634-5f897ff02aa9", "photo-1517336714731-489689fd1ca8"],
  belleza: ["photo-1596462502278-27bfdc403348", "photo-1522335789203-aabd1fc54bc9"],
  salud: ["photo-1505751172876-fa1923c5c528", "photo-1506126613408-eca07ce68773"],
  servicios: ["photo-1556740749-887f6717d7e4", "photo-1556761175-b413da4baf72"],
  mascotas: ["photo-1583337130417-3346a1be7dee", "photo-1548199973-03cce0bbc87b"],
  deportes: ["photo-1517836357463-d25dfeac3438", "photo-1461896836934-ffe607ba8211"],
  jugueteria: ["photo-1599623560574-39d485900c95", "photo-1560961911-ba7ef651a56c"],
  libreria: ["photo-1512820790803-83ca734da794", "photo-1495446815901-a7297e633e8d"],
};

const productTemplates = {
  alimentos: [
    "Café molido artesanal",
    "Canasta de frutas frescas",
    "Chocolate de mesa premium",
    "Galletas tradicionales",
  ],
  bebidas: [
    "Jugo natural de mango",
    "Té frío de maracuyá",
    "Café frío caribeño",
    "Agua saborizada cítrica",
  ],
  ropa: [
    "Camisa de lino fresco",
    "Pantalón cargo urbano",
    "Vestido estampado Caribe",
    "Camiseta básica premium",
  ],
  hogar: [
    "Set de sábanas suaves",
    "Lámpara de mesa",
    "Organizador multipropósito",
    "Juego de toallas",
  ],
  tecnologia: [
    "Audífonos inalámbricos",
    "Cargador rápido USB-C",
    "Soporte para celular",
    "Teclado compacto",
  ],
  belleza: [
    "Kit de cuidado facial",
    "Perfume floral 50 ml",
    "Labial mate intenso",
    "Crema hidratante",
  ],
  salud: [
    "Termo deportivo",
    "Kit de primeros auxilios",
    "Protector solar diario",
    "Banda elástica fitness",
  ],
  servicios: [
    "Arreglo de prendas",
    "Impresión a color",
    "Mantenimiento de celular",
    "Asesoría de imagen",
  ],
  mascotas: [
    "Alimento premium para perro",
    "Juguete interactivo",
    "Collar ajustable",
    "Arena para gato",
  ],
  deportes: [
    "Balón de entrenamiento",
    "Mancuernas ajustables",
    "Camiseta deportiva",
    "Botella térmica",
  ],
  jugueteria: [
    "Juego de construcción",
    "Muñeca articulada",
    "Rompecabezas ilustrado",
    "Carro a escala",
  ],
  libreria: ["Cuaderno ejecutivo", "Set de marcadores", "Agenda semanal", "Kit escolar creativo"],
};

const stores = [
  ["Casa Lino Centro", "ropa", "Moda contemporánea para todos los días."],
  ["Zapatería La 38", "ropa", "Calzado y accesorios para caminar el Centro."],
  ["Belleza Caribe", "belleza", "Cuidado personal y belleza con asesoría cercana."],
  ["Aromas del Portal", "belleza", "Perfumería y detalles para regalar."],
  ["Tecno Punto Centro", "tecnologia", "Accesorios y soluciones para tu vida digital."],
  ["Móvil Express 43", "tecnologia", "Celulares, accesorios y servicio técnico."],
  ["Hogar y Estilo", "hogar", "Soluciones prácticas para cada espacio de tu hogar."],
  ["Casa Organizada", "hogar", "Orden, cocina y decoración con estilo."],
  ["Sabor de Barrio", "alimentos", "Sabores locales para llevar a casa."],
  ["Mercado La Plaza", "alimentos", "Productos frescos y despensa del día."],
  ["Estación Tropical", "bebidas", "Bebidas frías, jugos y café para recargar tu día."],
  ["Salud Cercana", "salud", "Bienestar y productos esenciales para cuidarte."],
  ["Pet Centro", "mascotas", "Todo para consentir a tus mascotas."],
  ["Activa Deportes", "deportes", "Equipamiento para moverte y entrenar."],
  ["Mundo Juguete", "jugueteria", "Juegos que acompañan grandes momentos."],
  ["Papel y Punto", "libreria", "Papelería, útiles y soluciones para oficina."],
  ["Soluciones 44", "servicios", "Servicios rápidos para resolver lo que necesitas."],
  ["Arreglos del Centro", "servicios", "Reparaciones y encargos con atención directa."],
  ["Moda Urbana 45", "ropa", "Moda urbana y prendas versátiles."],
  ["Detalles Dorados", "belleza", "Regalos, bienestar y pequeños detalles."],
];

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
      user_metadata: { full_name: fullName, role },
    });
    if (error || !data.user) throw error ?? new Error(`Could not create ${email}`);
    user = data.user;
  } else {
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error(`Could not update ${email}`);
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

async function getPilotPlan() {
  const { data, error } = await supabase
    .from("planes_suscripcion")
    .select("id")
    .eq("nombre", "Piloto operativo Mercanta")
    .maybeSingle();
  if (error || !data) throw error ?? new Error("Pilot plan not found. Run provision-pilot first.");
  return data.id;
}

async function upsertPromotion(comercioId, productoId, payload) {
  const { data: existing, error: readError } = await supabase
    .from("promociones")
    .select("id")
    .eq("comercio_id", comercioId)
    .eq("titulo", payload.titulo)
    .maybeSingle();
  if (readError) throw readError;

  const { error } = existing
    ? await supabase.from("promociones").update(payload).eq("id", existing.id)
    : await supabase
        .from("promociones")
        .insert({ ...payload, comercio_id: comercioId, producto_id: productoId });
  if (error) throw error;
}

async function seedOrder({ clientId, commerce, product, index, merchantId }) {
  const reference = `PILOTO-ORDEN-${String(index + 1).padStart(2, "0")}`;
  const { data: existing, error: findError } = await supabase
    .from("pedidos")
    .select("id")
    .eq("notas_cliente", reference)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return;

  const states = ["solicitado", "aceptado", "preparando", "listo", "en_camino", "entregado"];
  const estado = states[index % states.length];
  const modalidad = index % 2 === 0 ? "domicilio" : "recoger";
  const unitPrice = Number(product.precio_oferta ?? product.precio_base);
  const quantity = (index % 3) + 1;
  const subtotal = unitPrice * quantity;
  const shipping = modalidad === "domicilio" ? 8000 : 0;
  const now = new Date();
  const { data: order, error: orderError } = await supabase
    .from("pedidos")
    .insert({
      cliente_id: clientId,
      comercio_id: commerce.id,
      estado,
      modalidad,
      contacto_nombre: "Cliente Demo Mercanta",
      contacto_telefono: "3000000000",
      direccion_entrega:
        modalidad === "domicilio" ? { ciudad: "Barranquilla", referencia: "Pedido piloto" } : null,
      notas_cliente: reference,
      subtotal,
      costo_domicilio: shipping,
      total: subtotal + shipping,
      solicitado_at: new Date(now.getTime() - (index + 1) * 86400000).toISOString(),
      aceptado_at: ["aceptado", "preparando", "listo", "en_camino", "entregado"].includes(estado)
        ? now.toISOString()
        : null,
      completado_at: estado === "entregado" ? now.toISOString() : null,
    })
    .select("id")
    .single();
  if (orderError || !order) throw orderError ?? new Error("Could not create pilot order");

  const { error: itemError } = await supabase.from("pedido_items").insert({
    pedido_id: order.id,
    producto_id: product.id,
    nombre_producto: product.nombre,
    sku: product.sku,
    imagen_url: product.imagen_url,
    precio_unitario: unitPrice,
    cantidad: quantity,
    total_linea: subtotal,
  });
  if (itemError) throw itemError;

  const { error: eventError } = await supabase.from("pedido_eventos").insert({
    pedido_id: order.id,
    actor_id: estado === "solicitado" ? clientId : merchantId,
    actor_tipo: estado === "solicitado" ? "cliente" : "comercio",
    evento: "pedido_piloto_creado",
    estado_anterior: null,
    estado_nuevo: estado,
    detalle: { entorno: "piloto", referencia: reference },
  });
  if (eventError) throw eventError;
}

async function upsertReview({ clientId, commerceId, productId, rating }) {
  const { data: existing, error: findError } = await supabase
    .from("calificaciones")
    .select("id")
    .eq("cliente_id", clientId)
    .eq("comercio_id", commerceId)
    .eq("producto_id", productId)
    .maybeSingle();
  if (findError) throw findError;

  const payload = {
    cliente_id: clientId,
    comercio_id: commerceId,
    producto_id: productId,
    rating,
    comentario: "Reseña de demostración para validar la experiencia del catálogo y el comercio.",
  };
  const { error } = existing
    ? await supabase.from("calificaciones").update(payload).eq("id", existing.id)
    : await supabase.from("calificaciones").insert(payload);
  if (error) throw error;
}

async function main() {
  const superAdminId = await findOrCreateUser(
    process.env.PILOT_SUPERADMIN_EMAIL,
    process.env.PILOT_SUPERADMIN_PASSWORD,
    "Administrador Piloto Mercanta",
    "super_admin",
  );
  const primaryMerchantId = await findOrCreateUser(
    process.env.PILOT_MERCHANT_EMAIL,
    process.env.PILOT_MERCHANT_PASSWORD,
    "Comercio Piloto Mercanta",
    "comercio",
  );
  const secondMerchantId = await findOrCreateUser(
    process.env.PILOT_SECOND_MERCHANT_EMAIL,
    process.env.PILOT_SECOND_MERCHANT_PASSWORD,
    "Comercio Demo Mercanta",
    "comercio",
  );
  const clientId = await findOrCreateUser(
    process.env.PILOT_CLIENT_EMAIL,
    process.env.PILOT_CLIENT_PASSWORD,
    "Cliente Demo Mercanta",
    "cliente",
  );

  const [{ data: city, error: cityError }, { data: categories, error: categoriesError }] =
    await Promise.all([
      supabase.from("ciudades").select("id").eq("slug", "barranquilla").single(),
      supabase.from("categorias").select("id, slug").eq("activa", true),
    ]);
  if (cityError || !city) throw cityError ?? new Error("Barranquilla city is missing");
  if (categoriesError || !categories) throw categoriesError ?? new Error("Categories are missing");
  const categoriesBySlug = new Map(categories.map((category) => [category.slug, category.id]));
  const planId = await getPilotPlan();
  const now = new Date();
  const inThirtyDays = new Date(now.getTime() + 30 * 86400000).toISOString();
  const seededStores = [];

  for (const [index, [name, categorySlug, description]] of stores.entries()) {
    const categoryId = categoriesBySlug.get(categorySlug);
    const photos = categoryMedia[categorySlug];
    const merchantId = index < 10 ? primaryMerchantId : secondMerchantId;
    if (!categoryId || !photos) throw new Error(`Missing category media for ${categorySlug}`);
    const slug = `piloto-${name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`;
    const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B1165&color=ffffff&bold=true&size=256`;
    const bannerUrl = image(photos[0], 1600);
    const { data: commerce, error: commerceError } = await supabase
      .from("comercios")
      .upsert(
        {
          owner_id: merchantId,
          created_by: superAdminId,
          ciudad_id: city.id,
          plan_id: planId,
          categoria_id: categoryId,
          nombre: name,
          slug,
          descripcion: `${description} Comercio de demostración para el piloto de Mercanta.`,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          direccion: `Centro de Barranquilla, sector ${34 + (index % 12)} #${40 + index}-20`,
          lat: 10.985 + index * 0.0007,
          lng: -74.786 - index * 0.0006,
          telefono: "6053000000",
          whatsapp: "573000000000",
          email: `piloto-${index + 1}@mercanta.test`,
          horarios: { lunes_viernes: "08:30 - 18:30", sabado: "09:00 - 16:00", domingo: "Cerrado" },
          estado: "activo",
          recogida_disponible: true,
          domicilio_disponible: index % 4 !== 0,
          recogida_notas: "Recoge en el comercio mostrando la confirmación.",
          domicilio_notas: "Cobertura piloto en el Centro de Barranquilla.",
          disponibilidad_notas: "Catálogo piloto disponible para pruebas.",
          confianza_notas: "Comercio verificado para el entorno piloto.",
          onboarding_completado_at: now.toISOString(),
          verificado_at: now.toISOString(),
          verificado_por: superAdminId,
        },
        { onConflict: "slug" },
      )
      .select("id, nombre, slug")
      .single();
    if (commerceError || !commerce) throw commerceError ?? new Error(`Could not upsert ${name}`);

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
      .maybeSingle();
    if (subscriptionError) throw subscriptionError;
    const subscriptionPayload = {
      comercio_id: commerce.id,
      plan_id: planId,
      estado: index % 3 === 0 ? "activa" : "trial",
      vence_at: inThirtyDays,
      creada_por: superAdminId,
      notas: "Suscripción de demostración, sin cobro ni renovación automática.",
    };
    const { error: subscriptionWriteError } = subscription
      ? await supabase
          .from("comercio_suscripciones")
          .update(subscriptionPayload)
          .eq("id", subscription.id)
      : await supabase.from("comercio_suscripciones").insert(subscriptionPayload);
    if (subscriptionWriteError) throw subscriptionWriteError;

    const productNames = productTemplates[categorySlug];
    for (const [productIndex, productName] of productNames.entries()) {
      const price = 28000 + index * 9000 + productIndex * 6500;
      const productSlug = `${slug}-${productIndex + 1}`;
      const imageUrl = image(photos[productIndex % photos.length], 900);
      const { data: product, error: productError } = await supabase
        .from("productos")
        .upsert(
          {
            comercio_id: commerce.id,
            created_by: merchantId,
            categoria_id: categoryId,
            nombre: productName,
            slug: productSlug,
            descripcion: `${productName} disponible en ${name}. Referencia creada para demostrar búsqueda, catálogo y pedido.`,
            precio_base: price,
            precio_oferta: productIndex % 2 === 0 ? price * 0.85 : null,
            marca: name,
            sku: `PIL-${String(index + 1).padStart(2, "0")}-${String(productIndex + 1).padStart(2, "0")}`,
            imagen_url: imageUrl,
            imagenes: [imageUrl, image(photos[(productIndex + 1) % photos.length], 900)],
            disponible: true,
            stock: 10 + productIndex * 7,
            destacado: productIndex === 0,
            tags: ["piloto", categorySlug, "centro-barranquilla"],
            atributos: {
              entorno: "piloto",
              entrega: index % 4 !== 0 ? "domicilio y recogida" : "recogida",
            },
          },
          { onConflict: "comercio_id,slug" },
        )
        .select("id, nombre, sku, imagen_url, precio_base, precio_oferta")
        .single();
      if (productError || !product)
        throw productError ?? new Error(`Could not upsert ${productName}`);
      if (productIndex === 0 || (index + productIndex) % 5 === 0) {
        await upsertPromotion(commerce.id, product.id, {
          titulo: `${name}: oferta piloto`,
          descripcion: `Oferta activa de demostración en ${productName}.`,
          tipo: "descuento_pct",
          valor: productIndex === 0 ? 15 : 10,
          imagen_url: imageUrl,
          fecha_inicio: now.toISOString(),
          fecha_fin: inThirtyDays,
          activa: true,
          destacada: productIndex === 0,
        });
      }
      if (productIndex === 0) seededStores.push({ commerce, product, merchantId, index });
    }
  }

  for (const store of seededStores) {
    await seedOrder({
      clientId,
      commerce: store.commerce,
      product: store.product,
      index: store.index,
      merchantId: store.merchantId,
    });
    await upsertReview({
      clientId,
      commerceId: store.commerce.id,
      productId: store.product.id,
      rating: 4 + (store.index % 2),
    });
  }

  console.log(
    "Marketplace pilot seeded: 20 stores, 80 products, promotions, reviews, orders, 2 merchants, 1 client.",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
