import React from "react";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Flower2, Calendar, Clock, ArrowDownUp, ListFilter } from "lucide-react";

export const dynamic = 'force-dynamic';

const COUNTRIES = [
  { code: "BO", name: "Bolivia", prefix: "+591", flag: "https://flagcdn.com/bo.svg", limit: 8 },
  { code: "AR", name: "Argentina", prefix: "+54", flag: "https://flagcdn.com/ar.svg", limit: 10 },
  { code: "CL", name: "Chile", prefix: "+56", flag: "https://flagcdn.com/cl.svg", limit: 9 },
  { code: "PE", name: "Perú", prefix: "+51", flag: "https://flagcdn.com/pe.svg", limit: 9 },
  { code: "CO", name: "Colombia", prefix: "+57", flag: "https://flagcdn.com/co.svg", limit: 10 },
  { code: "MX", name: "México", prefix: "+52", flag: "https://flagcdn.com/mx.svg", limit: 10 },
  { code: "ES", name: "España", prefix: "+34", flag: "https://flagcdn.com/es.svg", limit: 9 },
  { code: "US", name: "Estados Unidos", prefix: "+1", flag: "https://flagcdn.com/us.svg", limit: 10 },
  { code: "BR", name: "Brasil", prefix: "+55", flag: "https://flagcdn.com/br.svg", limit: 11 },
  { code: "UY", name: "Uruguay", prefix: "+598", flag: "https://flagcdn.com/uy.svg", limit: 8 },
  { code: "PY", name: "Paraguay", prefix: "+595", flag: "https://flagcdn.com/py.svg", limit: 9 },
  { code: "EC", name: "Ecuador", prefix: "+593", flag: "https://flagcdn.com/ec.svg", limit: 9 },
  { code: "VE", name: "Venezuela", prefix: "+58", flag: "https://flagcdn.com/ve.svg", limit: 10 },
  { code: "PA", name: "Panamá", prefix: "+507", flag: "https://flagcdn.com/pa.svg", limit: 8 },
  { code: "CR", name: "Costa Rica", prefix: "+506", flag: "https://flagcdn.com/cr.svg", limit: 8 },
  { code: "DO", name: "Rep. Dominicana", prefix: "+1", flag: "https://flagcdn.com/do.svg", limit: 10 },
  { code: "GT", name: "Guatemala", prefix: "+502", flag: "https://flagcdn.com/gt.svg", limit: 8 },
  { code: "HN", name: "Honduras", prefix: "+504", flag: "https://flagcdn.com/hn.svg", limit: 8 },
  { code: "SV", name: "El Salvador", prefix: "+503", flag: "https://flagcdn.com/sv.svg", limit: 8 },
  { code: "NI", name: "Nicaragua", prefix: "+505", flag: "https://flagcdn.com/ni.svg", limit: 8 },
  { code: "PR", name: "Puerto Rico", prefix: "+1", flag: "https://flagcdn.com/pr.svg", limit: 10 },
  { code: "IT", name: "Italia", prefix: "+39", flag: "https://flagcdn.com/it.svg", limit: 10 },
  { code: "FR", name: "Francia", prefix: "+33", flag: "https://flagcdn.com/fr.svg", limit: 9 },
  { code: "DE", name: "Alemania", prefix: "+49", flag: "https://flagcdn.com/de.svg", limit: 11 },
  { code: "GB", name: "Reino Unido", prefix: "+44", flag: "https://flagcdn.com/gb.svg", limit: 10 },
  { code: "CA", name: "Canadá", prefix: "+1", flag: "https://flagcdn.com/ca.svg", limit: 10 },
  { code: "PT", name: "Portugal", prefix: "+351", flag: "https://flagcdn.com/pt.svg", limit: 9 },
].sort((a, b) => a.name.localeCompare(b.name));

