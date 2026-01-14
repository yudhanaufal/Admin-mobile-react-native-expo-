export interface Toko {
  id: string;
  nama: string;
  alamat: string;
  no_tlp: string;
  pin?: string;  // Tambahkan ini sebagai optional string
  updatedAt?: number;
}