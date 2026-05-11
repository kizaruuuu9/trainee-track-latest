
export const PHILIPPINE_CITIES = [
  "Caloocan City, Metro Manila",
  "Las Piñas City, Metro Manila",
  "Makati City, Metro Manila",
  "Malabon City, Metro Manila",
  "Mandaluyong City, Metro Manila",
  "Manila City, Metro Manila",
  "Marikina City, Metro Manila",
  "Muntinlupa City, Metro Manila",
  "Navotas City, Metro Manila",
  "Parañaque City, Metro Manila",
  "Pasay City, Metro Manila",
  "Pasig City, Metro Manila",
  "Pateros, Metro Manila",
  "Quezon City, Metro Manila",
  "San Juan City, Metro Manila",
  "Taguig City, Metro Manila",
  "Valenzuela City, Metro Manila",
  "Angeles City, Pampanga",
  "Antipolo City, Rizal",
  "Bacolod City, Negros Occidental",
  "Baguio City, Benguet",
  "Batangas City, Batangas",
  "Biñan City, Laguna",
  "Cabanatuan City, Nueva Ecija",
  "Cabuyao City, Laguna",
  "Cagayan de Oro City, Misamis Oriental",
  "Calamba City, Laguna",
  "Cavite City, Cavite",
  "Cebu City, Cebu",
  "Cotabato City, Maguindanao",
  "Dagupan City, Pangasinan",
  "Dasmariñas City, Cavite",
  "Davao City, Davao del Sur",
  "Dumaguete City, Negros Oriental",
  "General Santos City, South Cotabato",
  "Iligan City, Lanao del Norte",
  "Iloilo City, Iloilo",
  "Imus City, Cavite",
  "Lapu-Lapu City, Cebu",
  "Legazpi City, Albay",
  "Lucena City, Quezon",
  "Mandaue City, Cebu",
  "Meycauayan City, Bulacan",
  "Naga City, Camarines Sur",
  "Olongapo City, Zambales",
  "Ormoc City, Leyte",
  "Puerto Princesa City, Palawan",
  "Roxas City, Capiz",
  "San Fernando City, Pampanga",
  "San Jose del Monte City, Bulacan",
  "San Pablo City, Laguna",
  "San Pedro City, Laguna",
  "Santa Rosa City, Laguna",
  "Tacloban City, Leyte",
  "Tagum City, Davao del Norte",
  "Tarlac City, Tarlac",
  "Trece Martires City, Cavite",
  "Zamboanga City, Zamboanga del Sur"
].sort();

export const normalizeLocation = (loc) => {
  if (!loc) return "";
  // Try to find the closest match in our standardized list
  const lowerLoc = loc.toLowerCase();
  const match = PHILIPPINE_CITIES.find(city => 
    lowerLoc.includes(city.toLowerCase().split(',')[0].trim())
  );
  return match || loc;
};