export default async function AdminPedidosPage({ searchParams }: { searchParams: { filter?: string, sort?: string } }) {
  const filter = searchParams.filter || 'all';
  const sort = searchParams.sort || 'recent';

  // Lógica para filtrar por fecha (Hoy en Bolivia)
  let whereClause: any = {};
  
  if (filter === 'today') {
    const now = new Date();
    // Obtener fecha actual en zona horaria de Bolivia
    const boliviaTimeStr = now.toLocaleString("en-US", { timeZone: "America/La_Paz" });
    const boliviaDate = new Date(boliviaTimeStr);
    
    const yyyy = boliviaDate.getFullYear();
    const mm = String(boliviaDate.getMonth() + 1).padStart(2, '0');
    const dd = String(boliviaDate.getDate()).padStart(2, '0');
    
    // Construir rango UTC correspondiente al día en Bolivia (UTC-4)
    const startIso = `${yyyy}-${mm}-${dd}T00:00:00.000-04:00`;
    const endIso = `${yyyy}-${mm}-${dd}T23:59:59.999-04:00`;
    
    whereClause.fecha_entrega = {
      gte: new Date(startIso),
      lte: new Date(endIso)
    };
  }

  // Lógica de ordenamiento
  let orderByClause: any = { fecha_pedido: 'desc' };
  
  if (sort === 'delivery_asc') {
    orderByClause = { fecha_entrega: 'asc' };
  } else if (sort === 'delivery_desc') {
    orderByClause = { fecha_entrega: 'desc' };
  } else if (sort === 'recent') {
    orderByClause = { fecha_pedido: 'desc' };
  }

  const pedidos = await prisma.pedidos.findMany({
    where: whereClause,
    orderBy: orderByClause,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif italic text-gray-800">Panel de Pedidos</h2>
          <p className="text-sm text-gray-500">Gestión simplificada de pedidos.</p>
        </div>
        
        {/* Barra de Herramientas de Filtro y Orden */}
        <div className="flex flex-wrap gap-3">
          {/* Filtro de Fecha */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <Link 
              href={`?filter=all&sort=${sort}`} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <ListFilter size={14} /> Todos
            </Link>
            <Link 
              href={`?filter=today&sort=${sort}`} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === 'today' ? 'bg-[#C5A059] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Calendar size={14} /> Para Hoy
            </Link>
          </div>

          {/* Ordenamiento */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <Link 
              href={`?filter=${filter}&sort=recent`} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sort === 'recent' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <ArrowDownUp size={14} /> Recientes
            </Link>
            <Link 
              href={`?filter=${filter}&sort=delivery_asc`} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sort === 'delivery_asc' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Clock size={14} /> Próxima Entrega
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pedidos.map((pedido) => {
          const country = COUNTRIES.find(c => pedido.telefono_contacto?.startsWith(c.prefix));
          const displayPhone = country ? `${country.prefix} ${pedido.telefono_contacto?.slice(country.prefix.length)}` : pedido.telefono_contacto;

          return (
          <div key={pedido.id.toString()} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4 font-sans hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-serif italic text-gray-800">Pedido #{pedido.id.toString()}</h2>
                    <div className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    pedido.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' : 
                    pedido.estado === 'completado' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-gray-100 text-gray-700'
                    }`}>
                    {pedido.estado}
                    </div>
                </div>
            </div>

            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Solicitado el:</p>
                <p className="text-xs text-gray-700 font-medium">
                {format(new Date(pedido.fecha_pedido || new Date()), "dd 'de' MMMM, yyyy - hh:mm aa", { locale: es })}
                </p>
            </div>

            <div className="space-y-0.5">
                <p className="text-base font-bold text-gray-800">{pedido.nombre_contacto}</p>
                <div className="flex items-center gap-2">
                  {country && (
                    <div className="w-4 h-3 relative shadow-sm shrink-0">
                        <img src={country.flag} alt={country.name} className="w-full h-full object-cover rounded-[2px]" />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 font-mono">{displayPhone}</p>
                </div>
            </div>

            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Entrega:</p>
                <p className="text-xs text-gray-700 font-medium">
                  <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">{format(new Date(pedido.fecha_entrega), "dd 'de' MMMM, yyyy - hh:mm aa", { locale: es })}</span>
                </p>
            </div>

            <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                <Link href={`/admin/pedidos/${pedido.id}`} className="text-[#C5A059] font-bold text-xs hover:underline uppercase tracking-wider">
                Ver Detalles
                </Link>
                <span className="text-sm font-serif italic text-gray-400">Bs {Number(pedido.total_pagar).toFixed(2)}</span>
            </div>
          </div>
        )})}

        {pedidos.length === 0 && (
          <div className="col-span-full text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Flower2 className="text-gray-200" size={40} />
            </div>
              <p className="text-gray-400 font-serif italic text-xl">No se encontraron pedidos con estos filtros.</p>
              {(filter !== 'all' || sort !== 'recent') && (
                <Link href="?filter=all&sort=recent" className="inline-block mt-4 text-xs font-bold text-[#C5A059] uppercase tracking-widest hover:underline">
                  Limpiar filtros
                </Link>
              )}
          </div>
        )}
      </div>
    </div>
  );
}