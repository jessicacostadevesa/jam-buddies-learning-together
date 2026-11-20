import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ubicarMiLocal } from "@/lib/locales.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const TIPOS_LOCAL = [
  "Sala de ensayo",
  "Bar con música en directo",
  "Sala de conciertos",
  "Estudio de grabación",
  "Centro cultural",
];
export const BACKLINE = [
  "Batería",
  "Ampli de guitarra",
  "Ampli de bajo",
  "Teclado",
  "Equipo de voces / PA",
  "Micrófonos",
  "Iluminación",
];
export const SERVICIOS_LOCAL = [
  "Jam sessions",
  "Open mic",
  "Conciertos de bandas noveles",
  "Grabación",
  "Alquiler de material",
  "Bono de horas",
  "Taquillas para guardar equipo",
];

export const localQuery = (uid: string) =>
  queryOptions({
    queryKey: ["local", uid],
    queryFn: async () => {
      const [d, f] = await Promise.all([
        supabase.from("local_detalles").select("*").eq("perfil_id", uid).maybeSingle(),
        supabase.from("local_datos_fiscales").select("*").eq("perfil_id", uid).maybeSingle(),
      ]);
      return { detalles: d.data, fiscal: f.data };
    },
  });

function Section({
  title,
  hint,
  children,
}: {
  title: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="cassette-surface p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-10 rounded-full border-2 border-transparent px-4 py-1 text-sm font-semibold transition-colors ${on ? "bg-venue text-foreground border-foreground" : "bg-muted hover:bg-border"}`}
    >
      {children}
    </Button>
  );
}
const tog = <T,>(a: T[], v: T) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);
const num = (s: string) => (s === "" ? null : Number(s));
const str = (v: number | null | undefined) => (v == null ? "" : String(v));

type Props = {
  uid: string;
  perfil: { nombre: string; ciudad: string | null; zona: string | null; bio: string | null };
  estilos: { id: number; nombre: string }[];
  misEstilos: number[];
  refreshBase: () => void;
};

