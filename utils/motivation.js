const quotes = [
    "Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan.",
    "Jangan takut gagal. Takutlah untuk tidak mencoba.",
    "Mimpi besar dimulai dari langkah kecil hari ini.",
    "Kerja keras mengalahkan bakat ketika bakat tidak bekerja keras.",
    "Setiap master dulunya adalah pemula yang tidak menyerah.",
    "Hari ini adalah kesempatan yang tidak akan datang dua kali.",
    "Fokus pada progres, bukan kesempurnaan.",
    "Kegagalan adalah guru terbaik jika kamu mau belajar.",
    "Bangun mimpimu atau orang lain akan mempekerjakanmu untuk membangun mimpi mereka.",
    "Disiplin adalah jembatan antara tujuan dan pencapaian."
];

const getRandom = () => quotes[Math.floor(Math.random() * quotes.length)];

module.exports = { getRandom };
