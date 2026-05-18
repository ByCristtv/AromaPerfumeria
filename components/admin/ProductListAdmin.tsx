"use client";

import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase/client";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { ADMIN_PRODUCTS_QUERY_KEY } from "@/features/admin/getProductsAdmin";
import { useQueryClient } from "@tanstack/react-query";

export default function ProductListAdmin() {
  // Consumimos el nuevo hook con los datos planos y tipados para el admin
  const { data: products = [], isLoading: loading } = useAdminProducts();
  const queryClient = useQueryClient();

  // Corregido: 'id' ahora es string (UUID) tal y como viene de la base de datos
  const deleteProduct = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar Producto?',
      text: `¿Estás seguro de que deseas eliminar "${name}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c9a96e',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      
      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `No se pudo eliminar el producto: ${error.message}`,
        });
        return;
      }

      // Invalida de forma segura la caché específica del admin
      await queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_QUERY_KEY });
      
      Swal.fire({
        icon: 'success',
        title: 'Producto Eliminar',
        text: 'El producto ha sido eliminado exitosamente.',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-black rounded-2xl border border-[#c9a96e]/30 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-sm">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-[#ececec] tracking-wide">Gestión de Productos</h2>
        <p className="text-[#a5a5a5] mt-2">Administra tu colección de perfumes premium</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-[#ececec] text-center">Cargando productos...</p>
        ) : products.length === 0 ? (
          <p className="text-[#ececec] text-center">No hay productos disponibles.</p>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="bg-[#1a1a1a] border border-[#c9a96e]/20 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#ececec] mb-2">{p.name}</h3>
                  {p.description && <p className="text-[#a5a5a5] mb-2">{p.description}</p>}
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    {/* El formateo de moneda ahora es seguro gracias a que price y stock son planos */}
                    <span className="text-[#c9a96e] font-medium">Precio: ₡{p.price.toLocaleString('es-CR')}</span>
                    <span className="text-[#c9a96e] font-medium">Stock: {p.stock}</span>
                    <span className="text-[#c9a96e] font-medium">Marca: {p.brand}</span>
                    <span className="text-[#c9a96e] font-medium">
                      Categorías:{" "}
                      {p.categories && p.categories.length > 0
                        ? p.categories.map((c) => c.name).join(", ")
                        : "Sin categoría"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => deleteProduct(p.id, p.name)}
                    className="bg-red-900 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => {
                      Swal.fire({
                        icon: 'info',
                        title: 'Editar producto',
                        text: 'Funcionalidad de edición en construcción.',
                      });
                    }}
                    className="bg-blue-950 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}