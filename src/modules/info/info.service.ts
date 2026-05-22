const jalurData = [
  {
    slug: "snbt",
    nama: "SNBT (Seleksi Nasional Berdasarkan Tes)",
    deskripsi: "Seleksi masuk PTN berdasarkan hasil UTBK-SNBT",
    syarat: [
      "Lulusan SMA/MA/SMK maksimal 3 tahun terakhir",
      "Setiap siswa hanya bisa ikut UTBK 2 kali",
    ],
    tahapan: [
      "Pendaftaran akun SNPMB",
      "Daftar UTBK",
      "Pelaksanaan UTBK",
      "Pengumuman",
    ],
    tips: [
      "Fokus pada TPS karena berlaku untuk semua jurusan",
      "Latihan soal minimal 2 jam per hari",
    ],
  },
  {
    slug: "mandiri",
    nama: "Jalur Mandiri",
    deskripsi: "Seleksi yang diselenggarakan langsung oleh masing-masing PTN",
    syarat: [
      "Syarat berbeda tiap PTN",
      "Umumnya menggunakan nilai UTBK atau tes mandiri",
    ],
    tahapan: [
      "Cek jadwal dan syarat tiap PTN",
      "Daftar di website PTN masing-masing",
      "Ikuti tes/seleksi",
      "Pengumuman",
    ],
    tips: [
      "Daftar di beberapa PTN sekaligus",
      "Perhatikan biaya pendaftaran tiap PTN",
    ],
  },
  {
    slug: "prestasi",
    nama: "Jalur Prestasi (SNBP)",
    deskripsi: "Seleksi berdasarkan prestasi akademik dan non-akademik",
    syarat: [
      "Direkomendasikan oleh sekolah",
      "Masuk kuota sekolah berdasarkan akreditasi",
      "Nilai rapor memenuhi syarat minimum",
    ],
    tahapan: [
      "Sekolah input nilai di PDSS",
      "Siswa eligible mendaftar SNBP",
      "Pengumuman hasil",
    ],
    tips: [
      "Jaga nilai rapor dari kelas 10",
      "Aktif di kegiatan ekstrakurikuler untuk portofolio prestasi",
    ],
  },
];

export const getJalur = async () => {
  return jalurData;
};

export const getJalurBySlug = async (slug: string) => {
  return jalurData.find((j) => j.slug === slug) || null;
};