export function LocalPerfil({ uid, perfil, estilos, misEstilos, refreshBase }: Props) {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(localQuery(uid));
  const d = data.detalles;
  const [f, setF] = useState({
    nombre: perfil.nombre ?? "",
    ciudad: perfil.ciudad ?? "",
    zona: perfil.zona ?? "",
    bio: perfil.bio ?? "",
    titular: d?.titular ?? "",
    tipos: d?.tipos ?? [],
    direccion: d?.direccion ?? "",
    codigo_postal: d?.codigo_postal ?? "",
    telefono: d?.telefono ?? "",
    email_contacto: d?.email_contacto ?? "",
    web: d?.web ?? "",
    instagram: d?.instagram ?? "",
    horario_apertura: d?.horario_apertura ?? "",
    aforo: str(d?.aforo),
    num_salas: str(d?.num_salas),
    precio_hora_ensayo: str(d?.precio_hora_ensayo),
    backline: d?.backline ?? [],
    equipamiento: d?.equipamiento ?? "",
    servicios: d?.servicios ?? [],
    condiciones_bandas: d?.condiciones_bandas ?? "",
    accesible: d?.accesible ?? false,
    estilos_otros: d?.estilos_otros ?? "",
    razon_social: data.fiscal?.razon_social ?? "",
    cif: data.fiscal?.cif ?? "",
    responsable: data.fiscal?.responsable ?? "",
  });
  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const now = new Date().toISOString();
    const r = await Promise.all([
      supabase
        .from("perfiles")
        .update({ nombre: f.nombre, ciudad: f.ciudad, zona: f.zona, bio: f.bio, updated_at: now })
        .eq("id", uid),
      supabase.from("local_detalles").upsert({
        perfil_id: uid,
        titular: f.titular,
        tipos: f.tipos,
        direccion: f.direccion,
        codigo_postal: f.codigo_postal,
        telefono: f.telefono,
        email_contacto: f.email_contacto,
        web: f.web,
        instagram: f.instagram,
        horario_apertura: f.horario_apertura,
        aforo: num(f.aforo),
        num_salas: num(f.num_salas),
        precio_hora_ensayo: num(f.precio_hora_ensayo),
        backline: f.backline,
        equipamiento: f.equipamiento,
        servicios: f.servicios,
        condiciones_bandas: f.condiciones_bandas,
        accesible: f.accesible,
        estilos_otros: f.estilos_otros || null,
        updated_at: now,
        organiza_jams: f.servicios.includes("Jam sessions") || f.servicios.includes("Open mic"),
        organiza_conciertos: f.servicios.includes("Conciertos de bandas noveles"),
      }),
      supabase
        .from("local_datos_fiscales")
        .upsert({
          perfil_id: uid,
          razon_social: f.razon_social,
          cif: f.cif,
          responsable: f.responsable,
        }),
    ]);
    if (r.some((x) => x.error)) {
      toast.error("No se pudo guardar");
      return;
    }
    toast.success("Ficha del local guardada");
    const dir = [f.direccion, f.codigo_postal, f.ciudad].filter(Boolean).join(", ");
    if (f.direccion.trim()) {
      ubicarMiLocal({ data: { direccion: dir } })
        .then((u) =>
          u.ok
            ? toast.success("Tu local ya aparece en el mapa")
            : toast.error("No encontramos esa dirección en el mapa"),
        )
        .catch(() => toast.error("No se pudo situar el local en el mapa"));
    }
    qc.invalidateQueries({ queryKey: ["local", uid] });
    refreshBase();
  }
  async function toggleEstilo(id: number) {
    if (misEstilos.includes(id))
      await supabase.from("perfil_estilos").delete().eq("perfil_id", uid).eq("estilo_id", id);
    else await supabase.from("perfil_estilos").insert({ perfil_id: uid, estilo_id: id });
    refreshBase();
  }

  return (
    <>
      <div>
        <span className="rounded-full border border-border bg-secondary px-3 py-0.5 text-sm font-semibold">
          Local
        </span>
        <h1 className="mt-3 text-4xl font-extrabold">La ficha de tu local</h1>
        <p className="mt-1 text-muted-foreground">
          Es lo que verán las bandas y músicos que buscan dónde ensayar o tocar por primera vez.
        </p>
      </div>
      <form onSubmit={guardar} className="profile-sections space-y-6">
        <Section title="Presentación" hint="Lo primero que leerá una banda.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="n">Nombre del local</Label>
              <Input id="n" className="mt-1" value={f.nombre} onChange={set("nombre")} />
            </div>
            <div>
              <Label htmlFor="t">Frase que os define</Label>
              <Input
                id="t"
                className="mt-1"
                placeholder="Salas de ensayo y escenario para bandas que empiezan"
                value={f.titular}
                onChange={set("titular")}
              />
            </div>
            <div>
              <Label htmlFor="c">Ciudad</Label>
              <Input id="c" className="mt-1" value={f.ciudad} onChange={set("ciudad")} />
            </div>
            <div>
              <Label htmlFor="z">Zona / barrio</Label>
              <Input id="z" className="mt-1" value={f.zona} onChange={set("zona")} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="b">Cómo es el local</Label>
              <Textarea
                id="b"
                rows={4}
                className="mt-1"
                placeholder="El ambiente, el tipo de público, por qué es un buen sitio para tocar por primera vez…"
                value={f.bio}
                onChange={set("bio")}
              />
            </div>
          </div>
          <Label className="mt-5 block">Tipo de local</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {TIPOS_LOCAL.map((x) => (
              <Chip
                key={x}
                on={f.tipos.includes(x)}
                onClick={() => setF({ ...f, tipos: tog(f.tipos, x) })}
              >
                {x === "Estudio de grabación" ? "Estudio musical" : x}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Ubicación y contacto">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="dir">Dirección</Label>
              <Input id="dir" className="mt-1" value={f.direccion} onChange={set("direccion")} />
            </div>
            <div>
              <Label htmlFor="cp">Código postal</Label>
              <Input
                id="cp"
                className="mt-1"
                value={f.codigo_postal}
                onChange={set("codigo_postal")}
              />
            </div>
            <div>
              <Label htmlFor="tel">Teléfono</Label>
              <Input id="tel" className="mt-1" value={f.telefono} onChange={set("telefono")} />
            </div>
            <div>
              <Label htmlFor="em">Email de contacto</Label>
              <Input
                id="em"
                type="email"
                className="mt-1"
                value={f.email_contacto}
                onChange={set("email_contacto")}
              />
            </div>
            <div>
              <Label htmlFor="web">Web</Label>
              <Input
                id="web"
                className="mt-1"
                placeholder="https://"
                value={f.web}
                onChange={set("web")}
              />
            </div>
            <div>
              <Label htmlFor="ig">Instagram</Label>
              <Input
                id="ig"
                className="mt-1"
                placeholder="@tulocal"
                value={f.instagram}
                onChange={set("instagram")}
              />
            </div>
            <div>
              <Label htmlFor="ho">Horario de apertura</Label>
              <Input
                id="ho"
                className="mt-1"
                placeholder="L-D 16:00–00:00"
                value={f.horario_apertura}
                onChange={set("horario_apertura")}
              />
            </div>
          </div>
        </Section>

        <Section title="Espacio y equipo">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="af">Aforo</Label>
              <Input
                id="af"
                type="number"
                min={0}
                className="mt-1"
                value={f.aforo}
                onChange={set("aforo")}
              />
            </div>
            <div>
              <Label htmlFor="ns">Nº de salas de ensayo</Label>
              <Input
                id="ns"
                type="number"
                min={0}
                className="mt-1"
                value={f.num_salas}
                onChange={set("num_salas")}
              />
            </div>
            <div>
              <Label htmlFor="ph">Precio ensayo por hora (€)</Label>
              <Input
                id="ph"
                type="number"
                min={0}
                step="0.5"
                className="mt-1"
                value={f.precio_hora_ensayo}
                onChange={set("precio_hora_ensayo")}
              />
            </div>
          </div>
          <Label className="mt-5 block">Material disponible</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {BACKLINE.map((x) => (
              <Chip
                key={x}
                on={f.backline.includes(x)}
                onClick={() => setF({ ...f, backline: tog(f.backline, x) })}
              >
                {x}
              </Chip>
            ))}
          </div>
          <div className="mt-4">
            <Label htmlFor="eq">Detalle del equipo</Label>
            <Textarea
              id="eq"
              rows={2}
              className="mt-1"
              placeholder="Marcas y modelos, si hay técnico de sonido…"
              value={f.equipamiento}
              onChange={set("equipamiento")}
            />
          </div>
          <div className="mt-4">
            <Label>Accesible en silla de ruedas</Label>
            <div className="mt-2 flex gap-2">
              <Chip on={f.accesible} onClick={() => setF({ ...f, accesible: true })}>
                Sí
              </Chip>
              <Chip on={!f.accesible} onClick={() => setF({ ...f, accesible: false })}>
                No
              </Chip>
            </div>
          </div>
        </Section>

        <Section title="Qué ofrecéis a los músicos">
          <div className="flex flex-wrap gap-2">
            {SERVICIOS_LOCAL.map((x) => (
              <Chip
                key={x}
                on={f.servicios.includes(x)}
                onClick={() => setF({ ...f, servicios: tog(f.servicios, x) })}
              >
                {x === "Grabación" ? "Producción musical" : x}
              </Chip>
            ))}
          </div>
          <div className="mt-4">
            <Label htmlFor="cb">Condiciones para tocar</Label>
            <Textarea
              id="cb"
              rows={3}
              className="mt-1"
              placeholder="Cómo pedir fecha, si hay taquilla o caché, duración del bolo, prueba de sonido…"
              value={f.condiciones_bandas}
              onChange={set("condiciones_bandas")}
            />
          </div>
          <Label className="mt-5 block">Estilos que programáis</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {estilos.map((e) => (
              <Chip key={e.id} on={misEstilos.includes(e.id)} onClick={() => toggleEstilo(e.id)}>
                {e.nombre}
              </Chip>
            ))}
          </div>
          <div className="mt-3">
            <Label htmlFor="eo">Otros estilos</Label>
            <Input
              id="eo"
              className="mt-1"
              value={f.estilos_otros}
              onChange={set("estilos_otros")}
            />
          </div>
        </Section>

        <Section
          title={
            <span className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4" /> Datos de la empresa
            </span>
          }
          hint="Privados. Solo los usamos para verificar el local."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="rs">Razón social</Label>
              <Input
                id="rs"
                className="mt-1"
                value={f.razon_social}
                onChange={set("razon_social")}
              />
            </div>
            <div>
              <Label htmlFor="cif">CIF / NIF</Label>
              <Input id="cif" className="mt-1" value={f.cif} onChange={set("cif")} />
            </div>
            <div>
              <Label htmlFor="resp">Persona responsable</Label>
              <Input
                id="resp"
                className="mt-1"
                value={f.responsable}
                onChange={set("responsable")}
              />
            </div>
          </div>
        </Section>
        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="lg">
            Guardar ficha
          </Button>
        </div>
      </form>
    </>
  );
}
